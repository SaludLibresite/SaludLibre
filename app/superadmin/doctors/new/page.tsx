'use client';

import SuperAdminLayout from '@/components/layout/SuperAdminLayout';
import { useAuth } from '@/components/providers/AuthProvider';
import LocationAutocomplete from '@/src/components/shared/LocationAutocomplete';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

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

export default function SuperAdminNewDoctorPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'not_specified',
    specialty: '',
    description: '',
    schedule: '',
    onlineConsultation: false,
    verified: false,
    professional: {
      profession: '',
      licenseNumber: '',
      officeAddress: '',
    },
    location: {
      formattedAddress: '',
      latitude: 0,
      longitude: 0,
    },
  });

  useEffect(() => {
    fetch('/api/specialties')
      .then(r => r.json())
      .then(d => setSpecialties(d.specialties ?? []))
      .catch(() => {});
  }, []);

  function updateForm(field: string, value: unknown) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function updateProfessional(field: string, value: string) {
    setForm(f => ({ ...f, professional: { ...f.professional, [field]: value } }));
  }

  const onLocationSelect = useCallback((loc: { latitude: number; longitude: number; formattedAddress: string }) => {
    setForm(f => ({
      ...f,
      location: loc,
      professional: { ...f.professional, officeAddress: loc.formattedAddress },
    }));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Nombre y email son obligatorios');
      return;
    }

    setSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/superadmin/doctors', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('Doctor creado exitosamente');
        router.push(`/superadmin/doctors/${data.doctor?.id ?? ''}`);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? 'Error al crear doctor');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SuperAdminLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Back nav */}
        <button onClick={() => router.push('/superadmin/doctors')} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Doctores
        </button>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Doctor</h1>
          <p className="mt-1 text-sm text-gray-500">Complete los datos para dar de alta un nuevo doctor en la plataforma.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-sm font-semibold text-gray-900">Información básica</h2>
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Nombre completo *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => updateForm('name', e.target.value)}
                  placeholder="Dr. Juan García"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => updateForm('email', e.target.value)}
                  placeholder="doctor@email.com"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Teléfono</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => updateForm('phone', e.target.value)}
                  placeholder="+54 11 1234-5678"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Género</label>
                <select
                  value={form.gender}
                  onChange={e => updateForm('gender', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400"
                >
                  {GENDERS.map(g => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Especialidad</label>
                <select
                  value={form.specialty}
                  onChange={e => updateForm('specialty', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400"
                >
                  <option value="">Seleccionar especialidad</option>
                  {specialties.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Descripción / Biografía</label>
                <textarea
                  value={form.description}
                  onChange={e => updateForm('description', e.target.value)}
                  rows={3}
                  placeholder="Breve descripción profesional del doctor..."
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50"
                />
              </div>
            </div>
          </div>

          {/* Professional Info */}
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-sm font-semibold text-gray-900">Información profesional</h2>
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Profesión</label>
                <input
                  type="text"
                  value={form.professional.profession}
                  onChange={e => updateProfessional('profession', e.target.value)}
                  placeholder="Médico, Kinesiólogo, etc."
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Matrícula</label>
                <input
                  type="text"
                  value={form.professional.licenseNumber}
                  onChange={e => updateProfessional('licenseNumber', e.target.value)}
                  placeholder="MP 12345"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Domicilio profesional</label>
                <LocationAutocomplete
                  defaultValue={form.professional.officeAddress}
                  onSelect={onLocationSelect}
                  placeholder="Av. Corrientes 1234, CABA"
                />
                {form.location.formattedAddress && (
                  <p className="mt-2 text-xs text-gray-500">📍 {form.location.formattedAddress}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Horario de atención</label>
                <input
                  type="text"
                  value={form.schedule}
                  onChange={e => updateForm('schedule', e.target.value)}
                  placeholder="Lunes a Viernes 9:00 - 18:00"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50"
                />
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-sm font-semibold text-gray-900">Opciones</h2>
            </div>
            <div className="divide-y divide-gray-50 px-6">
              <label className="flex items-center justify-between py-4 cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-gray-900">Consulta online</p>
                  <p className="text-xs text-gray-400">Puede atender pacientes por videollamada</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.onlineConsultation}
                  onClick={() => updateForm('onlineConsultation', !form.onlineConsultation)}
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${form.onlineConsultation ? 'bg-purple-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform mt-0.5 ${form.onlineConsultation ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                </button>
              </label>
              <label className="flex items-center justify-between py-4 cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-gray-900">Verificado</p>
                  <p className="text-xs text-gray-400">Marcarlo como verificado desde el inicio</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.verified}
                  onClick={() => updateForm('verified', !form.verified)}
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${form.verified ? 'bg-green-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform mt-0.5 ${form.verified ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                </button>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push('/superadmin/doctors')}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Creando...
                </>
              ) : 'Crear Doctor'}
            </button>
          </div>
        </form>
      </div>
    </SuperAdminLayout>
  );
}
