'use client';

import PatientLayout from '@/components/layout/PatientLayout';
import { useAuth } from '@/components/providers/AuthProvider';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { app } from '@/src/infrastructure/config/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Appointment {
  id: string;
  appointmentId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorPhone?: string;
  dateTime: string | null;
  status: string;
  type: string;
  reason?: string;
  notes?: string;
  isForFamilyMember?: boolean;
  familyMemberRelationship?: string;
  _source?: 'v2' | 'legacy';
}

interface VideoRoom {
  roomName: string;
  roomUrl?: string;
  status: string;
  scheduledAt?: string;
  expiresAt?: string;
  doctorJoined?: boolean;
  source?: string;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface Prescription {
  id: string;
  diagnosis: string;
  medications: Medication[];
  notes?: string;
  doctorName?: string;
  fileUrl?: string;
  createdAt?: string;
}

interface AppointmentDocument {
  id: string;
  title: string;
  fileName: string;
  fileSize?: number;
  downloadURL: string;
  uploadedBy?: string;
  uploadedByRole?: string;
  uploadedAt?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; cls: string; icon: string }> = {
  pending:     { label: 'Pendiente',    cls: 'bg-[var(--color-warning-light)] text-[var(--color-warning)]',  icon: '⏳' },
  confirmed:   { label: 'Confirmada',   cls: 'bg-[var(--color-success-light)] text-[var(--color-success)]',  icon: '✓'  },
  scheduled:   { label: 'Programada',   cls: 'bg-[var(--color-success-light)] text-[var(--color-success)]',  icon: '📅' },
  rescheduled: { label: 'Reprogramada', cls: 'bg-[var(--color-info-light)] text-[var(--color-info)]',        icon: '🔄' },
  in_progress: { label: 'En progreso',  cls: 'bg-[var(--color-primary-light)] text-[var(--color-primary)]',  icon: '▶'  },
  completed:   { label: 'Completada',   cls: 'bg-[var(--color-info-light)] text-[var(--color-info)]',        icon: '✓'  },
  cancelled:   { label: 'Cancelada',    cls: 'bg-[var(--color-error-light)] text-[var(--color-error)]',      icon: '✕'  },
  rejected:    { label: 'Rechazada',    cls: 'bg-[var(--color-error-light)] text-[var(--color-error)]',      icon: '✕'  },
};

const TYPE_LABELS: Record<string, string> = {
  consultation: 'Consulta',
  followup: 'Seguimiento',
  specialist: 'Especialista',
  checkup: 'Control',
  procedure: 'Procedimiento',
  emergency: 'Urgencia',
  online: 'Online',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  consultation: <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47m0 0l-2.47 2.47m2.47-2.47l2.47 2.47m-2.47-2.47l-2.47-2.47" />,
  online:       <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />,
  followup:     <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />,
  emergency:    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />,
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
}

function formatShortDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function formatBytes(bytes: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getRelativeTime(iso: string | null): string | null {
  if (!iso) return null;
  const now = Date.now();
  const target = new Date(iso).getTime();
  const diff = target - now;
  const absDiff = Math.abs(diff);
  const mins = Math.floor(absDiff / 60000);
  const hours = Math.floor(absDiff / 3600000);
  const days = Math.floor(absDiff / 86400000);

  if (diff > 0) {
    if (mins < 60) return `en ${mins} min`;
    if (hours < 24) return `en ${hours}h`;
    if (days === 1) return 'mañana';
    if (days < 7) return `en ${days} días`;
    return `en ${days} días`;
  } else {
    if (mins < 60) return `hace ${mins} min`;
    if (hours < 24) return `hace ${hours}h`;
    if (days === 1) return 'ayer';
    return `hace ${days} días`;
  }
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'info' | 'documents' | 'video';

export default function PatientAppointmentDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [videoRoom, setVideoRoom] = useState<VideoRoom | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [documents, setDocuments] = useState<AppointmentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [docsLoading, setDocsLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('info');
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [expandedRx, setExpandedRx] = useState<string | null>(null);

  // Upload / delete state
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/appointments/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAppointment(data.appointment ?? null);
          setVideoRoom(data.videoRoom ?? null);
        } else {
          const err = await res.json().catch(() => ({}));
          setFetchError(
            res.status === 403
              ? 'No tenés permiso para ver esta cita.'
              : (err.error ?? 'Cita no encontrada.')
          );
        }
      } catch { setFetchError('Error de conexión.'); } finally { setLoading(false); }
    })();
  }, [user, id]);

  // Poll for video room while appointment is active and no room yet
  useEffect(() => {
    if (!user || !id || !appointment) return;
    const shouldPoll = ['confirmed', 'scheduled', 'in_progress'].includes(appointment.status);
    if (!shouldPoll) return;
    const interval = setInterval(async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/appointments/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.videoRoom) setVideoRoom(data.videoRoom);
          if (data.appointment?.status !== appointment.status) {
            setAppointment(data.appointment);
          }
        }
      } catch { /* ignore polling errors */ }
    }, 15000);
    return () => clearInterval(interval);
  }, [user, id, appointment]);

  const fetchDocs = useCallback(async () => {
    if (!user || !id || docsLoading) return;
    setDocsLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/appointments/${id}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPrescriptions(data.prescriptions ?? []);
        setDocuments(data.documents ?? []);
      }
    } catch { /* */ } finally { setDocsLoading(false); }
  }, [user, id, docsLoading]);

  useEffect(() => {
    if (tab === 'documents') fetchDocs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function handleCancel() {
    if (!user || !appointment) return;
    setCancelling(true);
    setConfirmCancel(false);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/appointments/${id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: appointment._source }),
      });
      if (res.ok) setAppointment((prev) => prev ? { ...prev, status: 'cancelled' } : prev);
    } catch { /* */ } finally { setCancelling(false); }
  }

  async function uploadDocument() {
    if (!user || !uploadFile) return;
    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      const storage = getStorage(app);
      const ext = uploadFile.name.split('.').pop() ?? 'bin';
      const storagePath = `appointments/${id}/documents/${Date.now()}_${uploadFile.name}`;
      const storageRef = ref(storage, storagePath);

      await new Promise<void>((resolve, reject) => {
        const task = uploadBytesResumable(storageRef, uploadFile, { contentType: uploadFile.type });
        task.on(
          'state_changed',
          (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
          reject,
          async () => {
            try {
              const downloadURL = await getDownloadURL(task.snapshot.ref);
              const token = await user.getIdToken();
              const res = await fetch(`/api/appointments/${id}/documents`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: uploadTitle.trim() || uploadFile.name,
                  fileName: uploadFile.name,
                  fileSize: uploadFile.size,
                  fileType: uploadFile.type,
                  downloadURL,
                  storagePath,
                }),
              });
              if (!res.ok) throw new Error('Error al guardar el documento');
              const saved = await res.json();
              setDocuments((prev) => [...prev, saved]);
              setShowUploadForm(false);
              setUploadFile(null);
              setUploadTitle('');
              if (fileInputRef.current) fileInputRef.current.value = '';
              resolve();
            } catch (e) { reject(e); }
          },
        );
      });
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Error al subir el archivo');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  async function deleteDocument(docId: string) {
    if (!user) return;
    setDeletingDocId(docId);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/appointments/${id}/documents/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
      }
    } catch { /* */ } finally {
      setDeletingDocId(null);
    }
  }

  // Auto-switch to video tab when room first appears
  const prevHadVideo = useRef(false);
  useEffect(() => {
    if (videoRoom && !prevHadVideo.current) {
      prevHadVideo.current = true;
      setTab('video');
    }
  }, [videoRoom]);

  const relative = useMemo(() => appointment?.dateTime ? getRelativeTime(appointment.dateTime) : null, [appointment?.dateTime]);
  const isFuture = useMemo(() => appointment?.dateTime ? new Date(appointment.dateTime).getTime() > Date.now() : false, [appointment?.dateTime]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <PatientLayout>
        <div className="space-y-4">
          <div className="h-5 w-28 animate-pulse rounded bg-[var(--color-surface-elevated)]" />
          <div className="h-56 animate-pulse rounded-2xl bg-[var(--color-surface-elevated)]" />
          <div className="flex gap-3">
            <div className="h-10 w-28 animate-pulse rounded-xl bg-[var(--color-surface-elevated)]" />
            <div className="h-10 w-28 animate-pulse rounded-xl bg-[var(--color-surface-elevated)]" />
          </div>
          <div className="h-64 animate-pulse rounded-2xl bg-[var(--color-surface-elevated)]" />
        </div>
      </PatientLayout>
    );
  }

  if (!appointment) {
    return (
      <PatientLayout>
        <div className="flex flex-col items-center justify-center rounded-2xl bg-[var(--color-surface)] p-14 text-center shadow-[var(--shadow-sm)] border border-[var(--color-border)]">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-surface-elevated)]">
            <svg className="h-8 w-8 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" />
            </svg>
          </div>
          <p className="mt-4 text-[var(--color-text-secondary)]">{fetchError ?? 'Cita no encontrada.'}</p>
          <button
            onClick={() => router.push('/paciente/appointments')}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Volver a mis citas
          </button>
        </div>
      </PatientLayout>
    );
  }

  const badge = STATUS_META[appointment.status] ?? STATUS_META.pending;
  const canCancel = ['pending', 'confirmed', 'scheduled', 'rescheduled'].includes(appointment.status);
  const hasVideo = !!videoRoom;
  const videoActive = videoRoom && ['scheduled', 'active', 'in_progress'].includes(videoRoom.status);
  const isCompleted = appointment.status === 'completed';
  const isCancelled = ['cancelled', 'rejected'].includes(appointment.status);
  const isOnlineType = appointment.type === 'online';
  const isActiveStatus = ['confirmed', 'scheduled', 'in_progress'].includes(appointment.status);
  const showVideoTab = hasVideo || (isOnlineType && isActiveStatus);

  const tabs: { id: Tab; label: string; icon: React.ReactNode; show: boolean; pulse?: boolean }[] = [
    {
      id: 'info', label: 'Información', show: true,
      icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>,
    },
    {
      id: 'documents', label: 'Documentos', show: true,
      icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
    },
    {
      id: 'video', label: 'Sala Online', show: showVideoTab, pulse: !!videoActive,
      icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>,
    },
  ];

  return (
    <PatientLayout>
      <div className="space-y-6">

        {/* Back */}
        <button
          onClick={() => router.push('/paciente/appointments')}
          className="group flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
        >
          <svg className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Mis citas
        </button>

        {/* ── Hero Header Card ── */}
        <div className={`relative overflow-hidden rounded-2xl border shadow-[var(--shadow-sm)] ${isCancelled ? 'bg-[var(--color-surface)] border-[var(--color-error)]/20' : 'bg-[var(--color-surface)] border-[var(--color-border)]'}`}>
          {/* Top accent bar */}
          <div className={`h-1 ${isCancelled ? 'bg-[var(--color-error)]' : isCompleted ? 'bg-[var(--color-info)]' : 'bg-[var(--color-primary)]'}`} />

          <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
              {/* Doctor avatar */}
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] text-xl font-bold text-white shadow-md">
                {getInitials(appointment.doctorName || '?')}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{appointment.doctorName || '—'}</h1>
                    <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">{appointment.doctorSpecialty || '—'}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.cls}`}>
                      {badge.label}
                    </span>
                    {videoActive && (
                      <span className="flex items-center gap-1.5 rounded-full bg-[var(--color-primary-light)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
                        Sala activa
                      </span>
                    )}
                  </div>
                </div>

                {/* Date / time / type chips */}
                <div className="mt-4 flex flex-wrap gap-2.5">
                  <div className="flex items-center gap-2 rounded-xl bg-[var(--color-surface-elevated)] px-3 py-2 text-sm">
                    <svg className="h-4 w-4 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5" />
                    </svg>
                    <span className="text-[var(--color-text-primary)] font-medium">{formatDate(appointment.dateTime)}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-[var(--color-surface-elevated)] px-3 py-2 text-sm">
                    <svg className="h-4 w-4 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[var(--color-text-primary)] font-medium">{formatTime(appointment.dateTime)}</span>
                  </div>
                  {relative && (
                    <div className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium ${isFuture ? 'bg-[var(--color-success-light)] text-[var(--color-success)]' : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]'}`}>
                      {isFuture && <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />}
                      {relative}
                    </div>
                  )}
                </div>

                {/* Extra info row */}
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-[var(--color-text-secondary)]">
                  <span className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      {TYPE_ICONS[appointment.type] ?? <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47m0 0l-2.47 2.47m2.47-2.47l2.47 2.47m-2.47-2.47l-2.47-2.47" />}
                    </svg>
                    {TYPE_LABELS[appointment.type] ?? appointment.type}
                  </span>
                  {appointment.doctorPhone && (
                    <span className="flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 6.75z" />
                      </svg>
                      {appointment.doctorPhone}
                    </span>
                  )}
                  {appointment.isForFamilyMember && (
                    <span className="flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                      </svg>
                      Para familiar · {appointment.familyMemberRelationship}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 flex flex-wrap gap-3 border-t border-[var(--color-border)] pt-5">
              {videoActive && videoRoom && (
                <Link
                  href={`/video/join/${encodeURIComponent(videoRoom.roomName)}?fromPanel=true`}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-all hover:bg-[var(--color-primary-hover)] hover:shadow-md"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  Ingresar a la sala
                </Link>
              )}
              {canCancel && (
                <button
                  onClick={() => setConfirmCancel(true)}
                  disabled={cancelling}
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-error)]/30 px-5 py-2.5 text-sm font-medium text-[var(--color-error)] transition-colors hover:bg-[var(--color-error-light)] disabled:opacity-50"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {cancelling ? 'Cancelando…' : 'Cancelar cita'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Video Room Banner (prominent CTA when active) ── */}
        {videoActive && videoRoom && (
          <Link
            href={`/video/join/${encodeURIComponent(videoRoom.roomName)}?fromPanel=true`}
            className="group relative flex items-center gap-4 rounded-2xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] p-5 text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.01]"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold">Tu sala de video está lista</p>
              <p className="text-sm text-white/80">
                {videoRoom.expiresAt
                  ? `Expira a las ${formatTime(videoRoom.expiresAt)}`
                  : 'Tocá aquí para ingresar a la consulta online'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
              </span>
              <svg className="h-5 w-5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </Link>
        )}

        {/* ── Tabs ── */}
        <div className="flex gap-1 rounded-xl bg-[var(--color-surface-elevated)] p-1">
          {tabs.filter((t) => t.show).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
              {t.pulse && tab !== t.id && (
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-primary)] opacity-50" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab: Información ── */}
        {tab === 'info' && (
          <div className="space-y-4">
            {/* Reason + Notes — full width cards */}
            {appointment.reason && (
              <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5 shadow-[var(--shadow-sm)]">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-light)]">
                    <svg className="h-4.5 w-4.5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">Motivo de consulta</p>
                    <p className="mt-1.5 text-[var(--color-text-primary)] leading-relaxed">{appointment.reason}</p>
                  </div>
                </div>
              </div>
            )}

            {appointment.notes && (
              <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5 shadow-[var(--shadow-sm)]">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-info-light)]">
                    <svg className="h-4.5 w-4.5 text-[var(--color-info)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">Notas del médico</p>
                    <p className="mt-1.5 text-[var(--color-text-primary)] leading-relaxed">{appointment.notes}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Detail grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailCard
                icon={<path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082" />}
                label="Tipo de consulta"
                value={TYPE_LABELS[appointment.type] ?? appointment.type}
              />
              <DetailCard
                icon={<path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
                label="Estado"
                badge={<span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}>{badge.label}</span>}
              />
              <DetailCard
                icon={<path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5" />}
                label="Fecha"
                value={formatShortDate(appointment.dateTime)}
              />
              <DetailCard
                icon={<path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />}
                label="Hora"
                value={formatTime(appointment.dateTime)}
              />
              {appointment.appointmentId && (
                <DetailCard
                  icon={<path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" />}
                  label="Código de cita"
                  value={appointment.appointmentId}
                  mono
                />
              )}
              {appointment.doctorPhone && (
                <DetailCard
                  icon={<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 6.75z" />}
                  label="Teléfono del doctor"
                  value={appointment.doctorPhone}
                />
              )}
            </div>

            {/* Empty state when no reason/notes */}
            {!appointment.reason && !appointment.notes && (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-[var(--color-surface)] py-12 border border-[var(--color-border)] shadow-[var(--shadow-sm)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface-elevated)]">
                  <svg className="h-6 w-6 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                  </svg>
                </div>
                <p className="mt-3 text-sm text-[var(--color-text-muted)]">Sin información adicional para esta cita</p>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Documentos ── */}
        {tab === 'documents' && (
          <div className="space-y-6">
            {docsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-[var(--color-surface-elevated)]" />)}
              </div>
            ) : (
              <>
                {/* Prescriptions */}
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-success-light)]">
                      <svg className="h-3.5 w-3.5 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47m0 0l-2.47 2.47m2.47-2.47l2.47 2.47m-2.47-2.47l-2.47-2.47" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Recetas médicas</h3>
                    {prescriptions.length > 0 && (
                      <span className="rounded-full bg-[var(--color-success-light)] px-2 py-0.5 text-xs font-medium text-[var(--color-success)]">
                        {prescriptions.length}
                      </span>
                    )}
                  </div>
                  {prescriptions.length === 0 ? (
                    <div className="flex items-center gap-3 rounded-2xl bg-[var(--color-surface)] border border-dashed border-[var(--color-border)] p-6">
                      <svg className="h-8 w-8 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47m0 0l-2.47 2.47m2.47-2.47l2.47 2.47m-2.47-2.47l-2.47-2.47" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text-secondary)]">Sin recetas médicas</p>
                        <p className="text-xs text-[var(--color-text-muted)]">Las recetas aparecerán aquí cuando el médico las genere</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {prescriptions.map((rx) => (
                        <div key={rx.id} className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden shadow-[var(--shadow-sm)]">
                          <button
                            onClick={() => setExpandedRx(expandedRx === rx.id ? null : rx.id)}
                            className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-[var(--color-surface-elevated)]"
                          >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-success-light)] text-[var(--color-success)]">
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47m0 0l-2.47 2.47m2.47-2.47l2.47 2.47m-2.47-2.47l-2.47-2.47" />
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-[var(--color-text-primary)]">{rx.diagnosis || 'Receta médica'}</p>
                              <p className="text-xs text-[var(--color-text-muted)]">
                                {rx.medications.length} medicamento{rx.medications.length !== 1 ? 's' : ''}
                                {rx.doctorName && ` · Dr. ${rx.doctorName}`}
                                {rx.createdAt && ` · ${formatShortDate(rx.createdAt)}`}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              {rx.fileUrl && (
                                <a
                                  href={rx.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="rounded-lg bg-[var(--color-primary-light)] px-3 py-1.5 text-xs font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/20"
                                >
                                  PDF
                                </a>
                              )}
                              <svg className={`h-4 w-4 text-[var(--color-text-muted)] transition-transform ${expandedRx === rx.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </button>

                          {expandedRx === rx.id && (
                            <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-5 pb-5 pt-4">
                              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">Medicamentos</p>
                              <div className="space-y-2.5">
                                {rx.medications.map((med, i) => (
                                  <div key={i} className="rounded-xl bg-[var(--color-surface)] p-4 border border-[var(--color-border)]">
                                    <p className="font-medium text-[var(--color-text-primary)]">{med.name}</p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {med.dosage && (
                                        <span className="rounded-lg bg-[var(--color-primary-light)] px-2 py-0.5 text-xs font-medium text-[var(--color-primary)]">
                                          {med.dosage}
                                        </span>
                                      )}
                                      {med.frequency && (
                                        <span className="rounded-lg bg-[var(--color-info-light)] px-2 py-0.5 text-xs font-medium text-[var(--color-info)]">
                                          {med.frequency}
                                        </span>
                                      )}
                                      {med.duration && (
                                        <span className="rounded-lg bg-[var(--color-warning-light)] px-2 py-0.5 text-xs font-medium text-[var(--color-warning)]">
                                          {med.duration}
                                        </span>
                                      )}
                                    </div>
                                    {med.instructions && (
                                      <p className="mt-2 text-xs text-[var(--color-text-secondary)] leading-relaxed">{med.instructions}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                              {rx.notes && (
                                <div className="mt-3 rounded-xl bg-[var(--color-info-light)]/50 p-3 text-xs text-[var(--color-text-secondary)]">
                                  <span className="font-semibold">Notas:</span> {rx.notes}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Documents */}
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-info-light)]">
                      <svg className="h-3.5 w-3.5 text-[var(--color-info)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Documentos adjuntos</h3>
                    {documents.length > 0 && (
                      <span className="rounded-full bg-[var(--color-info-light)] px-2 py-0.5 text-xs font-medium text-[var(--color-info)]">
                        {documents.length}
                      </span>
                    )}
                    <button
                      onClick={() => { setShowUploadForm((v) => !v); setUploadError(null); }}
                      className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      Subir documento
                    </button>
                  </div>

                  {/* Upload form */}
                  {showUploadForm && (
                    <div className="mb-4 rounded-2xl border border-[var(--color-primary)]/30 bg-[var(--color-primary-light)]/40 p-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)]">Nuevo documento</p>
                      <div className="space-y-3">
                        {/* File picker */}
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[var(--color-primary)]/40 bg-white p-5 text-center transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)]"
                        >
                          <svg className="h-8 w-8 text-[var(--color-primary)]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                          </svg>
                          {uploadFile ? (
                            <div>
                              <p className="text-sm font-medium text-[var(--color-text-primary)]">{uploadFile.name}</p>
                              <p className="text-xs text-[var(--color-text-muted)]">{formatBytes(uploadFile.size)} · click para cambiar</p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Seleccionar archivo</p>
                              <p className="text-xs text-[var(--color-text-muted)]">PDF, imagen o documento · máx. 10 MB</p>
                            </div>
                          )}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) {
                                if (f.size > 10 * 1024 * 1024) { setUploadError('El archivo no puede superar los 10 MB'); return; }
                                setUploadFile(f);
                                setUploadError(null);
                                if (!uploadTitle) setUploadTitle(f.name.replace(/\.[^.]+$/, ''));
                              }
                            }}
                          />
                        </div>

                        {/* Title input */}
                        <input
                          type="text"
                          placeholder="Título del documento (opcional)"
                          value={uploadTitle}
                          onChange={(e) => setUploadTitle(e.target.value)}
                          className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                        />

                        {/* Progress bar */}
                        {uploading && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                              <span>Subiendo…</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-[var(--color-border)]">
                              <div
                                className="h-2 rounded-full bg-[var(--color-primary)] transition-all"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {uploadError && (
                          <p className="text-xs text-[var(--color-error)]">{uploadError}</p>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={uploadDocument}
                            disabled={!uploadFile || uploading}
                            className="flex-1 rounded-xl bg-[var(--color-primary)] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {uploading ? 'Subiendo…' : 'Subir documento'}
                          </button>
                          <button
                            onClick={() => { setShowUploadForm(false); setUploadFile(null); setUploadTitle(''); setUploadError(null); }}
                            disabled={uploading}
                            className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-elevated)] disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {documents.length === 0 && !showUploadForm ? (
                    <div
                      onClick={() => setShowUploadForm(true)}
                      className="flex cursor-pointer items-center gap-3 rounded-2xl bg-[var(--color-surface)] border border-dashed border-[var(--color-border)] p-6 transition-colors hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary-light)]/20"
                    >
                      <svg className="h-8 w-8 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text-secondary)]">Subí estudios o documentos</p>
                        <p className="text-xs text-[var(--color-text-muted)]">Podés adjuntar análisis, imágenes u otros archivos para tu médico</p>
                      </div>
                    </div>
                  ) : documents.length > 0 ? (
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <div key={doc.id} className="group flex items-center gap-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--color-surface-elevated)]">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-info-light)] text-[var(--color-info)]">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{doc.title}</p>
                            <p className="text-xs text-[var(--color-text-muted)]">
                              {doc.fileName}
                              {doc.fileSize ? ` · ${formatBytes(doc.fileSize)}` : ''}
                              {doc.uploadedAt && ` · ${formatShortDate(doc.uploadedAt)}`}
                              {doc.uploadedByRole === 'patient' && (
                                <span className="ml-1.5 rounded-full bg-[var(--color-primary-light)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-primary)]">Subido por vos</span>
                              )}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {doc.downloadURL && (
                              <a
                                href={doc.downloadURL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-primary-light)] px-3.5 py-2 text-xs font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/20"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                                Descargar
                              </a>
                            )}
                            {doc.uploadedByRole === 'patient' && (
                              <button
                                onClick={() => deleteDocument(doc.id)}
                                disabled={deletingDocId === doc.id}
                                title="Eliminar documento"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-error-light)] hover:text-[var(--color-error)] disabled:opacity-50"
                              >
                                {deletingDocId === doc.id ? (
                                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                  </svg>
                                ) : (
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                  </svg>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </section>
              </>
            )}
          </div>
        )}

        {/* ── Tab: Sala Online ── */}
        {tab === 'video' && (
          <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden shadow-[var(--shadow-sm)]">
            {videoRoom ? (
              <>
                {/* Video header */}
                <div className="bg-gradient-to-r from-[var(--color-primary)]/10 to-transparent p-5 sm:p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Consulta Online</h3>
                      <p className="text-sm text-[var(--color-text-secondary)]">Sala: {videoRoom.roomName}</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6 space-y-5">
                  {/* Room status info */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-[var(--color-surface-elevated)] p-4 border border-[var(--color-border)]">
                      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">Estado de la sala</p>
                      <p className="mt-1.5 font-medium text-[var(--color-text-primary)] capitalize">{videoRoom.status}</p>
                    </div>
                    {videoRoom.expiresAt && (
                      <div className="rounded-xl bg-[var(--color-surface-elevated)] p-4 border border-[var(--color-border)]">
                        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">La sala expira</p>
                        <p className="mt-1.5 text-sm font-medium text-amber-600">
                          {formatShortDate(videoRoom.expiresAt)} · {formatTime(videoRoom.expiresAt)}
                        </p>
                      </div>
                    )}
                    {!videoRoom.expiresAt && videoRoom.scheduledAt && (
                      <div className="rounded-xl bg-[var(--color-surface-elevated)] p-4 border border-[var(--color-border)]">
                        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">Horario</p>
                        <p className="mt-1.5 text-sm font-medium text-[var(--color-text-primary)]">
                          {formatShortDate(videoRoom.scheduledAt)} · {formatTime(videoRoom.scheduledAt)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Doctor joined status */}
                  {videoRoom.source === 'legacy' && (
                    <div className="flex items-center gap-3 rounded-xl bg-[var(--color-surface-elevated)] p-4 border border-[var(--color-border)]">
                      <span className={`flex h-3 w-3 rounded-full ${videoRoom.doctorJoined ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border-strong)]'}`}>
                        {videoRoom.doctorJoined && <span className="inline-flex h-3 w-3 animate-ping rounded-full bg-[var(--color-success)] opacity-40" />}
                      </span>
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        {videoRoom.doctorJoined ? 'El médico ya está en la sala' : 'Esperando que el médico ingrese…'}
                      </span>
                    </div>
                  )}

                  {/* Action button */}
                  {videoActive ? (
                    <Link
                      href={`/video/join/${encodeURIComponent(videoRoom.roomName)}?fromPanel=true`}
                      className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[var(--color-primary)] py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-all hover:bg-[var(--color-primary-hover)] hover:shadow-md"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                      Ingresar a la sala
                    </Link>
                  ) : (
                    <div className="rounded-xl bg-[var(--color-surface-elevated)] p-5 text-center border border-[var(--color-border)]">
                      <svg className="mx-auto h-8 w-8 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                      <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                        La sala {videoRoom.status === 'ended' || videoRoom.status === 'expired' ? 'ha finalizado' : 'no está disponible aún'}
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Waiting for doctor to create room */
              <div className="p-8 sm:p-10 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary-light)]">
                  <svg className="h-8 w-8 text-[var(--color-primary)] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-base font-semibold text-[var(--color-text-primary)]">Esperando sala de video</h3>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)] max-w-xs mx-auto">
                  Tu médico aún no ha creado la sala. Se actualizará automáticamente cuando esté lista.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[var(--color-text-muted)]">
                  <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verificando cada 15 segundos…
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cancel modal */}
      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--color-surface)] p-6 shadow-[var(--shadow-xl)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-error-light)] mx-auto">
              <svg className="h-6 w-6 text-[var(--color-error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="mt-4 text-center text-lg font-semibold text-[var(--color-text-primary)]">¿Cancelar esta cita?</h3>
            <p className="mt-2 text-center text-sm text-[var(--color-text-secondary)]">
              Cita con <strong>{appointment.doctorName}</strong>
              {appointment.dateTime && <> el <strong>{formatShortDate(appointment.dateTime)}</strong> a las <strong>{formatTime(appointment.dateTime)}</strong></>}.
            </p>
            <p className="mt-1 text-center text-xs text-[var(--color-text-muted)]">Esta acción no se puede deshacer</p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmCancel(false)}
                className="flex-1 rounded-xl border border-[var(--color-border)] py-2.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] transition-colors"
              >
                Mantener
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 rounded-xl bg-[var(--color-error)] py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                Cancelar cita
              </button>
            </div>
          </div>
        </div>
      )}
    </PatientLayout>
  );
}

// ── Reusable Detail Card ──────────────────────────────────────────────────────

function DetailCard({ icon, label, value, badge, mono }: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  badge?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 shadow-[var(--shadow-sm)]">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-elevated)]">
          <svg className="h-4 w-4 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            {icon}
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{label}</p>
          {badge ?? (
            <p className={`mt-0.5 truncate font-medium text-[var(--color-text-primary)] ${mono ? 'font-mono text-sm' : 'text-sm'}`}>
              {value || '—'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
