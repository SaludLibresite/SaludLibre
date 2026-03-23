'use client';

import SuperAdminLayout from '@/components/layout/SuperAdminLayout';
import { useAuth } from '@/components/providers/AuthProvider';
import { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface DoctorSubscription {
  status: string;
  planId: string;
  planName: string;
  expiresAt: string | null;
}

interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  specialty: string;
  profileImage: string;
  verified: boolean;
  onlineConsultation: boolean;
  subscription: DoctorSubscription;
  createdAt?: string;
}

const PER_PAGE = 12;

function getPlanStyle(planName?: string, status?: string) {
  const active = status === 'active';
  const plan = planName?.toLowerCase() ?? '';
  if (active && plan.includes('plus')) return { bg: 'bg-purple-100 text-purple-700 ring-purple-200', label: 'Plus' };
  if (active && plan.includes('medium')) return { bg: 'bg-blue-100 text-blue-700 ring-blue-200', label: 'Medium' };
  return { bg: 'bg-gray-100 text-gray-500 ring-gray-200', label: 'Free' };
}

export default function SuperAdminDoctorsPage() {
  return (
    <Suspense>
      <SuperAdminDoctorsContent />
    </Suspense>
  );
}

function SuperAdminDoctorsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterVerified, setFilterVerified] = useState<'all' | 'yes' | 'no'>('all');
  const [filterPlan, setFilterPlan] = useState<'all' | 'free' | 'medium' | 'plus'>('all');

  const pageFromUrl = Number(searchParams.get('page')) || 1;
  const [page, _setPage] = useState(pageFromUrl);

  const setPage = useCallback((p: number | ((prev: number) => number)) => {
    _setPage((prev) => {
      const next = typeof p === 'function' ? p(prev) : p;
      return next;
    });
  }, []);

  // Push URL param whenever page state changes (skip page 1)
  useEffect(() => {
    const currentUrlPage = Number(searchParams.get('page')) || 1;
    if (page === currentUrlPage) return;
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) params.delete('page');
    else params.set('page', String(page));
    const qs = params.toString();
    router.push(qs ? `?${qs}` : window.location.pathname, { scroll: false });
  }, [page, router, searchParams]);

  // Sync state when URL changes (e.g. browser back/forward)
  useEffect(() => {
    _setPage(pageFromUrl);
  }, [pageFromUrl]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/superadmin/doctors', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setDoctors(data.doctors ?? []);
        }
      } catch { /* */ } finally { setLoading(false); }
    })();
  }, [user]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return doctors.filter((d) => {
      const matchesSearch =
        !q ||
        d.name?.toLowerCase().includes(q) ||
        d.email?.toLowerCase().includes(q) ||
        d.specialty?.toLowerCase().includes(q);

      const matchesVerified =
        filterVerified === 'all' ||
        (filterVerified === 'yes' && d.verified) ||
        (filterVerified === 'no' && !d.verified);

      const plan = d.subscription?.planName?.toLowerCase() ?? '';
      const active = d.subscription?.status === 'active';
      const matchesPlan =
        filterPlan === 'all' ||
        (filterPlan === 'free' && (!active || (!plan.includes('plus') && !plan.includes('medium')))) ||
        (filterPlan === 'medium' && active && plan.includes('medium')) ||
        (filterPlan === 'plus' && active && plan.includes('plus'));

      return matchesSearch && matchesVerified && matchesPlan;
    });
  }, [search, doctors, filterVerified, filterPlan]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Reset page when filters change
  useEffect(() => {
    _setPage(1);
  }, [search, filterVerified, filterPlan]);

  const verifiedCount = doctors.filter((d) => d.verified).length;
  const pendingCount = doctors.filter((d) => !d.verified).length;
  const paidCount = doctors.filter((d) => {
    const plan = d.subscription?.planName?.toLowerCase() ?? '';
    return d.subscription?.status === 'active' && (plan.includes('plus') || plan.includes('medium'));
  }).length;

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Doctores</h1>
            <p className="mt-1 text-sm text-gray-500">{doctors.length} doctores registrados</p>
          </div>
          <Link
            href="/superadmin/doctors/new"
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Nuevo Doctor
          </Link>
        </div>

        {/* Summary cards */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <p className="text-2xl font-bold text-gray-900">{doctors.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <p className="text-2xl font-bold text-green-600">{verifiedCount}</p>
            <p className="text-xs text-gray-500 mt-1">Verificados</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            <p className="text-xs text-gray-500 mt-1">Pendientes</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <p className="text-2xl font-bold text-purple-600">{paidCount}</p>
            <p className="text-xs text-gray-500 mt-1">Con plan pago</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Buscar por nombre, email o especialidad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50"
            />
          </div>
          <select
            value={filterVerified}
            onChange={(e) => setFilterVerified(e.target.value as 'all' | 'yes' | 'no')}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-purple-400"
          >
            <option value="all">Todos los estados</option>
            <option value="yes">Verificados</option>
            <option value="no">Pendientes</option>
          </select>
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value as 'all' | 'free' | 'medium' | 'plus')}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-purple-400"
          >
            <option value="all">Todos los planes</option>
            <option value="free">Free</option>
            <option value="medium">Medium</option>
            <option value="plus">Plus</option>
          </select>
        </div>

        {/* Results info */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Mostrando {paginated.length} de {filtered.length} doctores</span>
          <span>Página {page} de {totalPages}</span>
        </div>

        {/* Doctor cards */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-gray-100" />
                    <div className="h-3 w-1/2 rounded bg-gray-100" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-3 w-full rounded bg-gray-100" />
                  <div className="h-3 w-2/3 rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="rounded-2xl bg-white py-16 text-center shadow-sm ring-1 ring-gray-100">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <p className="mt-3 text-gray-500">No se encontraron doctores</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map((doc) => {
              const plan = getPlanStyle(doc.subscription?.planName, doc.subscription?.status);
              const drTitle = doc.gender === 'female' ? 'Dra.' : 'Dr.';
              return (
                <Link
                  key={doc.id}
                  href={`/superadmin/doctors/${doc.id}`}
                  className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md hover:ring-purple-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-linear-to-br from-purple-400 to-purple-700">
                      {doc.profileImage ? (
                        <img src={doc.profileImage} alt={doc.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg font-bold text-white">
                          {doc.name?.[0]?.toUpperCase() ?? 'D'}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 truncate group-hover:text-purple-700 transition-colors">
                        {drTitle} {doc.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{doc.specialty || 'Sin especialidad'}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{doc.email}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    {doc.verified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-200">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                        Verificado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" /></svg>
                        Pendiente
                      </span>
                    )}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${plan.bg}`}>
                      {plan.label}
                    </span>
                    {doc.onlineConsultation && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2 py-0.5 text-xs font-medium text-cyan-700 ring-1 ring-cyan-200">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        Online
                      </span>
                    )}
                  </div>

                  {doc.phone && (
                    <p className="mt-3 text-xs text-gray-400">
                      Tel: {doc.phone}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, idx, arr) => {
                const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                return (
                  <span key={p} className="flex items-center gap-1">
                    {showEllipsis && <span className="px-1 text-gray-400">…</span>}
                    <button
                      onClick={() => setPage(p)}
                      className={`h-9 min-w-9 rounded-lg text-sm font-medium transition ${
                        p === page
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                );
              })}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}
