'use client';

import SuperAdminLayout from '@/components/layout/SuperAdminLayout';
import { useAuth } from '@/components/providers/AuthProvider';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePlatformSettingsStore } from '@/src/stores/platformSettingsStore';

interface PlatformStats {
  totalDoctors: number;
  verifiedDoctors: number;
  pendingDoctors: number;
  totalPatients: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  totalSubscriptions: number;
  totalRevenue: number;
  totalSpecialties: number;
  activeSpecialties: number;
  planBreakdown: { plus: number; medium: number; free: number };
  onlineDoctors: number;
}

const EMPTY: PlatformStats = {
  totalDoctors: 0, verifiedDoctors: 0, pendingDoctors: 0,
  totalPatients: 0, activeSubscriptions: 0, expiredSubscriptions: 0,
  totalSubscriptions: 0, totalRevenue: 0, totalSpecialties: 0,
  activeSpecialties: 0, planBreakdown: { plus: 0, medium: 0, free: 0 },
  onlineDoctors: 0,
};

export default function SuperAdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PlatformStats>(EMPTY);
  const [loading, setLoading] = useState(true);
  const { freemiumMode, setFreemiumMode } = usePlatformSettingsStore();
  const [freemiumLoading, setFreemiumLoading] = useState(false);
  const [freemiumFetched, setFreemiumFetched] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        const [statsRes, settingsRes] = await Promise.all([
          fetch('/api/superadmin/stats', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/superadmin/platform-settings', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (settingsRes.ok) {
          const d = await settingsRes.json();
          setFreemiumMode(d.freemiumMode);
          setFreemiumFetched(true);
        }
      } catch { /* */ } finally { setLoading(false); }
    })();
  }, [user, setFreemiumMode]);

  async function handleFreemiumToggle(value: boolean) {
    if (!user) return;
    setFreemiumLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/superadmin/platform-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ freemiumMode: value }),
      });
      if (res.ok) setFreemiumMode(value);
    } catch { /* */ } finally { setFreemiumLoading(false); }
  }

  const pct = (n: number, total: number) => total > 0 ? Math.round((n / total) * 100) : 0;

  return (
    <SuperAdminLayout>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
        <p className="mt-1 text-sm text-gray-500">Vista general de la plataforma SaludLibre</p>

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : (
          <>
            {/* Main KPIs */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/superadmin/doctors" className="group rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md hover:ring-[#4dbad9]/30">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                  </div>
                  {stats.pendingDoctors > 0 && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      {stats.pendingDoctors} pendientes
                    </span>
                  )}
                </div>
                <p className="mt-3 text-2xl font-bold text-gray-900">{stats.totalDoctors}</p>
                <p className="text-sm text-gray-500">Doctores</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                  <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-green-400" />{stats.verifiedDoctors} verificados</span>
                  <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-blue-400" />{stats.onlineDoctors} online</span>
                </div>
              </Link>

              <Link href="/superadmin/patients" className="group rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md hover:ring-[#4dbad9]/30">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
                </div>
                <p className="mt-3 text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
                <p className="text-sm text-gray-500">Pacientes</p>
              </Link>

              <Link href="/superadmin/subscriptions-overview" className="group rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md hover:ring-[#4dbad9]/30">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                  </div>
                  {stats.expiredSubscriptions > 0 && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                      {stats.expiredSubscriptions} expiradas
                    </span>
                  )}
                </div>
                <p className="mt-3 text-2xl font-bold text-gray-900">{stats.activeSubscriptions}</p>
                <p className="text-sm text-gray-500">Suscripciones activas</p>
                <div className="mt-2 text-xs text-gray-400">{stats.totalSubscriptions} totales</div>
              </Link>

              <Link href="/superadmin/specialties" className="group rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md hover:ring-[#4dbad9]/30">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" /></svg>
                </div>
                <p className="mt-3 text-2xl font-bold text-gray-900">{stats.activeSpecialties}</p>
                <p className="text-sm text-gray-500">Especialidades activas</p>
                <div className="mt-2 text-xs text-gray-400">{stats.totalSpecialties} totales</div>
              </Link>
            </div>

            {/* Revenue + Plan breakdown */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {/* Revenue card */}
              <div className="rounded-xl bg-gradient-to-br from-[#011d2f] to-[#0a3a5c] p-6 text-white shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Ingresos activos</p>
                    <p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString('es-AR')}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-white/40">De {stats.activeSubscriptions} suscripciones activas</p>
              </div>

              {/* Plan distribution */}
              <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <p className="text-sm font-semibold text-gray-900">Distribución de planes</p>
                <div className="mt-4 space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Plus</span>
                      <span className="font-medium text-gray-900">{stats.planBreakdown.plus}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct(stats.planBreakdown.plus, stats.totalDoctors)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Medium</span>
                      <span className="font-medium text-gray-900">{stats.planBreakdown.medium}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-blue-400 transition-all" style={{ width: `${pct(stats.planBreakdown.medium, stats.totalDoctors)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Free</span>
                      <span className="font-medium text-gray-900">{stats.planBreakdown.free}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-gray-300 transition-all" style={{ width: `${pct(stats.planBreakdown.free, stats.totalDoctors)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Freemium mode toggle */}
            <div className="mt-6">
              <p className="text-sm font-semibold text-gray-900">Configuración de plataforma</p>
              <div className="mt-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Modo freemium</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Habilita todas las funciones premium para todos los doctores sin costo. Los botones de suscripción se deshabilitan y se muestra un aviso en el panel.
                    </p>
                    {freemiumMode && (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Activo ahora
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleFreemiumToggle(!freemiumMode)}
                    disabled={freemiumLoading || !freemiumFetched}
                    aria-checked={freemiumMode}
                    role="switch"
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                      freemiumMode ? 'bg-amber-400' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                        freemiumMode ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div className="mt-6">
              <p className="text-sm font-semibold text-gray-900">Accesos rápidos</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Gestionar doctores', href: '/superadmin/doctors', desc: `${stats.pendingDoctors} por verificar` },
                  { label: 'Ver pacientes', href: '/superadmin/patients', desc: `${stats.totalPatients} registrados` },
                  { label: 'Planes y precios', href: '/superadmin/subscriptions', desc: 'Configurar tiers' },
                  { label: 'Programa referidos', href: '/superadmin/referral-rewards', desc: 'Gestionar recompensas' },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md hover:ring-[#4dbad9]/30"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{link.label}</p>
                      <p className="mt-0.5 text-xs text-gray-400">{link.desc}</p>
                    </div>
                    <svg className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </SuperAdminLayout>
  );
}
