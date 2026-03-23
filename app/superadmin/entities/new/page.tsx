'use client';

import SuperAdminLayout from '@/components/layout/SuperAdminLayout';
import { useAuth } from '@/components/providers/AuthProvider';
import LocationAutocomplete from '@/src/components/shared/LocationAutocomplete';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

const ENTITY_TYPES = [
  { value: 'centro_medico', label: 'Centro Médico' },
  { value: 'farmacia', label: 'Farmacia' },
  { value: 'laboratorio', label: 'Laboratorio' },
];

export default function SuperAdminNewEntityPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    type: 'centro_medico',
    name: '',
    email: '',
    phone: '',
    description: '',
    schedule: '',
    website: '',
    verified: false,
    location: {
      formattedAddress: '',
      latitude: 0,
      longitude: 0,
    },
  });

  function updateForm(field: string, value: unknown) {
    setForm(f => ({ ...f, [field]: value }));
  }

  const onLocationSelect = useCallback((loc: { latitude: number; longitude: number; formattedAddress: string }) => {
    setForm(f => ({ ...f, location: loc }));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!form.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    setSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/superadmin/entities', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('Entidad creada exitosamente');
        router.push(`/superadmin/entities/${data.entity?.id ?? ''}`);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? 'Error al crear entidad');
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
        <button onClick={() => router.push('/superadmin/entities')} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Entidades
        </button>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva Entidad</h1>
          <p className="mt-1 text-sm text-gray-500">Complete los datos para dar de alta una nueva entidad.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo */}
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-sm font-semibold text-gray-900">Tipo de entidad</h2>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-3">
                {ENTITY_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => updateForm('type', t.value)}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                      form.type === t.value
                        ? 'border-purple-400 bg-purple-50 text-purple-700 ring-2 ring-purple-200/50'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-sm font-semibold text-gray-900">Información general</h2>
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Nombre *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => updateForm('name', e.target.value)}
                  placeholder="Nombre de la entidad"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => updateForm('email', e.target.value)}
                  placeholder="contacto@entidad.com"
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
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Sitio web</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={e => updateForm('website', e.target.value)}
                  placeholder="https://www.entidad.com"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Horario de atención</label>
                <input
                  type="text"
                  value={form.schedule}
                  onChange={e => updateForm('schedule', e.target.value)}
                  placeholder="Lunes a Viernes 9:00 - 18:00"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={e => updateForm('description', e.target.value)}
                  rows={3}
                  placeholder="Breve descripción de la entidad..."
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Dirección</label>
                <LocationAutocomplete
                  defaultValue={form.location.formattedAddress}
                  onSelect={onLocationSelect}
                  placeholder="Av. Santa Fe 1234, CABA, Buenos Aires"
                />
                {form.location.formattedAddress && (
                  <p className="mt-2 text-xs text-gray-500">📍 {form.location.formattedAddress}</p>
                )}
              </div>
            </div>
          </div>

          {/* Verificado */}
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
            <div className="px-6 py-4">
              <label className="flex items-center justify-between cursor-pointer">
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
              onClick={() => router.push('/superadmin/entities')}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Creando...
                </>
              ) : (
                'Crear entidad'
              )}
            </button>
          </div>
        </form>
      </div>
    </SuperAdminLayout>
  );
}
