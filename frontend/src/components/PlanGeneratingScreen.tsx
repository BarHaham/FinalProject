import React, { useEffect, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

const MESSAGE_KEYS = [
  'onboarding.generating1',
  'onboarding.generating2',
  'onboarding.generating3',
  'onboarding.generating4',
];

// Full-screen "building your plan" state with rotating status messages.
// Rendered as a fixed overlay so it works from any page (onboarding,
// dashboard banner, profile regenerate).
const PlanGeneratingScreen: React.FC = () => {
  const { t } = useLanguage();
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () => setMessageIndex((current) => (current + 1) % MESSAGE_KEYS.length),
      2500
    );
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950 px-4 text-white">
      <div className="max-w-md text-center">
        <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-white/20 border-t-primary" />
        <h1 className="mt-8 text-3xl font-black">{t('onboarding.generatingTitle')}</h1>
        <p className="mt-4 text-lg font-bold text-orange-200">{t(MESSAGE_KEYS[messageIndex])}</p>
        <p className="mt-6 text-sm text-slate-400">{t('onboarding.generatingHint')}</p>
      </div>
    </div>
  );
};

export default PlanGeneratingScreen;
