import express from 'express';
import pool from '../db/connection';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);

const dateOnly = (value: unknown) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().split('T')[0];
  return String(value).split('T')[0];
};

const daysBetween = (from: string, to: string) => {
  const fromDate = new Date(`${from}T00:00:00.000Z`);
  const toDate = new Date(`${to}T00:00:00.000Z`);
  return Math.floor((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
};

// Get user streak
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query('SELECT * FROM streaks WHERE user_id = $1', [userId]);

    if (result.rows.length === 0) {
      const created = await pool.query(
        'INSERT INTO streaks (user_id, current_streak, longest_streak) VALUES ($1, 0, 0) RETURNING *',
        [userId]
      );
      return res.json(created.rows[0]);
    }

    const today = new Date().toISOString().split('T')[0];
    const streak = result.rows[0];
    const lastCompleted = dateOnly(streak.last_completed_date);

    if (lastCompleted && daysBetween(lastCompleted, today) > 1 && streak.current_streak !== 0) {
      const reset = await pool.query(
        'UPDATE streaks SET current_streak = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 RETURNING *',
        [userId]
      );
      return res.json(reset.rows[0]);
    }

    res.json(streak);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update streak
router.post('/:userId/update', async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().split('T')[0];

    const streakResult = await pool.query('SELECT * FROM streaks WHERE user_id = $1', [userId]);
    
    if (streakResult.rows.length === 0) {
      const newStreak = await pool.query(
        'INSERT INTO streaks (user_id, current_streak, longest_streak, last_completed_date) VALUES ($1, 1, 1, $2) RETURNING *',
        [userId, today]
      );
      return res.json(newStreak.rows[0]);
    }

    const streak = streakResult.rows[0];
    const lastDate = streak.last_completed_date;
    const newStreak = new Date(today);
    const lastDateObj = new Date(lastDate);
    
    const daysDiff = Math.floor((newStreak.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24));

    let newStreakCount = streak.current_streak;
    if (daysDiff === 1) {
      newStreakCount = streak.current_streak + 1;
    } else if (daysDiff > 1) {
      newStreakCount = 1;
    }

    const result = await pool.query(
      'UPDATE streaks SET current_streak = $1, longest_streak = GREATEST(longest_streak, $1), last_completed_date = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3 RETURNING *',
      [newStreakCount, today, userId]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
