import pool from './connection';
import schema from './schema';
import { pathLessonSeeds } from '../data/content';

export const initializeDatabase = async () => {
  await pool.query(schema);

  for (const lesson of pathLessonSeeds) {
    await pool.query(
      `INSERT INTO path_lessons (
        lesson_name,
        section_number,
        unit_number,
        lesson_number,
        lesson_type,
        exercises,
        xp_reward,
        estimated_duration_minutes,
        difficulty
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (section_number, unit_number, lesson_number) WHERE user_id IS NULL
      DO UPDATE SET
        lesson_name = EXCLUDED.lesson_name,
        lesson_type = EXCLUDED.lesson_type,
        exercises = EXCLUDED.exercises,
        xp_reward = EXCLUDED.xp_reward,
        estimated_duration_minutes = EXCLUDED.estimated_duration_minutes,
        difficulty = EXCLUDED.difficulty`,
      [
        lesson.lessonName,
        lesson.sectionNumber,
        lesson.unitNumber,
        lesson.lessonNumber,
        lesson.lessonType,
        JSON.stringify(lesson.exercises),
        lesson.xpReward,
        lesson.estimatedDurationMinutes,
        lesson.difficulty,
      ]
    );
  }
};
