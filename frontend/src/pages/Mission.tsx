import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ExerciseDemo from '../components/ExerciseDemo';
import { dailyMission as fallbackDailyMission, Mission as MissionData } from '../data/sportLingoData';
import { enrichExercisesWithMedia } from '../data/exerciseMedia';
import api from '../utils/api';
import { getStoredUser } from '../utils/storage';
import { useLanguage } from '../i18n/LanguageContext';

const restSeconds = 10;

const getExerciseSeconds = (duration: string) => {
  const value = Number.parseInt(duration, 10);
  if (Number.isNaN(value)) return 30;

  if (/min/i.test(duration)) return value * 60;
  return value;
};

const Mission: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dailyMission, setDailyMission] = useState<MissionData>({
    ...fallbackDailyMission,
    exercises: enrichExercisesWithMedia(fallbackDailyMission.exercises),
  });
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(() => getExerciseSeconds(fallbackDailyMission.exercises[0].duration));
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<'exercise' | 'rest'>('exercise');
  const [completed, setCompleted] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [completionData, setCompletionData] = useState<{ streak: number; achievements: string[] } | null>(null);
  const { t, tv, isHebrew } = useLanguage();

  const currentExercise = dailyMission.exercises[currentExerciseIndex];
  const nextExercise = dailyMission.exercises[currentExerciseIndex + 1];
  const progress = Math.round(((currentExerciseIndex + 1) / dailyMission.exercises.length) * 100);
  const currentExerciseSeconds = getExerciseSeconds(currentExercise.duration);

  const totalRemainingLabel = useMemo(() => {
    const remainingExerciseSeconds = dailyMission.exercises
      .slice(currentExerciseIndex + 1)
      .reduce((total, exercise) => total + getExerciseSeconds(exercise.duration), 0);
    const upcomingRests = Math.max(dailyMission.exercises.length - currentExerciseIndex - 1, 0) * restSeconds;
    const totalSeconds = secondsRemaining + remainingExerciseSeconds + upcomingRests;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [currentExerciseIndex, dailyMission.exercises, secondsRemaining]);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      navigate('/login');
      return;
    }

    const loadMission = async () => {
      const practiceTitle = new URLSearchParams(location.search).get('practice');

      try {
        const streakRes = await api.get(`/streaks/${user.id}`);
        setCurrentStreak(streakRes.data.current_streak || 0);

        if (practiceTitle) {
          const practiceRes = await api.get('/missions/practice');
          const session = (practiceRes.data as any[]).find(
            (s: any) => s.title === practiceTitle
          );
          if (session) {
            setDailyMission({
              id: `practice-${practiceTitle}`,
              title: session.title,
              description: session.description,
              durationMinutes: session.durationMinutes,
              difficulty: session.difficultyLevel,
              focus: session.focusArea,
              xpReward: session.xpReward,
              type: session.missionType,
              equipment: ['No equipment'],
              exercises: enrichExercisesWithMedia(session.exercises || []),
            });
            return;
          }
        }

        const missionRes = await api.get(`/missions/daily/${user.id}`);
        const data = missionRes.data;
        setDailyMission({
          id: String(data.id),
          title: data.title,
          description: data.description,
          durationMinutes: data.duration_minutes,
          difficulty: data.difficulty_level,
          focus: data.focus_area,
          xpReward: data.xp_reward,
          type: data.mission_type,
          equipment: ['No equipment'],
          exercises: enrichExercisesWithMedia(data.exercises || fallbackDailyMission.exercises),
        });
      } catch {
        setDailyMission({
          ...fallbackDailyMission,
          exercises: enrichExercisesWithMedia(fallbackDailyMission.exercises),
        });
      }
    };

    loadMission();
  }, [navigate, location.search]);

  useEffect(() => {
    setPhase('exercise');
    setIsRunning(false);
    setSecondsRemaining(getExerciseSeconds(currentExercise.duration));
  }, [currentExercise.duration]);

  useEffect(() => {
    if (!isRunning || completed) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setSecondsRemaining((current) => {
        if (current > 1) {
          return current - 1;
        }

        if (phase === 'exercise' && currentExerciseIndex < dailyMission.exercises.length - 1) {
          setPhase('rest');
          setSecondsRemaining(restSeconds);
          return restSeconds;
        }

        if (phase === 'rest' && currentExerciseIndex < dailyMission.exercises.length - 1) {
          setCurrentExerciseIndex((currentIndex) => currentIndex + 1);
          setPhase('exercise');
          const nextDuration = dailyMission.exercises[currentExerciseIndex + 1]?.duration;
          return nextDuration ? getExerciseSeconds(nextDuration) : 30;
        }

        setIsRunning(false);
        setCompleted(true);
        return 0;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [completed, currentExerciseIndex, dailyMission.exercises, isRunning, phase]);

  const moveToNextExercise = () => {
    if (phase === 'exercise' && currentExerciseIndex < dailyMission.exercises.length - 1) {
      setPhase('rest');
      setSecondsRemaining(restSeconds);
      setIsRunning(false);
      return;
    }

    if (currentExerciseIndex < dailyMission.exercises.length - 1) {
      setCurrentExerciseIndex((current) => current + 1);
      setPhase('exercise');
      setIsRunning(false);
      return;
    }

    setCompleted(true);
    setIsRunning(false);
  };

  useEffect(() => {
    if (!completed) return;

    const saveCompletion = async () => {
      const stored = localStorage.getItem('demoProgress');
      const prev = stored ? JSON.parse(stored) as { totalXP?: number; streak?: number; workouts?: number; minutes?: number } : {};
      const localUpdate = {
        totalXP: (prev.totalXP || 0) + dailyMission.xpReward,
        streak: Math.max((prev.streak || 0) + 1, 1),
        workouts: (prev.workouts || 0) + 1,
        minutes: (prev.minutes || 0) + dailyMission.durationMinutes,
      };

      if (/^\d+$/.test(dailyMission.id)) {
        try {
          const { data } = await api.post(`/missions/${dailyMission.id}/complete`);
          const newStreak = data.streak?.current_streak ?? localUpdate.streak;
          localStorage.setItem('demoProgress', JSON.stringify({
            totalXP: data.progress?.total_xp ?? localUpdate.totalXP,
            streak: newStreak,
            workouts: data.progress?.total_missions_completed ?? localUpdate.workouts,
            minutes: data.progress?.total_minutes_trained ?? localUpdate.minutes,
          }));
          setCompletionData({ streak: newStreak, achievements: data.unlockedAchievements ?? [] });
          return;
        } catch {
          // fall through to local
        }
      }

      localStorage.setItem('demoProgress', JSON.stringify(localUpdate));
      setCompletionData({ streak: localUpdate.streak, achievements: [] });
    };

    saveCompletion();
  }, [completed]); // eslint-disable-line react-hooks/exhaustive-deps

  const completeMission = () => {
    toast.success(`${t('mission.complete')}. +${dailyMission.xpReward} XP`);
    navigate('/dashboard');
  };

  const repeatMission = () => {
    setCompleted(false);
    setCurrentExerciseIndex(0);
    setPhase('exercise');
    setSecondsRemaining(getExerciseSeconds(dailyMission.exercises[0].duration));
    setIsRunning(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (completed) {
    const displayStreak = completionData?.streak ?? currentStreak + 1;
    const displayAchievements = completionData?.achievements ?? [];

    return (
      <div className="min-h-screen bg-slate-950 px-4 py-8 text-white">
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-lg place-items-center">
          <section className="w-full rounded-md bg-white p-6 text-center text-slate-900 shadow-2xl">
            <p className="text-sm font-black uppercase tracking-wide text-success">{t('mission.complete')}</p>
            <h1 className="mt-3 text-4xl font-black">{t('mission.greatJob')}</h1>
            <p className="mt-2 text-lg font-bold text-slate-700">{tv(dailyMission.title)}</p>
            <p className="mt-1 text-slate-500">{tv(dailyMission.focus)} · {dailyMission.durationMinutes} {t('unit.min')}</p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="mini-metric">+{dailyMission.xpReward} XP</div>
              <div className="mini-metric">{displayStreak} {t('unit.days')}</div>
              <div className="mini-metric">{tv(dailyMission.difficulty)}</div>
            </div>
            {displayAchievements.length > 0 && (
              <div className="mt-4 rounded-md bg-success/10 p-3">
                <p className="text-sm font-black text-emerald-700">{displayAchievements.join(' · ')}</p>
              </div>
            )}
            <p className="mt-4 text-sm text-slate-500">{t('mission.showedUp')}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button onClick={repeatMission} className="btn-secondary">
                {t('mission.repeatWorkout')}
              </button>
              <button onClick={completeMission} className="btn-primary">
                {t('mission.saveBack')}
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-950 px-4 py-5 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-start">
            <div>
              <Link to="/dashboard" className="text-sm font-bold text-slate-300 hover:text-white">{t('mission.back')}</Link>
              <h1 className="mt-2 text-3xl font-black">{tv(dailyMission.title)}</h1>
              <p className="mt-1 text-slate-300">{tv(dailyMission.focus)} · {dailyMission.durationMinutes} {t('unit.min')} · +{dailyMission.xpReward} XP</p>
            </div>
            <div className={`rounded-md bg-white/10 px-4 py-3 ${isHebrew ? 'text-left' : 'text-right'}`}>
              <p className="text-sm text-slate-300">{t('mission.remaining')}</p>
              <p className="text-2xl font-black">{totalRemainingLabel}</p>
            </div>
            <div className={`rounded-md bg-primary px-4 py-3 ${isHebrew ? 'text-left' : 'text-right'}`}>
              <p className="text-sm text-orange-100">{t('dashboard.currentStreak')}</p>
              <p className="text-2xl font-black">{currentStreak}</p>
            </div>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-950 p-3 text-white">
              <p className="text-sm font-black uppercase tracking-wide text-orange-200">Instructor demo</p>
            </div>
            <div className="p-4">
              <ExerciseDemo
                exercise={currentExercise}
                nextExercise={nextExercise}
                phase={phase}
                isRunning={isRunning}
                tv={tv}
              />
            </div>
          </div>

          <aside className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-black text-primary">{t('mission.exercise')} {currentExerciseIndex + 1} {t('mission.of')} {dailyMission.exercises.length}</p>
            <h2 className="mt-2 text-4xl font-black text-slate-950">{phase === 'rest' ? 'Rest' : tv(currentExercise.name)}</h2>
            <p className="mt-2 text-slate-600">
              {phase === 'rest' ? `Next: ${nextExercise ? tv(nextExercise.name) : t('mission.completionScreen')}` : currentExercise.duration}
            </p>

            <div className="mt-5 rounded-md bg-slate-50 p-4">
              <div className="mx-auto grid h-44 w-44 place-items-center rounded-full bg-white shadow-inner ring-8 ring-primary/10">
                <span className="text-6xl font-black text-primary">{secondsRemaining}</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button onClick={() => setIsRunning((current) => !current)} className="btn-secondary">
                  {isRunning ? t('mission.pause') : secondsRemaining === currentExerciseSeconds || secondsRemaining === restSeconds ? t('mission.start') : t('mission.resume')}
                </button>
                <button onClick={moveToNextExercise} className="btn-primary">
                  {phase === 'rest' ? t('mission.next') : currentExerciseIndex === dailyMission.exercises.length - 1 ? t('mission.finish') : 'Rest'}
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div className="mini-metric">{t('mission.target')}: {tv(currentExercise.target)}</div>
              <div className="mini-metric">{t('mission.alternative')}: {tv(currentExercise.alternative)}</div>
            </div>
          </aside>
        </section>

        <section className="mt-5 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-black uppercase tracking-wide text-primary">Movement cues</p>
          <p className="mt-3 text-lg leading-8 text-slate-700">{tv(currentExercise.instructions)}</p>

          {currentExercise.musclesWorked && currentExercise.musclesWorked.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {currentExercise.musclesWorked.map((muscle) => (
                <span key={muscle} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600">
                  {tv(muscle)}
                </span>
              ))}
            </div>
          )}

          <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {tv(currentExercise.safetyNote)} {t('mission.safety')}
          </div>
        </section>

        <section className="mt-5 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black">{t('mission.nextExercise')}</h3>
          <p className="mt-2 text-slate-600">{nextExercise ? `${tv(nextExercise.name)} · ${nextExercise.duration}` : t('mission.completionScreen')}</p>
        </section>
      </main>
    </div>
  );
};

export default Mission;
