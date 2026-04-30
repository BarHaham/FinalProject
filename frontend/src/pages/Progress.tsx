import React from 'react';
import AppShell from '../components/AppShell';
import { achievements, weeklyActivity } from '../data/sportLingoData';
import { useLanguage } from '../i18n/LanguageContext';

const Progress: React.FC = () => {
  const { t, tv } = useLanguage();
  return (
    <AppShell title={t('progress.title')}>
      <div className="grid gap-6">
        <section>
          <p className="text-sm font-black uppercase tracking-wide text-primary">{t('progress.kicker')}</p>
          <h2 className="mt-2 text-3xl font-black">{t('progress.heading')}</h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            {t('progress.copy')}
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="stat-card"><p className="stat-label">{t('dashboard.currentStreak')}</p><p className="stat-value">3</p></div>
          <div className="stat-card"><p className="stat-label">{t('progress.longest')}</p><p className="stat-value">5</p></div>
          <div className="stat-card"><p className="stat-label">{t('progress.totalWorkouts')}</p><p className="stat-value">4</p></div>
          <div className="stat-card"><p className="stat-label">{t('progress.totalMinutes')}</p><p className="stat-value">22</p></div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black">{t('progress.weekly')}</h3>
          <div className="mt-5 grid grid-cols-7 gap-2">
            {weeklyActivity.map((day, index) => (
              <div key={`${day.day}-${index}`} className="rounded-md bg-slate-50 p-3 text-center">
                <div className={`mx-auto h-12 rounded-md ${day.done ? 'bg-success' : 'bg-slate-200'}`} />
                <p className="mt-2 text-sm font-black text-slate-500">{day.day}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-black">{t('progress.achievements')}</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((achievement, index) => (
              <div key={achievement} className="rounded-md border border-slate-200 p-4">
                <p className="text-sm font-black text-primary">Badge {index + 1}</p>
                <p className="mt-1 font-black">{tv(achievement)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
};

export default Progress;
