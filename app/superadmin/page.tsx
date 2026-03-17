'use client';

import SuperAdminLayout from '@/components/layout/SuperAdminLayout';
import { useAuth } from '@/components/providers/AuthProvider';
import { useEffect, useState } from 'react';

interface PlatformStats {
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  totalSubscriptions: number;
  totalRevenue: number;
  activeSubscriptions: number;
}

export default function SuperAdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PlatformStats>({
    totalDoctors: 0, totalPatients: 0, totalAppointments: 0,
    totalSubscriptions: 0, totalRevenue: 0, activeSubscriptions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/superadmin/stats', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch { /* */ } finally { setLoading(false); }
    })();
  }, [user]);

  const cards = [
    { label: 'Doctores', value: stats.totalDoctors, icon: '👨‍⚕️', color: 'bg-blue-50 text-blue-700', href: '/superadmin/doctors' },
    { label: 'Pacientes', value: stats.totalPatients, icon: '👥', color: 'bg-green-50 text-green-700', href: '/superadmin/patients' },
    { label: 'Turnos', value: stats.totalAppointments, icon: '📅', color: 'bg-yellow-50 text-yellow-700', href: '#' },
    { label: 'Suscripciones Activas', value: stats.activeSubscriptions, icon: '⭐', color: 'bg-purple-50 text-purple-700', href: '/superadmin/subscriptions-overview' },
    { label: 'Especialidades', value: 0, icon: '🏥', color: 'bg-cyan-50 text-cyan-700', href: '/superadmin/specialties' },
    { label: 'Ingresos Totales', value: `$${stats.totalRevenue.toLocaleString('es-AR')}`, icon: '💰', color: 'bg-emerald-50 text-emerald-700', href: '#' },
  ];

  return (
    <SuperAdminLayout>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
        <p className="mt-1 text-sm text-gray-500">Vista general de la plataforma SaludLibre</p>

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => (
              <a
                key={c.label}
                href={c.href}
                className={`flex items-center gap-4 rounded-xl p-5 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md ${c.color}`}
              >
                <span className="text-3xl">{c.icon}</span>
                <div>
                  <p className="text-2xl font-bold">{c.value}</p>
                  <p className="text-sm opacity-70">{c.label}</p>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Recent activity placeholder */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900">Actividad Reciente</h2>
          <div className="mt-4 rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
            <p className="text-gray-400">Las actividades recientes se mostrarán aquí</p>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
