'use client';

import AdminLayout from '@/components/layout/AdminLayout';
import SubscriptionGuard from '@/components/guards/SubscriptionGuard';
import { useAuth } from '@/components/providers/AuthProvider';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import toast from 'react-hot-toast';

// ── Types ────────────────────────────────────────────────────

interface Appointment {
  id: string;
  appointmentId: string;
  patientId: string;
  patientUserId: string;
  doctorId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorPhone: string;
  dateTime: string | null;
  durationMinutes: number;
  type: string;
  reason: string;
  urgency: string;
  notes: string;
  status: string;
  requestedAt: string | null;
  approvedAt: string | null;
  _source: string;
}

interface VideoRoom {
  roomName: string;
  roomUrl: string;
  status: string;
  scheduledAt: string | null;
  expiresAt: string | null;
  source: string;
}

interface PrescriptionDoc {
  id: string;
  diagnosis: string;
  medications: { name: string; dosage: string; frequency: string; duration?: string; instructions?: string }[];
  notes: string;
  doctorName: string;
  fileUrl?: string | null;
  createdAt: string | null;
  _source: string;
}

interface AppointmentDocument {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  downloadURL: string;
  uploadedBy: string;
  uploadedByRole: string;
  uploadedAt: string | null;
  _source: string;
}

type TabKey = 'info' | 'documents' | 'prescriptions';

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

function fmt(iso: string | null, opts: Intl.DateTimeFormatOptions) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', opts);
}

function fmtTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

const TYPE_LABELS: Record<string, string> = {
  consultation: 'Consulta',
  follow_up: 'Seguimiento',
  emergency: 'Emergencia',
  online: 'Online',
};

const URGENCY_LABELS: Record<string, { label: string; cls: string }> = {
  low:    { label: 'Baja',    cls: 'bg-green-100 text-green-700' },
  normal: { label: 'Normal',  cls: 'bg-gray-100 text-gray-600' },
  high:   { label: 'Alta',    cls: 'bg-amber-100 text-amber-700' },
  urgent: { label: 'Urgente', cls: 'bg-red-100 text-red-700' },
};

// ── Component ────────────────────────────────────────────────

export default function AdminAppointmentDetailPage() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [apt, setApt] = useState<Appointment | null>(null);
  const [videoRoom, setVideoRoom] = useState<VideoRoom | null>(null);
  const [prescriptions, setPrescriptions] = useState<PrescriptionDoc[]>([]);
  const [documents, setDocuments] = useState<AppointmentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [docsLoading, setDocsLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('info');
  const [updating, setUpdating] = useState(false);

  // Prescription form
  const [showRxForm, setShowRxForm] = useState(false);
  const [rxDiagnosis, setRxDiagnosis] = useState('');
  const [rxNotes, setRxNotes] = useState('');
  const [rxMeds, setRxMeds] = useState([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  const [rxSaving, setRxSaving] = useState(false);

  // ── Load appointment ───────────────────────────────────────
  const loadApt = useCallback(async () => {
    if (!user || !id) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/appointments/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { router.push('/admin/schedule'); return; }
      const data = await res.json();
      setApt(data.appointment);
      setVideoRoom(data.videoRoom ?? null);
    } catch { router.push('/admin/schedule'); } finally { setLoading(false); }
  }, [user, id, router]);

  const loadDocs = useCallback(async () => {
    if (!user || !id) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/appointments/${id}/documents`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setPrescriptions(data.prescriptions ?? []);
        setDocuments(data.documents ?? []);
      }
    } catch { /* ignore */ } finally { setDocsLoading(false); }
  }, [user, id]);

  useEffect(() => { loadApt(); }, [loadApt]);
  useEffect(() => { loadDocs(); }, [loadDocs]);

  // ── Status update ──────────────────────────────────────────
  async function updateStatus(action: string) {
    if (!user || !id) return;
    setUpdating(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        toast.success(action === 'confirm' ? 'Cita confirmada' : action === 'complete' ? 'Cita completada' : action === 'cancel' ? 'Cita cancelada' : 'Estado actualizado');
        await loadApt();
      } else { toast.error('Error al actualizar estado'); }
    } catch { toast.error('Error al actualizar'); } finally { setUpdating(false); }
  }

  // ── Create video room ─────────────────────────────────────
  async function createVideoRoom() {
    if (!user || !apt) return;
    setUpdating(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/video/create-room', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: apt.id,
          doctorName: apt.doctorName,
          patientId: apt.patientId,
          patientName: apt.patientName,
          scheduledAt: apt.dateTime,
        }),
      });
      if (res.ok) {
        toast.success('Sala creada');
        await loadApt();
      } else {
        const err = await res.json().catch(() => null);
        toast.error(err?.error ?? 'Error al crear sala');
      }
    } catch { toast.error('Error al crear sala'); } finally { setUpdating(false); }
  }

  // ── Recreate video room (delete old + create new) ─────────
  async function recreateVideoRoom() {
    if (!user || !apt) return;
    setUpdating(true);
    try {
      const token = await user.getIdToken();
      // Delete old room
      await fetch(`/api/video/rooms/${encodeURIComponent(apt.id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      // Create new room
      const res = await fetch('/api/video/create-room', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: apt.id,
          doctorName: apt.doctorName,
          patientId: apt.patientId,
          patientName: apt.patientName,
          scheduledAt: apt.dateTime,
        }),
      });
      if (res.ok) {
        toast.success('Sala recreada correctamente');
        await loadApt();
      } else {
        const err = await res.json().catch(() => null);
        toast.error(err?.error ?? 'Error al recrear sala');
      }
    } catch { toast.error('Error al recrear sala'); } finally { setUpdating(false); }
  }

  // ── Create prescription ────────────────────────────────────
  async function createPrescription() {
    if (!user || !apt) return;
    const validMeds = rxMeds.filter(m => m.name.trim());
    if (validMeds.length === 0) { toast.error('Agregá al menos un medicamento'); return; }
    if (!rxDiagnosis.trim()) { toast.error('El diagnóstico es obligatorio'); return; }

    setRxSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: apt.id,
          patientId: apt.patientId,
          medications: validMeds,
          diagnosis: rxDiagnosis.trim(),
          notes: rxNotes.trim(),
        }),
      });
      if (res.ok) {
        toast.success('Receta creada');
        setShowRxForm(false);
        setRxDiagnosis(''); setRxNotes(''); setRxMeds([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
        await loadDocs();
      } else { toast.error('Error al crear receta'); }
    } catch { toast.error('Error al crear receta'); } finally { setRxSaving(false); }
  }

  function addMed() { setRxMeds(m => [...m, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]); }
  function removeMed(i: number) { setRxMeds(m => m.filter((_, idx) => idx !== i)); }
  function updateMed(i: number, field: string, value: string) {
    setRxMeds(m => m.map((med, idx) => idx === i ? { ...med, [field]: value } : med));
  }

  // ── Loading / error ────────────────────────────────────────
  if (loading) {
    return (
      <AdminLayout>
        <SubscriptionGuard feature="appointments">
          <div className="space-y-4">
            <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-100" />
            <div className="h-52 animate-pulse rounded-2xl bg-gray-100" />
            <div className="h-96 animate-pulse rounded-2xl bg-gray-100" />
          </div>
        </SubscriptionGuard>
      </AdminLayout>
    );
  }

  if (!apt) return null;

  const st = getStatus(apt.status);
  const isTerminal = apt.status === 'completed' || apt.status === 'cancelled' || apt.status === 'no_show';
  const urgencyInfo = URGENCY_LABELS[apt.urgency] ?? URGENCY_LABELS.normal;

  const tabs: { key: TabKey; label: string; count?: number; icon: ReactNode }[] = [
    { key: 'info', label: 'Información', icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { key: 'documents', label: 'Documentos', count: documents.length, icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { key: 'prescriptions', label: 'Recetas', count: prescriptions.length, icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25" /></svg> },
  ];

  return (
    <AdminLayout>
      <SubscriptionGuard feature="appointments">
        <div>
          {/* Back link */}
          <Link href="/admin/schedule" className="group mb-4 inline-flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-[#4dbad9]">
            <svg className="h-4 w-4 transition group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Volver a la agenda
          </Link>

          {/* ── Hero Banner ─────────────────────────────── */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#4dbad9] to-[#2d9ab7]">
            {/* Background pattern */}
            <div className="pointer-events-none absolute inset-0 opacity-10">
              <svg className="absolute -right-12 -top-12 h-64 w-64 text-white" fill="currentColor" viewBox="0 0 200 200"><circle cx="100" cy="100" r="100" /></svg>
              <svg className="absolute -bottom-8 -left-8 h-48 w-48 text-white" fill="currentColor" viewBox="0 0 200 200"><circle cx="100" cy="100" r="100" /></svg>
            </div>
            <div className="relative px-5 py-6 sm:px-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 text-xl font-bold text-white backdrop-blur-sm">
                    {getInitials(apt.patientName)}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white sm:text-2xl">{apt.patientName}</h1>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/80">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span className="capitalize">{fmt(apt.dateTime, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                      <span className="text-white/40">|</span>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span className="font-semibold text-white">{fmtTime(apt.dateTime)}</span>
                      <span className="text-white/40">|</span>
                      <span>{apt.durationMinutes} min</span>
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                        <span className={`h-2 w-2 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80">
                        {TYPE_LABELS[apt.type] ?? apt.type}
                      </span>
                      {apt.urgency !== 'normal' && (
                        <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80">
                          {urgencyInfo.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Contact quick actions */}
                <div className="flex items-center gap-2">
                  {apt.patientPhone && (
                    <>
                      <a href={`tel:${apt.patientPhone}`} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white transition hover:bg-white/25 backdrop-blur-sm" title="Llamar">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      </a>
                      <a href={`https://wa.me/${apt.patientPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white transition hover:bg-white/25 backdrop-blur-sm" title="WhatsApp">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.11.546 4.093 1.505 5.816L.057 23.88l6.232-1.412A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.82a9.78 9.78 0 01-5.29-1.544l-.38-.225-3.93.89.935-3.825-.248-.394A9.78 9.78 0 012.18 12c0-5.422 4.398-9.82 9.82-9.82 5.422 0 9.82 4.398 9.82 9.82 0 5.422-4.398 9.82-9.82 9.82z" /></svg>
                      </a>
                    </>
                  )}
                  {apt.patientEmail && (
                    <a href={`mailto:${apt.patientEmail}`} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white transition hover:bg-white/25 backdrop-blur-sm" title="Email">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Quick Action Cards ─────────────────────── */}
          {!isTerminal && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* Confirm / Video */}
              {apt.status === 'pending' ? (
                <button
                  onClick={() => updateStatus('confirm')}
                  disabled={updating}
                  className="group flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-gray-100 transition hover:ring-[#4dbad9]/30 hover:shadow-md disabled:opacity-50"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4dbad9]/10 transition group-hover:bg-[#4dbad9]/20">
                    <svg className="h-5 w-5 text-[#4dbad9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">Confirmar cita</p>
                    <p className="text-xs text-gray-400">Aprobar el turno</p>
                  </div>
                </button>
              ) : (apt.status === 'confirmed' || apt.status === 'scheduled' || apt.status === 'in_progress') ? (
                videoRoom ? (
                  <div className="flex gap-3 sm:contents">
                    <Link
                      href={`/video/join/${videoRoom.roomName}`}
                      className="group flex flex-1 items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-gray-100 transition hover:ring-green-200 hover:shadow-md"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 transition group-hover:bg-green-200">
                        <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-green-700">Entrar a la cita</p>
                        <p className="text-xs text-gray-400">
                          {videoRoom.expiresAt
                            ? `Expira ${fmt(videoRoom.expiresAt, { hour: '2-digit', minute: '2-digit' })}`
                            : 'Sala de video activa'}
                        </p>
                      </div>
                    </Link>
                    <button
                      onClick={recreateVideoRoom}
                      disabled={updating}
                      className="group flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-gray-100 transition hover:ring-orange-200 hover:shadow-md disabled:opacity-50"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 transition group-hover:bg-orange-200">
                        <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-orange-700">Recrear sala</p>
                        <p className="text-xs text-gray-400">Borrar y crear nueva</p>
                      </div>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={createVideoRoom}
                    disabled={updating}
                    className="group flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-gray-100 transition hover:ring-green-200 hover:shadow-md disabled:opacity-50"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 transition group-hover:bg-green-200">
                      <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-green-700">Crear sala de video</p>
                      <p className="text-xs text-gray-400">Iniciar videoconsulta</p>
                    </div>
                  </button>
                )
              ) : null}

              {/* Complete visit */}
              {(apt.status === 'confirmed' || apt.status === 'scheduled' || apt.status === 'in_progress') && (
                <button
                  onClick={() => updateStatus('complete')}
                  disabled={updating}
                  className="group flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-gray-100 transition hover:ring-amber-200 hover:shadow-md disabled:opacity-50"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 transition group-hover:bg-amber-200">
                    <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">Completar visita</p>
                    <p className="text-xs text-gray-400">Marcar como finalizada</p>
                  </div>
                </button>
              )}

              {/* Cancel */}
              <button
                onClick={() => updateStatus('cancel')}
                disabled={updating}
                className="group flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-gray-100 transition hover:ring-red-200 hover:shadow-md disabled:opacity-50"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 transition group-hover:bg-red-100">
                  <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">Cancelar cita</p>
                  <p className="text-xs text-gray-400">Rechazar turno</p>
                </div>
              </button>
            </div>
          )}

          {/* ── Tabs ────────────────────────────────────── */}
          <div className="mt-6 flex gap-1.5 overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  tab === t.key
                    ? 'bg-[#4dbad9] text-white shadow-sm'
                    : 'bg-white text-gray-500 ring-1 ring-gray-100 hover:bg-gray-50'
                }`}
              >
                {t.icon}
                {t.label}
                {t.count !== undefined && t.count > 0 && (
                  <span className={`rounded-full px-1.5 text-[10px] font-bold ${
                    tab === t.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>{t.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* ── Tab Content ──────────────────────────────── */}
          <div className="mt-5">
            {/* ── Info tab ────────────────────────────────── */}
            {tab === 'info' && (
              <div className="grid gap-5 lg:grid-cols-5">
                {/* Appointment details - wider */}
                <div className="lg:col-span-3 space-y-5">
                  <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-100">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <svg className="h-4 w-4 text-[#4dbad9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Detalles de la cita
                    </h3>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl bg-gray-50 p-3.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Fecha y hora</p>
                        <p className="mt-1 text-sm font-medium capitalize text-gray-900">{fmt(apt.dateTime, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        <p className="text-sm font-bold text-[#4dbad9]">{fmtTime(apt.dateTime)}</p>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-3.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Duración y tipo</p>
                        <p className="mt-1 text-sm font-medium text-gray-900">{apt.durationMinutes} minutos</p>
                        <p className="text-sm text-gray-600">{TYPE_LABELS[apt.type] ?? apt.type}</p>
                      </div>
                    </div>
                    {(apt.reason || apt.notes) && (
                      <div className="mt-4 space-y-3">
                        {apt.reason && (
                          <div className="rounded-xl bg-gray-50 p-3.5">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Motivo de consulta</p>
                            <p className="mt-1 text-sm text-gray-900">{apt.reason}</p>
                          </div>
                        )}
                        {apt.notes && (
                          <div className="rounded-xl bg-gray-50 p-3.5">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Notas</p>
                            <p className="mt-1 text-sm text-gray-900">{apt.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {apt.requestedAt && (
                      <p className="mt-4 text-xs text-gray-400">
                        Solicitada el {fmt(apt.requestedAt, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>

                  {/* Video room card */}
                  {videoRoom && (
                    <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 p-5 ring-1 ring-green-100">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-green-100">
                        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-green-800">Sala de videoconsulta activa</p>
                        <p className="text-xs text-green-600">Sala: {videoRoom.roomName}</p>
                        {videoRoom.expiresAt && (
                          <p className="mt-0.5 text-xs text-amber-600">
                            Expira: {fmt(videoRoom.expiresAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                      <Link href={`/video/join/${videoRoom.roomName}`} className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700">
                        Entrar
                      </Link>
                    </div>
                  )}
                </div>

                {/* Patient sidebar */}
                <div className="lg:col-span-2 space-y-5">
                  <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-100">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <svg className="h-4 w-4 text-[#4dbad9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      Paciente
                    </h3>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#4dbad9]/10 text-sm font-bold text-[#4dbad9]">
                        {getInitials(apt.patientName)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{apt.patientName}</p>
                        {apt.patientEmail && <p className="text-xs text-gray-400">{apt.patientEmail}</p>}
                      </div>
                    </div>

                    {apt.patientPhone && (
                      <div className="mt-4 flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        <span className="text-sm text-gray-700">{apt.patientPhone}</span>
                      </div>
                    )}

                    {/* Quick contact actions */}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {apt.patientPhone && (
                        <a href={`https://wa.me/${apt.patientPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 rounded-xl bg-green-50 py-2.5 text-xs font-medium text-green-700 transition hover:bg-green-100">
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
                          WhatsApp
                        </a>
                      )}
                      {apt.patientPhone && (
                        <a href={`tel:${apt.patientPhone}`}
                          className="flex items-center justify-center gap-2 rounded-xl bg-blue-50 py-2.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                          Llamar
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Status timeline */}
                  <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-100">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <svg className="h-4 w-4 text-[#4dbad9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Estado
                    </h3>
                    <div className="mt-4 space-y-3">
                      {[
                        { status: 'pending', label: 'Solicitud recibida', date: apt.requestedAt },
                        { status: 'confirmed', label: 'Confirmada', date: apt.approvedAt },
                        ...(apt.status === 'completed' ? [{ status: 'completed' as const, label: 'Completada', date: null }] : []),
                        ...(apt.status === 'cancelled' ? [{ status: 'cancelled' as const, label: 'Cancelada', date: null }] : []),
                      ].map((step, i) => {
                        const stepSt = getStatus(step.status);
                        const isActive = step.status === apt.status;
                        const isPast = ['pending', 'confirmed', 'scheduled'].indexOf(step.status) <= ['pending', 'confirmed', 'scheduled'].indexOf(apt.status);
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                              isActive ? `${stepSt.bg}` : isPast ? 'bg-gray-100' : 'bg-gray-50'
                            }`}>
                              {isPast || isActive ? (
                                <svg className={`h-4 w-4 ${isActive ? stepSt.text : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                              ) : (
                                <span className="h-2 w-2 rounded-full bg-gray-200" />
                              )}
                            </div>
                            <div>
                              <p className={`text-sm ${isActive ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>{step.label}</p>
                              {step.date && <p className="text-xs text-gray-400">{fmt(step.date, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Documents tab ───────────────────────────── */}
            {tab === 'documents' && (
              <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <svg className="h-4 w-4 text-[#4dbad9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Documentos de la cita
                  </h3>
                </div>

                {docsLoading ? (
                  <div className="mt-4 space-y-2">
                    {[1, 2].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-50" />)}
                  </div>
                ) : documents.length === 0 ? (
                  <div className="mt-6 py-10 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
                      <svg className="h-7 w-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                    </div>
                    <p className="mt-3 text-sm font-medium text-gray-500">No hay documentos cargados</p>
                    <p className="text-xs text-gray-400">Los documentos subidos por vos o el paciente aparecerán acá</p>
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {documents.map(doc => (
                      <div key={doc.id} className="group flex items-center gap-3 rounded-xl border border-gray-100 p-3.5 transition hover:border-gray-200 hover:shadow-sm">
                        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                          doc.fileType?.includes('pdf') ? 'bg-red-50' :
                          doc.fileType?.includes('image') ? 'bg-green-50' : 'bg-blue-50'
                        }`}>
                          {doc.fileType?.includes('pdf') ? (
                            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
                          ) : doc.fileType?.includes('image') ? (
                            <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          ) : (
                            <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">{doc.title}</p>
                          <p className="flex items-center gap-1.5 text-xs text-gray-400">
                            {fmtBytes(doc.fileSize)}
                            {doc.uploadedByRole === 'patient' && <span className="rounded bg-purple-50 px-1 py-0.5 text-[10px] font-medium text-purple-600">Paciente</span>}
                            {doc.uploadedAt && <span>{fmt(doc.uploadedAt, { day: 'numeric', month: 'short' })}</span>}
                          </p>
                        </div>
                        {doc.downloadURL && (
                          <a href={doc.downloadURL} target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 text-gray-300 transition group-hover:text-[#4dbad9]" title="Descargar">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Prescriptions tab ───────────────────────── */}
            {tab === 'prescriptions' && (
              <div className="space-y-5">
                <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <svg className="h-4 w-4 text-[#4dbad9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25" /></svg>
                      Recetas médicas
                    </h3>
                    {!showRxForm && (
                      <button
                        onClick={() => setShowRxForm(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#4dbad9] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#3da8c7]"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        Crear receta
                      </button>
                    )}
                  </div>

                  {docsLoading ? (
                    <div className="mt-4 space-y-2">
                      {[1, 2].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-50" />)}
                    </div>
                  ) : prescriptions.length === 0 && !showRxForm ? (
                    <div className="mt-6 py-10 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
                        <svg className="h-7 w-7 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25" /></svg>
                      </div>
                      <p className="mt-3 text-sm font-medium text-gray-500">No hay recetas para esta cita</p>
                      <button onClick={() => setShowRxForm(true)} className="mt-2 text-sm font-medium text-[#4dbad9] hover:underline">
                        Crear la primera receta
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {prescriptions.map(rx => (
                        <div key={rx.id} className="rounded-2xl border border-green-100 bg-gradient-to-br from-green-50/80 to-emerald-50/50 p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25" /></svg>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-green-800">Receta Médica</p>
                                <p className="text-xs text-green-600">
                                  {rx.doctorName}
                                  {rx.createdAt && <span className="ml-1.5 text-green-500">· {fmt(rx.createdAt, { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
                                </p>
                              </div>
                            </div>
                            {rx._source === 'v2' ? (
                              <button
                                onClick={async () => {
                                  try {
                                    if (!user) return;
                                    const token = await user.getIdToken();
                                    const res = await fetch(`/api/prescriptions/${rx.id}/pdf`, {
                                      headers: { Authorization: `Bearer ${token}` },
                                    });
                                    if (!res.ok) throw new Error('Error al generar PDF');
                                    const blob = await res.blob();
                                    const url = URL.createObjectURL(blob);
                                    window.open(url, '_blank');
                                  } catch { toast.error('Error al generar PDF'); }
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-200"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                PDF
                              </button>
                            ) : rx.fileUrl ? (
                              <a href={rx.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-200">
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                PDF
                              </a>
                            ) : null}
                          </div>

                          {rx.diagnosis && (
                            <div className="mt-4 rounded-xl bg-white/70 p-3.5">
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-green-600">Diagnóstico</p>
                              <p className="mt-1 text-sm text-gray-800">{rx.diagnosis}</p>
                            </div>
                          )}

                          {rx.medications.length > 0 && (
                            <div className="mt-3">
                              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-green-600">Medicamentos ({rx.medications.length})</p>
                              <div className="space-y-2">
                                {rx.medications.map((m, i) => (
                                  <div key={i} className="flex items-start gap-3 rounded-xl bg-white/70 p-3">
                                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-[10px] font-bold text-green-700">{i + 1}</div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">{m.name}</p>
                                      <p className="text-xs text-gray-500">{m.dosage} · {m.frequency}{m.duration ? ` · ${m.duration}` : ''}</p>
                                      {m.instructions && <p className="mt-0.5 text-xs text-gray-400 italic">{m.instructions}</p>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {rx.notes && (
                            <div className="mt-3 rounded-xl bg-white/70 p-3.5">
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-green-600">Notas</p>
                              <p className="mt-1 text-sm text-gray-700">{rx.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Prescription form */}
                {showRxForm && (
                  <div className="rounded-2xl bg-white p-5 ring-1 ring-[#4dbad9]/20">
                    <div className="flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#4dbad9]/10">
                          <svg className="h-4 w-4 text-[#4dbad9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        </div>
                        Nueva receta
                      </h3>
                      <button onClick={() => setShowRxForm(false)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>

                    <div className="mt-5 space-y-5">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">Diagnóstico *</label>
                        <textarea
                          value={rxDiagnosis}
                          onChange={e => setRxDiagnosis(e.target.value)}
                          rows={2}
                          className="mt-1.5 w-full rounded-xl border-0 bg-gray-50 px-3.5 py-3 text-sm ring-1 ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-[#4dbad9]"
                          placeholder="Diagnóstico del paciente..."
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">Medicamentos *</label>
                          <button onClick={addMed} className="inline-flex items-center gap-1 text-xs font-medium text-[#4dbad9] hover:underline">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                            Agregar
                          </button>
                        </div>
                        <div className="mt-2 space-y-3">
                          {rxMeds.map((m, i) => (
                            <div key={i} className="rounded-xl bg-gray-50 p-4">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#4dbad9]/10 text-[10px] font-bold text-[#4dbad9]">{i + 1}</span>
                                  Medicamento
                                </span>
                                {rxMeds.length > 1 && (
                                  <button onClick={() => removeMed(i)} className="text-xs text-red-400 hover:text-red-600">Eliminar</button>
                                )}
                              </div>
                              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                <input value={m.name} onChange={e => updateMed(i, 'name', e.target.value)} placeholder="Nombre *"
                                  className="rounded-lg border-0 bg-white px-3 py-2.5 text-sm ring-1 ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-[#4dbad9]" />
                                <input value={m.dosage} onChange={e => updateMed(i, 'dosage', e.target.value)} placeholder="Dosis *"
                                  className="rounded-lg border-0 bg-white px-3 py-2.5 text-sm ring-1 ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-[#4dbad9]" />
                                <input value={m.frequency} onChange={e => updateMed(i, 'frequency', e.target.value)} placeholder="Frecuencia *"
                                  className="rounded-lg border-0 bg-white px-3 py-2.5 text-sm ring-1 ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-[#4dbad9]" />
                              </div>
                              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                <input value={m.duration} onChange={e => updateMed(i, 'duration', e.target.value)} placeholder="Duración"
                                  className="rounded-lg border-0 bg-white px-3 py-2.5 text-sm ring-1 ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-[#4dbad9]" />
                                <input value={m.instructions} onChange={e => updateMed(i, 'instructions', e.target.value)} placeholder="Instrucciones"
                                  className="rounded-lg border-0 bg-white px-3 py-2.5 text-sm ring-1 ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-[#4dbad9]" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">Notas adicionales</label>
                        <textarea
                          value={rxNotes}
                          onChange={e => setRxNotes(e.target.value)}
                          rows={2}
                          className="mt-1.5 w-full rounded-xl border-0 bg-gray-50 px-3.5 py-3 text-sm ring-1 ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-[#4dbad9]"
                          placeholder="Notas opcionales..."
                        />
                      </div>

                      <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                        <button onClick={() => setShowRxForm(false)} className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-200">
                          Cancelar
                        </button>
                        <button
                          onClick={createPrescription}
                          disabled={rxSaving}
                          className="rounded-xl bg-[#4dbad9] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#3da8c7] disabled:opacity-50"
                        >
                          {rxSaving ? 'Guardando...' : 'Crear receta'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </SubscriptionGuard>
    </AdminLayout>
  );
}
