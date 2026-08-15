import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

type MascotPosition = {
  x: number;
  y: number;
  rotate: number;
};

const previewItems = [
  { icon: '💪', key: 'welcome.preview1' },
  { icon: '🔥', key: 'welcome.preview2' },
  { icon: '🏆', key: 'welcome.preview3' },
  { icon: '🌍', key: 'welcome.preview4' },
];

const statsItems = [
  { value: 'AI', key: 'welcome.stat1' },
  { value: '100+', key: 'welcome.stat2' },
  { value: '5', key: 'welcome.stat3' },
  { value: '7', key: 'welcome.stat4' },
];

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [mascotPosition, setMascotPosition] = useState<MascotPosition>({ x: 6, y: 8, rotate: 4 });

  useEffect(() => {
    const moveMascot = () => {
      setMascotPosition({
        x: 4 + Math.random() * 18,
        y: 6 + Math.random() * 68,
        rotate: -10 + Math.random() * 20,
      });
    };

    const intervalId = window.setInterval(moveMascot, 2400);
    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[linear-gradient(135deg,#ffd58a_0%,#ffc2d5_28%,#b9a8ff_58%,#67dff0_100%)] text-white">
      <div
        className="floating-mascot pointer-events-none absolute z-20 hidden h-32 w-32 items-center justify-center rounded-full border-4 border-white/80 bg-white/70 p-1 shadow-2xl transition-all duration-[1800ms] ease-in-out sm:flex lg:h-40 lg:w-40"
        style={{
          left: `${mascotPosition.x}%`,
          top: `${mascotPosition.y}%`,
          transform: `rotate(${mascotPosition.rotate}deg)`,
        }}
        aria-hidden="true"
      >
        <div className="fitlingo-avatar-logo h-full w-full rounded-full bg-[#f6edff]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl content-start gap-4 px-4 py-4 sm:py-5 lg:content-center lg:items-center lg:gap-5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 mb-4">
          {statsItems.map((stat) => (
            <div key={stat.key} className="rounded-md bg-white/25 p-3 text-center backdrop-blur">
              <p className="text-2xl font-black">{stat.value}</p>
              <p className="text-xs font-bold text-white/80">{t(stat.key)}</p>
            </div>
          ))}
        </div>
        <div className="grid min-h-screen max-w-6xl content-start gap-4 lg:grid-cols-[0.95fr_0.8fr] lg:content-center lg:items-start lg:gap-5">
        <section className="rounded-md bg-slate-950/70 p-4 shadow-2xl backdrop-blur sm:p-5">
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value as 'en' | 'he')}
            className="mb-3 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm font-bold text-white sm:mb-4"
            aria-label="Language"
          >
            <option className="text-slate-900" value="en">{t('language.english')}</option>
            <option className="text-slate-900" value="he">{t('language.hebrew')}</option>
          </select>
          <p className="mb-2 text-sm font-black uppercase tracking-wide text-success sm:mb-3">{t('welcome.kicker')}</p>
          <h1 className="text-4xl font-black leading-tight sm:text-5xl xl:text-6xl">FitLingo</h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-slate-200 sm:text-lg lg:text-xl">
            {t('welcome.copy')}
          </p>
          <div className="mt-5 grid max-w-sm gap-2.5 sm:mt-6 sm:gap-3">
            <button
              onClick={() => navigate('/register')}
              className="rounded-md bg-primary px-5 py-3 text-base font-black text-white shadow-lg shadow-orange-950/30 transition hover:bg-orange-700"
            >
              {t('welcome.getStarted')}
            </button>
            <button
              onClick={() => navigate('/login')}
              className="rounded-md px-5 py-3 text-base font-black text-slate-200 transition hover:bg-white/10"
            >
              {t('welcome.login')}
            </button>
          </div>
        </section>

        <section className="rounded-md border border-white/30 bg-white/25 p-3 shadow-2xl backdrop-blur sm:p-4">
          <div className="overflow-hidden rounded-md bg-white text-slate-900">
            <div className="bg-[linear-gradient(135deg,#ffe2a6,#ffd0df,#c9bcff,#88e7f3)] p-2 sm:p-3">
              <img src="/images/fitlingo-logo.png" alt="FitLingo logo" className="h-24 w-full object-contain sm:h-32 lg:h-36 xl:h-40" />
            </div>
            <div className="p-3">
              <div className="mb-2.5 flex items-center justify-between">
                <p className="font-black">{t('welcome.previewTitle')}</p>
                <span className="rounded-full bg-success/15 px-3 py-1 text-sm font-black text-emerald-700">🏃 XP</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="fitlingo-avatar-logo h-11 w-11 rounded-full border-2 border-white bg-[#f6edff] shadow sm:h-12 sm:w-12" />
                <h2 className="text-xl font-black sm:text-2xl">FitLingo</h2>
              </div>
              <p className="mt-1.5 text-slate-600">{t('welcome.previewSubtitle')}</p>
              <div className="mt-2.5 space-y-1.5">
                {previewItems.map((item, index) => (
                  <div key={item.key} className="flex items-center gap-3 rounded-md bg-slate-50 px-2.5 py-2">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-sm font-black text-white">{index + 1}</span>
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-bold">{t(item.key)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
