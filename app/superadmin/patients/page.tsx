'use client';

import SuperAdminLayout from '@/components/layout/SuperAdminLayout';
import { useAuth } from '@/components/providers/AuthProvider';
import { useEffect, useState, useMemo } from 'react';

interface AssignedDoctor {
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
}

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dni: string;
  gender: string;
  address: string;
  profilePhoto: string | null;
  isActive: boolean;
  dataComplete: boolean;
  doctors: AssignedDoctor[];
  insurance: { provider: string; number: string };
  createdAt?: string;
}

const PER_PAGE = 15;

type SortKey = 'recent' | 'alphabetical';

function getInitials(name: string) {
  return (name || '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(d?: string) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return '—'; }
}

export default function SuperAdminPatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');
  const [page, setPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/superadmin/patients', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setPatients(data.patients ?? []);
        }
      } catch { /* */ } finally { setLoading(false); }
    })();
  }, [user]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let result = patients.filter(
      p =>
        p.name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.dni?.includes(q) ||
        p.phone?.includes(q)
    );
    if (sort === 'alphabetical') {
      result = [...result].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'es'));
    } else {
      result = [...result].sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      });
    }
    return result;
  }, [patients, search, sort]);

  // Reset page when search/sort changes
  useEffect(() => { setPage(1); }, [search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Page numbers to display (max 5 visible)
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (page <= 3) {
      for (let i = 1; i <= maxVisible; i++) pages.push(i);
    } else if (page >= totalPages - 2) {
      for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = page - 2; i <= page + 2; i++) pages.push(i);
    }
    return pages;
  }, [page, totalPages]);

  const activeCount = patients.filter(p => p.isActive !== false).length;
  const withDoctorCount = patients.filter(p => p.doctors?.length > 0).length;
  const completeProfileCount = patients.filter(p => p.dataComplete).length;

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="mt-1 text-sm text-gray-500">{patients.length} pacientes registrados</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
                <p className="text-xs text-gray-500">Activos</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{withDoctorCount}</p>
                <p className="text-xs text-gray-500">Con doctor</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{completeProfileCount}</p>
                <p className="text-xs text-gray-500">Perfil completo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Sort controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre, email, DNI, teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Ordenar:</span>
            <button
              onClick={() => setSort('recent')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                sort === 'recent' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Más recientes
            </button>
            <button
              onClick={() => setSort('alphabetical')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                sort === 'alphabetical' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              A → Z
            </button>
          </div>
        </div>

        {/* Results info */}
        {search && (
          <p className="text-sm text-gray-500">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} para &quot;{search}&quot;
          </p>
        )}

        {/* Patient list */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-36 rounded bg-gray-100" />
                    <div className="h-3 w-52 rounded bg-gray-100" />
                  </div>
                  <div className="h-3 w-20 rounded bg-gray-100" />
                </div>
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <div className="py-16 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="mt-3 text-sm font-medium text-gray-900">No se encontraron pacientes</p>
              <p className="mt-1 text-xs text-gray-500">
                {search ? 'Probá con otro término de búsqueda.' : 'Aún no hay pacientes registrados.'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="px-5 py-3 text-xs font-semibold uppercase text-gray-400">Paciente</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase text-gray-400">Contacto</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase text-gray-400">DNI</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase text-gray-400">Doctor asignado</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase text-gray-400">Estado</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase text-gray-400">Registro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginated.map((pat) => (
                      <tr
                        key={pat.id}
                        onClick={() => setExpandedRow(expandedRow === pat.id ? null : pat.id)}
                        className="cursor-pointer transition hover:bg-purple-50/30"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-purple-100 to-purple-200 text-xs font-semibold text-purple-700">
                              {pat.profilePhoto ? (
                                <img src={pat.profilePhoto} alt={pat.name} className="h-full w-full rounded-full object-cover" />
                              ) : (
                                getInitials(pat.name)
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">{pat.name || 'Sin nombre'}</p>
                              {pat.insurance?.provider && (
                                <p className="text-[11px] text-gray-400 truncate">{pat.insurance.provider}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-gray-700 truncate">{pat.email || '—'}</p>
                          <p className="text-xs text-gray-400">{pat.phone || '—'}</p>
                        </td>
                        <td className="px-5 py-3.5 text-gray-700">{pat.dni || '—'}</td>
                        <td className="px-5 py-3.5">
                          {pat.doctors?.length > 0 ? (
                            <div className="flex flex-col gap-0.5">
                              {pat.doctors.slice(0, 2).map((doc, idx) => (
                                <span key={idx} className="text-sm text-gray-700 truncate">
                                  {doc.doctorName}
                                </span>
                              ))}
                              {pat.doctors.length > 2 && (
                                <span className="text-[11px] text-gray-400">+{pat.doctors.length - 2} más</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Sin asignar</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            {pat.isActive !== false ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700 ring-1 ring-green-600/10">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                Activo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-500 ring-1 ring-gray-600/5">
                                <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                                Inactivo
                              </span>
                            )}
                            {pat.dataComplete && (
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-[10px] text-blue-600" title="Perfil completo">
                                ✓
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">{formatDate(pat.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y divide-gray-50 md:hidden">
                {paginated.map((pat) => (
                  <div
                    key={pat.id}
                    onClick={() => setExpandedRow(expandedRow === pat.id ? null : pat.id)}
                    className="cursor-pointer px-4 py-3.5 transition hover:bg-purple-50/30"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-purple-100 to-purple-200 text-xs font-semibold text-purple-700">
                        {pat.profilePhoto ? (
                          <img src={pat.profilePhoto} alt={pat.name} className="h-full w-full rounded-full object-cover" />
                        ) : (
                          getInitials(pat.name)
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">{pat.name || 'Sin nombre'}</p>
                          {pat.isActive !== false ? (
                            <span className="inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" title="Activo" />
                          ) : (
                            <span className="inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" title="Inactivo" />
                          )}
                        </div>
                        {pat.email && <p className="text-xs text-gray-500 truncate">{pat.email}</p>}
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400">
                          {pat.dni && <span>DNI: {pat.dni}</span>}
                          {pat.phone && <span>{pat.phone}</span>}
                          <span>{formatDate(pat.createdAt)}</span>
                        </div>
                        {pat.doctors?.length > 0 && (
                          <p className="mt-1 text-[11px] text-purple-600">
                            Dr. {pat.doctors[0].doctorName}
                            {pat.doctors.length > 1 && ` (+${pat.doctors.length - 1})`}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Expanded detail (mobile) */}
                    {expandedRow === pat.id && (
                      <div className="mt-3 ml-13 space-y-1.5 border-t border-gray-100 pt-3 text-xs text-gray-500">
                        {pat.address && <p><span className="text-gray-400">Dirección:</span> {pat.address}</p>}
                        {pat.insurance?.provider && <p><span className="text-gray-400">Obra social:</span> {pat.insurance.provider} {pat.insurance.number && `(${pat.insurance.number})`}</p>}
                        {pat.gender && <p><span className="text-gray-400">Género:</span> {pat.gender === 'female' ? 'Femenino' : pat.gender === 'male' ? 'Masculino' : pat.gender}</p>}
                        <p className="font-mono text-[10px] text-gray-300">ID: {pat.id}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop expanded row (below table) */}
              {expandedRow && (
                <div className="hidden md:block border-t border-gray-100 bg-gray-50/50 px-5 py-4">
                  {(() => {
                    const pat = paginated.find(p => p.id === expandedRow);
                    if (!pat) return null;
                    return (
                      <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                        <div>
                          <p className="text-[11px] font-medium text-gray-400">Dirección</p>
                          <p className="text-gray-700">{pat.address || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-gray-400">Género</p>
                          <p className="text-gray-700">{pat.gender === 'female' ? 'Femenino' : pat.gender === 'male' ? 'Masculino' : pat.gender || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-gray-400">Obra social</p>
                          <p className="text-gray-700">{pat.insurance?.provider || '—'} {pat.insurance?.number ? `(${pat.insurance.number})` : ''}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-gray-400">Perfil completo</p>
                          <p className="text-gray-700">{pat.dataComplete ? 'Sí' : 'No'}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium text-gray-400">ID</p>
                          <p className="font-mono text-xs text-gray-400">{pat.id}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-xs text-gray-500">
              Mostrando {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} de {filtered.length} pacientes
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Anterior
              </button>

              {pageNumbers.map(n => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-xs font-medium transition ${
                    n === page
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {n}
                </button>
              ))}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none"
              >
                Siguiente
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}
