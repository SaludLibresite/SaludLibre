'use client';

import AdminLayout from '@/components/layout/AdminLayout';
import SubscriptionGuard from '@/components/guards/SubscriptionGuard';
import { useAuth } from '@/components/providers/AuthProvider';
import { useSchedulePrefsStore } from '@/src/stores/schedulePrefsStore';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

// ── Types ────────────────────────────────────────────────────

interface Appointment {
  id: string;
  appointmentId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  dateTime: string | null;
  durationMinutes: number;
  type: string;
  reason: string;
  urgency: string;
  notes: string;
  status: string;
  _source?: string;
}

type ViewMode = 'calendar' | 'list';
type FilterKey = 'upcoming' | 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

const PER_PAGE = 15;

// ── Helpers ──────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending:     { label: 'Pendiente',   bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500'  },
  scheduled:   { label: 'Agendada',    bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  confirmed:   { label: 'Confirmada',  bg: 'bg-sky-100',    text: 'text-sky-700',    dot: 'bg-sky-500'    },
  in_progress: { label: 'En curso',    bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  completed:   { label: 'Completada',  bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
  cancelled:   { label: 'Cancelada',   bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500'    },
  no_show:     { label: 'No asistió',  bg: 'bg-gray-100',   text: 'text-gray-600',   dot: 'bg-gray-400'   },
};

function getStatus(s: string) { return STATUS_CONFIG[s] ?? { label: s, bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' }; }

function formatTime(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

function formatDateFull(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function isSameDay(iso: string | null, date: Date): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && d.getDate() === date.getDate();
}

function isToday(iso: string | null): boolean {
  return isSameDay(iso, new Date());
}

function isFutureOrToday(iso: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return d >= now;
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// ── Component ────────────────────────────────────────────────

export default function AdminSchedulePage() {
  const { user } = useAuth();
  const { view, filter, setView, setFilter } = useSchedulePrefsStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [calDate, setCalDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // ── Load data ──────────────────────────────────────────────
  const loadAppointments = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/appointments?limit=500', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments ?? []);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  // ── Status update ──────────────────────────────────────────
  async function updateStatus(id: string, action: string) {
    if (!user) return;
    setUpdatingId(id);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        toast.success(action === 'confirm' ? 'Cita confirmada' : action === 'complete' ? 'Cita completada' : action === 'cancel' ? 'Cita cancelada' : 'Estado actualizado');
        await loadAppointments();
      } else {
        toast.error('Error al actualizar estado');
      }
    } catch { toast.error('Error al actualizar'); } finally { setUpdatingId(null); }
  }

  // ── Counts ─────────────────────────────────────────────────
  const counts = useMemo(() => {
    const c = { upcoming: 0, all: appointments.length, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    for (const a of appointments) {
      if (a.status === 'pending') c.pending++;
      if (a.status === 'confirmed' || a.status === 'scheduled') c.confirmed++;
      if (a.status === 'completed') c.completed++;
      if (a.status === 'cancelled') c.cancelled++;
      if (isFutureOrToday(a.dateTime) && a.status !== 'cancelled' && a.status !== 'completed') c.upcoming++;
    }
    return c;
  }, [appointments]);

  // ── Today stats ────────────────────────────────────────────
  const todayStats = useMemo(() => {
    const today = appointments.filter(a => isToday(a.dateTime));
    return {
      total: today.length,
      pending: today.filter(a => a.status === 'pending').length,
      confirmed: today.filter(a => a.status === 'confirmed' || a.status === 'scheduled').length,
      completed: today.filter(a => a.status === 'completed').length,
    };
  }, [appointments]);

  // ── Filtered list ──────────────────────────────────────────
  const processed = useMemo(() => {
    let list = [...appointments];

    switch (filter) {
      case 'upcoming': list = list.filter(a => isFutureOrToday(a.dateTime) && a.status !== 'cancelled' && a.status !== 'completed'); break;
      case 'pending': list = list.filter(a => a.status === 'pending'); break;
      case 'confirmed': list = list.filter(a => a.status === 'confirmed' || a.status === 'scheduled'); break;
      case 'completed': list = list.filter(a => a.status === 'completed'); break;
      case 'cancelled': list = list.filter(a => a.status === 'cancelled'); break;
    }

    if (selectedDay && view === 'calendar') {
      list = list.filter(a => isSameDay(a.dateTime, selectedDay));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.patientName.toLowerCase().includes(q) ||
        a.reason.toLowerCase().includes(q) ||
        (a.patientEmail ?? '').toLowerCase().includes(q),
      );
    }

    list.sort((a, b) => {
      const da = a.dateTime ? new Date(a.dateTime).getTime() : 0;
      const db = b.dateTime ? new Date(b.dateTime).getTime() : 0;
      return filter === 'completed' || filter === 'cancelled' ? db - da : da - db;
    });

    return list;
  }, [appointments, filter, search, selectedDay, view]);

  const totalPages = Math.max(1, Math.ceil(processed.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = processed.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  useEffect(() => { setPage(1); }, [filter, search, selectedDay]);

  // ── Calendar data ──────────────────────────────────────────
  const calendarData = useMemo(() => {
    const year = calDate.getFullYear();
    const month = calDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Mon=0
    const totalDays = daysInMonth(year, month);
    const today = new Date();

    const days: { date: Date; isCurrentMonth: boolean; isToday: boolean; appointments: Appointment[] }[] = [];

    // Previous month padding
    for (let i = startDay - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false, isToday: false, appointments: [] });
    }

    // Current month
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      const dayApts = appointments.filter(a => isSameDay(a.dateTime, d));
      days.push({
        date: d,
        isCurrentMonth: true,
        isToday: d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate(),
        appointments: dayApts,
      });
    }

    // Next month padding to fill 6 rows
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false, isToday: false, appointments: [] });
    }

    return days;
  }, [calDate, appointments]);

  // ── Filters config ─────────────────────────────────────────
  const filters: { key: FilterKey; label: string }[] = [
    { key: 'upcoming', label: 'Próximas' },
    { key: 'all', label: 'Todas' },
    { key: 'pending', label: 'Pendientes' },
    { key: 'confirmed', label: 'Confirmadas' },
    { key: 'completed', label: 'Completadas' },
    { key: 'cancelled', label: 'Canceladas' },
  ];

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const max = 5;
    let start = Math.max(1, safePage - Math.floor(max / 2));
    const end = Math.min(totalPages, start + max - 1);
    start = Math.max(1, end - max + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [safePage, totalPages]);

  // ── Action buttons for an appointment ──────────────────────
  function ActionButtons({ apt }: { apt: Appointment }) {
    const isUpdating = updatingId === apt.id;
    const isTerminal = apt.status === 'completed' || apt.status === 'cancelled' || apt.status === 'no_show';
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {apt.status === 'pending' && (
          <button
            onClick={(e) => { e.stopPropagation(); updateStatus(apt.id, 'confirm'); }}
            disabled={isUpdating}
            className="rounded-lg bg-sky-100 px-2.5 py-1.5 text-xs font-medium text-sky-700 transition hover:bg-sky-200 disabled:opacity-50"
          >
            Confirmar
          </button>
        )}
        {!isTerminal && (apt.status === 'confirmed' || apt.status === 'scheduled') && (
          <Link
            href={`/video/join/${apt.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 rounded-lg bg-green-100 px-2.5 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-200"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            Entrar
          </Link>
        )}
        <Link
          href={`/admin/appointment/${apt.id}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-200"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          Ver detalles
        </Link>
      </div>
    );
  }

  return (
    <AdminLayout>
      <SubscriptionGuard feature="appointments">
        <div>
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
              <p className="mt-1 text-sm text-gray-500">Administrá tus citas y turnos</p>
            </div>
            {/* View toggle */}
            <div className="flex items-center rounded-xl bg-gray-100 p-1">
              <button
                onClick={() => setView('calendar')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${view === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Calendario
              </button>
              <button
                onClick={() => { setView('list'); setSelectedDay(null); }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${view === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                Lista
              </button>
            </div>
          </div>

          {/* Today stats */}
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-white p-4 ring-1 ring-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4dbad9]/10">
                  <svg className="h-4.5 w-4.5 text-[#4dbad9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Hoy</p>
                  <p className="text-lg font-bold text-gray-900">{todayStats.total}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
                  <svg className="h-4.5 w-4.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pendientes</p>
                  <p className="text-lg font-bold text-amber-700">{todayStats.pending}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100">
                  <svg className="h-4.5 w-4.5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Confirmadas</p>
                  <p className="text-lg font-bold text-sky-700">{todayStats.confirmed}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-100">
                  <svg className="h-4.5 w-4.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Completadas</p>
                  <p className="text-lg font-bold text-green-700">{todayStats.completed}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Calendar View ─────────────────────────────────── */}
          {view === 'calendar' && (
            <div className="mt-6">
              <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                {/* Calendar grid */}
                <div className="rounded-2xl bg-white p-4 ring-1 ring-gray-100 sm:p-5">
                  {/* Month nav */}
                  <div className="mb-4 flex items-center justify-between">
                    <button
                      onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1))}
                      className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div className="text-center">
                      <h2 className="text-lg font-semibold capitalize text-gray-900">
                        {calDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                      </h2>
                      <button
                        onClick={() => { setCalDate(new Date()); setSelectedDay(new Date()); }}
                        className="text-xs text-[#4dbad9] hover:underline"
                      >
                        Ir a hoy
                      </button>
                    </div>
                    <button
                      onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1))}
                      className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>

                  {/* Weekday headers */}
                  <div className="grid grid-cols-7 gap-px">
                    {WEEKDAYS.map(d => (
                      <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400">{d}</div>
                    ))}
                  </div>

                  {/* Day cells */}
                  <div className="grid grid-cols-7 gap-px">
                    {calendarData.map((day, i) => {
                      const isSelected = selectedDay &&
                        day.date.getFullYear() === selectedDay.getFullYear() &&
                        day.date.getMonth() === selectedDay.getMonth() &&
                        day.date.getDate() === selectedDay.getDate();
                      const hasApts = day.appointments.length > 0;
                      const pendingCount = day.appointments.filter(a => a.status === 'pending').length;
                      const confirmedCount = day.appointments.filter(a => a.status === 'confirmed' || a.status === 'scheduled').length;

                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedDay(day.date)}
                          className={`relative flex min-h-[52px] flex-col items-center rounded-lg p-1.5 transition sm:min-h-[64px] ${
                            !day.isCurrentMonth ? 'text-gray-300' :
                            isSelected ? 'bg-[#4dbad9] text-white' :
                            day.isToday ? 'bg-[#4dbad9]/10 font-bold text-[#4dbad9]' :
                            'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-sm">{day.date.getDate()}</span>
                          {hasApts && day.isCurrentMonth && (
                            <div className="mt-0.5 flex gap-0.5">
                              {pendingCount > 0 && <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white/70' : 'bg-amber-400'}`} />}
                              {confirmedCount > 0 && <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white/90' : 'bg-sky-400'}`} />}
                              {day.appointments.some(a => a.status === 'completed') && <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-green-400'}`} />}
                            </div>
                          )}
                          {hasApts && day.isCurrentMonth && (
                            <span className={`mt-auto text-[10px] font-medium ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                              {day.appointments.length}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Day detail sidebar */}
                <div className="rounded-2xl bg-white p-4 ring-1 ring-gray-100 sm:p-5">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {selectedDay ? (
                      <span className="capitalize">{formatDateFull(selectedDay.toISOString())}</span>
                    ) : 'Seleccioná un día'}
                  </h3>
                  {selectedDay && (
                    <div className="mt-4 space-y-2.5">
                      {(() => {
                        const dayApts = appointments
                          .filter(a => isSameDay(a.dateTime, selectedDay))
                          .sort((a, b) => new Date(a.dateTime ?? 0).getTime() - new Date(b.dateTime ?? 0).getTime());

                        if (dayApts.length === 0) {
                          return (
                            <div className="py-8 text-center">
                              <svg className="mx-auto h-10 w-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              <p className="mt-2 text-xs text-gray-400">Sin citas este día</p>
                            </div>
                          );
                        }

                        return dayApts.map(apt => {
                          const st = getStatus(apt.status);
                          return (
                            <div key={apt.id} className="rounded-xl border border-gray-100 p-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#4dbad9]/10 text-[10px] font-bold text-[#4dbad9]">
                                    {getInitials(apt.patientName)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{apt.patientName}</p>
                                    <p className="text-xs text-gray-400">{formatTime(apt.dateTime)} · {apt.durationMinutes}min</p>
                                  </div>
                                </div>
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${st.bg} ${st.text}`}>
                                  <span className={`h-1 w-1 rounded-full ${st.dot}`} />
                                  {st.label}
                                </span>
                              </div>
                              {apt.reason && <p className="mt-2 text-xs text-gray-500">{apt.reason}</p>}
                              <div className="mt-2">
                                <ActionButtons apt={apt} />
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* List View ─────────────────────────────────────── */}
          {view === 'list' && (
            <div className="mt-6">
              {/* Search + filters */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                  <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por paciente o motivo..."
                    className="w-full rounded-xl border-0 bg-white py-2.5 pl-10 pr-10 text-sm ring-1 ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-[#4dbad9]"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {filters.map(f => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      filter === f.key
                        ? 'bg-[#4dbad9] text-white shadow-sm'
                        : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {f.label}
                    <span className={`ml-1.5 ${filter === f.key ? 'text-white/60' : 'text-gray-400'}`}>{counts[f.key]}</span>
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
                    <svg className="h-12 w-12 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <p className="mt-3 text-sm font-medium text-gray-500">No se encontraron citas</p>
                    <p className="text-xs text-gray-400">Intenta cambiar los filtros</p>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden lg:block rounded-2xl bg-white ring-1 ring-gray-100 overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50/50">
                            <th className="py-3 pl-5 pr-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Paciente</th>
                            <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Fecha</th>
                            <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Hora</th>
                            <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Motivo</th>
                            <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Estado</th>
                            <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {paginated.map(apt => {
                            const st = getStatus(apt.status);
                            return (
                              <tr key={apt.id} className="transition hover:bg-gray-50/70">
                                <td className="py-3 pl-5 pr-3">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#4dbad9]/10 text-xs font-bold text-[#4dbad9]">
                                      {getInitials(apt.patientName)}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="truncate font-medium text-gray-900">{apt.patientName}</p>
                                      {apt.patientPhone && <p className="truncate text-xs text-gray-400">{apt.patientPhone}</p>}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-gray-700">
                                  <div className="flex items-center gap-1.5">
                                    {isToday(apt.dateTime) && <span className="rounded bg-[#4dbad9]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#4dbad9]">HOY</span>}
                                    {formatDateShort(apt.dateTime)}
                                  </div>
                                </td>
                                <td className="px-3 py-3 font-medium text-gray-900">{formatTime(apt.dateTime)}</td>
                                <td className="px-3 py-3 text-gray-500 max-w-[200px]">
                                  <p className="truncate">{apt.reason || '—'}</p>
                                </td>
                                <td className="px-3 py-3">
                                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${st.bg} ${st.text}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                                    {st.label}
                                  </span>
                                </td>
                                <td className="px-3 py-3">
                                  <ActionButtons apt={apt} />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="lg:hidden space-y-3">
                      {paginated.map(apt => {
                        const st = getStatus(apt.status);
                        return (
                          <div key={apt.id} className="rounded-2xl bg-white p-4 ring-1 ring-gray-100">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#4dbad9]/10 text-sm font-bold text-[#4dbad9]">
                                  {getInitials(apt.patientName)}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{apt.patientName}</p>
                                  <p className="text-xs text-gray-400">
                                    {formatDateShort(apt.dateTime)} · {formatTime(apt.dateTime)}
                                    {isToday(apt.dateTime) && <span className="ml-1.5 rounded bg-[#4dbad9]/10 px-1 py-0.5 text-[10px] font-semibold text-[#4dbad9]">HOY</span>}
                                  </p>
                                </div>
                              </div>
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${st.bg} ${st.text}`}>
                                <span className={`h-1 w-1 rounded-full ${st.dot}`} />
                                {st.label}
                              </span>
                            </div>
                            {apt.reason && <p className="mt-2 text-xs text-gray-500">{apt.reason}</p>}
                            <div className="mt-3">
                              <ActionButtons apt={apt} />
                            </div>
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
                              className={`h-8 w-8 rounded-lg text-sm font-medium transition ${n === safePage ? 'bg-[#4dbad9] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
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
        </div>
      </SubscriptionGuard>
    </AdminLayout>
  );
}
