import pool from '../db/connection';

// Works with both the Pool and a checked-out PoolClient inside transactions.
export type Queryable = {
  query: (text: string, params?: any[]) => Promise<{ rows: any[] }>;
};

export type UserPlan = {
  id: number;
  user_id: number;
  status: 'generating' | 'ready' | 'failed';
  source: 'ai' | 'static';
  language: string;
  model: string | null;
  is_active: boolean;
  error: string | null;
  generated_at: Date | null;
  created_at: Date;
};

// The user's active, ready plan — or null, meaning they are on the global static path.
export const getActivePlan = async (userId: number, db: Queryable = pool): Promise<UserPlan | null> => {
  const result = await db.query(
    `SELECT * FROM user_plans
     WHERE user_id = $1 AND is_active AND status = 'ready'
     ORDER BY id DESC
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
};

// Latest plan row regardless of state (for status endpoints / in-flight guards).
export const getLatestPlan = async (userId: number, db: Queryable = pool): Promise<UserPlan | null> => {
  const result = await db.query(
    'SELECT * FROM user_plans WHERE user_id = $1 ORDER BY id DESC LIMIT 1',
    [userId]
  );
  return result.rows[0] || null;
};

// Lesson scope: rows of the user's active plan when one exists,
// otherwise the global static path (user_id IS NULL).
const LESSON_SCOPE =
  '(($2::int IS NOT NULL AND pl.plan_id = $2) OR ($2::int IS NULL AND pl.user_id IS NULL))';

export const getScopedLessons = async (userId: number, db: Queryable = pool) => {
  const plan = await getActivePlan(userId, db);
  const result = await db.query(
    `SELECT
      pl.*,
      COALESCE(upp.completed, FALSE) AS completed,
      COALESCE(upp.attempted, FALSE) AS attempted
     FROM path_lessons pl
     LEFT JOIN user_path_progress upp
      ON upp.lesson_id = pl.id AND upp.user_id = $1
     WHERE ${LESSON_SCOPE}
     ORDER BY pl.section_number, pl.unit_number, pl.lesson_number`,
    [userId, plan?.id ?? null]
  );
  return { plan, lessons: result.rows };
};

export const getCurrentLessonForPlan = async (
  userId: number,
  planId: number | null,
  db: Queryable = pool
) => {
  const result = await db.query(
    `SELECT pl.*
     FROM path_lessons pl
     LEFT JOIN user_path_progress upp
      ON upp.lesson_id = pl.id AND upp.user_id = $1
     WHERE ${LESSON_SCOPE} AND COALESCE(upp.completed, FALSE) = FALSE
     ORDER BY pl.section_number, pl.unit_number, pl.lesson_number
     LIMIT 1`,
    [userId, planId]
  );
  return result.rows[0] || null;
};

export const getCurrentLesson = async (userId: number, db: Queryable = pool) => {
  const plan = await getActivePlan(userId, db);
  return getCurrentLessonForPlan(userId, plan?.id ?? null, db);
};
