import pool from '../db/connection';
import {
  ExerciseDifficulty,
  ExerciseDose,
  ExerciseLanguage,
  LibraryExercise,
  exerciseLibrary,
  formatDose,
  resolveExercise,
} from '../data/exerciseLibrary';
import { completeJson, currentModelName, isAiEnabled } from './openaiClient';
import { getLatestPlan } from './planService';

export class PlanGenerationInProgressError extends Error {
  constructor() {
    super('Plan generation is already in progress');
    this.name = 'PlanGenerationInProgressError';
  }
}

export class PlanGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlanGenerationError';
  }
}

type AiExercise = { exerciseId: string; doseType: 'time' | 'reps'; amount: number; perSide: boolean };
type AiLesson = {
  name: string;
  lessonType: string;
  xpReward: number;
  estimatedDurationMinutes: number;
  difficulty: string;
  exercises: AiExercise[];
};
type AiSection = { title: string; summary: string; lessons: AiLesson[] };
type AiPlan = { sections: AiSection[] };

const SECTION_COUNT = 5;
const SECTION_KEYS = Array.from({ length: SECTION_COUNT }, (_, i) => `section${i + 1}`);
const lessonKeysFor = (count: number) => Array.from({ length: count }, (_, i) => `lesson${i + 1}`);

// Strict structured-output schema. The plan structure is enforced BY THE
// SCHEMA, not by prose: exactly 5 named section slots, each with exactly N
// named lesson slots (N depends on the user's level). Small models ignore
// "exactly 5 sections" in text but cannot omit a required key. Numeric ranges
// are still clamped in code (min/max keywords are outside the strict subset).
const buildPlanSchema = (lessonsPerSection: number) => {
  const lessonKeys = lessonKeysFor(lessonsPerSection);
  return {
    name: 'training_plan',
    schema: {
      type: 'object',
      additionalProperties: false,
      required: SECTION_KEYS,
      properties: Object.fromEntries(SECTION_KEYS.map((key) => [key, { $ref: '#/$defs/section' }])),
      $defs: {
        exercise: {
          type: 'object',
          additionalProperties: false,
          required: ['exerciseId', 'doseType', 'amount', 'perSide'],
          properties: {
            exerciseId: { type: 'string' },
            doseType: { type: 'string', enum: ['time', 'reps'] },
            amount: { type: 'integer' },
            perSide: { type: 'boolean' },
          },
        },
        lesson: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'lessonType', 'xpReward', 'estimatedDurationMinutes', 'difficulty', 'exercises'],
          properties: {
            name: { type: 'string' },
            lessonType: { type: 'string' },
            xpReward: { type: 'integer' },
            estimatedDurationMinutes: { type: 'integer' },
            difficulty: { type: 'string', enum: ['Easy', 'Beginner', 'Intermediate', 'Advanced', 'Gentle'] },
            exercises: { type: 'array', items: { $ref: '#/$defs/exercise' } },
          },
        },
        section: {
          type: 'object',
          additionalProperties: false,
          required: ['title', 'summary', ...lessonKeys],
          properties: {
            title: { type: 'string' },
            summary: { type: 'string' },
            ...Object.fromEntries(lessonKeys.map((key) => [key, { $ref: '#/$defs/lesson' }])),
          },
        },
      },
    },
  };
};

// Convert the slot-keyed response (section1.lesson3 …) into the internal
// array shape. Tolerant of missing slots so repair still works if a model
// ever returns a partial structure.
const toPlan = (raw: any): AiPlan => {
  const sections: AiSection[] = [];
  SECTION_KEYS.forEach((sectionKey) => {
    const section = raw?.[sectionKey];
    if (!section || typeof section !== 'object') return;
    const lessons = Object.keys(section)
      .filter((key) => /^lesson\d+$/.test(key) && section[key])
      .sort((a, b) => Number(a.slice(6)) - Number(b.slice(6)))
      .map((key) => section[key] as AiLesson);
    sections.push({ title: section.title, summary: section.summary, lessons });
  });
  return { sections };
};

const DIFFICULTY_RANK: Record<ExerciseDifficulty, number> = { beginner: 1, intermediate: 2, advanced: 3 };

const difficultyCeiling = (fitnessLevel: string | null): ExerciseDifficulty => {
  const level = String(fitnessLevel || '').toLowerCase();
  if (level.includes('advanced')) return 'advanced';
  if (level.includes('intermediate')) return 'intermediate';
  return 'beginner';
};

// Models satisfice on ranges ("3 to 5" reliably yields 3), so the code picks
// an exact per-section lesson count and the prompt demands exactly that.
// More experienced users get longer paths.
const lessonsPerSectionFor = (fitnessLevel: string | null): number => {
  const level = String(fitnessLevel || '').toLowerCase();
  if (level.includes('advanced') || level.includes('intermediate')) return 6;
  if (level.includes('complete')) return 4;
  return 5;
};

const MAX_LESSONS = 30;

// Real lesson length as the mission player will run it: each dose plus the
// fixed 10s rest between exercises. Reps are ~3s each; per-side doubles.
const REST_SECONDS = 10;
const estimateLessonMinutes = (exercises: { dose: ExerciseDose }[]): number => {
  const work = exercises.reduce((total, { dose }) => {
    const seconds = dose.type === 'time' ? dose.amount : dose.amount * 3;
    return total + (dose.perSide ? seconds * 2 : seconds);
  }, 0);
  const rest = Math.max(0, exercises.length - 1) * REST_SECONDS;
  return clamp(Math.round((work + rest) / 60), 1, 20);
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(Number(value) || min)));

const clean = (value: unknown, maxLength: number) =>
  String(value ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .trim()
    .slice(0, maxLength);

// Exercises the user can actually perform: equipment they own, difficulty at
// or below their ceiling. The AI only ever sees (and may only pick) these.
const allowedExercisesFor = (userEquipment: string[], ceiling: ExerciseDifficulty): LibraryExercise[] => {
  const owned = new Set(userEquipment);
  return exerciseLibrary.filter(
    (entry) =>
      DIFFICULTY_RANK[entry.difficulty] <= DIFFICULTY_RANK[ceiling] &&
      entry.equipment.every((item) => owned.has(item))
  );
};

const catalogForPrompt = (allowed: LibraryExercise[]) =>
  allowed
    .map(
      (entry) =>
        `${entry.id} | ${entry.category} | ${entry.difficulty} | equipment: ${entry.equipment.join('+') || 'none'} | ${entry.musclesWorked.join(', ')} | default: ${formatDose(entry.defaultDose, 'en')}`
    )
    .join('\n');

type UserProfile = {
  id: number;
  age: number | null;
  gender: string | null;
  fitness_level: string | null;
  main_goal: string | null;
  motivation_reason: string | null;
  current_activity_level: string | null;
  preferred_workout_duration: number | null;
  onboarding_answers: unknown;
  equipment: string[];
  sports: string[];
};

const fetchProfile = async (userId: number): Promise<UserProfile> => {
  const user = await pool.query(
    `SELECT id, age, gender, fitness_level, main_goal, motivation_reason,
            current_activity_level, preferred_workout_duration, onboarding_answers
     FROM users WHERE id = $1`,
    [userId]
  );
  if (user.rows.length === 0) {
    throw new PlanGenerationError('User not found');
  }
  const [equipment, sports] = await Promise.all([
    pool.query('SELECT equipment_type FROM equipment WHERE user_id = $1', [userId]),
    pool.query('SELECT sport_type FROM sport_preferences WHERE user_id = $1', [userId]),
  ]);
  return {
    ...user.rows[0],
    equipment: equipment.rows.map((row) => clean(row.equipment_type, 60)),
    sports: sports.rows.map((row) => clean(row.sport_type, 60)),
  };
};

const followUpAnswersText = (answers: unknown): string => {
  if (!Array.isArray(answers)) return 'none';
  return answers
    .slice(0, 8)
    .map((entry: any) => `${clean(entry?.question, 160)}: ${clean((entry?.answerLabels || []).join(', '), 200)}`)
    .join('\n');
};

const buildPrompt = (profile: UserProfile, allowed: LibraryExercise[], language: ExerciseLanguage) => {
  const targetMinutes = clamp(profile.preferred_workout_duration || 5, 1, 15);
  const lessonsPerSection = lessonsPerSectionFor(profile.fitness_level);
  const totalLessons = lessonsPerSection * 5;
  const responseLanguage = language === 'he' ? 'Hebrew' : 'English';
  const system = [
    'You are an expert fitness coach building a Duolingo-style progressive training path for one specific user.',
    '',
    'HARD RULES:',
    '- Use ONLY exercise ids from the provided catalog. Never invent ids.',
    `- The response format has 5 sections (section1–section5), each with ${lessonsPerSection} lessons (lesson1–lesson${lessonsPerSection}) — ${totalLessons} lessons in total. Fill EVERY slot with a distinct, meaningful lesson; never repeat a lesson.`,
    '- The FIRST exercise of every lesson must be from the warmup category.',
    '- For doseType "time", amount is seconds (10-90). For "reps", amount is repetitions (4-20). Use perSide=true for one-sided moves.',
    '- xpReward between 10 and 40, higher for longer/harder lessons.',
    '- lessonType is a short focus label such as "Core", "Legs", "Cardio", "Mobility", "Full body" — never the word "lesson".',
    `- Write all titles, summaries, lesson names and lessonType values in ${responseLanguage}.`,
    '',
    'SAFETY (highest priority):',
    '- If the follow-up answers mention sensitive or injured areas (knees, lower back, shoulders, wrists, etc.), AVOID exercises that load them: no jumping/plyometrics for knees, no loaded hinges or sit-ups for lower back, no push-ups/dips/overhead work for shoulders or wrists. Prefer the gentle alternatives in the catalog.',
    '- Older users (60+) and "Complete beginner" users get low-impact, floor-supported or wall-supported movements only in sections 1-3.',
    '',
    'HOW TO DESIGN EACH LESSON:',
    `- Time budget: about ${targetMinutes} minutes. The player adds 10 seconds of rest between exercises, so total the doses (reps ≈ 3 seconds each, per-side doubles) plus rest and stay within the budget. Short budgets (1-2 min) mean 3 exercises with small doses; 10-15 min budgets mean 6-7 exercises.`,
    '- Structure: 1 warmup → 2-4 main exercises for the lesson focus → finish with 1 mobility/stretch or lighter movement when the budget allows.',
    '- Variety: do not use the same non-warmup exercise in two consecutive lessons; across the whole path use as much of the catalog as sensible.',
    '- Balance within a section: mix pushing and pulling, left/right, and core work rather than repeating one pattern.',
    '',
    'HOW TO DESIGN THE PATH:',
    '- Give each section its own theme and order sections as a progression (for example: foundations, lower body, core, upper body, full-body integration). Later sections use harder catalog exercises and larger doses.',
    '- Emphasis follows the main goal: weight loss / cardio endurance → more cardio and full_body; build strength → more legs_glutes, upper_body and core with rep-based doses; flexibility / stress relief → more mobility and balance with time-based holds; daily habit / general fitness → an even mix.',
    '- Weave in the user\'s sports interests (e.g. running → cardio + legs + ankle work; basketball → jumps and lateral agility where safe).',
    '- Use the follow-up answers to pick focus areas and to decide what to avoid.',
  ].join('\n');

  const user = [
    'EXERCISE CATALOG (id | category | difficulty | equipment | muscles | default dose):',
    catalogForPrompt(allowed),
    '',
    'USER PROFILE:',
    `- Main goal: ${clean(profile.main_goal, 120) || 'general fitness'}`,
    `- Fitness level: ${clean(profile.fitness_level, 60) || 'Beginner'}`,
    `- Daily time budget: ${targetMinutes} minutes per lesson`,
    `- Age: ${profile.age ?? 'unknown'}, gender: ${clean(profile.gender, 40) || 'unspecified'}`,
    `- Current activity level: ${clean(profile.current_activity_level, 80) || 'unknown'}`,
    `- Motivation: ${clean(profile.motivation_reason, 160) || 'unspecified'}`,
    `- Equipment available: ${profile.equipment.join(', ') || 'none'}`,
    `- Sports interests: ${profile.sports.join(', ') || 'general fitness'}`,
    '- Follow-up answers:',
    followUpAnswersText(profile.onboarding_answers),
    '',
    'Build the personalized training path now.',
  ].join('\n');

  return { system, user };
};

// Substitute a hallucinated/blocked id with the closest allowed exercise.
const substitute = (bad: AiExercise, allowed: LibraryExercise[], hint?: LibraryExercise): LibraryExercise => {
  if (hint) {
    const sameCategory = allowed.find((entry) => entry.category === hint.category && entry.id !== bad.exerciseId);
    if (sameCategory) return sameCategory;
  }
  const sameDoseType = allowed.find((entry) => entry.defaultDose.type === bad.doseType);
  return sameDoseType || allowed[0];
};

type RepairedLesson = {
  name: string;
  lessonType: string;
  xpReward: number;
  estimatedDurationMinutes: number;
  difficulty: string;
  sectionTitle: string;
  sectionSummary: string;
  sectionNumber: number;
  lessonNumber: number;
  exercises: { entry: LibraryExercise; dose: ExerciseDose }[];
};

// Title for a section the model failed to provide: the most common focus
// label among its lessons (already in the user's language), else a generic
// localized fallback.
const derivedSectionTitle = (
  lessons: { lessonType: string }[],
  index: number,
  language: ExerciseLanguage
): string => {
  const counts = new Map<string, number>();
  lessons.forEach((lesson) => counts.set(lesson.lessonType, (counts.get(lesson.lessonType) || 0) + 1));
  const dominant = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (dominant) return dominant;
  return language === 'he' ? `שלב ${index + 1}` : `Stage ${index + 1}`;
};

const repairPlan = (plan: AiPlan, allowed: LibraryExercise[], language: ExerciseLanguage): RepairedLesson[] => {
  const allowedById = new Map(allowed.map((entry) => [entry.id, entry]));
  const warmups = allowed.filter((entry) => entry.category === 'warmup');

  const providedMetas = (plan.sections || []).slice(0, SECTION_COUNT).map((section, index) => ({
    title: clean(section.title, 100) || `Section ${index + 1}`,
    summary: clean(section.summary, 220),
  }));

  // First pass: repair every usable lesson into a flat, ordered list.
  type FlatLesson = Omit<RepairedLesson, 'sectionTitle' | 'sectionSummary' | 'sectionNumber' | 'lessonNumber'>;
  const flat: FlatLesson[] = [];

  // Read lessons from every returned section (even if the model collapsed
  // them into one or two) — the section layout is rebuilt below anyway.
  (plan.sections || []).forEach((section) => {
    (section.lessons || []).forEach((lesson) => {
      if (flat.length >= MAX_LESSONS) return;

      const exercises = (lesson.exercises || []).slice(0, 7).map((item) => {
        const entry = allowedById.get(item.exerciseId) || substitute(item, allowed);
        const isTime = item.doseType === 'time';
        const dose: ExerciseDose = {
          type: isTime ? 'time' : 'reps',
          amount: isTime ? clamp(item.amount, 10, 90) : clamp(item.amount, 4, 20),
          perSide: Boolean(item.perSide),
        };
        return { entry, dose };
      });

      // Guarantee the lesson opens with a warmup movement.
      if (warmups.length > 0 && exercises.length > 0 && exercises[0].entry.category !== 'warmup') {
        const warmup = warmups[flat.length % warmups.length];
        exercises.unshift({ entry: warmup, dose: warmup.defaultDose });
      }

      if (exercises.length < 2) return;

      flat.push({
        name: clean(lesson.name, 100) || `Lesson ${flat.length + 1}`,
        lessonType: clean(lesson.lessonType, 60) || 'Workout',
        xpReward: clamp(lesson.xpReward, 10, 40),
        // Computed from the actual doses (not trusted from the model) so the
        // minutes shown match what the mission player will really take.
        estimatedDurationMinutes: estimateLessonMinutes(exercises),
        difficulty: clean(lesson.difficulty, 30) || 'Beginner',
        exercises,
      });
    });
  });

  // Second pass: always produce exactly SECTION_COUNT sections with the
  // lessons spread evenly. Models return lopsided or collapsed structures
  // (a section with 1 lesson, or everything in one section), and lesson
  // dropping above can shrink sections further — so the layout is decided
  // here in code, never trusted from the model. Missing section titles are
  // derived from the lessons themselves.
  const base = Math.floor(flat.length / SECTION_COUNT);
  const extra = flat.length % SECTION_COUNT;

  const lessons: RepairedLesson[] = [];
  let cursor = 0;
  for (let sectionIndex = 0; sectionIndex < SECTION_COUNT; sectionIndex += 1) {
    const size = base + (sectionIndex < extra ? 1 : 0);
    const chunk = flat.slice(cursor, cursor + size);
    const meta = providedMetas[sectionIndex] || {
      title: derivedSectionTitle(chunk, sectionIndex, language),
      summary: '',
    };
    chunk.forEach((lesson, position) => {
      lessons.push({
        ...lesson,
        sectionTitle: meta.title,
        sectionSummary: meta.summary,
        sectionNumber: sectionIndex + 1,
        lessonNumber: position + 1,
      });
    });
    cursor += size;
  }

  return lessons;
};

// Structural validation used inside the AI retry loop: cheap checks whose
// failures are worth a model retry (deeper repair happens in repairPlan).
const validateStructure = (plan: AiPlan, allowedIds: Set<string>, targetLessons: number): string | null => {
  // Section count is repaired (rebalanced to 5) rather than rejected — small
  // models often collapse the plan into one or two sections.
  if (!Array.isArray(plan.sections) || plan.sections.length === 0) {
    return 'The plan must contain 5 sections with lessons.';
  }
  const allExercises = plan.sections.flatMap((section) =>
    (section.lessons || []).flatMap((lesson) => lesson.exercises || [])
  );
  const totalLessons = plan.sections.reduce((count, section) => count + (section.lessons || []).length, 0);
  // The prompt asks for the exact per-level target as a nudge, but a plan is
  // only rejected below the floor every model reliably clears (15 lessons =
  // 3 per section). Demanding the full target caused small models to fail
  // validation on every attempt.
  const minimumLessons = Math.min(15, targetLessons - 3);
  if (totalLessons < minimumLessons) {
    return `Only ${totalLessons} lessons returned; the plan must contain exactly ${targetLessons} lessons (${targetLessons / 5} per section).`;
  }
  if (allExercises.length === 0) {
    return 'Lessons contained no exercises.';
  }
  const invalid = allExercises.filter((item) => !allowedIds.has(item.exerciseId));
  if (invalid.length / allExercises.length > 0.2) {
    const sample = Array.from(new Set(invalid.map((item) => item.exerciseId))).slice(0, 10).join(', ');
    return `Too many unknown exercise ids (${sample}). Use only ids from the catalog.`;
  }
  return null;
};

export type GeneratedPlanSummary = { planId: number; lessonsCount: number };

export const generatePlanForUser = async (
  userId: number,
  language: ExerciseLanguage
): Promise<GeneratedPlanSummary> => {
  if (!isAiEnabled()) {
    throw new PlanGenerationError('AI plan generation is not configured');
  }

  const latest = await getLatestPlan(userId);
  if (
    latest &&
    latest.status === 'generating' &&
    Date.now() - new Date(latest.created_at).getTime() < 2 * 60 * 1000
  ) {
    throw new PlanGenerationInProgressError();
  }

  const profile = await fetchProfile(userId);
  const ceiling = difficultyCeiling(profile.fitness_level);
  const allowed = allowedExercisesFor(profile.equipment, ceiling);
  const allowedIds = new Set(allowed.map((entry) => entry.id));

  const planRow = await pool.query(
    `INSERT INTO user_plans (user_id, status, source, language, model, profile_snapshot)
     VALUES ($1, 'generating', 'ai', $2, $3, $4)
     RETURNING id`,
    [userId, language, currentModelName(), JSON.stringify(profile)]
  );
  const planId: number = planRow.rows[0].id;

  try {
    const { system, user } = buildPrompt(profile, allowed, language);
    const lessonsPerSection = lessonsPerSectionFor(profile.fitness_level);
    const targetLessons = lessonsPerSection * SECTION_COUNT;
    const rawPlan = await completeJson<unknown>({
      system,
      user,
      schema: buildPlanSchema(lessonsPerSection),
      validate: (raw) => validateStructure(toPlan(raw), allowedIds, targetLessons),
      maxRetries: 1,
    });

    const lessons = repairPlan(toPlan(rawPlan), allowed, language);
    if (lessons.length < 10) {
      throw new Error('Plan had too few usable lessons after validation');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE user_plans SET is_active = FALSE WHERE user_id = $1 AND is_active', [userId]);

      let firstLessonId: number | null = null;
      for (const lesson of lessons) {
        const resolved = lesson.exercises.map(({ entry, dose }) => resolveExercise(entry.id, language, dose));
        const inserted = await client.query(
          `INSERT INTO path_lessons (
            lesson_name, section_number, unit_number, lesson_number, lesson_type,
            exercises, xp_reward, estimated_duration_minutes, difficulty,
            user_id, plan_id, section_title, section_summary
          )
          VALUES ($1, $2, 1, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING id`,
          [
            lesson.name,
            lesson.sectionNumber,
            lesson.lessonNumber,
            lesson.lessonType,
            JSON.stringify(resolved),
            lesson.xpReward,
            lesson.estimatedDurationMinutes,
            lesson.difficulty,
            userId,
            planId,
            lesson.sectionTitle,
            lesson.sectionSummary,
          ]
        );
        if (firstLessonId === null) {
          firstLessonId = inserted.rows[0].id;
        }
      }

      if (firstLessonId !== null) {
        await client.query(
          `INSERT INTO user_path_progress (user_id, lesson_id, completed, attempted)
           VALUES ($1, $2, FALSE, TRUE)
           ON CONFLICT (user_id, lesson_id) DO UPDATE SET attempted = TRUE`,
          [userId, firstLessonId]
        );
      }

      // Drop today's uncompleted missions so the new plan applies immediately.
      await client.query(
        `DELETE FROM missions
         WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE
          AND mission_type IN ('Daily mission', 'Extra mission') AND completed = FALSE`,
        [userId]
      );

      await client.query(
        `UPDATE user_plans
         SET status = 'ready', is_active = TRUE, generated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [planId]
      );
      await client.query('COMMIT');
    } catch (transactionError) {
      await client.query('ROLLBACK');
      throw transactionError;
    } finally {
      client.release();
    }

    return { planId, lessonsCount: lessons.length };
  } catch (error: any) {
    const message = String(error?.message || 'Plan generation failed').slice(0, 500);
    await pool
      .query(`UPDATE user_plans SET status = 'failed', error = $2 WHERE id = $1`, [planId, message])
      .catch(() => undefined);
    // Log metadata only — never prompt contents or profile data.
    console.error('[planGenerator] generation failed', { userId, planId, message });
    throw new PlanGenerationError(message);
  }
};
