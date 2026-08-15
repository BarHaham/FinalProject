import React from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { practiceCategories } from '../data/sportLingoData';
import { useLanguage } from '../i18n/LanguageContext';

const Practice: React.FC = () => {
  const { t, tv } = useLanguage();
  return (
    <AppShell title={t('practice.title')}>
      <section className="mb-6">
        <p className="text-sm font-black uppercase tracking-wide text-primary">{t('practice.kicker')}</p>
        <h2 className="mt-2 text-2xl font-black sm:text-3xl">{t('practice.heading')}</h2>
        <p className="mt-2 max-w-2xl text-slate-600">
          {t('practice.copy')}
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {practiceCategories.map((practice) => (
          <Link key={practice.title} to={`/mission?practice=${encodeURIComponent(practice.title)}`} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm transition hover:border-primary hover:shadow-md">
            <p className="text-sm font-black text-primary">{tv(practice.level)}</p>
            <h3 className="mt-2 text-xl font-black">{tv(practice.title)}</h3>
            <p className="mt-2 text-slate-600">{tv(practice.focus)}</p>
            <div className="mt-5 flex items-center justify-between text-sm font-black text-slate-500">
              <span>{practice.duration.replace('min', t('unit.min'))}</span>
              <span>+{practice.xp} XP</span>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
};

export default Practice;
