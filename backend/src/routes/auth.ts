import express from 'express';
import pool from '../db/connection';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ensureUserState } from '../services/userState';
import { sendEmail } from '../services/email';

const router = express.Router();

const jwtSecret = process.env.JWT_SECRET || 'secret';
const jwtOptions: jwt.SignOptions = {
  expiresIn: (process.env.JWT_EXPIRY || '7d') as jwt.SignOptions['expiresIn'],
};

const createTemporaryPassword = () => {
  const random = Math.random().toString(36).slice(2, 8);
  return `Sport-${random}-${Date.now().toString().slice(-4)}`;
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const result = await client.query(
        'INSERT INTO users (email, password, name, preferred_workout_duration, fitness_level, main_goal) VALUES ($1, $2, $3, 5, $4, $5) RETURNING id, email, name, preferred_workout_duration, fitness_level, main_goal',
        [email, hashedPassword, name, 'Beginner', 'Build a daily sports habit']
      );

      await ensureUserState(client, result.rows[0].id);
      await client.query('COMMIT');

      const token = jwt.sign(
        { userId: result.rows[0].id, email: result.rows[0].email },
        jwtSecret,
        jwtOptions
      );

      res.status(201).json({ user: result.rows[0], token });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      jwtOptions
    );

    await pool.query('UPDATE users SET last_seen_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        age: user.age,
        height: user.height,
        weight: user.weight,
        fitness_level: user.fitness_level,
        main_goal: user.main_goal,
        preferred_workout_duration: user.preferred_workout_duration,
      },
      token,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const userResult = await pool.query('SELECT id, email, name FROM users WHERE email = $1', [email]);

    // Do not reveal whether the email exists.
    if (userResult.rows.length === 0) {
      return res.json({ message: 'If this email exists, reset instructions were sent.' });
    }

    const user = userResult.rows[0];
    const temporaryPassword = createTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    await pool.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, user.id]
    );

    await sendEmail({
      to: user.email,
      subject: 'Your FitLingo temporary password',
      text: `Hi ${user.name},\n\nYour temporary FitLingo password is:\n\n${temporaryPassword}\n\nPlease log in and change it later. If you did not request this, ignore this email and contact support.`,
    });

    res.json({ message: 'If this email exists, reset instructions were sent.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
