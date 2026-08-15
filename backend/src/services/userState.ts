import { PoolClient } from 'pg';
import { achievementCatalog } from '../data/content';

export const ensureUserState = async (client: PoolClient, userId: number) => {
  await client.query(
    `INSERT INTO streaks (user_id, current_streak, longest_streak, streak_freezes)
     VALUES ($1, 0, 0, 0)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );

  await client.query(
    `INSERT INTO user_progress (user_id, total_xp, current_level, current_xp_in_level, total_missions_completed, total_minutes_trained)
     VALUES ($1, 0, 1, 0, 0, 0)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );

  for (const achievement of achievementCatalog) {
    await client.query(
      `INSERT INTO achievements (user_id, achievement_name, achievement_type, unlocked)
       VALUES ($1, $2, $3, FALSE)
       ON CONFLICT (user_id, achievement_name) DO NOTHING`,
      [userId, achievement.name, achievement.type]
    );
  }

  const firstLessons = await client.query(
    'SELECT id FROM path_lessons WHERE user_id IS NULL ORDER BY section_number, unit_number, lesson_number'
  );
  for (const [index, lesson] of firstLessons.rows.entries()) {
    await client.query(
      `INSERT INTO user_path_progress (user_id, lesson_id, completed, attempted)
       VALUES ($1, $2, FALSE, $3)
       ON CONFLICT (user_id, lesson_id) DO NOTHING`,
      [userId, lesson.id, index === 0]
    );
  }
};

export const calculateLevel = (totalXp: number) => {
  if (totalXp >= 500) return 4;
  if (totalXp >= 250) return 3;
  if (totalXp >= 100) return 2;
  return 1;
};

export const weekStartDate = () => {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  now.setDate(now.getDate() + mondayOffset);
  return now.toISOString().split('T')[0];
};
