'use client';

import AdminLayout from '@/components/layout/AdminLayout';
import { useAuth } from '@/components/providers/AuthProvider';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';

const LIBRARIES: ('places')[] = ['places'];

interface DoctorProfile {
  name: string;
  specialty: string;
  phone: string;
  description: string;
  profileImage: string;
  onlineConsultation: boolean;
  gender: string;
  schedule: string;
  location: { latitude?: number; longitude?: number; formattedAddress?: string };
  professional: {
    profession: string;
    licenseNumber: string;
    officeAddress: string;
  };
}

export default function AdminProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [imgError, setImgError] = useState(false);

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    libraries: LIBRARIES,
  });

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const token = await user!.getIdToken();
        const res = await fetch('/api/doctors/me', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch { /* ignore */ } finally { setLoading(false); }
    }
    load();
  }, [user]);

  const onPlaceSelected = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.geometry?.location) return;
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const addr = place.formatted_address ?? '';
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            location: { latitude: lat, longitude: lng, formattedAddress: addr },
            professional: { ...prev.professional, officeAddress: addr },
          }
        : prev,
    );
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile) return;
    setSaving(true);
    setMessage('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/doctors/me', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          specialty: profile.specialty,
          phone: profile.phone,
          description: profile.description,
          onlineConsultation: profile.onlineConsultation,
          gender: profile.gender,
          schedule: profile.schedule,
          professional: profile.professional,
          location: profile.location,
        }),
      });
      setMessage(res.ok ? 'Perfil actualizado correctamente' : 'Error al guardar');
    } catch {
      setMessage('Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  function update<K extends keyof DoctorProfile>(key: K, value: DoctorProfile[K]) {
    setProfile((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function updateProfessional(key: keyof DoctorProfile['professional'], value: string) {
    setProfile((prev) => (prev ? { ...prev, professional: { ...prev.professional, [key]: value } } : prev));
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#4dbad9]" />
        </div>
      </AdminLayout>
    );
  }

  const initials = profile?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <AdminLayout>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="mt-1 text-sm text-gray-500">Administrá tu información profesional</p>

        {message && (
          <div
            className={`mt-4 rounded-lg px-4 py-3 text-sm ${
              message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="mt-6 space-y-6">
          {/* Photo + basic info */}
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Información básica</h2>

            <div className="mt-4 flex items-center gap-4">
              {profile?.profileImage && !imgError ? (
                <img
                  src={profile.profileImage}
                  alt={profile.name}
                  className="h-20 w-20 rounded-xl object-cover"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-[#4dbad9]/10 text-xl font-bold text-[#4dbad9]">
                  {initials ?? '?'}
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">{profile?.name}</p>
                <p className="text-sm text-gray-500">{profile?.specialty}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre completo</label>
                <input
                  type="text"
                  value={profile?.name ?? ''}
                  onChange={(e) => update('name', e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#4dbad9] focus:ring-2 focus:ring-[#4dbad9]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Especialidad</label>
                <input
                  type="text"
                  value={profile?.specialty ?? ''}
                  onChange={(e) => update('specialty', e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#4dbad9] focus:ring-2 focus:ring-[#4dbad9]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                <input
                  type="tel"
                  value={profile?.phone ?? ''}
                  onChange={(e) => update('phone', e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#4dbad9] focus:ring-2 focus:ring-[#4dbad9]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Género</label>
                <select
                  value={profile?.gender ?? ''}
                  onChange={(e) => update('gender', e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#4dbad9] focus:ring-2 focus:ring-[#4dbad9]/20"
                >
                  <option value="">Seleccionar</option>
                  <option value="male">Masculino</option>
                  <option value="female">Femenino</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="online"
                  checked={profile?.onlineConsultation ?? false}
                  onChange={(e) => update('onlineConsultation', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#4dbad9] focus:ring-[#4dbad9]"
                />
                <label htmlFor="online" className="text-sm text-gray-700">
                  Ofrezco consultas online
                </label>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Descripción / Biografía</label>
              <textarea
                rows={3}
                value={profile?.description ?? ''}
                onChange={(e) => update('description', e.target.value)}
                className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#4dbad9] focus:ring-2 focus:ring-[#4dbad9]/20"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Horarios de atención</label>
              <input
                type="text"
                value={profile?.schedule ?? ''}
                onChange={(e) => update('schedule', e.target.value)}
                placeholder="Ej: Lunes a Viernes 9:00 - 18:00"
                className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#4dbad9] focus:ring-2 focus:ring-[#4dbad9]/20"
              />
            </div>
          </div>

          {/* Professional info */}
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Información profesional</h2>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Matrícula</label>
              <input
                type="text"
                value={profile?.professional?.licenseNumber ?? ''}
                onChange={(e) => updateProfessional('licenseNumber', e.target.value)}
                className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#4dbad9] focus:ring-2 focus:ring-[#4dbad9]/20"
              />
            </div>
          </div>

          {/* Location with Google Autocomplete */}
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Ubicación del consultorio</h2>
            <p className="mt-1 text-xs text-gray-400">Buscá la dirección y seleccioná una opción del listado</p>
            <div className="mt-4">
              {isLoaded ? (
                <Autocomplete
                  onLoad={(ac) => { autocompleteRef.current = ac; }}
                  onPlaceChanged={onPlaceSelected}
                  options={{ componentRestrictions: { country: 'ar' }, types: ['address'] }}
                >
                  <input
                    type="text"
                    defaultValue={profile?.location?.formattedAddress ?? profile?.professional?.officeAddress ?? ''}
                    placeholder="Escribí una dirección..."
                    className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#4dbad9] focus:ring-2 focus:ring-[#4dbad9]/20"
                  />
                </Autocomplete>
              ) : (
                <input
                  type="text"
                  value={profile?.location?.formattedAddress ?? ''}
                  readOnly
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500"
                />
              )}
              {profile?.location?.formattedAddress && (
                <p className="mt-2 text-sm text-gray-500">📍 {profile.location.formattedAddress}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#4dbad9] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#3da8c5] disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
