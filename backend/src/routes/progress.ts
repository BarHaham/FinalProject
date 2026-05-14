import express from 'express';
import pool from '../db/connection';
import { calculateLevel } from '../services/userState';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);

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

// Complete a path lesson
router.post('/:userId/path/complete', async (req, res) => {
  const client = await pool.connect();
  try {
    const { userId } = req.params;
    const { lessonId } = req.body;

    if (!lessonId) {
      return res.status(400).json({ error: 'lessonId is required' });
    }

    await client.query('BEGIN');

    await client.query(
      `INSERT INTO user_path_progress (user_id, lesson_id, completed, attempted, completed_at)
       VALUES ($1, $2, TRUE, TRUE, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, lesson_id)
       DO UPDATE SET completed = TRUE, attempted = TRUE, completed_at = CURRENT_TIMESTAMP`,
      [userId, lessonId]
    );

    const nextLesson = await client.query(
      `SELECT pl.id
       FROM path_lessons pl
       LEFT JOIN user_path_progress upp
        ON upp.lesson_id = pl.id AND upp.user_id = $1
       WHERE COALESCE(upp.completed, FALSE) = FALSE
       ORDER BY pl.section_number, pl.unit_number, pl.lesson_number
       LIMIT 1`,
      [userId]
    );

    if (nextLesson.rows.length > 0) {
      await client.query(
        `INSERT INTO user_path_progress (user_id, lesson_id, completed, attempted)
         VALUES ($1, $2, FALSE, TRUE)
         ON CONFLICT (user_id, lesson_id)
         DO UPDATE SET attempted = TRUE`,
        [userId, nextLesson.rows[0].id]
      );
    }

    await client.query('COMMIT');

    res.json({
      completed: true,
      nextLessonId: nextLesson.rows[0]?.id ?? null,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Get achievements
router.get('/:userId/achievements', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      'SELECT * FROM achievements WHERE user_id = $1 ORDER BY unlocked DESC, achievement_name',
      [userId]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
