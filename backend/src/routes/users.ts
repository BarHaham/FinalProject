import express from 'express';
import pool from '../db/connection';
import bcrypt from 'bcryptjs';

const router = express.Router();

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

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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
    } = req.body;

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
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING id, email, name, age, height, weight, gender, current_activity_level, fitness_level, main_goal, motivation_reason, preferred_workout_duration`,
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
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

export default router;
