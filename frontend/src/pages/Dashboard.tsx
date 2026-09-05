import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AppShell from '../components/AppShell';
import PlanGeneratingScreen from '../components/PlanGeneratingScreen';
import { PlanBadge, isAiPlan, runPlanGeneration, usePlanStatus } from '../components/PlanStatus';
import { LessonState, dailyMission as fallbackDailyMission, Mission, pathUnits, practiceCategories, weeklyActivity } from '../data/sportLingoData';
import api from '../utils/api';
import { getOnboardingProfile, getStoredUser, StoredUser } from '../utils/storage';
import { formatText, useLanguage } from '../i18n/LanguageContext';

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

type PathPreviewLesson = {
  id: string;
  title: string;
  durationMinutes: number;
  xpReward: number;
  state: LessonState;
};

type ApiPathLesson = {
  id: number;
  lesson_name: string;
  xp_reward: number;
  estimated_duration_minutes: number;
  state: LessonState;
};

const fallbackStreak: Streak = {
  current_streak: 0,
  longest_streak: 0,
};

const fallbackProgress: ProgressSummary = {
  total_xp: 0,
  current_level: 1,
  total_missions_completed: 0,
  total_minutes_trained: 0,
};

const getLocalProgress = (): { streak: Streak; progress: ProgressSummary } => {
  const stored = localStorage.getItem('demoProgress');
  if (!stored) {
    return { streak: fallbackStreak, progress: fallbackProgress };
  }

  try {
    const parsed = JSON.parse(stored) as { totalXP?: number; streak?: number; workouts?: number; minutes?: number };
    return {
      streak: {
        current_streak: parsed.streak || 0,
        longest_streak: parsed.streak || 0,
      },
      progress: {
        total_xp: parsed.totalXP || 0,
        current_level: (parsed.totalXP || 0) >= 100 ? 2 : 1,
        total_missions_completed: parsed.workouts || 0,
        total_minutes_trained: parsed.minutes || 0,
      },
    };
  } catch {
    return { streak: fallbackStreak, progress: fallbackProgress };
  }
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [streak, setStreak] = useState<Streak>(fallbackStreak);
  const [progress, setProgress] = useState<ProgressSummary>(fallbackProgress);
  const [dailyMission, setDailyMission] = useState<Mission>(fallbackDailyMission);
  const [pathLessons, setPathLessons] = useState<PathPreviewLesson[]>(
    pathUnits.flatMap((unit) => unit.lessons).map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      durationMinutes: lesson.durationMinutes,
      xpReward: lesson.xpReward,
      state: lesson.state,
    }))
  );
  const [weekDays, setWeekDays] = useState<boolean[]>(Array(7).fill(false));
  const [bannerDismissed, setBannerDismissed] = useState(() => localStorage.getItem('starterBannerDismissed') === 'true');
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const { plan } = usePlanStatus();
  const onboarding = getOnboardingProfile();
  const { t, tv, language } = useLanguage();

  // Offer AI plan generation when the user completed onboarding but ended up
  // on the static starter path (AI failed or was unavailable at the time).
  const showStarterBanner = Boolean(
    plan &&
    plan.aiEnabled &&
    !isAiPlan(plan) &&
    plan.status !== 'generating' &&
    localStorage.getItem('onboardingProfile') &&
    !bannerDismissed
  );

  const dismissBanner = () => {
    localStorage.setItem('starterBannerDismissed', 'true');
    setBannerDismissed(true);
  };

  const generatePlanNow = async () => {
    const storedUser = getStoredUser();
    if (!storedUser || generatingPlan) return;
    setGeneratingPlan(true);
    const result = await runPlanGeneration(storedUser.id, language);
    if (result.ready) {
      toast.success(t('plan.regenerateSuccess'));
      window.location.reload();
      return;
    }
    toast.error(`${t('plan.regenerateFailed')}${result.error ? `\n(${result.error})` : ''}`, { duration: 10000 });
    setGeneratingPlan(false);
  };

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      navigate('/login');
      return;
    }

        setUser(storedUser);
        api.post(`/users/${storedUser.id}/activity`).catch(() => undefined);

    const fetchData = async () => {
      try {
        const [streakResponse, progressResponse, missionResponse, pathResponse, weeklyResponse] = await Promise.all([
          api.get<Streak>(`/streaks/${storedUser.id}`),
          api.get<ProgressSummary>(`/progress/${storedUser.id}`),
          api.get(`/missions/daily/${storedUser.id}`),
          api.get<ApiPathLesson[]>(`/progress/${storedUser.id}/path`),
          api.get<{ days: boolean[] }>(`/missions/weekly/${storedUser.id}`),
        ]);

        setStreak(streakResponse.data);
        setProgress(progressResponse.data);
        setWeekDays(weeklyResponse.data.days);
        setDailyMission({
          id: String(missionResponse.data.id),
          title: missionResponse.data.title,
          description: missionResponse.data.description,
          durationMinutes: missionResponse.data.duration_minutes,
          difficulty: missionResponse.data.difficulty_level,
          focus: missionResponse.data.focus_area,
          xpReward: missionResponse.data.xp_reward,
          type: missionResponse.data.mission_type,
          equipment: ['No equipment'],
          exercises: missionResponse.data.exercises,
        });
        setPathLessons(pathResponse.data.map((lesson) => ({
          id: String(lesson.id),
          title: lesson.lesson_name,
          durationMinutes: lesson.estimated_duration_minutes,
          xpReward: lesson.xp_reward,
          state: lesson.state,
        })));
      } catch {
        const local = getLocalProgress();
        setStreak(local.streak);
        setProgress(local.progress);
        setDailyMission(fallbackDailyMission);
      }
    };

    fetchData();
  }, [navigate]);

  const daysActiveThisWeek = weekDays.filter(Boolean).length;
  const completedLessons = pathLessons.filter((lesson) => lesson.state === 'completed').length;
  const totalLessons = pathLessons.length;
  const pathProgress = Math.round((completedLessons / totalLessons) * 100);
  const levelProgress = Math.min(100, Math.round((progress.total_xp / 100) * 100));

  return (
    <AppShell title={t('dashboard.title')}>
      {generatingPlan && <PlanGeneratingScreen />}
      <div className="grid gap-6">
        {showStarterBanner && (
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-violet-200 bg-violet-50 p-4">
            <div>
              <p className="font-black text-violet-900">✨ {t('plan.starterBannerTitle')}</p>
              <p className="mt-1 text-sm text-violet-700">{t('plan.starterBannerCopy')}</p>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={generatePlanNow} disabled={generatingPlan} className="btn-primary">
                {generatingPlan ? t('onboarding.generatingTitle') : t('plan.starterBannerButton')}
              </button>
              <button type="button" onClick={dismissBanner} className="text-sm font-black text-violet-400 hover:text-violet-700" aria-label="Dismiss">
                ✕
              </button>
            </div>
          </section>
        )}

        <section className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-md bg-slate-950 p-6 text-white">
            <p className="text-sm font-black uppercase tracking-wide text-success">{t('dashboard.todayEnough')}</p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">{t('dashboard.welcomeBack')}, {user?.name || t('dashboard.fallbackName')}.</h2>
            <p className="mt-3 max-w-2xl text-slate-300">
              {tv(onboarding.motivationReason) || t('dashboard.defaultMotivation')} {formatText(t('dashboard.missionReady'), { minutes: onboarding.dailyTimeGoal })}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/mission" className="btn-primary">
                {t('dashboard.startToday')}
              </Link>
              <Link to="/practice" className="btn-ghost-dark">
                {t('dashboard.extraPractice')}
              </Link>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">{t('dashboard.currentStreak')}</p>
            <p className="mt-2 text-4xl font-black text-primary sm:text-5xl">{streak.current_streak}</p>
            <p className="mt-1 text-sm text-slate-500">{formatText(t('dashboard.longestStreak'), { days: streak.longest_streak })}</p>
            <div className="mt-5 grid grid-cols-7 gap-2">
              {weeklyActivity.map((day, index) => (
                <div key={`${day.day}-${index}`} className="text-center">
                  <div className={`mx-auto h-9 w-9 rounded-full border ${weekDays[index] ? 'border-success bg-success' : 'border-slate-200 bg-slate-100'}`} />
                  <p className="mt-1 text-xs font-bold text-slate-500">{day.day}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="stat-card">
            <p className="stat-label">{t('dashboard.level')}</p>
            <p className="stat-value">{progress.current_level}</p>
            <div className="mt-3 h-2 rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-secondary" style={{ width: `${levelProgress}%` }} />
            </div>
          </div>
          <div className="stat-card">
            <p className="stat-label">{t('dashboard.totalXp')}</p>
            <p className="stat-value">{progress.total_xp}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">{t('dashboard.workouts')}</p>
            <p className="stat-value">{progress.total_missions_completed}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">{t('dashboard.minutes')}</p>
            <p className="stat-value">{progress.total_minutes_trained}</p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-primary">{t('mission.today')}</p>
                  <PlanBadge plan={plan} />
                </div>
                <h3 className="mt-1 text-2xl font-black">{tv(dailyMission.title)}</h3>
                <p className="mt-2 text-slate-600">{tv(dailyMission.description)}</p>
              </div>
              <span className="rounded-full bg-success/15 px-3 py-1 text-sm font-black text-emerald-700">+{dailyMission.xpReward} XP</span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="mini-metric">{t('dashboard.duration')}: {dailyMission.durationMinutes} {t('unit.min')}</div>
              <div className="mini-metric">{t('dashboard.focus')}: {tv(dailyMission.focus)}</div>
              <div className="mini-metric">{t('dashboard.level')}: {tv(dailyMission.difficulty)}</div>
            </div>
            <Link to="/mission" className="btn-primary mt-5 inline-flex">
              {t('dashboard.startWorkout')}
            </Link>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black">{t('dashboard.sportsPath')}</h3>
              <Link to="/path" className="text-sm font-black text-primary">{t('dashboard.viewPath')}</Link>
            </div>
            <div className="mt-4 h-3 rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-primary" style={{ width: `${pathProgress}%` }} />
            </div>
            <p className="mt-2 text-sm text-slate-500">{formatText(t('dashboard.lessonsComplete'), { done: completedLessons, total: totalLessons })}</p>
            <div className="mt-5 space-y-3">
              {pathLessons.slice(0, 3).map((lesson) => (
                <div key={lesson.id} className="flex items-center justify-between rounded-md bg-slate-50 p-3">
                  <div>
                    <p className="font-bold">{tv(lesson.title)}</p>
                    <p className="text-sm text-slate-500">{lesson.durationMinutes} {t('unit.min')} · {lesson.xpReward} XP</p>
                  </div>
                  <span className="text-sm font-black capitalize text-slate-500">{t(`state.${lesson.state}`)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black">{t('dashboard.weeklyGoal')}</h3>
              <Link to="/progress" className="text-sm font-black text-primary">{t('nav.progress')}</Link>
            </div>
            <p className="mt-3 text-sm text-slate-500">{formatText(t('dashboard.daysActive'), { done: daysActiveThisWeek })}</p>
            <div className="mt-3 h-3 rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-success transition-all" style={{ width: `${Math.round((daysActiveThisWeek / 7) * 100)}%` }} />
            </div>
            <div className="mt-4 grid grid-cols-7 gap-1">
              {weeklyActivity.map((day, index) => (
                <div key={`${day.day}-${index}`} className="text-center">
                  <div className={`mx-auto h-6 w-6 rounded-full ${weekDays[index] ? 'bg-success' : 'bg-slate-100'}`} />
                  <p className="mt-1 text-xs text-slate-500">{day.day}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black">{t('dashboard.leaderboard')}</h3>
              <Link to="/leaderboard" className="text-sm font-black text-primary">{t('nav.leaderboard')}</Link>
            </div>
            <p className="mt-3 text-slate-600">{t('leaderboard.copy')}</p>
            <Link to="/leaderboard" className="btn-primary mt-4 inline-flex">
              {t('leaderboard.rankings')}
            </Link>
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-black">{t('dashboard.recommended')}</h3>
            <Link to="/practice" className="text-sm font-black text-primary">{t('dashboard.seeAll')}</Link>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {practiceCategories.slice(0, 3).map((practice) => (
              <Link key={practice.title} to={`/mission?practice=${encodeURIComponent(practice.title)}`} className="rounded-md border border-slate-200 p-4 transition hover:border-primary hover:shadow-sm">
                <p className="font-black">{tv(practice.title)}</p>
                <p className="mt-1 text-sm text-slate-500">{practice.duration.replace('min', t('unit.min'))} · {tv(practice.focus)}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
};

export default Dashboard;
