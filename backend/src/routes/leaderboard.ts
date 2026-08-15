import express from 'express';
import pool from '../db/connection';
import { weekStartDate } from '../services/userState';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);

// Get leaderboard for current week
router.get('/current/:league', async (req, res) => {
  try {
    const { league } = req.params;
    // Must match the week bucket used when XP is written on mission completion.
    const weekStart = weekStartDate();

    const result = await pool.query(
      `SELECT l.user_id, u.name, l.league, l.weekly_xp, l.rank_position
       FROM leaderboard l
       JOIN users u ON l.user_id = u.id
       WHERE l.league = $1 AND l.week_start_date = $2
       ORDER BY l.weekly_xp DESC
       LIMIT 100`,
      [league, weekStart]
    );

    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all leagues
router.get('/', async (req, res) => {
  try {
    const leagues = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
    const result = await pool.query(
      'SELECT DISTINCT league FROM leaderboard ORDER BY league'
    );

    res.json(result.rows.length > 0 ? result.rows : leagues.map(l => ({ league: l })));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user rank — computed live from this week's XP within the league
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const weekStart = weekStartDate();

    const result = await pool.query(
      `WITH ranked AS (
        SELECT user_id, league, weekly_xp, week_start_date,
               ROW_NUMBER() OVER (PARTITION BY league ORDER BY weekly_xp DESC)::int AS rank_position
        FROM leaderboard
        WHERE week_start_date = $2
      )
      SELECT * FROM ranked WHERE user_id = $1`,
      [userId, weekStart]
    );

    if (result.rows.length > 0) {
      return res.json(result.rows[0]);
    }

    const latest = await pool.query(
      'SELECT * FROM leaderboard WHERE user_id = $1 ORDER BY week_start_date DESC LIMIT 1',
      [userId]
    );
    if (latest.rows.length === 0) {
      return res.json({ message: 'User not on leaderboard' });
    }
    res.json(latest.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
