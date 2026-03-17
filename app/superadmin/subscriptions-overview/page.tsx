'use client';

import SuperAdminLayout from '@/components/layout/SuperAdminLayout';
import { useAuth } from '@/components/providers/AuthProvider';
import { useEffect, useMemo, useState } from 'react';

interface Subscription {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorEmail: string;
  tier: string;
  planName: string;
  status: string;
  startDate: string;
  endDate?: string;
  price: number;
  activationType?: string;
}

type FilterKey = 'all' | 'active' | 'inactive' | 'expired' | 'cancelled' | 'free' | 'premium';
type SortKey = 'recent' | 'expiring' | 'name' | 'price';

const PER_PAGE = 15;

// ── Helpers ──────────────────────────────────────────────────

function formatDate(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'active': return { label: 'Activa', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' };
    case 'expired': return { label: 'Expirada', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' };
    case 'cancelled': return { label: 'Cancelada', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' };
    case 'inactive': return { label: 'Inactiva', bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
    default: return { label: status, bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
  }
}

function getTierConfig(tier: string) {
  switch (tier) {
    case 'plus': return { label: 'Plus', bg: 'bg-purple-100', text: 'text-purple-700', icon: '💎' };
    case 'medium': return { label: 'Medium', bg: 'bg-blue-100', text: 'text-blue-700', icon: '⭐' };
    default: return { label: 'Free', bg: 'bg-gray-100', text: 'text-gray-600', icon: '🆓' };
  }
}

function getActivationLabel(type?: string) {
  switch (type) {
    case 'manual': return 'Manual';
    case 'mercadopago': return 'MercadoPago';
    case 'automatic': return 'Automática';
    default: return '—';
  }
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

// ── Component ────────────────────────────────────────────────

export default function SuperAdminSubscriptionsOverviewPage() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/superadmin/subscriptions', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSubscriptions(data.subscriptions ?? []);
        }
      } catch { /* ignore */ } finally { setLoading(false); }
    })();
  }, [user]);

  // ── Counts ─────────────────────────────────────────────────
  const counts = useMemo(() => {
    const c = { all: subscriptions.length, active: 0, inactive: 0, expired: 0, cancelled: 0, free: 0, premium: 0 };
    for (const s of subscriptions) {
      if (s.status === 'active') c.active++;
      if (s.status === 'inactive') c.inactive++;
      if (s.status === 'expired') c.expired++;
      if (s.status === 'cancelled') c.cancelled++;
      if (s.tier === 'free') c.free++;
      if (s.tier === 'plus' || s.tier === 'medium') c.premium++;
    }
    return c;
  }, [subscriptions]);

  const totalRevenue = useMemo(
    () => subscriptions.filter(s => s.status === 'active').reduce((sum, s) => sum + (s.price ?? 0), 0),
    [subscriptions],
  );

  // ── Filtered / Sorted / Paginated ─────────────────────────
  const processed = useMemo(() => {
    let list = [...subscriptions];

    // Filter by status/tier
    if (filter === 'active') list = list.filter(s => s.status === 'active');
    else if (filter === 'inactive') list = list.filter(s => s.status === 'inactive');
    else if (filter === 'expired') list = list.filter(s => s.status === 'expired');
    else if (filter === 'cancelled') list = list.filter(s => s.status === 'cancelled');
    else if (filter === 'free') list = list.filter(s => s.tier === 'free');
    else if (filter === 'premium') list = list.filter(s => s.tier === 'plus' || s.tier === 'medium');

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.doctorName.toLowerCase().includes(q) ||
        s.doctorEmail.toLowerCase().includes(q) ||
        (s.planName ?? '').toLowerCase().includes(q),
      );
    }

    // Sort
    list.sort((a, b) => {
      switch (sort) {
        case 'recent': return new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime();
        case 'expiring': return new Date(a.endDate || '9999').getTime() - new Date(b.endDate || '9999').getTime();
        case 'name': return a.doctorName.localeCompare(b.doctorName, 'es');
        case 'price': return (b.price ?? 0) - (a.price ?? 0);
        default: return 0;
      }
    });

    return list;
  }, [subscriptions, filter, search, sort]);

  const totalPages = Math.max(1, Math.ceil(processed.length / PER_PAGE));
  const safeCurrentPage = Math.min(page, totalPages);
  const paginated = processed.slice((safeCurrentPage - 1) * PER_PAGE, safeCurrentPage * PER_PAGE);

  // Reset page on filter/search changes
  useEffect(() => { setPage(1); }, [filter, search, sort]);

  // ── Page numbers ───────────────────────────────────────────
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, safeCurrentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [safeCurrentPage, totalPages]);

  // ── Filter config ─────────────────────────────────────────
  const filters: { key: FilterKey; label: string; color: string }[] = [
    { key: 'all', label: 'Todas', color: 'purple' },
    { key: 'active', label: 'Activas', color: 'green' },
    { key: 'expired', label: 'Expiradas', color: 'amber' },
    { key: 'cancelled', label: 'Canceladas', color: 'red' },
    { key: 'inactive', label: 'Inactivas', color: 'gray' },
    { key: 'free', label: 'Gratuitas', color: 'gray' },
    { key: 'premium', label: 'Premium', color: 'purple' },
  ];

  return (
    <SuperAdminLayout>
      <div>
        {/* Header */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Suscripciones</h1>
            <p className="mt-1 text-sm text-gray-500">Vista general de suscripciones de doctores</p>
          </div>
          <p className="text-xs text-gray-400">{subscriptions.length} registros totales</p>
        </div>

        {/* Stat Cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Total</p>
                <p className="text-xl font-bold text-gray-900">{counts.all}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Activas</p>
                <p className="text-xl font-bold text-green-700">{counts.active}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Expiradas</p>
                <p className="text-xl font-bold text-amber-700">{counts.expired}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Ingreso activo</p>
                <p className="text-xl font-bold text-blue-700">${totalRevenue.toLocaleString('es-AR')}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                <span className="text-lg">💎</span>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Premium</p>
                <p className="text-xl font-bold text-purple-700">{counts.premium}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search + Sort */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, email o plan..."
              className="w-full rounded-xl border-0 bg-white py-2.5 pl-10 pr-10 text-sm ring-1 ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Ordenar:</span>
            {([
              { key: 'recent' as SortKey, label: 'Recientes' },
              { key: 'expiring' as SortKey, label: 'Por vencer' },
              { key: 'name' as SortKey, label: 'Nombre' },
              { key: 'price' as SortKey, label: 'Precio' },
            ]).map(s => (
              <button
                key={s.key}
                onClick={() => setSort(s.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  sort === s.key ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                filter === f.key
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.label}
              <span className={`ml-1.5 ${filter === f.key ? 'text-purple-200' : 'text-gray-400'}`}>
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="mt-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : processed.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 ring-1 ring-gray-100">
              <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              <p className="mt-3 text-sm font-medium text-gray-500">No se encontraron suscripciones</p>
              <p className="text-xs text-gray-400">Intenta cambiar los filtros o la búsqueda</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block rounded-2xl bg-white ring-1 ring-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="py-3 pl-5 pr-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Doctor</th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Plan</th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Estado</th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Precio</th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Inicio</th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Vencimiento</th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Días rest.</th>
                      <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Activación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginated.map(sub => {
                      const st = getStatusConfig(sub.status);
                      const tier = getTierConfig(sub.tier);
                      const remaining = daysUntil(sub.endDate);
                      const isExpanded = expandedId === sub.id;

                      return (
                        <tr
                          key={sub.id}
                          onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                          className="cursor-pointer transition hover:bg-gray-50/70"
                        >
                          <td className="py-3.5 pl-5 pr-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">
                                {getInitials(sub.doctorName)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-gray-900">{sub.doctorName}</p>
                                <p className="truncate text-xs text-gray-400">{sub.doctorEmail}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3.5">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${tier.bg} ${tier.text}`}>
                              <span>{tier.icon}</span> {sub.planName ?? tier.label}
                            </span>
                          </td>
                          <td className="px-3 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${st.bg} ${st.text}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                              {st.label}
                            </span>
                          </td>
                          <td className="px-3 py-3.5 font-medium text-gray-900">
                            {sub.price ? `$${sub.price.toLocaleString('es-AR')}` : 'Gratis'}
                          </td>
                          <td className="px-3 py-3.5 text-gray-500">{formatDate(sub.startDate)}</td>
                          <td className="px-3 py-3.5 text-gray-500">{formatDate(sub.endDate)}</td>
                          <td className="px-3 py-3.5">
                            {remaining !== null ? (
                              <span className={`font-semibold ${
                                remaining <= 0 ? 'text-red-600' :
                                remaining <= 7 ? 'text-red-500' :
                                remaining <= 30 ? 'text-amber-600' :
                                'text-green-600'
                              }`}>
                                {remaining <= 0 ? 'Vencido' : `${remaining}d`}
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3.5 text-xs text-gray-500">{getActivationLabel(sub.activationType)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3">
                {paginated.map(sub => {
                  const st = getStatusConfig(sub.status);
                  const tier = getTierConfig(sub.tier);
                  const remaining = daysUntil(sub.endDate);
                  const isExpanded = expandedId === sub.id;

                  return (
                    <div key={sub.id} className="rounded-2xl bg-white p-4 ring-1 ring-gray-100">
                      <div
                        className="flex items-start justify-between cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700">
                            {getInitials(sub.doctorName)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{sub.doctorName}</p>
                            <p className="text-xs text-gray-400">{sub.doctorEmail}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${st.bg} ${st.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${tier.bg} ${tier.text}`}>
                          <span>{tier.icon}</span> {sub.planName ?? tier.label}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {sub.price ? `$${sub.price.toLocaleString('es-AR')}` : 'Gratis'}
                        </span>
                        {remaining !== null && (
                          <span className={`text-xs font-semibold ${
                            remaining <= 0 ? 'text-red-600' :
                            remaining <= 7 ? 'text-red-500' :
                            remaining <= 30 ? 'text-amber-600' :
                            'text-green-600'
                          }`}>
                            {remaining <= 0 ? 'Vencido' : `${remaining} días restantes`}
                          </span>
                        )}
                      </div>
                      {isExpanded && (
                        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3 text-xs">
                          <div>
                            <p className="text-gray-400">Inicio</p>
                            <p className="font-medium text-gray-700">{formatDate(sub.startDate)}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Vencimiento</p>
                            <p className="font-medium text-gray-700">{formatDate(sub.endDate)}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Activación</p>
                            <p className="font-medium text-gray-700">{getActivationLabel(sub.activationType)}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Doctor ID</p>
                            <p className="truncate font-mono text-gray-500">{sub.doctorId}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                  <p className="text-xs text-gray-400">
                    Mostrando {(safeCurrentPage - 1) * PER_PAGE + 1}–{Math.min(safeCurrentPage * PER_PAGE, processed.length)} de {processed.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={safeCurrentPage === 1}
                      className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 disabled:opacity-30"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    {pageNumbers.map(n => (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        className={`h-8 w-8 rounded-lg text-sm font-medium transition ${
                          n === safeCurrentPage ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={safeCurrentPage === totalPages}
                      className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 disabled:opacity-30"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
}
