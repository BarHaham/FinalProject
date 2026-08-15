import pool from '../db/connection';
import { weekStartDate } from './userState';

// Duolingo-style weekly leagues. Every Monday the previous week's results
// are settled lazily (first request of the new week triggers it):
//   - top PROMOTE_COUNT with XP > 0 in each league move up one league
//   - bottom DEMOTE_COUNT move down one league, but only when the league had
//     at least MIN_FOR_DEMOTION participants (avoids demoting everyone while
//     the user base is small, and keeps promoted/demoted sets disjoint)
export const LEAGUE_ORDER = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
export const PROMOTE_COUNT = 10;
export const DEMOTE_COUNT = 5;
export const MIN_FOR_DEMOTION = 15;

export const previousWeekStart = (): string => {
  const date = new Date(`${weekStartDate()}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 7);
  return date.toISOString().split('T')[0];
};

export const getCurrentLeague = async (userId: number): Promise<string> => {
  const result = await pool.query('SELECT current_league FROM users WHERE id = $1', [userId]);
  return result.rows[0]?.current_league || 'Bronze';
};

// Settle last week's promotions/demotions exactly once. Cheap no-op after the
// week has been processed. Never throws — league settling must not break the
// request that happened to trigger it.
export const processPreviousWeekIfNeeded = async (): Promise<void> => {
  try {
    const prevWeek = previousWeekStart();
    const done = await pool.query('SELECT 1 FROM league_weeks WHERE week_start_date = $1', [prevWeek]);
    if (done.rows.length > 0) return;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // The marker row doubles as a concurrency guard: only the request that
      // manages to insert it performs the processing.
      const marker = await client.query(
        `INSERT INTO league_weeks (week_start_date) VALUES ($1)
         ON CONFLICT (week_start_date) DO NOTHING
         RETURNING week_start_date`,
        [prevWeek]
      );
      if (marker.rows.length === 0) {
        await client.query('ROLLBACK');
        return;
      }

      const rows = await client.query(
        `SELECT user_id, league, weekly_xp
         FROM leaderboard
         WHERE week_start_date = $1
         ORDER BY weekly_xp DESC`,
        [prevWeek]
      );

      const byLeague = new Map<string, { user_id: number; weekly_xp: number }[]>();
      for (const row of rows.rows) {
        const list = byLeague.get(row.league) || [];
        list.push({ user_id: row.user_id, weekly_xp: Number(row.weekly_xp) });
        byLeague.set(row.league, list);
      }

      for (let index = 0; index < LEAGUE_ORDER.length; index += 1) {
        const league = LEAGUE_ORDER[index];
        const participants = byLeague.get(league) || [];
        if (participants.length === 0) continue;

        if (index < LEAGUE_ORDER.length - 1) {
          const promoted = participants
            .filter((entry) => entry.weekly_xp > 0)
            .slice(0, PROMOTE_COUNT)
            .map((entry) => entry.user_id);
          if (promoted.length > 0) {
            await client.query('UPDATE users SET current_league = $1 WHERE id = ANY($2::int[])', [
              LEAGUE_ORDER[index + 1],
              promoted,
            ]);
          }
        }

        if (index > 0 && participants.length >= MIN_FOR_DEMOTION) {
          const demoted = participants.slice(-DEMOTE_COUNT).map((entry) => entry.user_id);
          if (demoted.length > 0) {
            await client.query('UPDATE users SET current_league = $1 WHERE id = ANY($2::int[])', [
              LEAGUE_ORDER[index - 1],
              demoted,
            ]);
          }
        }
      }

      await client.query('COMMIT');
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('[leagueService] weekly processing failed', { message: String(error?.message || error).slice(0, 200) });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('[leagueService] weekly processing check failed', { message: String(error?.message || error).slice(0, 200) });
  }
};
