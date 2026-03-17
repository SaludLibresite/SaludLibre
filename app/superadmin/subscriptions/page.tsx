'use client';

import SuperAdminLayout from '@/components/layout/SuperAdminLayout';
import { useAuth } from '@/components/providers/AuthProvider';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface Plan {
  id: string;
  planId: string;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  isActive: boolean;
  isPopular: boolean;
  features: string[];
}

const TIER_ORDER = ['plan-free', 'plan-medium', 'plan-plus'];

const TIER_GRADIENTS: Record<string, string> = {
  'plan-free': 'from-gray-500 to-gray-600',
  'plan-medium': 'from-blue-500 to-cyan-400',
  'plan-plus': 'from-purple-600 to-pink-500',
};

const TIER_RING: Record<string, string> = {
  'plan-free': 'ring-gray-200',
  'plan-medium': 'ring-blue-200',
  'plan-plus': 'ring-purple-200',
};

export default function SuperAdminSubscriptionsPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', price: '', features: '' });
  const [saving, setSaving] = useState(false);

  async function getToken() {
    return user!.getIdToken();
  }

  async function loadPlans() {
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      let res = await fetch('/api/superadmin/plans', { headers });

      if (res.ok) {
        const data = await res.json();
        const fetchedPlans: Plan[] = data.plans ?? [];
        if (fetchedPlans.length === 0) {
          // Auto-initialize default plans
          const initRes = await fetch('/api/superadmin/plans/init', {
            method: 'POST',
            headers,
          });
          if (initRes.ok) {
            const initData = await initRes.json();
            setPlans(sortPlans(initData.plans ?? []));
            toast.success('Planes inicializados correctamente');
            return;
          }
        }
        setPlans(sortPlans(fetchedPlans));
      }
    } catch { /* */ } finally { setLoading(false); }
  }

  function sortPlans(list: Plan[]): Plan[] {
    return [...list].sort((a, b) => {
      const ai = TIER_ORDER.indexOf(a.planId);
      const bi = TIER_ORDER.indexOf(b.planId);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }

  useEffect(() => {
    if (!user) return;
    loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function startEditing(plan: Plan) {
    setEditing(plan.id);
    setEditForm({
      name: plan.name,
      description: plan.description,
      price: String(plan.price),
      features: plan.features.join('\n'),
    });
  }

  async function savePlan(planId: string) {
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/superadmin/plans/${planId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          price: Number(editForm.price),
          features: editForm.features.split('\n').map(f => f.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        setPlans(prev =>
          prev.map(p =>
            p.id === planId
              ? {
                  ...p,
                  name: editForm.name,
                  description: editForm.description,
                  price: Number(editForm.price),
                  features: editForm.features.split('\n').map(f => f.trim()).filter(Boolean),
                }
              : p
          )
        );
        toast.success('Plan actualizado');
        setEditing(null);
      } else {
        toast.error('Error al guardar');
      }
    } catch { toast.error('Error al guardar'); } finally { setSaving(false); }
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planes de Suscripción</h1>
          <p className="mt-1 text-sm text-gray-500">Administrar planes, precios y funcionalidades</p>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            <p className="mt-3 text-gray-500">No se encontraron planes</p>
            <button
              onClick={loadPlans}
              className="mt-4 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 transition"
            >
              Inicializar planes por defecto
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map(plan => {
              const gradient = TIER_GRADIENTS[plan.planId] ?? TIER_GRADIENTS['plan-free'];
              const ring = TIER_RING[plan.planId] ?? TIER_RING['plan-free'];
              const isEditing = editing === plan.id;

              return (
                <div key={plan.id} className={`relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ${ring} flex flex-col`}>
                  {/* Header */}
                  <div className={`bg-linear-to-r ${gradient} px-6 py-5 text-white`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase opacity-70">Plan</p>
                        <p className="text-xl font-bold">{plan.name}</p>
                      </div>
                      {plan.isPopular && (
                        <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-bold backdrop-blur-sm">
                          Popular
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-medium text-gray-500">Nombre</label>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-400"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">Descripción</label>
                          <textarea
                            value={editForm.description}
                            onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                            rows={2}
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-400 resize-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">Precio (ARS)</label>
                          <input
                            type="number"
                            value={editForm.price}
                            onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))}
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-400"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">Funcionalidades (una por línea)</label>
                          <textarea
                            value={editForm.features}
                            onChange={e => setEditForm(f => ({ ...f, features: e.target.value }))}
                            rows={5}
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-400 resize-none"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => savePlan(plan.id)}
                            disabled={saving}
                            className="flex-1 rounded-xl bg-purple-600 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 transition disabled:opacity-50"
                          >
                            {saving ? 'Guardando...' : 'Guardar'}
                          </button>
                          <button
                            onClick={() => setEditing(null)}
                            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-gray-900">
                            ${plan.price.toLocaleString('es-AR')}
                          </span>
                          <span className="text-sm text-gray-400">/{plan.durationDays} días</span>
                        </div>

                        {plan.description && (
                          <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
                        )}

                        {plan.features.length > 0 && (
                          <ul className="mt-5 space-y-2">
                            {plan.features.map((f, i) => (
                              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                                <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                {f}
                              </li>
                            ))}
                          </ul>
                        )}

                        <button
                          onClick={() => startEditing(plan)}
                          className="mt-5 w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                        >
                          Editar plan
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}
