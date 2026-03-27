'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { useAuth } from '@/src/components/providers/AuthProvider';

const GMAP_LIBRARIES: ('places')[] = ['places'];

/* ─── Types ─── */
interface DoctorLocation {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

interface DoctorSubscription {
  status: string;
  planId: string;
  planName: string;
  expiresAt: string | null;
}

interface Doctor {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  gender: string;
  specialty: string;
  description: string;
  profileImage: string;
  schedule: string;
  onlineConsultation: boolean;
  location: DoctorLocation;
  verified: boolean;
  subscription: DoctorSubscription;
  professional: {
    profession: string;
    licenseNumber: string;
    officeAddress: string;
  };
}

interface ReviewAspects {
  punctuality: number;
  attention: number;
  explanation: number;
  facilities: number;
}

interface Review {
  id: string;
  patientName: string;
  rating: number;
  aspects: ReviewAspects;
  comment: string;
  wouldRecommend: boolean;
  createdAt: string;
}

/* ─── Helpers ─── */
function getDrTitle(gender: string, name?: string): string {
  if (name && /^(Dra?\.?\s)/i.test(name.trim())) return '';
  return gender === 'female' ? 'Dra.' : 'Dr.';
}

function getPlanBadge(sub: DoctorSubscription | undefined) {
  if (!sub || sub.status !== 'active') return null;
  if (sub.expiresAt && new Date(sub.expiresAt) <= new Date()) return null;
  const plan = sub.planName?.toLowerCase() ?? '';
  if (plan.includes('plus'))
    return { label: '⭐ PLUS', cls: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-white' };
  if (plan.includes('medium'))
    return { label: '💎 MEDIUM', cls: 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white' };
  return null;
}

const ASPECT_LABELS: Record<string, string> = {
  punctuality: 'Puntualidad',
  attention: 'Atención',
  explanation: 'Explicación',
  facilities: 'Instalaciones',
};

/* ─── Appointment Modal ─── */
interface FamilyMemberOption {
  id: string;
  name: string;
  relationship: string;
}

function AppointmentModal({ doctor, onClose }: { doctor: Doctor; onClose: () => void }) {
  const { user, userType, profile } = useAuth();

  const [selectedPatient, setSelectedPatient] = useState<string>('self'); // 'self' or family member id
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberOption[]>([]);
  const [loadingFamily, setLoadingFamily] = useState(false);

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState('presencial');
  const [reason, setReason] = useState('');

  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Fetch family members on mount
  useEffect(() => {
    if (!user || userType !== 'patient') return;
    let cancelled = false;
    async function fetchFamily() {
      setLoadingFamily(true);
      try {
        const token = await user!.getIdToken();
        const res = await fetch('/api/patients/me/family', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setFamilyMembers(
            (data.members ?? []).map((m: { id: string; name: string; relationship: string }) => ({
              id: m.id,
              name: m.name,
              relationship: m.relationship,
            })),
          );
        }
      } catch { /* ignore */ }
      finally { if (!cancelled) setLoadingFamily(false); }
    }
    fetchFamily();
    return () => { cancelled = true; };
  }, [user, userType]);

  // Fetch available slots when date changes
  useEffect(() => {
    if (!date) { setSlots([]); return; }
    let cancelled = false;
    async function fetchSlots() {
      setLoadingSlots(true);
      setSlots([]);
      setTime('');
      try {
        const start = new Date(date + 'T00:00:00');
        const end = new Date(date + 'T23:59:59');
        const res = await fetch(
          `/api/appointments/slots?doctorId=${doctor.id}&start=${start.toISOString()}&end=${end.toISOString()}`
        );
        if (res.ok && !cancelled) {
          const data = await res.json();
          const times: string[] = (data.slots ?? []).map((s: { dateTime: string }) => {
            const d = new Date(s.dateTime);
            return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
          });
          setSlots(times);
        }
      } catch { /* ignore */ }
      finally { if (!cancelled) setLoadingSlots(false); }
    }
    fetchSlots();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, doctor.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile) return;
    setSending(true);
    try {
      const token = await user.getIdToken();
      const selectedFamily = familyMembers.find(m => m.id === selectedPatient);
      await fetch('/api/appointments', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: doctor.id,
          patientName: selectedFamily ? selectedFamily.name : profile.name,
          patientEmail: profile.email,
          familyMemberId: selectedFamily ? selectedFamily.id : null,
          date,
          time,
          type,
          reason,
        }),
      });
      setSent(true);
    } catch { /* ignore */ }
    finally { setSending(false); }
  }

  const today = new Date().toISOString().split('T')[0];

  // Not logged in or not a patient → show login prompt
  if (!user || userType !== 'patient') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl">🔒</div>
          <h3 className="mt-4 text-lg font-bold text-gray-900">Iniciar sesión requerido</h3>
          <p className="mt-2 text-sm text-gray-500">Necesitás estar registrado como paciente para solicitar un turno.</p>
          <div className="mt-6 flex gap-3">
            <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50">Cancelar</button>
            <Link href="/paciente/login" className="flex-1 rounded-xl bg-[#4dbad9] py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#3ba8c7]">Iniciar sesión</Link>
          </div>
          <Link href="/paciente/register" className="mt-3 block text-xs text-[#4dbad9] hover:underline">¿No tenés cuenta? Registrate</Link>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {sent ? (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">✓</div>
            <h3 className="mt-4 text-xl font-bold text-gray-900">¡Turno solicitado!</h3>
            <p className="mt-2 text-sm text-gray-500">Te contactaremos a la brevedad para confirmar.</p>
            <button onClick={onClose} className="mt-6 rounded-xl bg-[#4dbad9] px-6 py-2.5 text-sm font-semibold text-white">Cerrar</button>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Agendar Turno</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Doctor info */}
            <div className="mb-5 rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-sm text-gray-500">
                Turno con <span className="font-semibold text-gray-800">{getDrTitle(doctor.gender, doctor.name)} {doctor.name}</span>
              </p>
              <p className="mt-0.5 text-xs text-gray-400">{doctor.specialty}</p>
            </div>

            {/* Patient selector */}
            <div className="mb-5">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">Paciente</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPatient('self')}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                    selectedPatient === 'self'
                      ? 'border-[#4dbad9] bg-[#4dbad9]/10 text-[#4dbad9]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="text-base">👤</span>
                  {profile?.name ?? 'Yo'}
                  {selectedPatient === 'self' && <span className="text-xs">✓</span>}
                </button>
                {familyMembers.map((fm) => (
                  <button
                    key={fm.id}
                    type="button"
                    onClick={() => setSelectedPatient(fm.id)}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                      selectedPatient === fm.id
                        ? 'border-[#4dbad9] bg-[#4dbad9]/10 text-[#4dbad9]'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-base">👥</span>
                    <span>{fm.name}</span>
                    <span className="text-[10px] text-gray-400">({fm.relationship})</span>
                    {selectedPatient === fm.id && <span className="text-xs">✓</span>}
                  </button>
                ))}
                {loadingFamily && (
                  <span className="flex items-center gap-1.5 px-3 text-xs text-gray-400">
                    <span className="h-3 w-3 animate-spin rounded-full border border-gray-300 border-t-[#4dbad9]" />
                    Cargando…
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Consultation type */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Tipo de consulta</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#4dbad9]">
                  <option value="presencial">Presencial</option>
                  {doctor.onlineConsultation && <option value="online">Online</option>}
                </select>
              </div>

              {/* Date picker */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Fecha</label>
                <input
                  required
                  type="date"
                  min={today}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#4dbad9]"
                />
              </div>

              {/* Time slots */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Hora</label>
                {!date ? (
                  <p className="rounded-lg bg-gray-50 px-3 py-3 text-center text-xs text-gray-400">Seleccioná una fecha para ver los horarios disponibles</p>
                ) : loadingSlots ? (
                  <div className="flex items-center justify-center gap-2 rounded-lg bg-gray-50 px-3 py-4">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#4dbad9]" />
                    <span className="text-xs text-gray-400">Cargando horarios...</span>
                  </div>
                ) : slots.length === 0 ? (
                  <p className="rounded-lg bg-red-50 px-3 py-3 text-center text-xs text-red-500">No hay horarios disponibles para esta fecha</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                    {slots.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTime(t)}
                        className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${
                          time === t
                            ? 'border-[#4dbad9] bg-[#4dbad9] text-white shadow-sm'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-[#4dbad9]/50 hover:bg-[#4dbad9]/5'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
                <input type="hidden" required value={time} />
              </div>

              {/* Reason */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Motivo de consulta <span className="text-gray-300">(opcional)</span></label>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Describí brevemente el motivo…" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#4dbad9]" />
              </div>

              <button disabled={sending || !time} type="submit" className="w-full rounded-xl bg-[#e8910f] py-3 text-sm font-semibold text-white transition hover:bg-[#d4830d] disabled:opacity-50">
                {sending ? 'Enviando…' : 'Solicitar turno'}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ─── Main Component ─── */
export default function DoctorProfile() {
  const params = useParams();
  const slug = params.slug as string;
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedDoctors, setRelatedDoctors] = useState<Doctor[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAppointment, setShowAppointment] = useState(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    libraries: GMAP_LIBRARIES,
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/doctors/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setDoctor(data.doctor);
          setReviews(data.reviews ?? []);
          setRelatedDoctors(data.relatedDoctors ?? []);
          setAverageRating(data.averageRating ?? 0);
          setTotalReviews(data.totalReviews ?? 0);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#4dbad9]" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Doctor no encontrado</h2>
        <Link href="/doctores" className="text-[#4dbad9] hover:underline">Volver al listado</Link>
      </div>
    );
  }

  const title = getDrTitle(doctor.gender, doctor.name);
  const planBadge = getPlanBadge(doctor.subscription);
  const hasLocation = doctor.location?.latitude && doctor.location?.longitude;

  // Average aspect ratings
  const aspectAverages = reviews.length > 0
    ? (Object.keys(ASPECT_LABELS) as (keyof ReviewAspects)[]).reduce(
        (acc, key) => {
          const sum = reviews.reduce((s, r) => s + (r.aspects?.[key] ?? 0), 0);
          acc[key] = sum / reviews.length;
          return acc;
        },
        {} as Record<string, number>,
      )
    : null;

  return (
    <div className="min-h-screen bg-[var(--color-surface-elevated)]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#011d2f] via-[#0a3a5c] to-[#0d4a6f]">
        <div className="mx-auto max-w-6xl px-4 pb-14 pt-10 sm:px-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-end">
            {/* Avatar */}
            <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl border-[3px] border-white/20 bg-white shadow-xl sm:h-36 sm:w-36">
              {doctor.profileImage ? (
                <img src={doctor.profileImage} alt={doctor.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
              ) : null}
              <div className={`flex h-full w-full items-center justify-center bg-[#4dbad9]/10 text-3xl font-bold text-[#4dbad9]${doctor.profileImage ? ' hidden' : ''}`}>
                {doctor.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1 className="text-3xl font-bold text-white">{title} {doctor.name}</h1>
                {planBadge && (
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${planBadge.cls}`}>{planBadge.label}</span>
                )}
                {doctor.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2.5 py-0.5 text-[11px] font-medium text-green-300">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    Verificado
                  </span>
                )}
              </div>
              <p className="mt-1 text-lg font-medium text-[#4dbad9]">{doctor.specialty}</p>
              {doctor.professional?.profession && doctor.professional.profession !== doctor.specialty && (
                <p className="text-sm text-gray-400">{doctor.professional.profession}</p>
              )}

              {/* Meta chips */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                {doctor.location?.formattedAddress && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-gray-300">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {doctor.location.formattedAddress}
                  </span>
                )}
                {averageRating > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#e8ad0f]/20 px-3 py-1 text-xs font-semibold text-[#e8ad0f]">
                    <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    {averageRating.toFixed(1)} ({totalReviews})
                  </span>
                )}
                {doctor.onlineConsultation && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-300">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    Consulta Online
                  </span>
                )}
              </div>
            </div>

            {/* CTA buttons — desktop only, visible in hero */}
            <div className="hidden shrink-0 flex-col gap-2 sm:flex">
              <button
                onClick={() => setShowAppointment(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#e8910f] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-[#d4830d] hover:shadow-orange-500/30"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Pedir turno
              </button>
              {doctor.phone && (
                <a
                  href={`https://wa.me/${doctor.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${title} ${doctor.name}, me gustaría agendar una consulta.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-emerald-600"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /></svg>
                  WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* Mobile CTA */}
          <div className="mt-5 flex gap-2 sm:hidden">
            <button
              onClick={() => setShowAppointment(true)}
              className="flex-1 rounded-xl bg-[#e8910f] py-3 text-sm font-semibold text-white shadow transition hover:bg-[#d4830d]"
            >
              📅 Pedir turno
            </button>
            {doctor.phone && (
              <a
                href={`https://wa.me/${doctor.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${title} ${doctor.name}, me gustaría agendar una consulta.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-xl bg-emerald-500 py-3 text-center text-sm font-semibold text-white shadow transition hover:bg-emerald-600"
              >
                WhatsApp
              </a>
            )}
            {doctor.phone && (
              <a href={`tel:${doctor.phone}`} className="rounded-xl bg-[#4dbad9] px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-[#3da8c5]">
                📞
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Content: 2 columns */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {doctor.description && (
              <section className="rounded-2xl bg-[var(--color-surface)] p-6 shadow-sm ring-1 ring-[var(--color-border)]">
                <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--color-text-primary)]">
                  <svg className="h-5 w-5 text-[#4dbad9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Sobre el profesional
                </h3>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--color-text-secondary)]">{doctor.description}</p>
              </section>
            )}

            {/* Professional Info */}
            {(doctor.professional?.licenseNumber || doctor.professional?.officeAddress) && (
              <section className="rounded-2xl bg-[var(--color-surface)] p-6 shadow-sm ring-1 ring-[var(--color-border)]">
                <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--color-text-primary)]">
                  <svg className="h-5 w-5 text-[#4dbad9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                  Información profesional
                </h3>
                <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {doctor.professional.licenseNumber && (
                    <div className="rounded-xl bg-[var(--color-surface-elevated)] px-4 py-3">
                      <dt className="text-xs font-medium text-[var(--color-text-muted)]">Matrícula</dt>
                      <dd className="mt-0.5 text-sm font-medium text-[var(--color-text-primary)]">{doctor.professional.licenseNumber}</dd>
                    </div>
                  )}
                  {doctor.professional.officeAddress && (
                    <div className="rounded-xl bg-[var(--color-surface-elevated)] px-4 py-3">
                      <dt className="text-xs font-medium text-[var(--color-text-muted)]">Consultorio</dt>
                      <dd className="mt-0.5 text-sm font-medium text-[var(--color-text-primary)]">{doctor.professional.officeAddress}</dd>
                    </div>
                  )}
                  {doctor.professional.profession && (
                    <div className="rounded-xl bg-[var(--color-surface-elevated)] px-4 py-3">
                      <dt className="text-xs font-medium text-[var(--color-text-muted)]">Profesión</dt>
                      <dd className="mt-0.5 text-sm font-medium text-[var(--color-text-primary)]">{doctor.professional.profession}</dd>
                    </div>
                  )}
                </dl>
              </section>
            )}

            {/* Reviews */}
            <section className="rounded-2xl bg-[var(--color-surface)] p-6 shadow-sm ring-1 ring-[var(--color-border)]">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--color-text-primary)]">
                  <svg className="h-5 w-5 text-[#4dbad9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
                  Reseñas ({totalReviews})
                </h3>
                {averageRating > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg key={i} className={`h-4 w-4 ${i < Math.round(averageRating) ? 'text-[#e8ad0f] fill-current' : 'text-gray-200 fill-current'}`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      ))}
                    </div>
                    <span className="text-sm font-bold text-[var(--color-text-primary)]">{averageRating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Aspect averages */}
              {aspectAverages && (
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {Object.entries(ASPECT_LABELS).map(([key, label]) => (
                    <div key={key} className="rounded-xl bg-[var(--color-surface-elevated)] p-3 text-center">
                      <p className="text-[11px] font-medium text-[var(--color-text-muted)]">{label}</p>
                      <p className="mt-1 text-xl font-bold text-[#4dbad9]">{(aspectAverages[key] ?? 0).toFixed(1)}</p>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-[#4dbad9] transition-all" style={{ width: `${((aspectAverages[key] ?? 0) / 5) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Review list */}
              <div className="mt-6 space-y-4">
                {reviews.length === 0 ? (
                  <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">Aún no hay reseñas para este profesional.</p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="rounded-xl border border-[var(--color-border)] p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-elevated)] text-sm font-bold text-[var(--color-text-muted)]">
                            {review.patientName?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[var(--color-text-primary)]">{review.patientName}</p>
                            <p className="text-[11px] text-[var(--color-text-muted)]">
                              {new Date(review.createdAt).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {review.wouldRecommend !== undefined && (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${review.wouldRecommend ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                              {review.wouldRecommend ? '👍 Recomienda' : '👎 No recomienda'}
                            </span>
                          )}
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, j) => (
                              <svg key={j} className={`h-3.5 w-3.5 ${j < review.rating ? 'text-[#e8ad0f] fill-current' : 'text-gray-200 fill-current'}`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            ))}
                          </div>
                        </div>
                      </div>
                      {review.comment && <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">{review.comment}</p>}
                      {review.aspects && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {Object.entries(ASPECT_LABELS).map(([key, label]) => {
                            const val = review.aspects[key as keyof ReviewAspects];
                            if (!val) return null;
                            return (
                              <span key={key} className="rounded-full bg-[var(--color-surface-elevated)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)]">
                                {label}: {val}/5
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Sidebar (1/3) */}
          <div className="space-y-6">
            {/* Schedule card — prominent placement */}
            {doctor.schedule && (
              <div className="rounded-2xl bg-[var(--color-surface)] p-5 shadow-sm ring-1 ring-[var(--color-border)]">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
                  <svg className="h-5 w-5 text-[#4dbad9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Horarios de atención
                </h4>
                <div className="mt-3 whitespace-pre-line rounded-xl bg-[var(--color-surface-elevated)] px-4 py-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  {doctor.schedule}
                </div>
              </div>
            )}

            {/* Contact card */}
            <div className="rounded-2xl bg-[var(--color-surface)] p-5 shadow-sm ring-1 ring-[var(--color-border)]">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
                <svg className="h-5 w-5 text-[#4dbad9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                Contacto
              </h4>
              <div className="mt-3 space-y-2.5">
                {doctor.phone && (
                  <a href={`tel:${doctor.phone}`} className="flex items-center gap-3 rounded-xl bg-[var(--color-surface-elevated)] px-4 py-2.5 text-sm text-[var(--color-text-secondary)] transition hover:ring-1 hover:ring-[#4dbad9]/30">
                    <span className="text-base">📞</span>
                    {doctor.phone}
                  </a>
                )}
                {doctor.email && (
                  <a href={`mailto:${doctor.email}`} className="flex items-center gap-3 rounded-xl bg-[var(--color-surface-elevated)] px-4 py-2.5 text-sm text-[var(--color-text-secondary)] transition hover:ring-1 hover:ring-[#4dbad9]/30">
                    <span className="text-base">✉️</span>
                    <span className="truncate">{doctor.email}</span>
                  </a>
                )}
                {doctor.location?.formattedAddress && (
                  <div className="flex items-start gap-3 rounded-xl bg-[var(--color-surface-elevated)] px-4 py-2.5 text-sm text-[var(--color-text-secondary)]">
                    <span className="mt-0.5 text-base">📍</span>
                    {doctor.location.formattedAddress}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowAppointment(true)}
                className="mt-4 w-full rounded-xl bg-[#e8910f] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#d4830d]"
              >
                📅 Pedir turno
              </button>
            </div>

            {/* Map */}
            {hasLocation && isLoaded && (
              <div className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-[var(--color-border)]">
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '220px' }}
                  center={{ lat: doctor.location.latitude, lng: doctor.location.longitude }}
                  zoom={15}
                  options={{ disableDefaultUI: true, zoomControl: true }}
                >
                  <Marker position={{ lat: doctor.location.latitude, lng: doctor.location.longitude }} />
                </GoogleMap>
                <a
                  href={`https://www.google.com/maps?q=${doctor.location.latitude},${doctor.location.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 bg-[var(--color-surface)] px-4 py-2.5 text-xs font-medium text-[#4dbad9] transition hover:bg-[var(--color-surface-elevated)]"
                >
                  Abrir en Google Maps
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Related Doctors — full width */}
        {relatedDoctors.length > 0 && (
          <div className="mt-10">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--color-text-primary)]">
              <svg className="h-5 w-5 text-[#4dbad9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
              Profesionales similares
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {relatedDoctors.map((rd) => {
                const rdBadge = getPlanBadge(rd.subscription);
                return (
                  <Link
                    key={rd.id}
                    href={`/doctores/${rd.slug ?? rd.id}`}
                    className="group relative flex flex-col items-center rounded-2xl bg-[var(--color-surface)] p-5 shadow-sm ring-1 ring-[var(--color-border)] transition hover:shadow-md hover:ring-[#4dbad9]/30"
                  >
                    {rdBadge && (
                      <span className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${rdBadge.cls}`}>{rdBadge.label}</span>
                    )}
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-[#4dbad9]/10 ring-2 ring-[var(--color-border)] group-hover:ring-[#4dbad9]/40 transition">
                      {rd.profileImage ? (
                        <img src={rd.profileImage} alt={rd.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                      ) : null}
                      <div className={`flex h-full w-full items-center justify-center text-lg font-bold text-[#4dbad9]${rd.profileImage ? ' hidden' : ''}`}>
                        {rd.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </div>
                    </div>
                    <p className="mt-3 text-center text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-[#4dbad9] transition-colors">{getDrTitle(rd.gender, rd.name)} {rd.name}</p>
                    <p className="mt-0.5 text-xs text-[#4dbad9]">{rd.specialty}</p>
                    {rd.location?.formattedAddress && (
                      <p className="mt-1.5 line-clamp-1 text-center text-[11px] text-[var(--color-text-muted)]">📍 {rd.location.formattedAddress}</p>
                    )}
                    <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#4dbad9]/10 px-3 py-1 text-xs font-medium text-[#4dbad9] transition group-hover:bg-[#4dbad9] group-hover:text-white">
                      Ver perfil
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Appointment modal */}
      <AnimatePresence>
        {showAppointment && <AppointmentModal doctor={doctor} onClose={() => setShowAppointment(false)} />}
      </AnimatePresence>
    </div>
  );
}
