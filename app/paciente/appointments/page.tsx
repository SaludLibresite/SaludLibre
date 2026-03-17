'use client';

import PatientLayout from '@/components/layout/PatientLayout';
import { useAuth } from '@/components/providers/AuthProvider';
import { useFamily } from '@/components/providers/FamilyContext';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  dateTime: string | null;
  status: string;
  reason?: string;
  notes?: string;
  _source?: 'v2' | 'legacy';
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending:     { label: 'Pendiente',    cls: 'bg-[var(--color-warning-light)] text-[var(--color-warning)]'   },
  confirmed:   { label: 'Confirmada',   cls: 'bg-[var(--color-success-light)] text-[var(--color-success)]'   },
  scheduled:   { label: 'Programada',   cls: 'bg-[var(--color-success-light)] text-[var(--color-success)]'   },
  rescheduled: { label: 'Reprogramada', cls: 'bg-[var(--color-info-light)] text-[var(--color-info)]'         },
  completed:   { label: 'Completada',   cls: 'bg-[var(--color-info-light)] text-[var(--color-info)]'         },
  cancelled:   { label: 'Cancelada',    cls: 'bg-[var(--color-error-light)] text-[var(--color-error)]'       },
  rejected:    { label: 'Rechazada',    cls: 'bg-[var(--color-error-light)] text-[var(--color-error)]'       },
};

const CANCELLABLE = new Set(['pending', 'confirmed', 'scheduled', 'rescheduled']);

type Tab = 'all' | 'active' | 'completed' | 'cancelled';

const TABS: { id: Tab; label: string }[] = [
  { id: 'all',       label: 'Todas'       },
  { id: 'active',    label: 'Activas'     },
  { id: 'completed', label: 'Completadas' },
  { id: 'cancelled', label: 'Canceladas'  },
];

function formatDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function isActive(status: string) {
  return ['pending', 'confirmed', 'scheduled', 'rescheduled'].includes(status);
}

export default function PatientAppointmentsPage() {
  const { user } = useAuth();
  const { selectedMember } = useFamily();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('all');
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<Appointment | null>(null);

  const fetchAppointments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams();
      if (selectedMember) params.set('familyMemberId', selectedMember.id);
      const res = await fetch(`/api/appointments?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments ?? []);
      }
    } catch { /* */ } finally { setLoading(false); }
  }, [user, selectedMember]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  async function handleCancel(apt: Appointment) {
    if (!user) return;
    setCancelling(apt.id);
    setConfirmCancel(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/appointments/${apt.id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: apt._source }),
      });
      if (res.ok) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === apt.id ? { ...a, status: 'cancelled' } : a))
        );
      }
    } catch { /* */ } finally { setCancelling(null); }
  }

  const filtered = appointments.filter((a) => {
    if (tab === 'all') return true;
    if (tab === 'active') return isActive(a.status);
    if (tab === 'completed') return a.status === 'completed';
    if (tab === 'cancelled') return a.status === 'cancelled' || a.status === 'rejected';
    return true;
  });

  const counts = {
    all: appointments.length,
    active: appointments.filter((a) => isActive(a.status)).length,
    completed: appointments.filter((a) => a.status === 'completed').length,
    cancelled: appointments.filter((a) => a.status === 'cancelled' || a.status === 'rejected').length,
  };

  return (
    <PatientLayout>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Mis Citas</h1>
          <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
            {selectedMember ? `Citas de ${selectedMember.name}` : 'Historial de turnos y consultas'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-[var(--color-primary)] text-white shadow-[var(--shadow-sm)]'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] hover:bg-[var(--color-surface-elevated)]'
              }`}
            >
              {t.label}
              {counts[t.id] > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  tab === t.id ? 'bg-white/20 text-white' : 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]'
                }`}>
                  {counts[t.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-[var(--color-surface-elevated)]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl bg-[var(--color-surface)] p-10 text-center shadow-[var(--shadow-sm)] border border-[var(--color-border)]">
            <svg className="mx-auto h-10 w-10 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" />
            </svg>
            <p className="mt-3 text-sm text-[var(--color-text-secondary)]">No se encontraron citas</p>
            <Link href="/doctores" className="mt-3 inline-block text-sm font-medium text-[var(--color-primary)] hover:underline">
              Buscar doctores →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((apt) => {
              const meta = STATUS_META[apt.status] ?? STATUS_META.pending;
              const canCancel = CANCELLABLE.has(apt.status);
              const isCancelling = cancelling === apt.id;

              return (
                <div
                  key={apt.id}
                  className="rounded-xl bg-[var(--color-surface)] shadow-[var(--shadow-sm)] border border-[var(--color-border)] transition hover:shadow-[var(--shadow-md)]"
                >
                  <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                    {/* Doctor info — clickable link to detail */}
                    <Link href={`/paciente/appointments/${apt.id}`} className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[var(--color-text-primary)]">{apt.doctorName || '—'}</p>
                        <p className="truncate text-sm text-[var(--color-text-secondary)]">{apt.doctorSpecialty || '—'}</p>
                        {apt.reason && (
                          <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">Motivo: {apt.reason}</p>
                        )}
                      </div>
                    </Link>

                    {/* Date + status + actions */}
                    <div className="flex shrink-0 items-center gap-3 sm:justify-end">
                      <div className="text-right">
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">{formatDate(apt.dateTime)}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{formatTime(apt.dateTime)}</p>
                      </div>

                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.cls}`}>
                        {meta.label}
                      </span>

                      {canCancel && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmCancel(apt); }}
                          disabled={isCancelling}
                          className="shrink-0 rounded-lg border border-[var(--color-error)] px-3 py-1.5 text-xs font-medium text-[var(--color-error)] transition-colors hover:bg-[var(--color-error-light)] disabled:opacity-50"
                        >
                          {isCancelling ? '...' : 'Cancelar'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel confirmation modal */}
      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--color-surface)] p-6 shadow-[var(--shadow-xl)]">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">¿Cancelar esta cita?</h3>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Cita con <strong>{confirmCancel.doctorName}</strong>
              {confirmCancel.dateTime && <> el <strong>{formatDate(confirmCancel.dateTime)}</strong> a las <strong>{formatTime(confirmCancel.dateTime)}</strong></>}.
              Esta acción no se puede deshacer.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmCancel(null)}
                className="flex-1 rounded-xl border border-[var(--color-border)] py-2.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] transition-colors"
              >
                Mantener
              </button>
              <button
                onClick={() => handleCancel(confirmCancel)}
                className="flex-1 rounded-xl bg-[var(--color-error)] py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </PatientLayout>
  );
}
