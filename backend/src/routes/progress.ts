import express from 'express';
import pool from '../db/connection';
import { calculateLevel } from '../services/userState';

const router = express.Router();

// Get user progress
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query('SELECT * FROM user_progress WHERE user_id = $1', [userId]);

    if (result.rows.length === 0) {
      const created = await pool.query(
        'INSERT INTO user_progress (user_id) VALUES ($1) RETURNING *',
        [userId]
      );
      return res.json(created.rows[0]);
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add XP
router.post('/:userId/add-xp', async (req, res) => {
  try {
    const { userId } = req.params;
    const { xp } = req.body;

    if (!xp || xp <= 0) {
      return res.status(400).json({ error: 'Invalid XP amount' });
    }

    const current = await pool.query('SELECT total_xp FROM user_progress WHERE user_id = $1', [userId]);
    const nextTotalXp = (current.rows[0]?.total_xp || 0) + xp;
    const result = await pool.query(
      `UPDATE user_progress
       SET total_xp = $1,
           current_level = $2,
           current_xp_in_level = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $4
       RETURNING *`,
      [nextTotalXp, calculateLevel(nextTotalXp), nextTotalXp, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Progress not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get sports path with user completion state
router.get('/:userId/path', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `SELECT
        pl.*,
        COALESCE(upp.completed, FALSE) AS completed,
        COALESCE(upp.attempted, FALSE) AS attempted
       FROM path_lessons pl
       LEFT JOIN user_path_progress upp
        ON upp.lesson_id = pl.id AND upp.user_id = $1
       ORDER BY pl.section_number, pl.unit_number, pl.lesson_number`,
      [userId]
    );

    let firstOpenFound = false;
    const lessons = result.rows.map((row) => {
      let state = 'locked';
      if (row.completed) {
        state = 'completed';
      } else if (!firstOpenFound) {
        state = 'current';
        firstOpenFound = true;
      }

      return { ...row, state };
    });

    res.json(lessons);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get achievements
router.get('/:userId/achievements', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query('SELECT * FROM achievements WHERE user_id = $1 AND unlocked = TRUE', [userId]);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
