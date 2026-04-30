import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { LessonState, PathUnit, pathUnits } from '../data/sportLingoData';
import { useLanguage } from '../i18n/LanguageContext';
import { apiUrl } from '../utils/api';
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
};

const groupApiLessons = (lessons: ApiPathLesson[]): PathUnit[] => {
  const grouped = new Map<string, PathUnit>();

  for (const lesson of lessons) {
    const key = `${lesson.section_number}-${lesson.unit_number}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        title: lesson.section_number === 1 ? 'Unit 1: Start Moving' : 'Unit 2: Build Control',
        summary: lesson.section_number === 1
          ? 'Tiny wins that make the habit easy to repeat.'
          : 'Core, balance, and smooth technique.',
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

const Path: React.FC = () => {
  const { t, tv } = useLanguage();
  const [units, setUnits] = useState<PathUnit[]>(pathUnits);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      return;
    }

    const loadPath = async () => {
      try {
        const response = await fetch(`${apiUrl}/progress/${user.id}/path`);
        if (!response.ok) return;
        const data = await response.json() as ApiPathLesson[];
        setUnits(groupApiLessons(data));
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
          <p className="text-sm font-black uppercase tracking-wide text-primary">{t('path.kicker')}</p>
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

        {units.map((unit) => (
          <section key={unit.title} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-2xl font-black">{tv(unit.title)}</h3>
            <p className="mt-1 text-slate-600">{tv(unit.summary)}</p>
            <div className="mt-5 grid gap-3">
              {unit.lessons.map((lesson, index) => (
                <div key={lesson.id} className="grid gap-3 rounded-md border border-slate-200 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                  <div className={`grid h-11 w-11 place-items-center rounded-full text-sm font-black ${lesson.state === 'locked' ? 'bg-slate-200 text-slate-500' : 'bg-primary text-white'}`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-black">{tv(lesson.title)}</p>
                    <p className="text-sm text-slate-500">{tv(lesson.type)} · {lesson.durationMinutes} {t('unit.min')} · {tv(lesson.difficulty)} · {lesson.xpReward} XP</p>
                  </div>
                  {lesson.state === 'current' ? (
                    <Link to="/mission" className="btn-primary text-center">{t('nav.start')}</Link>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-center text-sm font-black capitalize text-slate-500">{t(`state.${lesson.state}`)}</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
};

export default Path;
