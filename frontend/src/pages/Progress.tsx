import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { weeklyActivity } from '../data/sportLingoData';
import api from '../utils/api';
import { getStoredUser } from '../utils/storage';
import { useLanguage } from '../i18n/LanguageContext';

type Streak = {
  current_streak: number;
  longest_streak: number;
};

type ProgressSummary = {
  total_xp: number;
  current_level: number;
  total_missions_completed: number;
  total_minutes_trained: number;
};

type Achievement = {
  achievement_name: string;
  unlocked: boolean;
  unlocked_at: string | null;
};

type MissionRecord = {
  id: number;
  title: string;
  focus_area: string;
  xp_reward: number;
  duration_minutes: number;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
};

const Progress: React.FC = () => {
  const navigate = useNavigate();
  const { t, tv } = useLanguage();
  const [streak, setStreak] = useState<Streak>({ current_streak: 0, longest_streak: 0 });
  const [progress, setProgress] = useState<ProgressSummary>({ total_xp: 0, current_level: 1, total_missions_completed: 0, total_minutes_trained: 0 });
  const [weekDays, setWeekDays] = useState<boolean[]>(Array(7).fill(false));
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [history, setHistory] = useState<MissionRecord[]>([]);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) { navigate('/login'); return; }

    const fetchData = async () => {
      try {
        const [streakRes, progressRes, weeklyRes, achievementsRes, historyRes] = await Promise.all([
          api.get<Streak>(`/streaks/${user.id}`),
          api.get<ProgressSummary>(`/progress/${user.id}`),
          api.get<{ days: boolean[] }>(`/missions/weekly/${user.id}`),
          api.get<Achievement[]>(`/progress/${user.id}/achievements`),
          api.get<MissionRecord[]>(`/missions/user/${user.id}`),
        ]);
        setStreak(streakRes.data);
        setProgress(progressRes.data);
        setWeekDays(weeklyRes.data.days);
        setAchievements(achievementsRes.data);
        setHistory(historyRes.data.filter((m) => m.completed));
      } catch {
        // keep defaults on error
      }
    };

    fetchData();
  }, [navigate]);

  return (
    <AppShell title={t('progress.title')}>
      <div className="grid gap-6">
        <section>
          <p className="text-sm font-black uppercase tracking-wide text-primary">{t('progress.kicker')}</p>
          <h2 className="mt-2 text-3xl font-black">{t('progress.heading')}</h2>
          <p className="mt-2 max-w-2xl text-slate-600">{t('progress.copy')}</p>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="stat-card"><p className="stat-label">{t('dashboard.currentStreak')}</p><p className="stat-value">{streak.current_streak}</p></div>
          <div className="stat-card"><p className="stat-label">{t('progress.longest')}</p><p className="stat-value">{streak.longest_streak}</p></div>
          <div className="stat-card"><p className="stat-label">{t('progress.totalWorkouts')}</p><p className="stat-value">{progress.total_missions_completed}</p></div>
          <div className="stat-card"><p className="stat-label">{t('progress.totalMinutes')}</p><p className="stat-value">{progress.total_minutes_trained}</p></div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black">{t('progress.weekly')}</h3>
          <div className="mt-5 grid grid-cols-7 gap-2">
            {weeklyActivity.map((day, index) => (
              <div key={`${day.day}-${index}`} className="rounded-md bg-slate-50 p-3 text-center">
                <div className={`mx-auto h-12 rounded-md ${weekDays[index] ? 'bg-success' : 'bg-slate-200'}`} />
                <p className="mt-2 text-sm font-black text-slate-500">{day.day}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black">{t('progress.achievements')}</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((achievement, index) => (
              <div
                key={achievement.achievement_name}
                className={`rounded-md border p-4 ${achievement.unlocked ? 'border-primary/30 bg-primary/5' : 'border-slate-200 opacity-50'}`}
              >
                <p className="text-sm font-black text-primary">Badge {index + 1}</p>
                <p className="mt-1 font-black">{tv(achievement.achievement_name)}</p>
                {achievement.unlocked && achievement.unlocked_at && (
                  <p className="mt-1 text-xs text-slate-500">{new Date(achievement.unlocked_at).toLocaleDateString()}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black">{t('progress.history')}</h3>
          {history.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">{t('progress.noHistory')}</p>
          ) : (
            <div className="mt-4 space-y-2">
              {history.map((mission) => (
                <div key={mission.id} className="flex items-center justify-between rounded-md bg-slate-50 p-3">
                  <div>
                    <p className="font-bold">{tv(mission.title)}</p>
                    <p className="text-sm text-slate-500">
                      {mission.focus_area} · {mission.duration_minutes} {t('unit.min')} ·{' '}
                      {mission.completed_at
                        ? new Date(mission.completed_at).toLocaleDateString()
                        : new Date(mission.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-sm font-black text-success">+{mission.xp_reward} XP</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
};

export default Progress;
