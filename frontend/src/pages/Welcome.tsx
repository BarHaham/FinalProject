import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

type MascotPosition = {
  x: number;
  y: number;
  rotate: number;
};

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
    <div className="relative h-screen overflow-hidden bg-[linear-gradient(135deg,#ffd58a_0%,#ffc2d5_28%,#b9a8ff_58%,#67dff0_100%)] text-white">
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

      <div className="relative z-10 mx-auto grid h-screen max-w-6xl content-center gap-5 px-4 py-4 lg:grid-cols-[0.95fr_0.8fr] lg:items-center">
        <section className="rounded-md bg-slate-950/70 p-5 shadow-2xl backdrop-blur">
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value as 'en' | 'he')}
            className="mb-4 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm font-bold text-white"
            aria-label="Language"
          >
            <option className="text-slate-900" value="en">{t('language.english')}</option>
            <option className="text-slate-900" value="he">{t('language.hebrew')}</option>
          </select>
          <p className="mb-3 text-sm font-black uppercase tracking-wide text-success">{t('welcome.kicker')}</p>
          <h1 className="text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">FitLingo</h1>
          <p className="mt-4 max-w-xl text-lg leading-7 text-slate-200 lg:text-xl">
            {t('welcome.copy')}
          </p>
          <div className="mt-6 grid max-w-sm gap-3">
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

        <section className="rounded-md border border-white/30 bg-white/25 p-5 shadow-2xl backdrop-blur">
          <div className="overflow-hidden rounded-md bg-white text-slate-900">
            <div className="bg-[linear-gradient(135deg,#ffe2a6,#ffd0df,#c9bcff,#88e7f3)] p-3">
              <img src="/images/fitlingo-logo.png" alt="FitLingo logo" className="h-40 w-full object-contain sm:h-48 lg:h-52" />
            </div>
            <div className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-black">{t('welcome.previewTitle')}</p>
              <span className="rounded-full bg-success/15 px-3 py-1 text-sm font-black text-emerald-700">🏃 XP</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="fitlingo-avatar-logo h-14 w-14 rounded-full border-2 border-white bg-[#f6edff] shadow" />
              <h2 className="text-2xl font-black">FitLingo</h2>
            </div>
            <p className="mt-2 text-slate-600">{t('welcome.previewSubtitle')}</p>
            <div className="mt-4 space-y-2">
              {[
                ['⚽', t('welcome.preview1')],
                ['🔥', t('welcome.preview2')],
                ['🏆', t('welcome.preview3')],
                ['📩', t('welcome.preview4')],
              ].map(([icon, text], index) => (
                <div key={text} className="flex items-center gap-3 rounded-md bg-slate-50 p-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-sm font-black text-white">{index + 1}</span>
                  <span className="text-xl">{icon}</span>
                  <span className="font-bold">{text}</span>
                </div>
              ))}
            </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Welcome;
