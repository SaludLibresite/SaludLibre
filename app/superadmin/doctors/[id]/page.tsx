'use client';

import SuperAdminLayout from '@/components/layout/SuperAdminLayout';
import { useAuth } from '@/components/providers/AuthProvider';
import LocationAutocomplete from '@/src/components/shared/LocationAutocomplete';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface DoctorDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  specialty: string;
  description: string;
  profileImage: string;
  schedule: string;
  slug: string;
  verified: boolean;
  onlineConsultation: boolean;
  location: { latitude: number; longitude: number; formattedAddress: string };
  subscription: { status: string; planId: string; planName: string; expiresAt: string | null };
  professional: { profession: string; licenseNumber: string; officeAddress: string; signatureUrl?: string; stampUrl?: string };
  createdAt?: string;
}

interface AvailablePlan {
  id: string;
  planId: string;
  name: string;
  price: number;
}

interface Specialty {
  id: string;
  name: string;
}

const GENDERS = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Femenino' },
  { value: 'other', label: 'Otro' },
  { value: 'not_specified', label: 'No especificado' },
];

function getPlanConfig(planName?: string, status?: string) {
  const active = status === 'active';
  const plan = planName?.toLowerCase() ?? '';
  if (active && plan.includes('plus')) return { bg: 'bg-purple-500', ring: 'ring-purple-200', text: 'text-purple-700', light: 'bg-purple-50', label: 'Plus', icon: '⭐' };
  if (active && plan.includes('medium')) return { bg: 'bg-blue-500', ring: 'ring-blue-200', text: 'text-blue-700', light: 'bg-blue-50', label: 'Medium', icon: '🔷' };
  return { bg: 'bg-gray-400', ring: 'ring-gray-200', text: 'text-gray-500', light: 'bg-gray-50', label: 'Free', icon: '○' };
}

function formatDate(date?: string | null) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(date?: string | null) {
  if (!date) return null;
  const diff = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
  return diff;
}

/* Info row component */
function InfoRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-400">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-400">{label}</p>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="mt-0.5 text-sm font-medium text-purple-600 hover:text-purple-700 break-all">
            {value}
          </a>
        ) : (
          <p className="mt-0.5 text-sm font-medium text-gray-900 break-all">{value}</p>
        )}
      </div>
    </div>
  );
}

export default function SuperAdminDoctorDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [doctor, setDoctor] = useState<DoctorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [plans, setPlans] = useState<AvailablePlan[]>([]);
  const [showActivate, setShowActivate] = useState(false);
  const [activateForm, setActivateForm] = useState({ planId: '', price: '', days: '30' });
  const [activating, setActivating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [editForm, setEditForm] = useState({
    name: '', email: '', phone: '', gender: 'not_specified',
    specialty: '', description: '', schedule: '', onlineConsultation: false,
    verified: false,
    professional: { profession: '', licenseNumber: '', officeAddress: '' },
    location: { formattedAddress: '', latitude: 0, longitude: 0 },
  });

  useEffect(() => {
    if (!user || !params.id) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };
        const [docRes, plansRes] = await Promise.all([
          fetch(`/api/superadmin/doctors/${params.id}`, { headers }),
          fetch('/api/superadmin/plans', { headers }),
        ]);
        if (docRes.ok) {
          const data = await docRes.json();
          setDoctor(data.doctor ?? data);
        }
        if (plansRes.ok) {
          const data = await plansRes.json();
          setPlans(data.plans ?? []);
        }
      } catch { /* */ } finally { setLoading(false); }
    })();
  }, [user, params.id]);

  useEffect(() => {
    fetch('/api/specialties')
      .then(r => r.json())
      .then(d => setSpecialties(d.specialties ?? []))
      .catch(() => {});
  }, []);

  function startEditing() {
    if (!doctor) return;
    setEditForm({
      name: doctor.name, email: doctor.email, phone: doctor.phone,
      gender: doctor.gender, specialty: doctor.specialty,
      description: doctor.description, schedule: doctor.schedule,
      onlineConsultation: doctor.onlineConsultation, verified: doctor.verified,
      professional: {
        profession: doctor.professional?.profession ?? '',
        licenseNumber: doctor.professional?.licenseNumber ?? '',
        officeAddress: doctor.professional?.officeAddress ?? '',
      },
      location: {
        formattedAddress: doctor.location?.formattedAddress ?? '',
        latitude: doctor.location?.latitude ?? 0,
        longitude: doctor.location?.longitude ?? 0,
      },
    });
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
  }

  const onEditLocationSelect = useCallback((loc: { latitude: number; longitude: number; formattedAddress: string }) => {
    setEditForm(f => ({ ...f, location: loc }));
  }, []);

  async function saveEditing() {
    if (!user || !doctor) return;
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/superadmin/doctors/${doctor.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setDoctor({
          ...doctor,
          ...editForm,
          professional: { ...doctor.professional, ...editForm.professional },
          location: { ...doctor.location, ...editForm.location },
        });
        setEditing(false);
        toast.success('Doctor actualizado');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? 'Error al guardar');
      }
    } catch { toast.error('Error de conexión'); } finally { setSaving(false); }
  }

  async function toggleVerification() {
    if (!user || !doctor) return;
    setToggling(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/superadmin/doctors/${doctor.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: !doctor.verified }),
      });
      if (res.ok) {
        setDoctor({ ...doctor, verified: !doctor.verified });
        toast.success(doctor.verified ? 'Verificación removida' : 'Doctor verificado');
      }
    } catch { toast.error('Error al actualizar'); } finally { setToggling(false); }
  }

  async function activateSubscription() {
    if (!user || !doctor || !activateForm.planId) return;
    setActivating(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/superadmin/activate-subscription', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: doctor.id,
          planId: activateForm.planId,
          overridePrice: activateForm.price ? Number(activateForm.price) : undefined,
          durationDays: activateForm.days ? Number(activateForm.days) : undefined,
        }),
      });
      if (res.ok) {
        const selectedPlan = plans.find(p => p.id === activateForm.planId);
        setDoctor({
          ...doctor,
          subscription: {
            status: 'active',
            planId: activateForm.planId,
            planName: selectedPlan?.name ?? '',
            expiresAt: new Date(Date.now() + Number(activateForm.days || 30) * 86400000).toISOString(),
          },
        });
        toast.success('Suscripción activada');
        setShowActivate(false);
      } else {
        toast.error('Error al activar');
      }
    } catch { toast.error('Error al activar'); } finally { setActivating(false); }
  }

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="space-y-4">
          {/* Skeleton hero */}
          <div className="h-44 animate-pulse rounded-2xl bg-gray-100" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-60 animate-pulse rounded-2xl bg-gray-100" />
              <div className="h-32 animate-pulse rounded-2xl bg-gray-100" />
            </div>
            <div className="space-y-4">
              <div className="h-52 animate-pulse rounded-2xl bg-gray-100" />
              <div className="h-36 animate-pulse rounded-2xl bg-gray-100" />
            </div>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  if (!doctor) {
    return (
      <SuperAdminLayout>
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <p className="mt-3 text-gray-500">Doctor no encontrado</p>
          <button onClick={() => router.push('/superadmin/doctors')} className="mt-4 text-sm font-medium text-purple-600 hover:underline">
            ← Volver a doctores
          </button>
        </div>
      </SuperAdminLayout>
    );
  }

  const planConfig = getPlanConfig(doctor.subscription?.planName, doctor.subscription?.status);
  const drTitle = doctor.gender === 'female' ? 'Dra.' : 'Dr.';
  const expiryDays = daysUntil(doctor.subscription?.expiresAt);
  const isExpiringSoon = expiryDays !== null && expiryDays <= 7 && expiryDays > 0;
  const isExpired = expiryDays !== null && expiryDays <= 0;

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Back nav */}
        <button onClick={() => router.push('/superadmin/doctors')} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Doctores
        </button>

        {/* ── Hero Card ── */}
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
          {/* Gradient banner */}
          <div className="h-32 bg-linear-to-br from-purple-600 via-purple-500 to-indigo-600" />

          {/* Profile info overlapping banner */}
          <div className="relative px-6 pb-6">
            {/* Photo */}
            <div className="-mt-14 mb-4 flex items-end justify-between">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-linear-to-br from-purple-400 to-purple-700 shadow-lg">
                {doctor.profileImage ? (
                  <img src={doctor.profileImage} alt={doctor.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-white">
                    {doctor.name?.[0]?.toUpperCase() ?? 'D'}
                  </div>
                )}
              </div>
              {/* Top-right actions */}
              <div className="flex items-center gap-2">
                {doctor.slug && (
                  <a
                    href={`/doctores/${doctor.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    Ver perfil
                  </a>
                )}
                <button
                  onClick={editing ? cancelEditing : startEditing}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition ${
                    editing
                      ? 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      : 'border border-purple-200 bg-white text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  {editing ? (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      Cancelar edición
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      Editar
                    </>
                  )}
                </button>
                <button
                  onClick={toggleVerification}
                  disabled={toggling}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition disabled:opacity-50 ${
                    doctor.verified
                      ? 'border border-red-200 bg-white text-red-600 hover:bg-red-50'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {toggling ? (
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  ) : doctor.verified ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                  {toggling ? 'Procesando...' : doctor.verified ? 'Remover verificación' : 'Verificar'}
                </button>
              </div>
            </div>

            {/* Name & specialty */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{drTitle} {doctor.name}</h1>
              <p className="mt-0.5 text-sm text-gray-500">{doctor.specialty || 'Sin especialidad'}</p>
            </div>

            {/* Badges row */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {doctor.verified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 ring-1 ring-green-600/10">
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                  Verificado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-600/10">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" /></svg>
                  Pendiente verificación
                </span>
              )}
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${planConfig.light} ${planConfig.text} ring-1 ${planConfig.ring}`}>
                {planConfig.icon} Plan {planConfig.label}
              </span>
              {doctor.onlineConsultation && (
                <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700 ring-1 ring-cyan-600/10">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Consulta online
                </span>
              )}
              {doctor.createdAt && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-3 py-1 text-xs text-gray-500 ring-1 ring-gray-600/5">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Registrado {formatDate(doctor.createdAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Main content (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact & personal info */}
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
              <div className="border-b border-gray-100 px-6 py-4">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Información de contacto
                </h2>
              </div>
              {editing ? (
                <div className="grid gap-4 p-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-medium text-gray-500">Nombre completo</label>
                    <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-500">Email</label>
                    <input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-500">Teléfono</label>
                    <input type="tel" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-500">Género</label>
                    <select value={editForm.gender} onChange={e => setEditForm(f => ({ ...f, gender: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400">
                      {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-500">Especialidad</label>
                    <select value={editForm.specialty} onChange={e => setEditForm(f => ({ ...f, specialty: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400">
                      <option value="">Seleccionar</option>
                      {specialties.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-medium text-gray-500">Ubicación</label>
                    <LocationAutocomplete
                      defaultValue={editForm.location.formattedAddress}
                      onSelect={onEditLocationSelect}
                      placeholder="Escribí una dirección..."
                    />
                    {editForm.location.formattedAddress && (
                      <p className="mt-1.5 text-xs text-gray-500">📍 {editForm.location.formattedAddress}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editForm.onlineConsultation}
                        onChange={e => setEditForm(f => ({ ...f, onlineConsultation: e.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                      <span className="text-sm text-gray-700">Consulta online</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editForm.verified}
                        onChange={e => setEditForm(f => ({ ...f, verified: e.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                      <span className="text-sm text-gray-700">Verificado</span>
                    </label>
                  </div>
                </div>
              ) : (
              <div className="divide-y divide-gray-50 px-6">
                <InfoRow
                  icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                  label="Email"
                  value={doctor.email}
                />
                <InfoRow
                  icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
                  label="Teléfono"
                  value={doctor.phone || 'No registrado'}
                />
                <InfoRow
                  icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                  label="Género"
                  value={doctor.gender === 'female' ? 'Femenino' : doctor.gender === 'male' ? 'Masculino' : doctor.gender || 'No especificado'}
                />
                {doctor.location?.formattedAddress && (
                  <InfoRow
                    icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                    label="Ubicación"
                    value={doctor.location.formattedAddress}
                  />
                )}
                {doctor.slug && (
                  <InfoRow
                    icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>}
                    label="URL pública"
                    value={`/doctores/${doctor.slug}`}
                    href={`/doctores/${doctor.slug}`}
                  />
                )}
              </div>
              )}
            </div>

            {/* Professional info */}
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
              <div className="border-b border-gray-100 px-6 py-4">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                  Información profesional
                </h2>
              </div>
              {editing ? (
                <div className="grid gap-4 p-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-500">Profesión</label>
                    <input type="text" value={editForm.professional.profession}
                      onChange={e => setEditForm(f => ({ ...f, professional: { ...f.professional, profession: e.target.value } }))}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-500">Matrícula</label>
                    <input type="text" value={editForm.professional.licenseNumber}
                      onChange={e => setEditForm(f => ({ ...f, professional: { ...f.professional, licenseNumber: e.target.value } }))}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-medium text-gray-500">Domicilio profesional</label>
                    <input type="text" value={editForm.professional.officeAddress}
                      onChange={e => setEditForm(f => ({ ...f, professional: { ...f.professional, officeAddress: e.target.value } }))}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-medium text-gray-500">Horario de atención</label>
                    <input type="text" value={editForm.schedule}
                      onChange={e => setEditForm(f => ({ ...f, schedule: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50" />
                  </div>
                </div>
              ) : (
              <div className="divide-y divide-gray-50 px-6">
                <InfoRow
                  icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                  label="Profesión"
                  value={doctor.professional?.profession || 'No registrada'}
                />
                <InfoRow
                  icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>}
                  label="Matrícula"
                  value={doctor.professional?.licenseNumber || 'No registrada'}
                />
                <InfoRow
                  icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  label="Horario de atención"
                  value={doctor.schedule || 'No definido'}
                />
                {doctor.professional?.officeAddress && (
                  <InfoRow
                    icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                    label="Domicilio profesional"
                    value={doctor.professional.officeAddress}
                  />
                )}
              </div>
              )}

              {/* Professional documents */}
              {!editing && (doctor.professional?.signatureUrl || doctor.professional?.stampUrl) && (
                <div className="border-t border-gray-100 px-6 py-4">
                  <p className="mb-3 text-xs font-medium text-gray-400">Documentos profesionales</p>
                  <div className="flex gap-4">
                    {doctor.professional.signatureUrl && (
                      <div className="text-center">
                        <div className="h-16 w-28 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-1">
                          <img src={doctor.professional.signatureUrl} alt="Firma" className="h-full w-full object-contain" />
                        </div>
                        <p className="mt-1 text-[10px] text-gray-400">Firma digital</p>
                      </div>
                    )}
                    {doctor.professional.stampUrl && (
                      <div className="text-center">
                        <div className="h-16 w-16 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-1">
                          <img src={doctor.professional.stampUrl} alt="Sello" className="h-full w-full object-contain" />
                        </div>
                        <p className="mt-1 text-[10px] text-gray-400">Sello</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bio */}
            {(editing || doctor.description) && (
              <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
                <div className="border-b border-gray-100 px-6 py-4">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Biografía
                  </h2>
                </div>
                <div className="px-6 py-4">
                  {editing ? (
                    <textarea
                      value={editForm.description}
                      onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                      rows={4}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50"
                    />
                  ) : (
                    <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">{doctor.description}</p>
                  )}
                </div>
              </div>
            )}

            {/* Save/Cancel bar when editing */}
            {editing && (
              <div className="flex items-center justify-end gap-3 rounded-2xl bg-purple-50 p-4 ring-1 ring-purple-100">
                <button onClick={cancelEditing} className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                  Cancelar
                </button>
                <button
                  onClick={saveEditing}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Guardando...
                    </>
                  ) : 'Guardar cambios'}
                </button>
              </div>
            )}
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-6">
            {/* Subscription card */}
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 overflow-hidden">
              {/* Colored header stripe */}
              <div className={`h-1.5 ${planConfig.bg}`} />
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-900">Suscripción</h2>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${planConfig.light} ${planConfig.text}`}>
                    {planConfig.icon} {planConfig.label}
                  </span>
                </div>

                {/* Status display */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Estado</span>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                      doctor.subscription?.status === 'active' ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        doctor.subscription?.status === 'active' ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                      {doctor.subscription?.status === 'active' ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Plan actual</span>
                    <span className="text-xs font-medium text-gray-900">{doctor.subscription?.planName || 'Free'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Expira</span>
                    <span className={`text-xs font-medium ${
                      isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-gray-900'
                    }`}>
                      {doctor.subscription?.expiresAt ? formatDate(doctor.subscription.expiresAt) : '—'}
                    </span>
                  </div>

                  {expiryDays !== null && doctor.subscription?.status === 'active' && (
                    <div className={`rounded-lg px-3 py-2 text-xs font-medium ${
                      isExpired ? 'bg-red-50 text-red-700' : isExpiringSoon ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
                    }`}>
                      {isExpired
                        ? `Expirado hace ${Math.abs(expiryDays)} día${Math.abs(expiryDays) === 1 ? '' : 's'}`
                        : `${expiryDays} día${expiryDays === 1 ? '' : 's'} restante${expiryDays === 1 ? '' : 's'}`
                      }
                    </div>
                  )}
                </div>

                {/* Activate button */}
                <button
                  onClick={() => {
                    setShowActivate(!showActivate);
                    if (!showActivate && plans.length > 0) {
                      setActivateForm({ planId: plans[0].id, price: String(plans[0].price), days: '30' });
                    }
                  }}
                  className={`mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    showActivate
                      ? 'border border-gray-200 text-gray-500 hover:bg-gray-50'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {showActivate ? 'Cancelar' : 'Activar plan manualmente'}
                </button>

                {/* Activation form */}
                {showActivate && (
                  <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">Plan</label>
                      <select
                        value={activateForm.planId}
                        onChange={e => {
                          const p = plans.find(pl => pl.id === e.target.value);
                          setActivateForm(f => ({ ...f, planId: e.target.value, price: String(p?.price ?? 0) }));
                        }}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                      >
                        {plans.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (${p.price.toLocaleString('es-AR')})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">Precio custom (ARS)</label>
                      <input
                        type="number"
                        value={activateForm.price}
                        onChange={e => setActivateForm(f => ({ ...f, price: e.target.value }))}
                        placeholder="Precio del plan"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">Duración (días)</label>
                      <input
                        type="number"
                        value={activateForm.days}
                        onChange={e => setActivateForm(f => ({ ...f, days: e.target.value }))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                      />
                    </div>
                    <button
                      onClick={activateSubscription}
                      disabled={activating || !activateForm.planId}
                      className="w-full rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-50"
                    >
                      {activating ? (
                        <span className="inline-flex items-center gap-2">
                          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                          Activando...
                        </span>
                      ) : 'Confirmar activación'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick info card */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <h2 className="mb-3 text-sm font-semibold text-gray-900">Datos rápidos</h2>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-sm">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs ${
                    doctor.verified ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {doctor.verified ? '✓' : '!'}
                  </span>
                  <span className="text-gray-700">{doctor.verified ? 'Cuenta verificada' : 'Pendiente de verificación'}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-xs text-purple-600">
                    {planConfig.icon}
                  </span>
                  <span className="text-gray-700">Plan {planConfig.label}</span>
                </div>
                {doctor.onlineConsultation && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-50 text-xs text-cyan-600">📹</span>
                    <span className="text-gray-700">Consultas online habilitadas</span>
                  </div>
                )}
                {doctor.professional?.licenseNumber && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-xs text-blue-600">🪪</span>
                    <span className="text-gray-700">Matrícula: {doctor.professional.licenseNumber}</span>
                  </div>
                )}
                {doctor.createdAt && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-50 text-xs text-gray-500">📅</span>
                    <span className="text-gray-700">{formatDate(doctor.createdAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ID card */}
            <div className="rounded-2xl bg-gray-50 px-5 py-4 ring-1 ring-gray-100">
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">ID del doctor</p>
              <p className="mt-1 font-mono text-xs text-gray-500 break-all">{doctor.id}</p>
            </div>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
