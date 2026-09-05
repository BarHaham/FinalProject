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

// Strict structured-output schema. Numeric/count ranges are enforced in code
// (clamped or repaired) to stay within the strict-mode keyword subset.
const PLAN_SCHEMA = {
  name: 'training_plan',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['sections'],
    properties: {
      sections: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['title', 'summary', 'lessons'],
          properties: {
            title: { type: 'string' },
            summary: { type: 'string' },
            lessons: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['name', 'lessonType', 'xpReward', 'estimatedDurationMinutes', 'difficulty', 'exercises'],
                properties: {
                  name: { type: 'string' },
                  lessonType: { type: 'string' },
                  xpReward: { type: 'integer' },
                  estimatedDurationMinutes: { type: 'integer' },
                  difficulty: { type: 'string', enum: ['Easy', 'Beginner', 'Intermediate', 'Advanced', 'Gentle'] },
                  exercises: {
                    type: 'array',
                    items: {
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
                  },
                },
              },
            },
          },
        },
      },
    },
  },
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
  if (level.includes('advanced') || level.includes('intermediate')) return 5;
  if (level.includes('complete')) return 3;
  return 4;
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
    'HARD RULES:',
    '- Use ONLY exercise ids from the provided catalog. Never invent ids.',
    `- Every lesson must take roughly ${targetMinutes} minutes (within 2 minutes either way).`,
    '- The FIRST exercise of every lesson must be from the warmup category.',
    '- Progress difficulty gradually across sections; early lessons easier, later lessons harder.',
    `- EXACTLY 5 sections with EXACTLY ${lessonsPerSection} lessons each — ${totalLessons} lessons in total. Count them before answering. 3 to 7 exercises per lesson.`,
    '- xpReward between 10 and 40, higher for longer/harder lessons.',
    '- lessonType is a short focus label such as "Core", "Legs", "Cardio", "Mobility", "Full body" — never the word "lesson".',
    '- For doseType "time", amount is seconds (10-90). For "reps", amount is repetitions (4-20). Use perSide=true for one-sided moves.',
    '- Align the theme of sections and lesson selection with the user\'s goal, sports interests, and follow-up answers.',
    `- Write all titles, summaries, lesson names and lessonType values in ${responseLanguage}.`,
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

const repairPlan = (plan: AiPlan, allowed: LibraryExercise[]): RepairedLesson[] => {
  const allowedById = new Map(allowed.map((entry) => [entry.id, entry]));
  const warmups = allowed.filter((entry) => entry.category === 'warmup');

  const sectionMetas = plan.sections.slice(0, 5).map((section, index) => ({
    title: clean(section.title, 100) || `Section ${index + 1}`,
    summary: clean(section.summary, 220),
  }));

  // First pass: repair every usable lesson into a flat, ordered list.
  type FlatLesson = Omit<RepairedLesson, 'sectionTitle' | 'sectionSummary' | 'sectionNumber' | 'lessonNumber'>;
  const flat: FlatLesson[] = [];

  plan.sections.slice(0, 5).forEach((section) => {
    (section.lessons || []).slice(0, 6).forEach((lesson) => {
      if (flat.length >= 25) return;

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
        estimatedDurationMinutes: clamp(lesson.estimatedDurationMinutes, 3, 20),
        difficulty: clean(lesson.difficulty, 30) || 'Beginner',
        exercises,
      });
    });
  });

  // Second pass: redistribute the lessons evenly across the section titles.
  // Models sometimes return lopsided structures (a section with 1 lesson),
  // and lesson-dropping above can shrink sections further — so the section
  // sizes are decided here in code, not trusted from the model.
  const sectionCount = Math.max(1, sectionMetas.length);
  const base = Math.floor(flat.length / sectionCount);
  const extra = flat.length % sectionCount;

  const lessons: RepairedLesson[] = [];
  let cursor = 0;
  sectionMetas.forEach((meta, sectionIndex) => {
    const size = base + (sectionIndex < extra ? 1 : 0);
    for (let position = 0; position < size; position += 1) {
      lessons.push({
        ...flat[cursor],
        sectionTitle: meta.title,
        sectionSummary: meta.summary,
        sectionNumber: sectionIndex + 1,
        lessonNumber: position + 1,
      });
      cursor += 1;
    }
  });

  return lessons;
};

// Structural validation used inside the AI retry loop: cheap checks whose
// failures are worth a model retry (deeper repair happens in repairPlan).
const validateStructure = (plan: AiPlan, allowedIds: Set<string>, targetLessons: number): string | null => {
  if (!Array.isArray(plan.sections) || plan.sections.length < 4) {
    return 'The plan must contain exactly 5 sections.';
  }
  const allExercises = plan.sections.flatMap((section) =>
    (section.lessons || []).flatMap((lesson) => lesson.exercises || [])
  );
  const totalLessons = plan.sections.reduce((count, section) => count + (section.lessons || []).length, 0);
  if (totalLessons < targetLessons - 3) {
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
    const targetLessons = lessonsPerSectionFor(profile.fitness_level) * 5;
    const aiPlan = await completeJson<AiPlan>({
      system,
      user,
      schema: PLAN_SCHEMA,
      validate: (plan) => validateStructure(plan, allowedIds, targetLessons),
      maxRetries: 1,
    });

    const lessons = repairPlan(aiPlan, allowed);
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
