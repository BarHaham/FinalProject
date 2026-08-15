import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { PlanBadge, usePlanStatus } from '../components/PlanStatus';
import { LessonState, PathUnit, pathUnits } from '../data/sportLingoData';
import { useLanguage } from '../i18n/LanguageContext';
import api from '../utils/api';
import { getStoredUser } from '../utils/storage';

type ApiPathLesson = {
  id: number;
  lesson_name: string;
  section_number: number;
  unit_number: number;
  lesson_number: number;
  lesson_type: string;
  xp_reward: number;
  estimated_duration_minutes: number;
  difficulty: string;
  state: LessonState;
  user_id?: number | null;
  section_title?: string | null;
  section_summary?: string | null;
};

const sectionCopy: Record<number, { title: string; summary: string }> = {
  1: {
    title: 'Unit 1: Start Moving',
    summary: 'Warm-up, breathing, and simple full-body wins.',
  },
  2: {
    title: 'Unit 2: Legs and Glutes',
    summary: 'Squats, bridges, lunges, and lower-body endurance.',
  },
  3: {
    title: 'Unit 3: Abs and Core',
    summary: 'Core control before intensity: dead bugs, planks, and side strength.',
  },
  4: {
    title: 'Unit 4: Arms and Upper Body',
    summary: 'Push-up progressions, triceps, shoulders, and plank stability.',
  },
  5: {
    title: 'Unit 5: Mobility and Review',
    summary: 'Stretch, recover, and review the full bodyweight foundation.',
  },
};

const groupApiLessons = (lessons: ApiPathLesson[]): PathUnit[] => {
  const grouped = new Map<string, PathUnit>();

  for (const lesson of lessons) {
    const key = `${lesson.section_number}-${lesson.unit_number}`;
    if (!grouped.has(key)) {
      // AI-generated plans carry their own section titles/summaries (already in
      // the user's language); the static path falls back to the built-in copy.
      const copy = lesson.section_title
        ? { title: lesson.section_title, summary: lesson.section_summary || '' }
        : sectionCopy[lesson.section_number] || {
          title: `Unit ${lesson.section_number}: Bodyweight Training`,
          summary: 'A focused bodyweight progression for strength, control, and consistency.',
        };

      grouped.set(key, {
        title: copy.title,
        summary: copy.summary,
        lessons: [],
      });
    }

    grouped.get(key)?.lessons.push({
      id: String(lesson.id),
      title: lesson.lesson_name,
      type: lesson.lesson_type,
      durationMinutes: lesson.estimated_duration_minutes,
      xpReward: lesson.xp_reward,
      difficulty: lesson.difficulty,
      state: lesson.state,
    });
  }

  return Array.from(grouped.values());
};

const lessonNodeClass = (state: LessonState) => {
  if (state === 'completed') return 'bg-success text-white ring-success/20';
  if (state === 'current') return 'bg-primary text-white ring-primary/25';
  return 'bg-slate-200 text-slate-500 ring-slate-200';
};

const lessonCardClass = (state: LessonState) => {
  if (state === 'current') return 'border-primary bg-[#f7f3ff] shadow-md shadow-primary/10';
  if (state === 'completed') return 'border-success/40 bg-white';
  return 'border-slate-200 bg-slate-50';
};

const lessonIcon = (type: string) => {
  const normalizedType = type.toLowerCase();
  if (normalizedType.includes('warm')) return '🔥';
  if (normalizedType.includes('glute')) return '🍑';
  if (normalizedType.includes('leg')) return '🦵';
  if (normalizedType.includes('abs') || normalizedType.includes('core')) return '💪';
  if (normalizedType.includes('arm') || normalizedType.includes('upper')) return '🏋️';
  if (normalizedType.includes('mobility')) return '🧘';
  if (normalizedType.includes('review')) return '🏆';
  if (normalizedType.includes('full')) return '⚡';
  return '•';
};

const lessonNodeContent = (lesson: PathUnit['lessons'][number], index: number) => {
  if (lesson.state === 'completed') return '✓';
  if (lesson.state === 'current') return lessonIcon(lesson.type);
  if (lesson.state === 'locked') return '🔒';
  return index + 1;
};

const unitTheme = (title: string) => {
  if (title.includes('Legs')) {
    return {
      icon: '🍑',
      label: 'Lower body',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      accent: 'bg-rose-500',
      text: 'text-rose-700',
    };
  }
  if (title.includes('Abs')) {
    return {
      icon: '💪',
      label: 'Core',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      accent: 'bg-amber-500',
      text: 'text-amber-700',
    };
  }
  if (title.includes('Arms')) {
    return {
      icon: '🏋️',
      label: 'Upper body',
      bg: 'bg-violet-50',
      border: 'border-violet-200',
      accent: 'bg-violet-500',
      text: 'text-violet-700',
    };
  }
  if (title.includes('Mobility')) {
    return {
      icon: '🧘',
      label: 'Recovery',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      accent: 'bg-emerald-500',
      text: 'text-emerald-700',
    };
  }
  return {
    icon: '🔥',
    label: 'Starter',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    accent: 'bg-sky-500',
    text: 'text-sky-700',
  };
};

const Path: React.FC = () => {
  const { t, tv } = useLanguage();
  const [units, setUnits] = useState<PathUnit[]>(pathUnits);
  const { plan } = usePlanStatus();

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      return;
    }

    const loadPath = async () => {
      try {
        const { data } = await api.get(`/progress/${user.id}/path`);
        setUnits(groupApiLessons(data as ApiPathLesson[]));
      } catch {
        setUnits(pathUnits);
      }
    };

    loadPath();
  }, []);

  const pathSummary = useMemo(() => {
    const lessons = units.flatMap((unit) => unit.lessons);
    return {
      completed: lessons.filter((lesson) => lesson.state === 'completed').length,
      total: lessons.length,
    };
  }, [units]);

  return (
    <AppShell title={t('path.title')}>
      <div className="space-y-6">
        <section>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-black uppercase tracking-wide text-primary">{t('path.kicker')}</p>
            <PlanBadge plan={plan} />
          </div>
          <h2 className="mt-2 text-3xl font-black">{t('path.heading')}</h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            {t('path.copy')}
          </p>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="h-3 rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${pathSummary.total ? Math.round((pathSummary.completed / pathSummary.total) * 100) : 0}%` }}
            />
          </div>
          <p className="mt-2 text-sm font-bold text-slate-500">
            {pathSummary.completed} / {pathSummary.total}
          </p>
        </section>

        {units.map((unit) => {
          const theme = unitTheme(unit.title);
          const completedInUnit = unit.lessons.filter((lesson) => lesson.state === 'completed').length;
          const unitXp = unit.lessons.reduce((total, lesson) => total + lesson.xpReward, 0);
          const unitProgress = unit.lessons.length ? Math.round((completedInUnit / unit.lessons.length) * 100) : 0;

          return (
          <section key={unit.title} className={`overflow-hidden rounded-md border bg-white shadow-sm ${theme.border}`}>
            <div className={`${theme.bg} border-b ${theme.border} p-5`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-4">
                  <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-md ${theme.accent} text-3xl text-white shadow-sm`}>
                    {theme.icon}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-2xl font-black">{tv(unit.title)}</h3>
                      <span className={`rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-wide ${theme.text}`}>
                        {theme.label}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-600">{tv(unit.summary)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:min-w-56">
                  <div className="rounded-md bg-white px-3 py-2 text-center shadow-sm">
                    <p className="text-xs font-bold text-slate-500">Lessons</p>
                    <p className="text-lg font-black text-slate-950">{completedInUnit}/{unit.lessons.length}</p>
                  </div>
                  <div className="rounded-md bg-white px-3 py-2 text-center shadow-sm">
                    <p className="text-xs font-bold text-slate-500">XP</p>
                    <p className="text-lg font-black text-slate-950">{unitXp}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                <div className={`h-full rounded-full ${theme.accent}`} style={{ width: `${unitProgress}%` }} />
              </div>
            </div>

            <div className="p-5">
            <div className="relative mt-6 max-w-3xl">
              <div className="absolute bottom-8 left-7 top-8 w-1.5 rounded-full bg-slate-200 sm:left-8" aria-hidden="true" />
              {unit.lessons.map((lesson, index) => (
                <div key={lesson.id} className="relative z-10 flex gap-4 pb-8 last:pb-0">
                  <div className="shrink-0">
                    <div className={`grid h-16 w-16 place-items-center rounded-full text-xl font-black shadow-sm ring-8 ${lessonNodeClass(lesson.state)}`}>
                      {lessonNodeContent(lesson, index)}
                    </div>
                  </div>

                  <div className={`mt-1 grid flex-1 gap-3 rounded-md border px-4 py-3 transition sm:grid-cols-[1fr_auto] sm:items-center ${lessonCardClass(lesson.state)}`}>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xl" aria-hidden="true">{lessonIcon(lesson.type)}</span>
                        <p className="font-black">{tv(lesson.title)}</p>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm">{tv(lesson.type)}</span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm">{lesson.durationMinutes} {t('unit.min')}</span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm">{tv(lesson.difficulty)}</span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-primary shadow-sm">{lesson.xpReward} XP</span>
                      </div>
                    </div>
                    {lesson.state === 'current' ? (
                      <Link to="/mission" className="btn-primary text-center">{t('nav.start')}</Link>
                    ) : lesson.state === 'completed' ? (
                      <Link to="/mission" className="btn-secondary text-center">{t('mission.repeatWorkout')}</Link>
                    ) : (
                      <span className="rounded-full bg-white px-3 py-1 text-center text-sm font-black capitalize text-slate-500 shadow-sm">{t(`state.${lesson.state}`)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            </div>
          </section>
          );
        })}
      </div>
    </AppShell>
  );
};

export default Path;
