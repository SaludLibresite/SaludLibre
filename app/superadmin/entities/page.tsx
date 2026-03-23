'use client';

import SuperAdminLayout from '@/components/layout/SuperAdminLayout';
import { useAuth } from '@/components/providers/AuthProvider';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';

interface Entity {
  id: string;
  type: string;
  name: string;
  email: string;
  phone: string;
  description: string;
  profileImage: string;
  schedule: string;
  location: { latitude: number; longitude: number; formattedAddress: string };
  website: string;
  verified: boolean;
  createdAt?: string;
}

const TYPE_LABELS: Record<string, { label: string; color: string; dot: string }> = {
  centro_medico: { label: 'Centro Médico', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  farmacia: { label: 'Farmacia', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  laboratorio: { label: 'Laboratorio', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
};

const PER_PAGE = 12;

export default function SuperAdminEntitiesPage() {
  const { user } = useAuth();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterVerified, setFilterVerified] = useState<'all' | 'yes' | 'no'>('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/superadmin/entities', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setEntities(data.entities ?? []);
        }
      } catch { /* */ } finally { setLoading(false); }
    })();
  }, [user]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return entities.filter((e) => {
      const matchesSearch = !q || e.name?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q) || e.location?.formattedAddress?.toLowerCase().includes(q);
      const matchesType = filterType === 'all' || e.type === filterType;
      const matchesVerified = filterVerified === 'all' || (filterVerified === 'yes' && e.verified) || (filterVerified === 'no' && !e.verified);
      return matchesSearch && matchesType && matchesVerified;
    });
  }, [search, entities, filterType, filterVerified]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => { setPage(1); }, [search, filterType, filterVerified]);

  const counts = {
    total: entities.length,
    centros: entities.filter(e => e.type === 'centro_medico').length,
    farmacias: entities.filter(e => e.type === 'farmacia').length,
    laboratorios: entities.filter(e => e.type === 'laboratorio').length,
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Entidades</h1>
            <p className="mt-1 text-sm text-gray-500">{entities.length} entidades registradas</p>
          </div>
          <Link
            href="/superadmin/entities/new"
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Nueva Entidad
          </Link>
        </div>

        {/* Summary cards */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <p className="text-2xl font-bold text-gray-900">{counts.total}</p>
            <p className="text-xs text-gray-500 mt-1">Total</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <p className="text-2xl font-bold text-blue-600">{counts.centros}</p>
            <p className="text-xs text-gray-500 mt-1">Centros Médicos</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <p className="text-2xl font-bold text-green-600">{counts.farmacias}</p>
            <p className="text-xs text-gray-500 mt-1">Farmacias</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <p className="text-2xl font-bold text-purple-600">{counts.laboratorios}</p>
            <p className="text-xs text-gray-500 mt-1">Laboratorios</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Buscar por nombre, email o dirección..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-purple-400"
          >
            <option value="all">Todos los tipos</option>
            <option value="centro_medico">Centros Médicos</option>
            <option value="farmacia">Farmacias</option>
            <option value="laboratorio">Laboratorios</option>
          </select>
          <select
            value={filterVerified}
            onChange={(e) => setFilterVerified(e.target.value as 'all' | 'yes' | 'no')}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-purple-400"
          >
            <option value="all">Todos los estados</option>
            <option value="yes">Verificados</option>
            <option value="no">Pendientes</option>
          </select>
        </div>

        {/* Results info */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Mostrando {paginated.length} de {filtered.length} entidades</span>
          <span>Página {page} de {totalPages}</span>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-gray-100" />
                    <div className="h-3 w-1/2 rounded bg-gray-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="rounded-2xl bg-white py-16 text-center shadow-sm ring-1 ring-gray-100">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            <p className="mt-3 text-gray-500">No se encontraron entidades</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map((entity) => {
              const t = TYPE_LABELS[entity.type] ?? { label: entity.type, color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
              return (
                <Link
                  key={entity.id}
                  href={`/superadmin/entities/${entity.id}`}
                  className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md hover:ring-purple-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-lg font-bold text-gray-400">
                      {entity.profileImage ? (
                        <img src={entity.profileImage} alt={entity.name} className="h-full w-full rounded-xl object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        entity.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-gray-900 group-hover:text-purple-700 transition">{entity.name}</h3>
                        {entity.verified && (
                          <svg className="h-4 w-4 shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ring-current/10 ${t.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
                          {t.label}
                        </span>
                      </div>
                      {entity.location?.formattedAddress && (
                        <p className="mt-1.5 truncate text-xs text-gray-400">📍 {entity.location.formattedAddress}</p>
                      )}
                      {entity.phone && (
                        <p className="mt-0.5 text-xs text-gray-400">📞 {entity.phone}</p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
            >
              ← Anterior
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, i, arr) => (
                <span key={p}>
                  {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-gray-300">…</span>}
                  <button
                    onClick={() => setPage(p)}
                    className={`h-8 w-8 rounded-lg text-sm font-medium transition ${p === page ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}
