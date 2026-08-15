import express from 'express';
import pool from '../db/connection';
import { beginnerDailyMission, practiceSessions } from '../data/content';
import { calculateLevel, weekStartDate } from '../services/userState';
import { getActivePlan, getCurrentLesson, getCurrentLessonForPlan } from '../services/planService';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);

const toDateOnly = (value: unknown) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().split('T')[0];
  return String(value).split('T')[0];
};

const getMissionTemplateForUser = async (userId: number) => {
  const currentLesson = await getCurrentLesson(userId);
  return currentLesson
    ? {
      title: currentLesson.lesson_name,
      description: 'Your next bodyweight lesson is ready.',
      durationMinutes: currentLesson.estimated_duration_minutes,
      difficultyLevel: currentLesson.difficulty,
      focusArea: currentLesson.lesson_type,
      xpReward: currentLesson.xp_reward,
      missionType: 'Daily mission',
      exercises: currentLesson.exercises || beginnerDailyMission.exercises,
    }
    : beginnerDailyMission;
};

const createMissionForUser = async (userId: number) => {
  const template = await getMissionTemplateForUser(userId);

  const result = await pool.query(
    `INSERT INTO missions (
      user_id,
      title,
      description,
      duration_minutes,
      difficulty_level,
      focus_area,
      xp_reward,
      mission_type,
      exercises
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      userId,
      template.title,
      template.description,
      template.durationMinutes,
      template.difficultyLevel,
      template.focusArea,
      template.xpReward,
      template.missionType,
      JSON.stringify(template.exercises),
    ]
  );

  return result.rows[0];
};

// Get or create today's daily mission
router.get('/daily/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const today = new Date().toISOString().split('T')[0];

    const existing = await pool.query(
      `SELECT *
       FROM missions
       WHERE user_id = $1
        AND DATE(created_at) = $2
        AND mission_type = 'Daily mission'
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId, today]
    );

    if (existing.rows.length > 0) {
      return res.json(existing.rows[0]);
    }

    const mission = await createMissionForUser(userId);
    res.status(201).json(mission);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Practice catalog
router.get('/practice', (_req, res) => {
  res.json(practiceSessions);
});

// Get completed days this week (Sun=0 … Sat=6) for the weekly activity grid
router.get('/weekly/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const now = new Date();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - now.getDay());
    const weekStart = sunday.toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT EXTRACT(DOW FROM completed_at) AS dow
       FROM missions
       WHERE user_id = $1
         AND completed = TRUE
         AND completed_at >= $2::date`,
      [userId, weekStart]
    );

    const activeDays = new Set(result.rows.map((r: any) => Number(r.dow)));
    const days = [0, 1, 2, 3, 4, 5, 6].map((d) => activeDays.has(d));
    res.json({ days });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all missions for user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      'SELECT * FROM missions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Complete mission and update XP, streak, path, achievements, and weekly leaderboard
router.post('/:missionId/complete', async (req, res) => {
  const client = await pool.connect();

  try {
    const missionId = Number(req.params.missionId);
    const today = new Date().toISOString().split('T')[0];

    await client.query('BEGIN');

    const missionResult = await client.query('SELECT * FROM missions WHERE id = $1 FOR UPDATE', [missionId]);
    if (missionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Mission not found' });
    }

    const mission = missionResult.rows[0];
    if (mission.completed) {
      const [progress, streak] = await Promise.all([
        client.query('SELECT * FROM user_progress WHERE user_id = $1', [mission.user_id]),
        client.query('SELECT * FROM streaks WHERE user_id = $1', [mission.user_id]),
      ]);
      await client.query('COMMIT');
      return res.json({
        mission,
        progress: progress.rows[0],
        streak: streak.rows[0],
        alreadyCompleted: true,
      });
    }

    const completedMission = await client.query(
      `UPDATE missions
       SET completed = TRUE,
           completed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [missionId]
    );

    const currentProgress = await client.query('SELECT * FROM user_progress WHERE user_id = $1 FOR UPDATE', [mission.user_id]);
    const totalXp = (currentProgress.rows[0]?.total_xp || 0) + mission.xp_reward;
    const totalMinutes = (currentProgress.rows[0]?.total_minutes_trained || 0) + (mission.duration_minutes || 0);
    const totalMissions = (currentProgress.rows[0]?.total_missions_completed || 0) + 1;

    const progress = await client.query(
      `INSERT INTO user_progress (
        user_id,
        total_xp,
        current_level,
        current_xp_in_level,
        total_missions_completed,
        total_minutes_trained
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id)
      DO UPDATE SET
        total_xp = EXCLUDED.total_xp,
        current_level = EXCLUDED.current_level,
        current_xp_in_level = EXCLUDED.current_xp_in_level,
        total_missions_completed = EXCLUDED.total_missions_completed,
        total_minutes_trained = EXCLUDED.total_minutes_trained,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [mission.user_id, totalXp, calculateLevel(totalXp), totalXp, totalMissions, totalMinutes]
    );

    const streakResult = await client.query('SELECT * FROM streaks WHERE user_id = $1 FOR UPDATE', [mission.user_id]);
    const previousStreak = streakResult.rows[0];
    const lastCompletedDate = toDateOnly(previousStreak?.last_completed_date);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];

    let currentStreak = 1;
    if (lastCompletedDate === today) {
      currentStreak = previousStreak?.current_streak || 1;
    } else if (lastCompletedDate === yesterdayDate) {
      currentStreak = (previousStreak?.current_streak || 0) + 1;
    }

    const streak = await client.query(
      `INSERT INTO streaks (user_id, current_streak, longest_streak, last_completed_date)
       VALUES ($1, $2, $2, $3)
       ON CONFLICT (user_id)
       DO UPDATE SET
        current_streak = EXCLUDED.current_streak,
        longest_streak = GREATEST(streaks.longest_streak, EXCLUDED.current_streak),
        last_completed_date = EXCLUDED.last_completed_date,
        updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [mission.user_id, currentStreak, today]
    );

    const activePlan = await getActivePlan(mission.user_id, client);
    const pathLesson = await getCurrentLessonForPlan(mission.user_id, activePlan?.id ?? null, client);

    if (pathLesson) {
      await client.query(
        `INSERT INTO user_path_progress (user_id, lesson_id, completed, attempted, completed_at)
         VALUES ($1, $2, TRUE, TRUE, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id, lesson_id)
         DO UPDATE SET completed = TRUE, attempted = TRUE, completed_at = CURRENT_TIMESTAMP`,
        [mission.user_id, pathLesson.id]
      );

      const nextLesson = await getCurrentLessonForPlan(mission.user_id, activePlan?.id ?? null, client);

      if (nextLesson) {
        await client.query(
          `INSERT INTO user_path_progress (user_id, lesson_id, completed, attempted)
           VALUES ($1, $2, FALSE, TRUE)
           ON CONFLICT (user_id, lesson_id)
           DO UPDATE SET attempted = TRUE`,
          [mission.user_id, nextLesson.id]
        );
      }
    }

    const unlockedAchievements: string[] = [];
    const unlockAchievement = async (name: string) => {
      const result = await client.query(
        `UPDATE achievements
         SET unlocked = TRUE, unlocked_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND achievement_name = $2 AND unlocked = FALSE
         RETURNING achievement_name`,
        [mission.user_id, name]
      );
      if (result.rows.length > 0) unlockedAchievements.push(result.rows[0].achievement_name);
    };

    await unlockAchievement('First Workout Completed');
    if (currentStreak >= 3) await unlockAchievement('3-Day Streak');
    if (currentStreak >= 7) await unlockAchievement('7-Day Streak');
    if (totalXp >= 100) await unlockAchievement('100 XP Earned');
    if (String(mission.focus_area).toLowerCase().includes('abs') || String(mission.focus_area).toLowerCase().includes('core')) {
      await unlockAchievement('Core Starter');
    }
    if (String(mission.focus_area).toLowerCase().includes('glute') || String(mission.focus_area).toLowerCase().includes('legs')) {
      await unlockAchievement('Glute Builder');
    }

    const weekStart = weekStartDate();
    await client.query(
      `INSERT INTO leaderboard (user_id, league, weekly_xp, rank_position, week_start_date)
       VALUES ($1, 'Bronze', $2, 1, $3)
       ON CONFLICT (user_id, week_start_date)
       DO UPDATE SET weekly_xp = leaderboard.weekly_xp + $2`,
      [mission.user_id, mission.xp_reward, weekStart]
    );

    await client.query('COMMIT');

    res.json({
      mission: completedMission.rows[0],
      progress: progress.rows[0],
      streak: streak.rows[0],
      unlockedAchievements,
      alreadyCompleted: false,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

export default router;
