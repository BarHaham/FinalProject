const schema = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  profile_picture_url VARCHAR(500),
  age INTEGER,
  height INTEGER,
  weight INTEGER,
  target_weight INTEGER,
  gender VARCHAR(50),
  current_activity_level VARCHAR(100),
  fitness_level VARCHAR(50),
  main_goal VARCHAR(100),
  motivation_reason VARCHAR(255),
  preferred_workout_duration INTEGER,
  last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS target_weight INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_activity_level VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS motivation_reason VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_workout_duration INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(5);
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_answers JSONB;

-- Equipment table
CREATE TABLE IF NOT EXISTS equipment (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  equipment_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_equipment_user_type ON equipment(user_id, equipment_type);

-- Sport preferences table
CREATE TABLE IF NOT EXISTS sport_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  sport_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sport_preferences_user_type ON sport_preferences(user_id, sport_type);

-- Missions table
CREATE TABLE IF NOT EXISTS missions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  difficulty_level VARCHAR(50),
  focus_area VARCHAR(100),
  xp_reward INTEGER DEFAULT 20,
  mission_type VARCHAR(100),
  exercises JSONB,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_missions_user_day_type ON missions(user_id, (DATE(created_at)), mission_type);

-- Streaks table
CREATE TABLE IF NOT EXISTS streaks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completed_date DATE,
  streak_freezes INTEGER DEFAULT 0,
  last_reminder_sent_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE streaks ADD COLUMN IF NOT EXISTS last_reminder_sent_date DATE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_streaks_unique_user ON streaks(user_id);

-- XP and Levels table
CREATE TABLE IF NOT EXISTS user_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  current_xp_in_level INTEGER DEFAULT 0,
  total_missions_completed INTEGER DEFAULT 0,
  total_minutes_trained INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_progress_unique_user ON user_progress(user_id);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  achievement_name VARCHAR(255) NOT NULL,
  achievement_type VARCHAR(100),
  unlocked BOOLEAN DEFAULT FALSE,
  unlocked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_achievements_user_name ON achievements(user_id, achievement_name);

-- Leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  league VARCHAR(100),
  weekly_xp INTEGER DEFAULT 0,
  rank_position INTEGER,
  week_start_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_user_week ON leaderboard(user_id, week_start_date);

-- Daily goals table
CREATE TABLE IF NOT EXISTS daily_goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  goal_type VARCHAR(100),
  goal_value INTEGER,
  goal_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Weekly goals table
CREATE TABLE IF NOT EXISTS weekly_goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  goal_type VARCHAR(100),
  goal_value INTEGER,
  week_start_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI-personalized training plans (one active plan per user; lessons live in path_lessons)
CREATE TABLE IF NOT EXISTS user_plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'generating',
  source VARCHAR(20) NOT NULL DEFAULT 'ai',
  language VARCHAR(5) NOT NULL DEFAULT 'en',
  model VARCHAR(100),
  profile_snapshot JSONB,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  error TEXT,
  generated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_plans_one_active ON user_plans(user_id) WHERE is_active;

-- Path and lessons table (rows with user_id IS NULL are the global static path;
-- rows with user_id/plan_id set belong to a user's AI-generated plan)
CREATE TABLE IF NOT EXISTS path_lessons (
  id SERIAL PRIMARY KEY,
  lesson_name VARCHAR(255) NOT NULL,
  section_number INTEGER,
  unit_number INTEGER,
  lesson_number INTEGER,
  lesson_type VARCHAR(100),
  exercises JSONB,
  xp_reward INTEGER DEFAULT 20,
  estimated_duration_minutes INTEGER,
  difficulty VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE path_lessons ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
ALTER TABLE path_lessons ADD COLUMN IF NOT EXISTS plan_id INTEGER REFERENCES user_plans(id);
ALTER TABLE path_lessons ADD COLUMN IF NOT EXISTS section_title VARCHAR(255);
ALTER TABLE path_lessons ADD COLUMN IF NOT EXISTS section_summary TEXT;
ALTER TABLE path_lessons ADD COLUMN IF NOT EXISTS description TEXT;
DROP INDEX IF EXISTS idx_path_lessons_position;
CREATE UNIQUE INDEX IF NOT EXISTS idx_path_lessons_position_global
  ON path_lessons(section_number, unit_number, lesson_number) WHERE user_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_path_lessons_user_plan ON path_lessons(user_id, plan_id);

-- User path progress table
CREATE TABLE IF NOT EXISTS user_path_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  lesson_id INTEGER NOT NULL REFERENCES path_lessons(id),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  attempted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_path_progress_unique ON user_path_progress(user_id, lesson_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_missions_user_id ON missions(user_id);
CREATE INDEX IF NOT EXISTS idx_streaks_user_id ON streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_league ON leaderboard(league);
CREATE INDEX IF NOT EXISTS idx_leaderboard_week ON leaderboard(week_start_date);
CREATE INDEX IF NOT EXISTS idx_user_path_progress_user ON user_path_progress(user_id);
`;

export default schema;
