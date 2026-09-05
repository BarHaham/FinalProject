import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import AppShell from '../components/AppShell';
import PlanGeneratingScreen from '../components/PlanGeneratingScreen';
import { PlanBadge, isAiPlan, runPlanGeneration, usePlanStatus } from '../components/PlanStatus';
import { achievements } from '../data/sportLingoData';
import { getStoredUser } from '../utils/storage';
import { useLanguage } from '../i18n/LanguageContext';
import api, { hasRealApi } from '../utils/api';

interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
  height?: number;
  weight?: number;
  fitness_level?: string;
  main_goal?: string;
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<User | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const { plan, refresh: refreshPlan } = usePlanStatus();
  const { t, tv, language } = useLanguage();

  const handleRegeneratePlan = async () => {
    if (!user || regenerating) return;
    if (!window.confirm(t('plan.regenerateConfirm'))) return;

    setRegenerating(true);
    const result = await runPlanGeneration(user.id, language);
    if (result.ready) {
      toast.success(t('plan.regenerateSuccess'));
    } else {
      toast.error(`${t('plan.regenerateFailed')}${result.error ? `\n(${result.error})` : ''}`, { duration: 10000 });
    }
    await refreshPlan();
    setRegenerating(false);
  };

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      window.location.href = '/login';
      return;
    }

    setUser(storedUser);
    setFormData(storedUser);
    setLoading(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSaveProfile = async () => {
    if (!formData || !user) return;

    try {
      await api.put(`/users/${user.id}`, formData);

      setUser(formData);
      localStorage.setItem('user', JSON.stringify(formData));
      setIsEditing(false);
      toast.success(t('profile.updated'));
    } catch {
      toast.error(t('profile.updateFailed'));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('profile.passwordMismatch'));
      return;
    }

    setPasswordLoading(true);
    try {
      await api.post(`/users/${user.id}/change-password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success(t('profile.passwordChanged'));
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('profile.passwordChangeFailed'));
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading || !user || !formData) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <AppShell title={t('profile.title')}>
      {regenerating && <PlanGeneratingScreen />}
      <div className="grid gap-6">
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-primary">{t('profile.account')}</p>
              <h2 className="mt-1 text-2xl font-black">{t('profile.userInfo')}</h2>
            </div>
            <button
              onClick={() => {
                if (isEditing) {
                  handleSaveProfile();
                } else {
                  setIsEditing(true);
                }
              }}
              className={isEditing ? 'btn-primary' : 'btn-secondary'}
            >
              {isEditing ? t('profile.save') : t('profile.edit')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold mb-2">{t('profile.fullName')}</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`input-field ${!isEditing ? 'bg-slate-100' : ''}`}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold mb-2">{t('profile.email')}</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="input-field bg-slate-100"
              />
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-semibold mb-2">{t('profile.age')}</label>
              <input
                type="number"
                name="age"
                value={formData.age || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`input-field ${!isEditing ? 'bg-slate-100' : ''}`}
              />
            </div>

            {/* Height */}
            <div>
              <label className="block text-sm font-semibold mb-2">{t('profile.height')}</label>
              <input
                type="number"
                name="height"
                value={formData.height || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`input-field ${!isEditing ? 'bg-slate-100' : ''}`}
              />
            </div>

            {/* Weight */}
            <div>
              <label className="block text-sm font-semibold mb-2">{t('profile.weight')}</label>
              <input
                type="number"
                name="weight"
                value={formData.weight || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`input-field ${!isEditing ? 'bg-slate-100' : ''}`}
              />
            </div>

            {/* Fitness Level */}
            <div>
              <label className="block text-sm font-semibold mb-2">{t('profile.fitnessLevel')}</label>
              <select
                name="fitness_level"
                value={formData.fitness_level || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`input-field ${!isEditing ? 'bg-slate-100' : ''}`}
              >
                <option value="">{t('profile.selectLevel')}</option>
                <option value="Complete beginner">{tv('Complete beginner')}</option>
                <option value="Beginner">{tv('Beginner')}</option>
                <option value="Intermediate">{tv('Intermediate')}</option>
                <option value="Advanced">{tv('Advanced')}</option>
              </select>
            </div>

            {/* Main Goal */}
            <div>
              <label className="block text-sm font-semibold mb-2">{t('profile.mainGoal')}</label>
              <select
                name="main_goal"
                value={formData.main_goal || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`input-field ${!isEditing ? 'bg-slate-100' : ''}`}
              >
                <option value="">{t('profile.selectGoal')}</option>
                <option value="Build daily habit">{tv('Build a daily sports habit')}</option>
                <option value="Lose weight">{tv('Lose weight')}</option>
                <option value="Improve fitness">{tv('Improve general fitness')}</option>
                <option value="Build strength">{tv('Build strength')}</option>
                <option value="Improve flexibility">{tv('Improve flexibility and mobility')}</option>
              </select>
            </div>
          </div>

          {isEditing && (
            <div className="mt-6 pt-6 border-t">
              <button
                onClick={() => setIsEditing(false)}
                className="btn-secondary"
              >
                {t('profile.cancel')}
              </button>
            </div>
          )}
        </section>

        {hasRealApi && plan && (
          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-black">{t('plan.myPlan')}</h2>
                  <PlanBadge plan={plan} />
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {isAiPlan(plan) ? t('plan.aiDescription') : t('plan.starterDescription')}
                </p>
                {isAiPlan(plan) && plan.generated_at && (
                  <p className="mt-1 text-sm text-slate-500">
                    {t('plan.generatedOn')}: {new Date(plan.generated_at).toLocaleDateString()}
                    {plan.language ? ` · ${t('plan.language')}: ${plan.language === 'he' ? 'עברית' : 'English'}` : ''}
                  </p>
                )}
                {plan.status === 'failed' && plan.error && (
                  <p className="mt-2 rounded-md bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 break-words">
                    Last attempt failed: {plan.error}
                  </p>
                )}
              </div>
              {plan.aiEnabled && (
                <button type="button" onClick={handleRegeneratePlan} disabled={regenerating} className="btn-primary">
                  {regenerating ? t('onboarding.generatingTitle') : isAiPlan(plan) ? t('plan.regenerate') : t('plan.starterBannerButton')}
                </button>
              )}
            </div>
          </section>
        )}

        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-6 text-2xl font-black">{t('profile.changePassword')}</h2>
          <form onSubmit={handleChangePassword} className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-semibold mb-2">{t('profile.currentPassword')}</label>
              <input
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">{t('profile.newPassword')}</label>
              <input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">{t('profile.confirmNewPassword')}</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                className="input-field"
                required
              />
            </div>
            <div className="md:col-span-3">
              <button type="submit" disabled={passwordLoading} className="btn-primary">
                {passwordLoading ? t('auth.creating') : t('profile.updatePassword')}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-6 text-2xl font-black">{t('progress.achievements')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {achievements.map((achievement, index) => (
              <div key={achievement} className="rounded-md bg-amber-50 p-4 text-center">
                <p className="mb-2 text-sm font-black text-primary">Badge {index + 1}</p>
                <p className="text-sm font-black">{tv(achievement)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
};

export default Profile;
