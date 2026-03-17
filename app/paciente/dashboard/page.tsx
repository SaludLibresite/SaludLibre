'use client';

import PatientLayout from '@/components/layout/PatientLayout';
import { useAuth } from '@/components/providers/AuthProvider';
import { useFamily } from '@/components/providers/FamilyContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Appointment {
  id: string;
  doctorName: string;
  doctorSpecialty: string;
  dateTime: string; // ISO string from API
  status: string;
  reason?: string;
}

function formatDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending:     { label: 'Pendiente',    cls: 'bg-[var(--color-warning-light)] text-[var(--color-warning)]' },
  confirmed:   { label: 'Confirmada',   cls: 'bg-[var(--color-success-light)] text-[var(--color-success)]' },
  scheduled:   { label: 'Programada',   cls: 'bg-[var(--color-success-light)] text-[var(--color-success)]' },
  rescheduled: { label: 'Reprogramada', cls: 'bg-[var(--color-info-light)] text-[var(--color-info)]'       },
};

export default function PatientDashboardPage() {
  const { user, profile } = useAuth();
  const { selectedMember, familyMembers } = useFamily();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const displayName = selectedMember
    ? selectedMember.name.split(' ')[0]
    : (profile?.name?.split(' ')[0] ?? 'Paciente');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setAppointments([]);
    (async () => {
      try {
        const token = await user.getIdToken();
        const params = new URLSearchParams({ limit: '5' });
        if (selectedMember) params.set('familyMemberId', selectedMember.id);
        const res = await fetch(`/api/appointments?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAppointments(data.appointments ?? []);
        }
      } catch { /* */ } finally { setLoading(false); }
    })();
  }, [user, selectedMember]);

  const upcoming = appointments.filter(
    (a) => a.status === 'confirmed' || a.status === 'pending' || a.status === 'scheduled' || a.status === 'rescheduled'
  );

  return (
    <PatientLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              ¡Hola, {profile?.name?.split(' ')[0] ?? 'Paciente'}!
            </h1>
            <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">Bienvenido/a a tu panel de salud</p>
          </div>

          {/* Family member banner */}
          {selectedMember && (
            <div className="flex items-center gap-2 rounded-xl bg-[var(--color-primary-light)] px-4 py-2.5 border border-[var(--color-primary)]/20">
              <svg className="h-4 w-4 shrink-0 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-[var(--color-primary)]">Viendo datos de</p>
                <p className="text-sm font-bold text-[var(--color-text-primary)]">
                  {selectedMember.name}
                  <span className="ml-1 font-normal text-[var(--color-text-secondary)]">({selectedMember.relationship})</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            href="/doctores"
            className="group flex items-center gap-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5 shadow-[var(--shadow-sm)] transition hover:shadow-[var(--shadow-md)]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary)] transition-colors group-hover:bg-[var(--color-primary)] group-hover:text-white">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.5 7.5a7.5 7.5 0 0013.15 9.15z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-[var(--color-text-primary)]">Buscar Doctor</p>
              <p className="text-xs text-[var(--color-text-muted)]">Encontrá especialistas</p>
            </div>
          </Link>

          <Link
            href="/paciente/appointments"
            className="group flex items-center gap-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5 shadow-[var(--shadow-sm)] transition hover:shadow-[var(--shadow-md)]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-secondary-light)] text-[var(--color-secondary)] transition-colors group-hover:bg-[var(--color-secondary)] group-hover:text-white">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-[var(--color-text-primary)]">Mis Citas</p>
              <p className="text-xs text-[var(--color-text-muted)]">Ver turnos agendados</p>
            </div>
          </Link>

          <Link
            href="/paciente/medical-records"
            className="group flex items-center gap-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5 shadow-[var(--shadow-sm)] transition hover:shadow-[var(--shadow-md)]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-success-light)] text-[var(--color-success)] transition-colors group-hover:bg-[var(--color-success)] group-hover:text-white">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-[var(--color-text-primary)]">Historial Médico</p>
              <p className="text-xs text-[var(--color-text-muted)]">Documentos y recetas</p>
            </div>
          </Link>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Upcoming appointments — takes 2 cols */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Próximas Citas {selectedMember ? `· ${selectedMember.name}` : ''}
              </h2>
              <Link href="/paciente/appointments" className="text-sm text-[var(--color-primary)] hover:underline">
                Ver todas →
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--color-surface-elevated)]" />
                ))}
              </div>
            ) : upcoming.length === 0 ? (
              <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-10 text-center shadow-[var(--shadow-sm)]">
                <svg className="mx-auto h-10 w-10 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" />
                </svg>
                <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
                  No hay citas próximas {selectedMember ? `para ${selectedMember.name}` : ''}
                </p>
                <Link href="/doctores" className="mt-3 inline-block text-sm font-medium text-[var(--color-primary)] hover:underline">
                  Buscar doctores →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((apt) => {
                  const meta = STATUS_META[apt.status] ?? STATUS_META.pending;
                  return (
                    <Link
                      key={apt.id}
                      href={`/paciente/appointments/${apt.id}`}
                      className="flex items-center gap-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 shadow-[var(--shadow-sm)] transition hover:shadow-[var(--shadow-md)]"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-[var(--color-text-primary)]">{apt.doctorName || '—'}</p>
                        <p className="truncate text-sm text-[var(--color-text-secondary)]">{apt.doctorSpecialty || '—'}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">{apt.dateTime ? formatDate(apt.dateTime) : '—'}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{apt.dateTime ? formatTime(apt.dateTime) : ''}</p>
                      </div>
                      <span className={`ml-2 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.cls}`}>
                        {meta.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar info */}
          <div className="space-y-4">
            {/* Family summary */}
            {familyMembers.length > 0 && (
              <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5 shadow-[var(--shadow-sm)]">
                <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">Mi Grupo Familiar</h3>
                <ul className="space-y-2">
                  {familyMembers.map((m) => (
                    <li key={m.id} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-superadmin-light)] text-[var(--color-superadmin)] text-xs font-bold">
                        {m.name[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{m.name}</p>
                        <p className="truncate text-xs text-[var(--color-text-muted)]">{m.relationship}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Profile card */}
            <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5 shadow-[var(--shadow-sm)]">
              <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
                {selectedMember ? 'Familiar seleccionado' : 'Mi Perfil'}
              </h3>
              {selectedMember ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Nombre</span>
                    <span className="font-medium text-[var(--color-text-primary)]">{selectedMember.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Relación</span>
                    <span className="font-medium text-[var(--color-text-primary)]">{selectedMember.relationship}</span>
                  </div>
                  {selectedMember.phone && (
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-secondary)]">Teléfono</span>
                      <span className="font-medium text-[var(--color-text-primary)]">{selectedMember.phone}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Nombre</span>
                    <span className="font-medium text-[var(--color-text-primary)]">{profile?.name ?? displayName}</span>
                  </div>
                  {profile?.email && (
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-secondary)]">Email</span>
                      <span className="truncate font-medium text-[var(--color-text-primary)] max-w-[140px]">{profile.email}</span>
                    </div>
                  )}
                  <Link
                    href="/paciente/profile"
                    className="mt-2 block text-center rounded-lg bg-[var(--color-surface-elevated)] py-2 text-xs font-medium text-[var(--color-primary)] hover:bg-[var(--color-surface-muted)] transition-colors"
                  >
                    Ver perfil completo
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PatientLayout>
  );
}
