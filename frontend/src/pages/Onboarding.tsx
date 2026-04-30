import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  OnboardingProfile,
  defaultOnboardingProfile,
  getStoredUser,
  mergeUserWithOnboarding,
  saveOnboardingProfile,
} from '../utils/storage';
import { apiUrl, hasRealApi } from '../utils/api';
import { formatText, useLanguage } from '../i18n/LanguageContext';

const goals = [
  'Build a daily sports habit',
  'Lose weight',
  'Improve general fitness',
  'Build strength',
  'Improve flexibility and mobility',
  'Improve cardio endurance',
  'Reduce stress and move more',
];

const equipmentOptions = ['No equipment', 'Chair', 'Yoga mat', 'Resistance bands', 'Dumbbells', 'Running area'];
const sportOptions = ['General fitness', 'Strength training', 'Cardio', 'Running', 'Basketball', 'Mobility and stretching', 'Core training'];

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<OnboardingProfile>(defaultOnboardingProfile);
  const { t, tv, isHebrew } = useLanguage();

  const steps = useMemo(
    () => [
      'onboarding.goal',
      'onboarding.dailyCommitment',
      'onboarding.level',
      'onboarding.detailsQuestion',
      'onboarding.equipment',
      'onboarding.motivationQuestion',
      'onboarding.summaryTitle',
    ],
    []
  );

  const toggleListValue = (key: 'equipment' | 'sports' | 'secondaryGoals', value: string) => {
    setProfile((current) => {
      const existing = current[key];
      const nextValue = existing.includes(value)
        ? existing.filter((item) => item !== value)
        : [...existing, value];
      return { ...current, [key]: nextValue };
    });
  };

  const finishOnboarding = async () => {
    saveOnboardingProfile(profile);
    const user = getStoredUser();
    if (user) {
      const updatedUser = mergeUserWithOnboarding(user, profile);
      if (hasRealApi) {
        try {
          const response = await fetch(`${apiUrl}/users/${user.id}/onboarding`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profile),
          });
          if (response.ok) {
            const savedUser = await response.json();
            localStorage.setItem('user', JSON.stringify({ ...updatedUser, ...savedUser }));
          }
        } catch {
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
    }
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <p className="mb-2 text-sm font-bold text-primary">{t('onboarding.setup')}</p>
          <div className="h-3 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
          </div>
          <p className="mt-2 text-sm text-slate-500">
            {t(steps[step])} · {formatText(t('onboarding.step'), { current: step + 1, total: steps.length })}
          </p>
        </div>

        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          {step === 0 && (
            <div>
              <h1 className="text-3xl font-black">{t('onboarding.goalQuestion')}</h1>
              <div className="mt-5 grid gap-3">
                {goals.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => setProfile((current) => ({ ...current, mainGoal: goal }))}
                    className={`choice-button ${profile.mainGoal === goal ? 'choice-button-active' : ''}`}
                  >
                    {tv(goal)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h1 className="text-3xl font-black">{t('onboarding.timeQuestion')}</h1>
              <p className="mt-2 text-slate-600">{t('onboarding.timeCopy')}</p>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[1, 2, 5, 10, 15].map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => setProfile((current) => ({ ...current, dailyTimeGoal: minutes }))}
                    className={`choice-button text-center ${profile.dailyTimeGoal === minutes ? 'choice-button-active' : ''}`}
                  >
                    {minutes} {t('unit.min')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h1 className="text-3xl font-black">{t('onboarding.levelQuestion')}</h1>
              <div className="mt-5 grid gap-3">
                {[
                  ['Complete beginner', 'I rarely exercise and want to start slowly.'],
                  ['Beginner', 'I exercise sometimes but not consistently.'],
                  ['Intermediate', 'I exercise regularly but want structure.'],
                  ['Advanced', 'I train often and want extra challenges.'],
                ].map(([level, description]) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setProfile((current) => ({ ...current, fitnessLevel: level }))}
                    className={`choice-button ${isHebrew ? 'text-right' : 'text-left'} ${profile.fitnessLevel === level ? 'choice-button-active' : ''}`}
                  >
                    <span className="block font-black">{tv(level)}</span>
                    <span className="text-sm text-slate-500">{tv(description)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h1 className="text-3xl font-black">{t('onboarding.detailsQuestion')}</h1>
              <p className="mt-2 text-sm text-slate-600">
                {t('onboarding.medical')}
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <input className="input-field" placeholder={t('onboarding.age')} value={profile.age} onChange={(event) => setProfile({ ...profile, age: event.target.value })} />
                <input className="input-field" placeholder={t('onboarding.height')} value={profile.height} onChange={(event) => setProfile({ ...profile, height: event.target.value })} />
                <input className="input-field" placeholder={t('onboarding.weight')} value={profile.weight} onChange={(event) => setProfile({ ...profile, weight: event.target.value })} />
                <select className="input-field" value={profile.activityLevel} onChange={(event) => setProfile({ ...profile, activityLevel: event.target.value })}>
                  <option>Mostly sitting</option>
                  <option>Light activity</option>
                  <option>Active most days</option>
                  <option>Training regularly</option>
                </select>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h1 className="text-3xl font-black">{t('onboarding.equipmentQuestion')}</h1>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {equipmentOptions.map((item) => (
                  <button key={item} type="button" onClick={() => toggleListValue('equipment', item)} className={`choice-button ${profile.equipment.includes(item) ? 'choice-button-active' : ''}`}>
                    {tv(item)}
                  </button>
                ))}
              </div>
              <h2 className="mt-8 text-xl font-black">{t('onboarding.activities')}</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {sportOptions.map((item) => (
                  <button key={item} type="button" onClick={() => toggleListValue('sports', item)} className={`choice-button ${profile.sports.includes(item) ? 'choice-button-active' : ''}`}>
                    {tv(item)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h1 className="text-3xl font-black">{t('onboarding.motivationQuestion')}</h1>
              <div className="mt-5 grid gap-3">
                {[
                  'I want to feel healthier',
                  'I want more energy',
                  'I want to create discipline',
                  'I want to reduce stress',
                  'I want to prove to myself I can stay consistent',
                ].map((reason) => (
                  <button key={reason} type="button" onClick={() => setProfile((current) => ({ ...current, motivationReason: reason }))} className={`choice-button ${profile.motivationReason === reason ? 'choice-button-active' : ''}`}>
                    {tv(reason)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div>
              <h1 className="text-3xl font-black">{t('onboarding.summaryTitle')}</h1>
              <div className="mt-5 grid gap-3 text-slate-700">
                <p><strong>{t('onboarding.goal')}:</strong> {tv(profile.mainGoal)}</p>
                <p><strong>{t('onboarding.level')}:</strong> {tv(profile.fitnessLevel)}</p>
                <p><strong>{t('onboarding.dailyCommitment')}:</strong> {profile.dailyTimeGoal} {t('unit.minutes')}</p>
                <p><strong>{t('onboarding.equipment')}:</strong> {profile.equipment.map(tv).join(', ') || tv('No equipment')}</p>
                <p><strong>{t('onboarding.focus')}:</strong> {profile.sports.map(tv).join(', ') || tv('General fitness')}</p>
              </div>
            </div>
          )}

          <div className="mt-8 flex gap-3">
            {step > 0 && (
              <button type="button" onClick={() => setStep((current) => current - 1)} className="btn-secondary">
                {t('onboarding.back')}
              </button>
            )}
            <button
              type="button"
              onClick={() => (step === steps.length - 1 ? finishOnboarding() : setStep((current) => current + 1))}
              className="btn-primary flex-1"
            >
              {step === steps.length - 1 ? t('onboarding.startFirst') : t('onboarding.continue')}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Onboarding;
