'use client';

import SuperAdminLayout from '@/components/layout/SuperAdminLayout';
import { useAuth } from '@/components/providers/AuthProvider';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

// ── Types ────────────────────────────────────────────────────

interface RewardConfig {
  id?: string;
  referrerReward: number;
  referredDiscount: number;
  minSubscriptionTier: string;
  active: boolean;
}

interface Referral {
  id: string;
  referrerId: string;
  referrerName: string;
  referrerEmail: string;
  referredId: string;
  referredName: string;
  referredEmail: string;
  referredSpecialty: string;
  status: string;
  confirmedAt: string | null;
  createdAt: string;
}

type TabKey = 'referrals' | 'config';
type FilterKey = 'all' | 'pending' | 'confirmed' | 'expired' | 'rejected';

const PER_PAGE = 12;

// ── Helpers ──────────────────────────────────────────────────

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'confirmed': return { label: 'Confirmado', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' };
    case 'pending': return { label: 'Pendiente', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' };
    case 'expired': return { label: 'Expirado', bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
    case 'rejected': return { label: 'Rechazado', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' };
    default: return { label: status, bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
  }
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

// ── Component ────────────────────────────────────────────────

export default function SuperAdminReferralRewardsPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState<RewardConfig>({
    referrerReward: 10, referredDiscount: 10, minSubscriptionTier: 'medium', active: true,
  });
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<TabKey>('referrals');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        const [configRes, referralsRes] = await Promise.all([
          fetch('/api/superadmin/referral-config', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/superadmin/referrals', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (configRes.ok) {
          const data = await configRes.json();
          if (data.config) setConfig(data.config);
        }
        if (referralsRes.ok) {
          const data = await referralsRes.json();
          setReferrals(data.referrals ?? []);
        }
      } catch { /* ignore */ } finally { setLoading(false); }
    })();
  }, [user]);

  // ── Counts ─────────────────────────────────────────────────
  const counts = useMemo(() => {
    const c = { all: referrals.length, pending: 0, confirmed: 0, expired: 0, rejected: 0 };
    for (const r of referrals) {
      if (r.status === 'pending') c.pending++;
      if (r.status === 'confirmed') c.confirmed++;
      if (r.status === 'expired') c.expired++;
      if (r.status === 'rejected') c.rejected++;
    }
    return c;
  }, [referrals]);

  // Unique referrers count
  const uniqueReferrers = useMemo(() => new Set(referrals.map(r => r.referrerId)).size, [referrals]);

  // Conversion rate
  const conversionRate = useMemo(() => {
    if (referrals.length === 0) return 0;
    return Math.round((counts.confirmed / referrals.length) * 100);
  }, [referrals.length, counts.confirmed]);

  // ── Filtered / Paginated ──────────────────────────────────
  const processed = useMemo(() => {
    let list = [...referrals];

    if (filter !== 'all') list = list.filter(r => r.status === filter);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.referrerName.toLowerCase().includes(q) ||
        r.referrerEmail.toLowerCase().includes(q) ||
        r.referredName.toLowerCase().includes(q) ||
        r.referredEmail.toLowerCase().includes(q) ||
        r.referredSpecialty.toLowerCase().includes(q),
      );
    }

    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return list;
  }, [referrals, filter, search]);

  const totalPages = Math.max(1, Math.ceil(processed.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = processed.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  useEffect(() => { setPage(1); }, [filter, search]);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const max = 5;
    let start = Math.max(1, safePage - Math.floor(max / 2));
    const end = Math.min(totalPages, start + max - 1);
    start = Math.max(1, end - max + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [safePage, totalPages]);

  // ── Confirm / Reject Actions ────────────────────────────────
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function handleAction(id: string, action: 'confirm' | 'reject') {
    if (!user) return;
    setActionLoading(id);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/superadmin/referrals/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setReferrals(prev => prev.map(r => r.id === id ? { ...r, status: action === 'confirm' ? 'confirmed' : 'rejected', confirmedAt: action === 'confirm' ? new Date().toISOString() : r.confirmedAt } : r));
        toast.success(action === 'confirm' ? 'Referido confirmado' : 'Referido rechazado');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Error al actualizar');
      }
    } catch { toast.error('Error de conexión'); } finally { setActionLoading(null); }
  }

  // ── Save config ────────────────────────────────────────────
  async function saveConfig(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/superadmin/referral-config', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) toast.success('Configuración guardada');
      else toast.error('Error al guardar');
    } catch { toast.error('Error al guardar'); } finally { setSaving(false); }
  }

  // ── Filter pills ──────────────────────────────────────────
  const filterOptions: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'pending', label: 'Pendientes' },
    { key: 'confirmed', label: 'Confirmados' },
    { key: 'expired', label: 'Expirados' },
    { key: 'rejected', label: 'Rechazados' },
  ];

  return (
    <SuperAdminLayout>
      <div>
        {/* Header */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Programa de Referidos</h1>
            <p className="mt-1 text-sm text-gray-500">Gestión de recompensas y seguimiento de referidos</p>
          </div>
          <div className="flex items-center gap-2">
            {config.active ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Programa activo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400" /> Programa inactivo
              </span>
            )}
          </div>
        </div>

        {/* Stat Cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Total referidos</p>
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
                <p className="text-xs font-medium text-gray-500">Confirmados</p>
                <p className="text-xl font-bold text-green-700">{counts.confirmed}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Pendientes</p>
                <p className="text-xl font-bold text-amber-700">{counts.pending}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Referentes</p>
                <p className="text-xl font-bold text-blue-700">{uniqueReferrers}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
                <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Conversión</p>
                <p className="text-xl font-bold text-indigo-700">{conversionRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 border-b border-gray-200">
          <nav className="-mb-px flex gap-6">
            <button
              onClick={() => setTab('referrals')}
              className={`border-b-2 pb-3 text-sm font-medium transition ${
                tab === 'referrals'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Referidos ({counts.all})
            </button>
            <button
              onClick={() => setTab('config')}
              className={`border-b-2 pb-3 text-sm font-medium transition ${
                tab === 'config'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Configuración
              </span>
            </button>
          </nav>
        </div>

        {/* Tab: Referrals */}
        {tab === 'referrals' && (
          <div className="mt-6">
            {/* Search + Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre, email o especialidad..."
                  className="w-full rounded-xl border-0 bg-white py-2.5 pl-10 pr-10 text-sm ring-1 ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {filterOptions.map(f => (
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
            <div className="mt-5">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />)}
                </div>
              ) : processed.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 ring-1 ring-gray-100">
                  <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  <p className="mt-3 text-sm font-medium text-gray-500">No hay referidos</p>
                  <p className="text-xs text-gray-400">Intenta cambiar los filtros o la búsqueda</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden lg:block rounded-2xl bg-white ring-1 ring-gray-100 overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                          <th className="py-3 pl-5 pr-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Referente</th>
                          <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Referido</th>
                          <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Especialidad</th>
                          <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Estado</th>
                          <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Fecha registro</th>
                          <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Confirmado</th>
                          <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {paginated.map(ref => {
                          const st = getStatusConfig(ref.status);
                          return (
                            <tr key={ref.id} className="transition hover:bg-gray-50/70">
                              <td className="py-3.5 pl-5 pr-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">
                                    {getInitials(ref.referrerName)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate font-medium text-gray-900">{ref.referrerName}</p>
                                    <p className="truncate text-xs text-gray-400">{ref.referrerEmail}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3.5">
                                <div className="min-w-0">
                                  <p className="truncate font-medium text-gray-900">{ref.referredName}</p>
                                  <p className="truncate text-xs text-gray-400">{ref.referredEmail}</p>
                                </div>
                              </td>
                              <td className="px-3 py-3.5 text-gray-500">{ref.referredSpecialty || '—'}</td>
                              <td className="px-3 py-3.5">
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${st.bg} ${st.text}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                                  {st.label}
                                </span>
                              </td>
                              <td className="px-3 py-3.5 text-gray-500">{formatDate(ref.createdAt)}</td>
                              <td className="px-3 py-3.5 text-gray-500">{formatDate(ref.confirmedAt)}</td>
                              <td className="px-3 py-3.5">
                                {ref.status === 'pending' ? (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => handleAction(ref.id, 'confirm')}
                                      disabled={actionLoading === ref.id}
                                      className="rounded-lg bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 ring-1 ring-green-200 transition hover:bg-green-100 disabled:opacity-50"
                                    >
                                      Confirmar
                                    </button>
                                    <button
                                      onClick={() => handleAction(ref.id, 'reject')}
                                      disabled={actionLoading === ref.id}
                                      className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 ring-1 ring-red-200 transition hover:bg-red-100 disabled:opacity-50"
                                    >
                                      Rechazar
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="lg:hidden space-y-3">
                    {paginated.map(ref => {
                      const st = getStatusConfig(ref.status);
                      return (
                        <div key={ref.id} className="rounded-2xl bg-white p-4 ring-1 ring-gray-100">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700">
                                {getInitials(ref.referrerName)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{ref.referrerName}</p>
                                <p className="text-xs text-gray-400">Referente</p>
                              </div>
                            </div>
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${st.bg} ${st.text}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                              {st.label}
                            </span>
                          </div>
                          <div className="mt-3 rounded-xl bg-gray-50 p-3">
                            <div className="flex items-center gap-2">
                              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                              <div>
                                <p className="text-sm font-medium text-gray-700">{ref.referredName}</p>
                                <p className="text-xs text-gray-400">{ref.referredEmail}</p>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                            {ref.referredSpecialty && (
                              <span>{ref.referredSpecialty}</span>
                            )}
                            <span>Registro: {formatDate(ref.createdAt)}</span>
                            {ref.confirmedAt && (
                              <span>Confirmado: {formatDate(ref.confirmedAt)}</span>
                            )}
                          </div>
                          {ref.status === 'pending' && (
                            <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
                              <button
                                onClick={() => handleAction(ref.id, 'confirm')}
                                disabled={actionLoading === ref.id}
                                className="flex-1 rounded-lg bg-green-50 py-2 text-xs font-medium text-green-700 ring-1 ring-green-200 transition hover:bg-green-100 disabled:opacity-50"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => handleAction(ref.id, 'reject')}
                                disabled={actionLoading === ref.id}
                                className="flex-1 rounded-lg bg-red-50 py-2 text-xs font-medium text-red-700 ring-1 ring-red-200 transition hover:bg-red-100 disabled:opacity-50"
                              >
                                Rechazar
                              </button>
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
                        Mostrando {(safePage - 1) * PER_PAGE + 1}–{Math.min(safePage * PER_PAGE, processed.length)} de {processed.length}
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={safePage === 1}
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 disabled:opacity-30"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        {pageNumbers.map(n => (
                          <button
                            key={n}
                            onClick={() => setPage(n)}
                            className={`h-8 w-8 rounded-lg text-sm font-medium transition ${
                              n === safePage ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                        <button
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={safePage === totalPages}
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
        )}

        {/* Tab: Config */}
        {tab === 'config' && (
          <div className="mt-6">
            <form onSubmit={saveConfig} className="max-w-2xl rounded-2xl bg-white p-6 ring-1 ring-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                  <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Configuración del Programa</h2>
                  <p className="text-xs text-gray-500">Ajustá los parámetros de recompensas por referidos</p>
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Recompensa referente (%)</label>
                  <input
                    type="number"
                    min="0" max="100"
                    value={config.referrerReward}
                    onChange={(e) => setConfig({ ...config, referrerReward: Number(e.target.value) })}
                    className="w-full rounded-xl border-0 bg-gray-50 px-4 py-2.5 text-sm ring-1 ring-gray-200 focus:bg-white focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="mt-1 text-xs text-gray-400">Descuento que recibe el doctor que refiere</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Descuento referido (%)</label>
                  <input
                    type="number"
                    min="0" max="100"
                    value={config.referredDiscount}
                    onChange={(e) => setConfig({ ...config, referredDiscount: Number(e.target.value) })}
                    className="w-full rounded-xl border-0 bg-gray-50 px-4 py-2.5 text-sm ring-1 ring-gray-200 focus:bg-white focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="mt-1 text-xs text-gray-400">Descuento que recibe el doctor referido</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Plan mínimo requerido</label>
                  <select
                    value={config.minSubscriptionTier}
                    onChange={(e) => setConfig({ ...config, minSubscriptionTier: e.target.value })}
                    className="w-full rounded-xl border-0 bg-gray-50 px-4 py-2.5 text-sm ring-1 ring-gray-200 focus:bg-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="free">Free</option>
                    <option value="medium">Medium</option>
                    <option value="plus">Plus</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-400">Plan mínimo para participar del programa</p>
                </div>
                <div className="flex items-center">
                  <label className="flex cursor-pointer items-center gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={config.active}
                      onClick={() => setConfig({ ...config, active: !config.active })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.active ? 'bg-purple-600' : 'bg-gray-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.active ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Programa activo</span>
                      <p className="text-xs text-gray-400">{config.active ? 'Los referidos generan recompensas' : 'Programa pausado'}</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-5">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 disabled:opacity-50"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Guardando...
                    </span>
                  ) : 'Guardar Configuración'}
                </button>
              </div>
            </form>

            {/* Config Summary */}
            <div className="mt-6 max-w-2xl rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 p-5 ring-1 ring-purple-100/50">
              <h3 className="text-sm font-semibold text-purple-900">Resumen actual</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-white/70 p-3 text-center">
                  <p className="text-2xl font-bold text-purple-700">{config.referrerReward}%</p>
                  <p className="text-xs text-purple-600">Desc. referente</p>
                </div>
                <div className="rounded-xl bg-white/70 p-3 text-center">
                  <p className="text-2xl font-bold text-purple-700">{config.referredDiscount}%</p>
                  <p className="text-xs text-purple-600">Desc. referido</p>
                </div>
                <div className="rounded-xl bg-white/70 p-3 text-center">
                  <p className="text-2xl font-bold capitalize text-purple-700">{config.minSubscriptionTier}</p>
                  <p className="text-xs text-purple-600">Plan mínimo</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}
