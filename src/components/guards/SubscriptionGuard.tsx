'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { usePlatformSettingsStore } from '@/src/stores/platformSettingsStore';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type SubscriptionTier = 'free' | 'medium' | 'plus';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiredTier?: SubscriptionTier;
  feature?: string;
  fallback?: React.ReactNode;
}

const FEATURE_TIER_MAP: Record<string, SubscriptionTier> = {
  'nuevo-paciente': 'medium',
  patients: 'medium',
  schedule: 'medium',
  appointments: 'medium',
  reviews: 'medium',
  'video-consultation': 'plus',
};

const PLAN_LABELS: Record<SubscriptionTier, string> = {
  free: 'Free',
  medium: 'Medium',
  plus: 'Plus',
};

export default function SubscriptionGuard({
  children,
  requiredTier,
  feature,
  fallback,
}: SubscriptionGuardProps) {
  const { user } = useAuth();
  const { freemiumMode, setFreemiumMode } = usePlatformSettingsStore();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [userPlan, setUserPlan] = useState<string>('Free');

  const needed = requiredTier || (feature ? FEATURE_TIER_MAP[feature] ?? 'medium' : 'medium');

  useEffect(() => {
    if (!user) return;

    async function checkAccess() {
      try {
        const [subRes, platformRes] = await Promise.all([
          user!.getIdToken().then((token) =>
            fetch('/api/subscriptions/me', { headers: { Authorization: `Bearer ${token}` } }),
          ),
          fetch('/api/platform-settings'),
        ]);

        if (platformRes.ok) {
          const pd = await platformRes.json();
          setFreemiumMode(pd.freemiumMode);
          if (pd.freemiumMode) {
            setHasAccess(true);
            return;
          }
        }

        if (!subRes.ok) {
          setHasAccess(false);
          return;
        }
        const data = await subRes.json();
        const plan = (data.subscription?.planId ?? 'free').toLowerCase();
        setUserPlan(plan === 'plus' ? 'Plus' : plan === 'medium' ? 'Medium' : 'Free');

        const tierOrder: SubscriptionTier[] = ['free', 'medium', 'plus'];
        setHasAccess(tierOrder.indexOf(plan as SubscriptionTier) >= tierOrder.indexOf(needed));
      } catch {
        setHasAccess(false);
      }
    }

    checkAccess();
  }, [user, needed, setFreemiumMode]);

  if (hasAccess === null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#4dbad9]" />
      </div>
    );
  }

  if (hasAccess) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  const requiredLabel = PLAN_LABELS[needed];

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <div className="max-w-md rounded-2xl bg-gradient-to-br from-gray-50 to-white p-8 text-center shadow-lg ring-1 ring-gray-100">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8ad0f]/10">
          <svg className="h-8 w-8 text-[#e8ad0f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900">Funcionalidad Premium</h3>
        <p className="mt-2 text-sm text-gray-600">
          Esta funcionalidad requiere el plan <strong>{requiredLabel}</strong> o superior.
        </p>
        <div className="mt-4 flex items-center justify-center gap-4 text-sm">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">
            Tu plan: <strong>{userPlan}</strong>
          </span>
          <span className="rounded-full bg-[#4dbad9]/10 px-3 py-1 text-[#4dbad9]">
            Requerido: <strong>{requiredLabel}</strong>
          </span>
        </div>
        <Link
          href="/admin/subscription"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4dbad9] to-[#e8ad0f] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
        >
          Actualizar Plan
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
