'use client';

import AdminLayout from '@/components/layout/AdminLayout';
import { useAuth } from '@/components/providers/AuthProvider';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DashboardStats {
  totalAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
  cancelledAppointments: number;
  averageRating: number;
  totalReviews: number;
}

interface DoctorProfile {
  name: string;
  specialty: string;
  verified: boolean;
  onlineConsultation: boolean;
  subscription: { status: string; planName: string };
  profileImage?: string;
  slug?: string;
}

export default function AdminDashboardPage() {
  const { user, profile: authProfile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const token = await user!.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };

        const [dashRes, profileRes] = await Promise.all([
          fetch('/api/doctors/me/dashboard', { headers }),
          fetch('/api/doctors/me', { headers }),
        ]);

        if (dashRes.ok) setStats(await dashRes.json());
        if (profileRes.ok) setDoctorProfile(await profileRes.json());
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const firstName = authProfile?.name?.split(' ')[0] ?? user?.displayName?.split(' ')[0] ?? 'Doctor';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  const completionRate = stats && stats.totalAppointments > 0
    ? Math.round((stats.completedAppointments / stats.totalAppointments) * 100)
    : 0;

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header with greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{greeting}, {firstName} 👋</h1>
            <p className="mt-1 text-sm text-gray-500">
              {doctorProfile?.specialty && <span>{doctorProfile.specialty} · </span>}
              Resumen de tu actividad
            </p>
          </div>
          <div className="flex items-center gap-2">
            {doctorProfile?.verified ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 ring-1 ring-green-200">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                Verificado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                Pendiente de verificación
              </span>
            )}
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ${
              doctorProfile?.subscription?.planName === 'Free'
                ? 'bg-gray-50 text-gray-600 ring-gray-200'
                : 'bg-[#4dbad9]/10 text-[#4dbad9] ring-[#4dbad9]/30'
            }`}>
              Plan {doctorProfile?.subscription?.planName ?? 'Free'}
            </span>
          </div>
        </div>

        {/* Stats cards */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <div className="h-20 rounded-lg bg-gray-100" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/schedule" className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md hover:ring-[#4dbad9]/30">
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#4dbad9]/10">
                  <svg className="h-6 w-6 text-[#4dbad9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </span>
                <svg className="w-5 h-5 text-gray-300 group-hover:text-[#4dbad9] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
              <p className="mt-4 text-3xl font-bold text-gray-900">{stats?.totalAppointments ?? 0}</p>
              <p className="mt-1 text-sm text-gray-500">Citas totales</p>
            </Link>

            <Link href="/admin/schedule" className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md hover:ring-orange-300/50">
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                  <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                {(stats?.pendingAppointments ?? 0) > 0 && (
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-orange-500 px-1.5 text-xs font-bold text-white">
                    {stats?.pendingAppointments}
                  </span>
                )}
              </div>
              <p className="mt-4 text-3xl font-bold text-gray-900">{stats?.pendingAppointments ?? 0}</p>
              <p className="mt-1 text-sm text-gray-500">Citas pendientes</p>
            </Link>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <p className="mt-4 text-3xl font-bold text-gray-900">{stats?.completedAppointments ?? 0}</p>
              <p className="mt-1 text-sm text-gray-500">Completadas</p>
              {stats && stats.totalAppointments > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Tasa de completado</span>
                    <span className="font-medium text-gray-700">{completionRate}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-green-500 transition-all duration-500" style={{ width: `${completionRate}%` }} />
                  </div>
                </div>
              )}
            </div>

            <Link href="/admin/reviews" className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md hover:ring-[#e8ad0f]/30">
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8ad0f]/10">
                  <svg className="h-6 w-6 text-[#e8ad0f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </span>
                <svg className="w-5 h-5 text-gray-300 group-hover:text-[#e8ad0f] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">{stats?.averageRating?.toFixed(1) ?? '0.0'}</p>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className={`w-4 h-4 ${star <= Math.round(stats?.averageRating ?? 0) ? 'text-[#e8ad0f]' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-500">{stats?.totalReviews ?? 0} reseñas</p>
            </Link>
          </div>
        )}

        {/* Two column layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quick actions */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones rápidas</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link href="/admin/patients" className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md group">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#4dbad9]/10 group-hover:bg-[#4dbad9]/20 transition">
                  <svg className="h-6 w-6 text-[#4dbad9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Gestionar pacientes</p>
                  <p className="text-xs text-gray-500 mt-0.5">Agregar, ver y editar pacientes</p>
                </div>
              </Link>
              <Link href="/admin/schedule" className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md group">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8ad0f]/10 group-hover:bg-[#e8ad0f]/20 transition">
                  <svg className="h-6 w-6 text-[#e8ad0f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Ver agenda</p>
                  <p className="text-xs text-gray-500 mt-0.5">Tus turnos y citas programadas</p>
                </div>
              </Link>
              <Link href="/admin/video-consultation" className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md group">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 group-hover:bg-green-200 transition">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Video consulta</p>
                  <p className="text-xs text-gray-500 mt-0.5">Iniciar o programar una videollamada</p>
                </div>
              </Link>
              <Link href="/admin/referrals" className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md group">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 group-hover:bg-purple-200 transition">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Referencias</p>
                  <p className="text-xs text-gray-500 mt-0.5">Tu código de referido y recompensas</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Profile summary card */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tu perfil</h2>
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-full bg-linear-to-br from-[#4dbad9] to-[#011d2f] flex items-center justify-center text-white text-xl font-bold shrink-0 overflow-hidden">
                  {doctorProfile?.profileImage ? (
                    <img src={doctorProfile.profileImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (authProfile?.name?.[0] ?? 'D').toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{doctorProfile?.name ?? authProfile?.name ?? 'Doctor'}</p>
                  <p className="text-sm text-gray-500 truncate">{doctorProfile?.specialty ?? 'Sin especialidad'}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Consulta online</span>
                  <span className={`font-medium ${doctorProfile?.onlineConsultation ? 'text-green-600' : 'text-gray-400'}`}>
                    {doctorProfile?.onlineConsultation ? 'Habilitada' : 'No habilitada'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Cancelaciones</span>
                  <span className="font-medium text-gray-700">{stats?.cancelledAppointments ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Calificación</span>
                  <span className="font-medium text-gray-700">
                    {stats?.averageRating ? `${stats.averageRating.toFixed(1)} / 5` : 'Sin calificar'}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100 flex gap-2">
                <Link href="/admin/profile" className="flex-1 text-center rounded-xl bg-[#4dbad9]/10 py-2.5 text-sm font-medium text-[#4dbad9] hover:bg-[#4dbad9]/20 transition">
                  Editar perfil
                </Link>
                {doctorProfile?.slug && (
                  <Link href={`/doctores/${doctorProfile.slug}`} target="_blank" className="flex-1 text-center rounded-xl bg-gray-100 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition">
                    Ver público
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
