import pool from '../db/connection';
import { sendEmail } from './email';

const todayDate = () => new Date().toISOString().split('T')[0];

export const sendStreakExpiryReminders = async () => {
  const today = todayDate();
  const result = await pool.query(
    `SELECT u.id, u.email, u.name, s.current_streak, u.last_seen_at
     FROM users u
     JOIN streaks s ON s.user_id = u.id
     WHERE s.current_streak > 0
      AND (s.last_completed_date IS NULL OR s.last_completed_date < $1)
      AND (u.last_seen_at IS NULL OR u.last_seen_at < NOW() - INTERVAL '8 hours')
      AND (s.last_reminder_sent_date IS NULL OR s.last_reminder_sent_date < $1)`,
    [today]
  );

  for (const user of result.rows) {
    await sendEmail({
      to: user.email,
      subject: 'Your FitLingo streak is waiting',
      text: `Hi ${user.name}, your FitLingo streak is ${user.current_streak} days. You have not opened FitLingo for 8 hours, and your streak may expire if you do not complete a mission today. Come back and keep it alive.`,
    });

    await pool.query(
      'UPDATE streaks SET last_reminder_sent_date = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [today, user.id]
    );
  }
};

export const startReminderScheduler = () => {
  const runIfLateEnough = async () => {
    try {
      await sendStreakExpiryReminders();
    } catch (error) {
      console.error('Failed to send streak reminders', error);
    }
  };

  runIfLateEnough();
  windowlessInterval(runIfLateEnough, 60 * 60 * 1000);
};

const windowlessInterval = (callback: () => void, ms: number) => {
  setInterval(callback, ms);
};
