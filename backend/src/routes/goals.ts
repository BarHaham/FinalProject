import express from 'express';
import pool from '../db/connection';
import { authenticateToken } from '../middleware/auth';
import { weekStartDate } from '../services/userState';

const todayDate = () => new Date().toISOString().split('T')[0];

const router = express.Router();
router.use(authenticateToken);

// GET daily goal for user (today)
router.get('/daily/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const today = todayDate();

    const result = await pool.query(
      'SELECT * FROM daily_goals WHERE user_id = $1 AND goal_date = $2 ORDER BY created_at DESC LIMIT 1',
      [userId, today]
    );

    if (result.rows.length === 0) {
      return res.json({ user_id: Number(userId), goal_date: today, goals: [] });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST / UPSERT daily goal for user
router.post('/daily/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { goal_type, goal_value } = req.body;
    const today = todayDate();

    if (!goal_type || goal_value == null) {
      return res.status(400).json({ error: 'goal_type and goal_value are required' });
    }

    const existing = await pool.query(
      'SELECT id FROM daily_goals WHERE user_id = $1 AND goal_date = $2 AND goal_type = $3',
      [userId, today, goal_type]
    );

    let result;
    if (existing.rows.length > 0) {
      result = await pool.query(
        'UPDATE daily_goals SET goal_value = $1, completed = FALSE, completed_at = NULL WHERE id = $2 RETURNING *',
        [goal_value, existing.rows[0].id]
      );
    } else {
      result = await pool.query(
        'INSERT INTO daily_goals (user_id, goal_type, goal_value, goal_date) VALUES ($1, $2, $3, $4) RETURNING *',
        [userId, goal_type, goal_value, today]
      );
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mark daily goal as completed
router.post('/daily/:userId/complete', async (req, res) => {
  try {
    const { userId } = req.params;
    const { goal_type } = req.body;
    const today = todayDate();

    const result = await pool.query(
      `UPDATE daily_goals
       SET completed = TRUE, completed_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND goal_date = $2 AND goal_type = $3
       RETURNING *`,
      [userId, today, goal_type]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Daily goal not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET weekly goal for user (current week)
router.get('/weekly/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const weekStart = weekStartDate();

    const result = await pool.query(
      'SELECT * FROM weekly_goals WHERE user_id = $1 AND week_start_date = $2',
      [userId, weekStart]
    );

    if (result.rows.length === 0) {
      return res.json({ user_id: Number(userId), week_start_date: weekStart, goals: [] });
    }

    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST / UPSERT weekly goal for user
router.post('/weekly/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { goal_type, goal_value } = req.body;

    if (!goal_type || goal_value == null) {
      return res.status(400).json({ error: 'goal_type and goal_value are required' });
    }

    const weekStart = weekStartDate();

    const existing = await pool.query(
      'SELECT id FROM weekly_goals WHERE user_id = $1 AND week_start_date = $2 AND goal_type = $3',
      [userId, weekStart, goal_type]
    );

    let result;
    if (existing.rows.length > 0) {
      result = await pool.query(
        'UPDATE weekly_goals SET goal_value = $1, completed = FALSE, completed_at = NULL WHERE id = $2 RETURNING *',
        [goal_value, existing.rows[0].id]
      );
    } else {
      result = await pool.query(
        'INSERT INTO weekly_goals (user_id, goal_type, goal_value, week_start_date) VALUES ($1, $2, $3, $4) RETURNING *',
        [userId, goal_type, goal_value, weekStart]
      );
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mark weekly goal as completed
router.post('/weekly/:userId/complete', async (req, res) => {
  try {
    const { userId } = req.params;
    const { goal_type } = req.body;
    const weekStart = weekStartDate();

    const result = await pool.query(
      `UPDATE weekly_goals
       SET completed = TRUE, completed_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND week_start_date = $2 AND goal_type = $3
       RETURNING *`,
      [userId, weekStart, goal_type]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Weekly goal not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
