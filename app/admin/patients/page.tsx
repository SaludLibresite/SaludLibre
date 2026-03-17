'use client';

import AdminLayout from '@/components/layout/AdminLayout';
import SubscriptionGuard from '@/components/guards/SubscriptionGuard';
import { useAuth } from '@/components/providers/AuthProvider';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt?: string;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export default function AdminPatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const token = await user!.getIdToken();
        const res = await fetch('/api/doctors/me/patients', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPatients(data.patients ?? []);
        }
      } catch { /* */ } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const filtered = patients.filter((p) =>
    `${p.name} ${p.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <SubscriptionGuard feature="patients">
        <div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
              <p className="mt-1 text-sm text-gray-500">
                {loading ? 'Cargando…' : `${patients.length} paciente${patients.length !== 1 ? 's' : ''} registrado${patients.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <Link
              href="/admin/nuevo-paciente"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Paciente
            </Link>
          </div>

          <div className="mt-6">
            <input
              type="text"
              placeholder="Buscar por nombre o email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 sm:max-w-sm"
            />
          </div>

          {loading ? (
            <div className="mt-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl bg-white p-5 shadow-sm">
                  <div className="h-12 rounded bg-gray-100" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="mt-12 flex flex-col items-center gap-3 text-center text-gray-500">
              <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="font-medium">
                {search ? 'Sin resultados para esa búsqueda' : 'Aún no tienes pacientes'}
              </p>
              {!search && (
                <p className="text-sm">Los pacientes aparecerán aquí cuando agenden una cita contigo.</p>
              )}
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {filtered.map((patient) => (
                <Link
                  key={patient.id}
                  href={`/admin/patients/${patient.id}`}
                  className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-[var(--color-border)] transition hover:shadow-md"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-sm font-bold text-[var(--color-primary)]">
                    {getInitials(patient.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">{patient.name}</p>
                    <p className="truncate text-sm text-gray-500">{patient.email}</p>
                  </div>
                  {patient.phone && (
                    <p className="hidden text-sm text-gray-500 sm:block">{patient.phone}</p>
                  )}
                  <svg className="h-5 w-5 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </div>
      </SubscriptionGuard>
    </AdminLayout>
  );
}
