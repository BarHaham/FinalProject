import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db/connection';
import { initializeDatabase } from './db/init';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import missionRoutes from './routes/missions';
import streakRoutes from './routes/streaks';
import leaderboardRoutes from './routes/leaderboard';
import progressRoutes from './routes/progress';
import goalsRoutes from './routes/goals';
import exercisesRoutes from './routes/exercises';
import { startReminderScheduler } from './services/reminders';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  credentials: true,
}));
app.use(express.json());

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/streaks', streakRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/exercises', exercisesRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

initializeDatabase()
  .then(() => {
    startReminderScheduler();
    app.listen(PORT, () => {
      console.log(`FitLingo API running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database', error);
    process.exit(1);
  });

export default pool;
