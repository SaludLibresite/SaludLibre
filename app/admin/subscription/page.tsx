'use client';

import AdminLayout from '@/components/layout/AdminLayout';
import { useAuth } from '@/components/providers/AuthProvider';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Plan { id: string; name: string; price: number; features: string[]; }
interface Subscription { id: string; planId: string; status: string; startDate: string; endDate?: string; }

const PLANS: Plan[] = [
  { id: 'free', name: 'Free', price: 0, features: ['Perfil profesional', 'Listado en directorio', 'Suscripción básica'] },
  { id: 'medium', name: 'Medium', price: 15000, features: ['Todo lo del Plan Free', 'Gestión de pacientes', 'Agenda de turnos', 'Sistema de reseñas', 'Reportes y estadísticas'] },
  { id: 'plus', name: 'Plus', price: 25000, features: ['Todo lo del Plan Medium', 'Video consultas ilimitadas', 'Salas virtuales personalizadas', 'Soporte prioritario'] },
];

export default function AdminSubscriptionPage() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const token = await user!.getIdToken();
        const res = await fetch('/api/subscriptions/me', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setSubscription(data.subscription);
        }
      } catch { /* */ } finally { setLoading(false); }
    }
    load();
  }, [user]);

  const currentPlanId = subscription?.planId?.toLowerCase() ?? 'free';

  return (
    <AdminLayout>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Suscripción</h1>
        <p className="mt-1 text-sm text-gray-500">Gestioná tu plan y accedé a más funcionalidades</p>

        {loading ? (
          <div className="mt-8 flex justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#4dbad9]" /></div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {PLANS.map((plan) => {
              const isCurrent = currentPlanId === plan.id;
              return (
                <div key={plan.id} className={`rounded-2xl p-6 shadow-sm transition ${isCurrent ? 'bg-gradient-to-br from-[#4dbad9]/5 to-[#e8ad0f]/5 ring-2 ring-[#4dbad9]' : 'bg-white ring-1 ring-gray-100'}`}>
                  {isCurrent && <span className="mb-3 inline-block rounded-full bg-[#4dbad9] px-3 py-1 text-xs font-semibold text-white">Plan actual</span>}
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="mt-2">
                    <span className="text-3xl font-extrabold text-gray-900">${plan.price.toLocaleString('es-AR')}</span>
                    {plan.price > 0 && <span className="text-sm text-gray-500">/mes</span>}
                  </p>
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
                    <Link href={`/api/mercadopago/create-preference?planId=${plan.id}`}
                      className="mt-6 block rounded-xl bg-[#4dbad9] py-3 text-center text-sm font-semibold text-white transition hover:bg-[#3da8c5]">
                      Actualizar a {plan.name}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
