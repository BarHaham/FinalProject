import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { dailyMission as fallbackDailyMission, Mission as MissionData } from '../data/sportLingoData';
import { apiUrl } from '../utils/api';
import { getStoredUser } from '../utils/storage';
import { useLanguage } from '../i18n/LanguageContext';

const secondsPerExercise = 30;

const Mission: React.FC = () => {
  const navigate = useNavigate();
  const [dailyMission, setDailyMission] = useState<MissionData>(fallbackDailyMission);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(secondsPerExercise);
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const { t, tv, isHebrew } = useLanguage();

  const currentExercise = dailyMission.exercises[currentExerciseIndex];
  const nextExercise = dailyMission.exercises[currentExerciseIndex + 1];
  const progress = Math.round(((currentExerciseIndex + 1) / dailyMission.exercises.length) * 100);

  const totalRemainingLabel = useMemo(() => {
    const remainingExercises = dailyMission.exercises.length - currentExerciseIndex - 1;
    const totalSeconds = remainingExercises * secondsPerExercise + secondsRemaining;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [currentExerciseIndex, dailyMission.exercises.length, secondsRemaining]);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      navigate('/login');
      return;
    }

    const loadMission = async () => {
      try {
        const [missionResponse, streakResponse] = await Promise.all([
          fetch(`${apiUrl}/missions/daily/${user.id}`),
          fetch(`${apiUrl}/streaks/${user.id}`),
        ]);
        if (!missionResponse.ok) return;
        const data = await missionResponse.json();
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
          exercises: data.exercises || fallbackDailyMission.exercises,
        });
        if (streakResponse.ok) {
          const streakData = await streakResponse.json();
          setCurrentStreak(streakData.current_streak || 0);
        }
      } catch {
        setDailyMission(fallbackDailyMission);
      }
    };

    loadMission();
  }, [navigate]);

  useEffect(() => {
    if (!isRunning || completed) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setSecondsRemaining((current) => {
        if (current > 1) {
          return current - 1;
        }

        setIsRunning(false);
        return 0;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [completed, isRunning]);

  const moveToNextExercise = () => {
    if (currentExerciseIndex < dailyMission.exercises.length - 1) {
      setCurrentExerciseIndex((current) => current + 1);
      setSecondsRemaining(secondsPerExercise);
      setIsRunning(false);
      return;
    }

    setCompleted(true);
    setIsRunning(false);
  };

  const completeMission = async () => {
    const currentProgress = localStorage.getItem('demoProgress');
    const parsedProgress = currentProgress ? JSON.parse(currentProgress) as { totalXP?: number; streak?: number; workouts?: number; minutes?: number } : {};
    const localUpdate = {
      totalXP: (parsedProgress.totalXP || 0) + dailyMission.xpReward,
      streak: Math.max((parsedProgress.streak || 0) + 1, 1),
      workouts: (parsedProgress.workouts || 0) + 1,
      minutes: (parsedProgress.minutes || 0) + dailyMission.durationMinutes,
    };

    if (/^\d+$/.test(dailyMission.id)) {
      try {
        const response = await fetch(`${apiUrl}/missions/${dailyMission.id}/complete`, { method: 'POST' });
        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('demoProgress', JSON.stringify({
            totalXP: data.progress?.total_xp ?? localUpdate.totalXP,
            streak: data.streak?.current_streak ?? localUpdate.streak,
            workouts: data.progress?.total_missions_completed ?? localUpdate.workouts,
            minutes: data.progress?.total_minutes_trained ?? localUpdate.minutes,
          }));
        } else {
          localStorage.setItem('demoProgress', JSON.stringify(localUpdate));
        }
      } catch {
        localStorage.setItem('demoProgress', JSON.stringify(localUpdate));
      }
    } else {
      localStorage.setItem('demoProgress', JSON.stringify(localUpdate));
    }

    toast.success(`${t('mission.complete')}. +${dailyMission.xpReward} XP`);
    navigate('/dashboard');
  };

  if (completed) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-8 text-white">
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-lg place-items-center">
          <section className="w-full rounded-md bg-white p-6 text-center text-slate-900 shadow-2xl">
            <p className="text-sm font-black uppercase tracking-wide text-success">{t('mission.complete')}</p>
            <h1 className="mt-3 text-4xl font-black">{t('mission.greatJob')}</h1>
            <p className="mt-3 text-slate-600">{t('mission.showedUp')}</p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="mini-metric">+{dailyMission.xpReward} XP</div>
              <div className="mini-metric">+1 {t('unit.days')}</div>
              <div className="mini-metric">Path +1</div>
            </div>
            <button onClick={completeMission} className="btn-primary mt-8 w-full">
              {t('mission.backDashboard')}
            </button>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-950 px-4 py-5 text-white">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-start justify-between gap-4">
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

      <main className="mx-auto max-w-4xl px-4 py-6">
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
            <div>
              <p className="text-sm font-black text-primary">{t('mission.exercise')} {currentExerciseIndex + 1} {t('mission.of')} {dailyMission.exercises.length}</p>
              <h2 className="mt-2 text-4xl font-black">{tv(currentExercise.name)}</h2>
              <p className="mt-3 text-lg leading-8 text-slate-700">{tv(currentExercise.instructions)}</p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="mini-metric">{t('mission.target')}: {tv(currentExercise.target)}</div>
                <div className="mini-metric">{t('mission.alternative')}: {tv(currentExercise.alternative)}</div>
              </div>

              <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                {tv(currentExercise.safetyNote)} {t('mission.safety')}
              </div>
            </div>

            <div className="rounded-md bg-slate-100 p-5 text-center">
              <div className="mx-auto grid h-48 w-48 place-items-center rounded-full bg-white shadow-inner">
                <span className="text-6xl font-black text-primary">{secondsRemaining}</span>
              </div>
              <p className="mt-4 text-sm font-bold text-slate-500">{currentExercise.duration}</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button onClick={() => setIsRunning((current) => !current)} className="btn-secondary">
                  {isRunning ? t('mission.pause') : secondsRemaining === secondsPerExercise ? t('mission.start') : t('mission.resume')}
                </button>
                <button onClick={moveToNextExercise} className="btn-primary">
                  {currentExerciseIndex === dailyMission.exercises.length - 1 ? t('mission.finish') : t('mission.next')}
                </button>
              </div>
            </div>
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
