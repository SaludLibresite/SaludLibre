'use client';

import AdminLayout from '@/components/layout/AdminLayout';
import { useAuth } from '@/components/providers/AuthProvider';
import { usePlatformSettingsStore } from '@/src/stores/platformSettingsStore';
import { useEffect, useState } from 'react';

interface Plan { id: string; planId: string; name: string; price: number; features: string[]; isPopular?: boolean; }
interface Subscription {
  id: string; planId: string; status: string; startDate: string; endDate?: string;
  expiresAt?: string; mpSubscriptionId?: string; activationType?: string;
}

const TIER_ORDER = ['plan-free', 'plan-medium', 'plan-plus'];

export default function AdminSubscriptionPage() {
  const { user } = useAuth();
  const { freemiumMode, setFreemiumMode } = usePlatformSettingsStore();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    fetch('/api/platform-settings')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setFreemiumMode(d.freemiumMode); })
      .catch(() => {});
  }, [setFreemiumMode]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const token = await user!.getIdToken();
        const [plansRes, subRes] = await Promise.all([
          fetch('/api/subscriptions/plans'),
          fetch('/api/subscriptions/me', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (plansRes.ok) {
          const data = await plansRes.json();
          const fetched: Plan[] = data.plans ?? [];
          setPlans(
            [...fetched]
              .filter((p) => p.isPopular !== false || true) // keep all
              .sort((a, b) => {
                const ai = TIER_ORDER.indexOf(a.planId ?? a.id);
                const bi = TIER_ORDER.indexOf(b.planId ?? b.id);
                return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
              }),
          );
        }
        if (subRes.ok) {
          const data = await subRes.json();
          setSubscription(data.subscription);
        }
      } catch { /* */ } finally { setLoading(false); }
    }
    load();
  }, [user]);

  async function handleCheckout(planId: string) {
    if (!user) return;
    setCheckoutLoading(planId);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? 'Error al crear la suscripción');
      }
      const data = await res.json();
      window.location.href = data.initPoint;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al iniciar la suscripción');
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function handleCancel() {
    if (!user || !subscription) return;
    if (!confirm('¿Estás seguro de que querés cancelar tu suscripción? Se mantendrá activa hasta la fecha de vencimiento.')) return;
    setCancelLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? 'Error al cancelar la suscripción');
      }
      setSubscription(prev => prev ? { ...prev, status: 'cancelled' } : null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al cancelar la suscripción');
    } finally {
      setCancelLoading(false);
    }
  }

  const currentPlanId = subscription?.planId?.toLowerCase() ?? 'plan-free';
  const isRecurring = !!subscription?.mpSubscriptionId;
  const isActive = subscription?.status === 'active';

  const expiresAt = subscription?.expiresAt
    ? new Date(subscription.expiresAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <AdminLayout>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Suscripción</h1>
        <p className="mt-1 text-sm text-gray-500">Gestioná tu plan y accedé a más funcionalidades</p>

        {freemiumMode && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-amber-800">Funciones premium habilitadas gratuitamente</p>
                <p className="mt-0.5 text-xs text-amber-700">
                  Todas las funciones de planes pagos están disponibles sin costo por tiempo limitado. Las suscripciones están temporalmente deshabilitadas.
                </p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="mt-8 flex justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#4dbad9]" /></div>
        ) : (
          <>
            {/* Current subscription status */}
            {isActive && currentPlanId !== 'plan-free' && (
              <div className="mt-6 rounded-xl bg-gradient-to-r from-[#4dbad9]/10 to-[#e8ad0f]/10 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Suscripción activa — {isRecurring ? 'Cobro automático mensual' : 'Activación manual'}
                    </p>
                    {expiresAt && (
                      <p className="mt-1 text-xs text-gray-500">
                        {isRecurring ? 'Próxima renovación' : 'Vence'}: {expiresAt}
                      </p>
                    )}
                  </div>
                  {isRecurring && (
                    <button
                      onClick={handleCancel}
                      disabled={cancelLoading}
                      className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                    >
                      {cancelLoading ? 'Cancelando...' : 'Cancelar suscripción'}
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              {plans.map((plan) => {
                const planKey = plan.planId ?? plan.id;
                const isCurrent = currentPlanId === planKey;
                return (
                  <div key={plan.id} className={`rounded-2xl p-6 shadow-sm transition ${isCurrent ? 'bg-gradient-to-br from-[#4dbad9]/5 to-[#e8ad0f]/5 ring-2 ring-[#4dbad9]' : 'bg-white ring-1 ring-gray-100'}`}>
                    {isCurrent && <span className="mb-3 inline-block rounded-full bg-[#4dbad9] px-3 py-1 text-xs font-semibold text-white">Plan actual</span>}
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    <p className="mt-2">
                      <span className="text-3xl font-extrabold text-gray-900">${plan.price.toLocaleString('es-AR')}</span>
                      {plan.price > 0 && <span className="text-sm text-gray-500">/mes</span>}
                    </p>
                    {plan.price > 0 && (
                      <p className="mt-1 text-xs text-gray-400">Cobro automático mensual</p>
                    )}
                    <ul className="mt-6 space-y-3">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="h-4 w-4 shrink-0 text-[#4dbad9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                    {!isCurrent && plan.price > 0 && (
                      freemiumMode ? (
                        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center">
                          <p className="text-xs font-medium text-amber-700">Funciones premium gratuitas por tiempo limitado</p>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleCheckout(plan.id)}
                          disabled={checkoutLoading === plan.id}
                          className="mt-6 block w-full rounded-xl bg-[#4dbad9] py-3 text-center text-sm font-semibold text-white transition hover:bg-[#3da8c5] disabled:opacity-60">
                          {checkoutLoading === plan.id ? 'Redirigiendo...' : `Suscribirse a ${plan.name}`}
                        </button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
