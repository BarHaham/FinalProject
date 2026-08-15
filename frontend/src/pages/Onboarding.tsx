import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FollowUpAnswer,
  OnboardingProfile,
  defaultOnboardingProfile,
  getStoredUser,
  mergeUserWithOnboarding,
  saveOnboardingProfile,
} from '../utils/storage';
import api, { hasRealApi } from '../utils/api';
import DynamicQuestionStep, { DynamicQuestion } from '../components/DynamicQuestionStep';
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

const GENERATING_MESSAGE_KEYS = [
  'onboarding.generating1',
  'onboarding.generating2',
  'onboarding.generating3',
  'onboarding.generating4',
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<OnboardingProfile>(defaultOnboardingProfile);
  const [aiQuestions, setAiQuestions] = useState<DynamicQuestion[]>([]);
  const [dynamicAnswers, setDynamicAnswers] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingMessageIndex, setGeneratingMessageIndex] = useState(0);
  const questionsRequested = useRef(false);
  const { t, tv, isHebrew, language } = useLanguage();

  // 5 fixed steps → N AI follow-up steps → motivation → summary.
  const steps = useMemo(
    () => [
      'onboarding.goal',
      'onboarding.dailyCommitment',
      'onboarding.level',
      'onboarding.detailsQuestion',
      'onboarding.equipment',
      ...aiQuestions.map(() => 'onboarding.aiQuestions'),
      'onboarding.motivationQuestion',
      'onboarding.summaryTitle',
    ],
    [aiQuestions]
  );

  const dynamicStepStart = 5;
  const dynamicStepEnd = dynamicStepStart + aiQuestions.length; // exclusive
  const motivationStep = dynamicStepEnd;
  const summaryStep = dynamicStepEnd + 1;

  useEffect(() => {
    if (generating) {
      const timer = window.setInterval(
        () => setGeneratingMessageIndex((current) => (current + 1) % GENERATING_MESSAGE_KEYS.length),
        2500
      );
      return () => window.clearInterval(timer);
    }
    return undefined;
  }, [generating]);

  // Prefetch the AI follow-up questions once the core answers (goal, time,
  // level) exist. Fired when leaving the level step so the network time is
  // hidden behind the details/equipment steps.
  const prefetchQuestions = () => {
    if (questionsRequested.current || !hasRealApi) return;
    const user = getStoredUser();
    if (!user) return;
    questionsRequested.current = true;

    api
      .post(`/users/${user.id}/onboarding/questions`, {
        mainGoal: profile.mainGoal,
        fitnessLevel: profile.fitnessLevel,
        dailyTimeGoal: profile.dailyTimeGoal,
        language,
      })
      .then(({ data }) => {
        if (Array.isArray(data?.questions)) {
          setAiQuestions(data.questions.slice(0, 5));
        }
      })
      .catch(() => {
        // No dynamic questions — the wizard simply keeps its fixed steps.
      });
  };

  const toggleListValue = (key: 'equipment' | 'sports' | 'secondaryGoals', value: string) => {
    setProfile((current) => {
      const existing = current[key];
      const nextValue = existing.includes(value)
        ? existing.filter((item) => item !== value)
        : [...existing, value];
      return { ...current, [key]: nextValue };
    });
  };

  const toggleDynamicAnswer = (question: DynamicQuestion, optionId: string) => {
    setDynamicAnswers((current) => {
      const existing = current[question.id] || [];
      if (question.type === 'single') {
        return { ...current, [question.id]: [optionId] };
      }
      return {
        ...current,
        [question.id]: existing.includes(optionId)
          ? existing.filter((id) => id !== optionId)
          : [...existing, optionId],
      };
    });
  };

  const collectFollowUpAnswers = (): FollowUpAnswer[] =>
    aiQuestions
      .map((question) => {
        const answerIds = dynamicAnswers[question.id] || [];
        return {
          questionId: question.id,
          question: question.question,
          answerIds,
          answerLabels: answerIds.map(
            (id) => question.options.find((option) => option.id === id)?.label || id
          ),
        };
      })
      .filter((answer) => answer.answerIds.length > 0);

  const finishOnboarding = async () => {
    if (saving) return;
    setSaving(true);

    const fullProfile: OnboardingProfile = {
      ...profile,
      followUpAnswers: collectFollowUpAnswers(),
      language,
    };
    saveOnboardingProfile(fullProfile);

    const user = getStoredUser();
    if (!user) {
      navigate('/dashboard');
      return;
    }

    const updatedUser = mergeUserWithOnboarding(user, fullProfile);
    let planGeneration = 'disabled';
    try {
      const { data: savedUser } = await api.post(`/users/${user.id}/onboarding`, fullProfile);
      localStorage.setItem('user', JSON.stringify({ ...updatedUser, ...savedUser }));
      planGeneration = savedUser?.planGeneration || 'disabled';
    } catch {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }

    if (!hasRealApi || planGeneration !== 'pending') {
      navigate('/dashboard');
      return;
    }

    // AI plan generation with a full-screen progress state. If the request
    // times out client-side the server may still finish, so poll the plan
    // status for up to 30 more seconds before falling back.
    setGenerating(true);
    try {
      const { data } = await api.post(`/users/${user.id}/plan/generate`, { language }, { timeout: 45000 });
      if (data?.status === 'ready') {
        toast.success(t('onboarding.planReady'));
        navigate('/path');
        return;
      }
    } catch {
      const deadline = Date.now() + 30000;
      while (Date.now() < deadline) {
        await sleep(3000);
        try {
          const { data } = await api.get(`/users/${user.id}/plan`);
          if (data?.status === 'ready') {
            toast.success(t('onboarding.planReady'));
            navigate('/path');
            return;
          }
          if (data?.status === 'failed' || data?.status === 'none') break;
        } catch {
          break;
        }
      }
    }

    toast(t('onboarding.planFailed'));
    navigate('/dashboard');
  };

  const goNext = () => {
    if (step === 2) {
      prefetchQuestions();
    }
    if (step === steps.length - 1) {
      finishOnboarding();
      return;
    }
    setStep((current) => current + 1);
  };

  if (generating) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 px-4 text-white">
        <div className="max-w-md text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-white/20 border-t-primary" />
          <h1 className="mt-8 text-3xl font-black">{t('onboarding.generatingTitle')}</h1>
          <p className="mt-4 text-lg font-bold text-orange-200">{t(GENERATING_MESSAGE_KEYS[generatingMessageIndex])}</p>
          <p className="mt-6 text-sm text-slate-400">{t('onboarding.generatingHint')}</p>
        </div>
      </div>
    );
  }

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
                <select className="input-field" value={profile.gender} onChange={(event) => setProfile({ ...profile, gender: event.target.value })}>
                  <option value="Prefer not to say">{t('onboarding.genderPreferNot')}</option>
                  <option value="Male">{t('onboarding.genderMale')}</option>
                  <option value="Female">{t('onboarding.genderFemale')}</option>
                  <option value="Non-binary">{t('onboarding.genderNonBinary')}</option>
                </select>
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

          {step >= dynamicStepStart && step < dynamicStepEnd && (
            <DynamicQuestionStep
              question={aiQuestions[step - dynamicStepStart]}
              selectedIds={dynamicAnswers[aiQuestions[step - dynamicStepStart].id] || []}
              onToggle={(optionId) => toggleDynamicAnswer(aiQuestions[step - dynamicStepStart], optionId)}
              isHebrew={isHebrew}
              kicker={t('onboarding.aiQuestions')}
              copy={t('onboarding.aiQuestionsCopy')}
            />
          )}

          {step === motivationStep && (
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

          {step === summaryStep && (
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
              onClick={goNext}
              disabled={saving}
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
