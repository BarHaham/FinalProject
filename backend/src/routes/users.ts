import express from 'express';
import pool from '../db/connection';
import bcrypt from 'bcryptjs';
import { authenticateToken } from '../middleware/auth';
import { isAiEnabled } from '../services/openaiClient';
import { generateFollowUpQuestions, staticFollowUpQuestions } from '../services/onboardingQuestions';
import {
  PlanGenerationInProgressError,
  generatePlanForUser,
} from '../services/planGenerator';
import { getLatestPlan } from '../services/planService';
import { getCurrentLeague, processPreviousWeekIfNeeded } from '../services/leagueService';
import { weekStartDate } from '../services/userState';
import { ExerciseLanguage } from '../data/exerciseLibrary';

const router = express.Router();
router.use(authenticateToken);

// Only the authenticated user may hit endpoints about themselves.
// Applied to the new AI endpoints (they cost money per call).
const requireSelf = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const tokenUserId = Number((req as any).user?.userId);
  if (!Number.isInteger(tokenUserId) || tokenUserId !== Number(req.params.id)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

const parseLanguage = (value: unknown): ExerciseLanguage => (value === 'he' ? 'he' : 'en');

const cleanText = (value: unknown, maxLength: number) =>
  String(value ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .trim()
    .slice(0, maxLength);

// Validate/normalize the follow-up answers array before it is stored and later
// embedded in an AI prompt (length caps double as prompt-injection reduction).
const sanitizeFollowUpAnswers = (raw: unknown) => {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 8).map((entry: any) => ({
    questionId: cleanText(entry?.questionId, 40),
    question: cleanText(entry?.question, 200),
    answerIds: Array.isArray(entry?.answerIds)
      ? entry.answerIds.slice(0, 6).map((id: unknown) => cleanText(id, 40))
      : [],
    answerLabels: Array.isArray(entry?.answerLabels)
      ? entry.answerLabels.slice(0, 6).map((label: unknown) => cleanText(label, 200))
      : [],
  }));
};

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT
        id,
        email,
        name,
        age,
        height,
        weight,
        target_weight,
        gender,
        current_activity_level,
        fitness_level,
        main_goal,
        motivation_reason,
        preferred_workout_duration
       FROM users
       WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [equipment, sports] = await Promise.all([
      pool.query('SELECT equipment_type FROM equipment WHERE user_id = $1 ORDER BY equipment_type', [id]),
      pool.query('SELECT sport_type FROM sport_preferences WHERE user_id = $1 ORDER BY sport_type', [id]),
    ]);

    res.json({
      ...result.rows[0],
      equipment: equipment.rows.map((row) => row.equipment_type),
      preferred_sports: sports.rows.map((row) => row.sport_type),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      age,
      height,
      weight,
      target_weight,
      gender,
      current_activity_level,
      fitness_level,
      main_goal,
      motivation_reason,
      preferred_workout_duration,
    } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           age = $2,
           height = $3,
           weight = $4,
           target_weight = $5,
           gender = $6,
           current_activity_level = $7,
           fitness_level = $8,
           main_goal = $9,
           motivation_reason = $10,
           preferred_workout_duration = $11,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $12
       RETURNING id, email, name, age, height, weight, target_weight, gender, current_activity_level, fitness_level, main_goal, motivation_reason, preferred_workout_duration`,
      [
        name,
        age ?? null,
        height ?? null,
        weight ?? null,
        target_weight ?? null,
        gender ?? null,
        current_activity_level ?? null,
        fitness_level ?? null,
        main_goal ?? null,
        motivation_reason ?? null,
        preferred_workout_duration ?? null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Change password
router.post('/:id/change-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All password fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const userResult = await pool.query('SELECT id, password FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, userResult.rows[0].password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, id]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mark user activity/open app
router.post('/:id/activity', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE users SET last_seen_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, last_seen_at',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Settle last week's league promotions/demotions if this is the first
    // request of a new week, then keep the user visible on this week's board
    // in their current league (0 XP row until they complete a mission).
    await processPreviousWeekIfNeeded();
    const league = await getCurrentLeague(Number(id));
    await pool.query(
      `INSERT INTO leaderboard (user_id, league, weekly_xp, week_start_date)
       VALUES ($1, $3, 0, $2)
       ON CONFLICT (user_id, week_start_date) DO NOTHING`,
      [id, weekStartDate(), league]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI-tailored follow-up questions for the onboarding wizard.
// Always answers 200 — falls back to the static question set when AI is off/fails.
router.post('/:id/onboarding/questions', requireSelf, async (req, res) => {
  try {
    const language = parseLanguage(req.body?.language);
    const dailyTimeGoal = Number(req.body?.dailyTimeGoal);
    const core = {
      mainGoal: cleanText(req.body?.mainGoal, 120),
      fitnessLevel: cleanText(req.body?.fitnessLevel, 60),
      dailyTimeGoal: Number.isInteger(dailyTimeGoal) && dailyTimeGoal >= 1 && dailyTimeGoal <= 15 ? dailyTimeGoal : 5,
      language,
    };
    if (!core.mainGoal || !core.fitnessLevel) {
      return res.json(staticFollowUpQuestions(language));
    }
    const result = await generateFollowUpQuestions(core);
    res.json(result);
  } catch {
    res.json(staticFollowUpQuestions(parseLanguage(req.body?.language)));
  }
});

// Save onboarding answers
router.post('/:id/onboarding', async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const {
      age,
      height,
      weight,
      gender,
      activityLevel,
      fitnessLevel,
      mainGoal,
      motivationReason,
      dailyTimeGoal,
      equipment = [],
      sports = [],
      followUpAnswers,
      language,
    } = req.body;

    const preferredLanguage = parseLanguage(language);
    const sanitizedAnswers = sanitizeFollowUpAnswers(followUpAnswers);

    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE users
       SET age = $1,
           height = $2,
           weight = $3,
           gender = $4,
           current_activity_level = $5,
           fitness_level = $6,
           main_goal = $7,
           motivation_reason = $8,
           preferred_workout_duration = $9,
           preferred_language = $10,
           onboarding_answers = $11,
           onboarding_completed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $12
       RETURNING id, email, name, age, height, weight, gender, current_activity_level, fitness_level, main_goal, motivation_reason, preferred_workout_duration, preferred_language`,
      [
        Number(age) || null,
        Number(height) || null,
        Number(weight) || null,
        gender || null,
        activityLevel || null,
        fitnessLevel || 'Beginner',
        mainGoal || 'Build a daily sports habit',
        motivationReason || null,
        Number(dailyTimeGoal) || 5,
        preferredLanguage,
        JSON.stringify(sanitizedAnswers),
        id,
      ]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    await client.query('DELETE FROM equipment WHERE user_id = $1', [id]);
    for (const item of equipment as string[]) {
      await client.query(
        'INSERT INTO equipment (user_id, equipment_type) VALUES ($1, $2) ON CONFLICT (user_id, equipment_type) DO NOTHING',
        [id, item]
      );
    }

    await client.query('DELETE FROM sport_preferences WHERE user_id = $1', [id]);
    for (const item of sports as string[]) {
      await client.query(
        'INSERT INTO sport_preferences (user_id, sport_type) VALUES ($1, $2) ON CONFLICT (user_id, sport_type) DO NOTHING',
        [id, item]
      );
    }

    await client.query('COMMIT');

    res.json({
      ...result.rows[0],
      equipment,
      preferred_sports: sports,
      planGeneration: isAiEnabled() ? 'pending' : 'disabled',
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Generate (or regenerate) the user's AI-personalized plan. Synchronous —
// the frontend shows a "building your plan" screen while this runs.
router.post('/:id/plan/generate', requireSelf, async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (!isAiEnabled()) {
      return res.json({ status: 'disabled', fallback: 'static' });
    }

    // Simple per-user daily cost cap.
    const todayCount = await pool.query(
      `SELECT COUNT(*)::int AS count FROM user_plans WHERE user_id = $1 AND created_at >= CURRENT_DATE`,
      [userId]
    );
    if (todayCount.rows[0].count >= 5) {
      return res.status(429).json({ status: 'failed', error: 'Daily plan generation limit reached', fallback: 'static' });
    }

    let language = parseLanguage(req.body?.language);
    if (!req.body?.language) {
      const stored = await pool.query('SELECT preferred_language FROM users WHERE id = $1', [userId]);
      language = parseLanguage(stored.rows[0]?.preferred_language);
    }

    const summary = await generatePlanForUser(userId, language);
    res.json({ status: 'ready', source: 'ai', lessonsCount: summary.lessonsCount });
  } catch (error: any) {
    if (error instanceof PlanGenerationInProgressError) {
      return res.status(409).json({ status: 'generating' });
    }
    // The user stays on the static path; the reason is returned to the owner
    // (this endpoint is requireSelf) so failures are diagnosable from the UI.
    res.json({
      status: 'failed',
      fallback: 'static',
      error: String(error?.message || 'Plan generation failed').slice(0, 300),
    });
  }
});

// Current plan status — drives the AI/Starter badge and the polling hatch.
router.get('/:id/plan', requireSelf, async (req, res) => {
  try {
    const plan = await getLatestPlan(Number(req.params.id));
    if (!plan) {
      return res.json({ status: 'none', source: 'static', aiEnabled: isAiEnabled() });
    }
    res.json({
      status: plan.status,
      source: plan.status === 'ready' && plan.is_active ? plan.source : 'static',
      language: plan.language,
      generated_at: plan.generated_at,
      aiEnabled: isAiEnabled(),
      // Failure reason (visible to the owner only) — helps diagnose AI issues.
      error: plan.status === 'failed' ? plan.error : undefined,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
