'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

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
function getDrTitle(gender: string): string {
  return gender === 'female' ? 'Dra.' : 'Dr.';
}

function getPlanBadge(sub: DoctorSubscription | undefined) {
  if (!sub || sub.status !== 'active') return null;
  const plan = sub.planName?.toLowerCase() ?? '';
  if (plan.includes('plus'))
    return { label: '⭐ PREMIUM', cls: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-white' };
  if (plan.includes('medium'))
    return { label: '💎 PLUS', cls: 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white' };
  return null;
}

const ASPECT_LABELS: Record<string, string> = {
  punctuality: 'Puntualidad',
  attention: 'Atención',
  explanation: 'Explicación',
  facilities: 'Instalaciones',
};

/* ─── Appointment Modal ─── */
function AppointmentModal({ doctor, onClose }: { doctor: Doctor; onClose: () => void }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    type: 'presencial',
    reason: '',
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId: doctor.id, ...form }),
      });
      setSent(true);
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
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
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Agendar Turno</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="mb-4 text-sm text-gray-500">
              Turno con <span className="font-medium text-gray-700">{getDrTitle(doctor.gender)} {doctor.name}</span> — {doctor.specialty}
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Nombre completo</label>
                  <input required value={form.name} onChange={(e) => set('name', e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#4dbad9]" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Email</label>
                  <input required type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#4dbad9]" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Teléfono</label>
                  <input required value={form.phone} onChange={(e) => set('phone', e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#4dbad9]" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Tipo de consulta</label>
                  <select value={form.type} onChange={(e) => set('type', e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#4dbad9]">
                    <option value="presencial">Presencial</option>
                    {doctor.onlineConsultation && <option value="online">Online</option>}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Fecha</label>
                  <input required type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#4dbad9]" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Hora preferida</label>
                  <input required type="time" value={form.time} onChange={(e) => set('time', e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#4dbad9]" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Motivo de consulta</label>
                <textarea value={form.reason} onChange={(e) => set('reason', e.target.value)} rows={3} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#4dbad9]" />
              </div>
              <button disabled={sending} type="submit" className="w-full rounded-xl bg-[#e8910f] py-3 text-sm font-semibold text-white transition hover:bg-[#d4830d] disabled:opacity-50">
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

  const title = getDrTitle(doctor.gender);
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-[#011d2f] to-[#0a3a5c] py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 sm:flex-row sm:items-start sm:px-6">
          <div className="relative h-36 w-36 shrink-0 overflow-hidden rounded-2xl border-4 border-white/20 bg-white shadow-lg">
            {doctor.profileImage ? (
              <img src={doctor.profileImage} alt={doctor.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
            ) : null}
            <div className={`flex h-full w-full items-center justify-center bg-[#4dbad9]/10 text-3xl font-bold text-[#4dbad9]${doctor.profileImage ? ' hidden' : ''}`}>
              {doctor.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
          </div>
          <div className="text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="text-3xl font-bold text-white">{title} {doctor.name}</h1>
              {planBadge && (
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${planBadge.cls}`}>{planBadge.label}</span>
              )}
              {doctor.verified && (
                <span className="rounded-full bg-green-500/20 px-2.5 py-1 text-xs font-medium text-green-300">✓ Verificado</span>
              )}
            </div>
            <p className="mt-1 text-lg text-[#4dbad9]">{doctor.specialty}</p>
            {doctor.professional?.profession && doctor.professional.profession !== doctor.specialty && (
              <p className="text-sm text-gray-400">{doctor.professional.profession}</p>
            )}
            {doctor.location?.formattedAddress && (
              <p className="mt-2 text-sm text-gray-300">📍 {doctor.location.formattedAddress}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              {averageRating > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-[#e8ad0f]/20 px-3 py-1 text-sm font-semibold text-[#e8ad0f]">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  {averageRating.toFixed(1)} ({totalReviews} reseñas)
                </span>
              )}
              {doctor.onlineConsultation && (
                <span className="rounded-full bg-green-500/20 px-3 py-1 text-sm font-medium text-green-300">🖥 Consulta Online</span>
              )}
            </div>
            {/* Action buttons */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <button
                onClick={() => setShowAppointment(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#e8910f] px-6 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#d4830d]"
              >
                📅 Pedir turno
              </button>
              {doctor.phone && (
                <a
                  href={`https://wa.me/${doctor.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${title} ${doctor.name}, me gustaría agendar una consulta.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:shadow-md"
                >
                  WhatsApp
                </a>
              )}
              {doctor.phone && (
                <a href={`tel:${doctor.phone}`} className="inline-flex items-center gap-1.5 rounded-xl bg-[#4dbad9] px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#3da8c5]">
                  📞 Llamar
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content: 2 columns */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {doctor.description && (
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Sobre el profesional</h3>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-600">{doctor.description}</p>
              </div>
            )}

            {/* Professional Info */}
            {(doctor.professional?.licenseNumber || doctor.professional?.officeAddress) && (
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Información profesional</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  {doctor.professional.licenseNumber && (
                    <div className="flex gap-2"><dt className="font-medium text-gray-500">Matrícula:</dt><dd className="text-gray-700">{doctor.professional.licenseNumber}</dd></div>
                  )}
                  {doctor.professional.officeAddress && (
                    <div className="flex gap-2"><dt className="font-medium text-gray-500">Consultorio:</dt><dd className="text-gray-700">{doctor.professional.officeAddress}</dd></div>
                  )}
                  {doctor.professional.profession && (
                    <div className="flex gap-2"><dt className="font-medium text-gray-500">Profesión:</dt><dd className="text-gray-700">{doctor.professional.profession}</dd></div>
                  )}
                </dl>
              </div>
            )}

            {/* Schedule */}
            {doctor.schedule && (
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Horarios de atención</h3>
                <p className="mt-3 whitespace-pre-line text-sm text-gray-600">{doctor.schedule}</p>
              </div>
            )}

            {/* Reviews */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Reseñas ({totalReviews})</h3>
                {averageRating > 0 && (
                  <div className="flex items-center gap-1 text-[#e8ad0f]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} className={`h-5 w-5 ${i < Math.round(averageRating) ? 'fill-current' : 'text-gray-200 fill-current'}`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    ))}
                    <span className="ml-1 text-sm font-semibold">{averageRating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Aspect averages */}
              {aspectAverages && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {Object.entries(ASPECT_LABELS).map(([key, label]) => (
                    <div key={key} className="rounded-xl bg-gray-50 p-3 text-center">
                      <p className="text-xs font-medium text-gray-500">{label}</p>
                      <p className="mt-1 text-lg font-bold text-[#4dbad9]">{(aspectAverages[key] ?? 0).toFixed(1)}</p>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                        <div className="h-full rounded-full bg-[#4dbad9]" style={{ width: `${((aspectAverages[key] ?? 0) / 5) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Review list */}
              <div className="mt-6 space-y-4">
                {reviews.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gray-400">Aún no hay reseñas para este profesional.</p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="rounded-xl border border-gray-100 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{review.patientName}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
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
                      {review.comment && <p className="mt-2 text-sm text-gray-600">{review.comment}</p>}
                      {/* Aspect breakdown */}
                      {review.aspects && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {Object.entries(ASPECT_LABELS).map(([key, label]) => {
                            const val = review.aspects[key as keyof ReviewAspects];
                            if (!val) return null;
                            return (
                              <span key={key} className="rounded-full bg-gray-50 px-2 py-0.5 text-[10px] text-gray-500">
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
            </div>
          </div>

          {/* Sidebar (1/3) */}
          <div className="space-y-6">
            {/* Contact card */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <h4 className="font-semibold text-gray-900">Contacto</h4>
              <div className="mt-3 space-y-2 text-sm">
                {doctor.phone && (
                  <p className="flex items-center gap-2 text-gray-600">📞 <a href={`tel:${doctor.phone}`} className="hover:text-[#4dbad9]">{doctor.phone}</a></p>
                )}
                {doctor.email && (
                  <p className="flex items-center gap-2 text-gray-600">✉️ <a href={`mailto:${doctor.email}`} className="hover:text-[#4dbad9]">{doctor.email}</a></p>
                )}
                {doctor.location?.formattedAddress && (
                  <p className="flex items-center gap-2 text-gray-600">📍 {doctor.location.formattedAddress}</p>
                )}
              </div>
              <button
                onClick={() => setShowAppointment(true)}
                className="mt-4 w-full rounded-xl bg-[#e8910f] py-2.5 text-sm font-semibold text-white transition hover:bg-[#d4830d]"
              >
                📅 Pedir turno
              </button>
            </div>

            {/* Map */}
            {hasLocation && isLoaded && (
              <div className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-gray-100">
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '250px' }}
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
                  className="block bg-white px-4 py-2.5 text-center text-xs font-medium text-[#4dbad9] hover:bg-gray-50"
                >
                  Abrir en Google Maps →
                </a>
              </div>
            )}

            {/* Related doctors */}
            {relatedDoctors.length > 0 && (
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                <h4 className="font-semibold text-gray-900">Profesionales similares</h4>
                <div className="mt-3 space-y-3">
                  {relatedDoctors.map((rd) => (
                    <Link key={rd.id} href={`/doctores/${rd.slug ?? rd.id}`} className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-gray-50">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#4dbad9]/10">
                        {rd.profileImage ? (
                          <img src={rd.profileImage} alt={rd.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                        ) : null}
                        <div className={`flex h-full w-full items-center justify-center text-xs font-bold text-[#4dbad9]${rd.profileImage ? ' hidden' : ''}`}>
                          {rd.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">{getDrTitle(rd.gender)} {rd.name}</p>
                        <p className="text-xs text-[#4dbad9]">{rd.specialty}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Appointment modal */}
      <AnimatePresence>
        {showAppointment && <AppointmentModal doctor={doctor} onClose={() => setShowAppointment(false)} />}
      </AnimatePresence>
    </div>
  );
}
