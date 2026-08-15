import React, { useCallback, useEffect, useState } from 'react';
import api, { hasRealApi } from '../utils/api';
import { getStoredUser } from '../utils/storage';
import { useLanguage } from '../i18n/LanguageContext';

export type PlanInfo = {
  status: 'none' | 'generating' | 'ready' | 'failed';
  source: 'ai' | 'static';
  language?: string;
  generated_at?: string | null;
  aiEnabled?: boolean;
};

export const isAiPlan = (plan: PlanInfo | null) =>
  Boolean(plan && plan.source === 'ai' && plan.status === 'ready');

// Fetches the user's plan status (null in demo mode / before the fetch lands).
export const usePlanStatus = () => {
  const [plan, setPlan] = useState<PlanInfo | null>(null);

  const refresh = useCallback(async () => {
    const user = getStoredUser();
    if (!hasRealApi || !user) return;
    try {
      const { data } = await api.get<PlanInfo>(`/users/${user.id}/plan`);
      setPlan(data);
    } catch {
      // Demo mode or unauthenticated — no badge is shown.
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { plan, refresh };
};

// Kicks off AI plan generation and resolves true when the plan is ready.
// If the synchronous call times out client-side, polls the status endpoint
// (the server may still finish and commit).
export const runPlanGeneration = async (userId: number, language: string): Promise<boolean> => {
  try {
    const { data } = await api.post(`/users/${userId}/plan/generate`, { language }, { timeout: 65000 });
    return data?.status === 'ready';
  } catch {
    // Keep polling for up to 90 more seconds — the server may still finish.
    const deadline = Date.now() + 90000;
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      try {
        const { data } = await api.get(`/users/${userId}/plan`);
        if (data?.status === 'ready') return true;
        if (data?.status === 'failed' || data?.status === 'none') return false;
      } catch {
        return false;
      }
    }
    return false;
  }
};

// "AI plan" / "Starter plan" chip. Renders nothing while the status is unknown.
export const PlanBadge: React.FC<{ plan: PlanInfo | null }> = ({ plan }) => {
  const { t } = useLanguage();
  if (!plan) return null;
  const ai = isAiPlan(plan);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${
        ai ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'
      }`}
    >
      {ai ? `✨ ${t('plan.aiBadge')}` : t('plan.starterBadge')}
    </span>
  );
};
