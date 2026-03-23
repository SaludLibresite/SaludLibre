'use client';

import AdminLayout from '@/components/layout/AdminLayout';
import { useAuth } from '@/components/providers/AuthProvider';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';

const LIBRARIES: ('places')[] = ['places'];

type WeekDay = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
interface DayTimeRange { from: string; to: string; }
interface DaySchedule { enabled: boolean; ranges: DayTimeRange[]; }
interface ScheduleConfig { enabled: boolean; slotDuration: number; days: Record<WeekDay, DaySchedule>; }

const WEEKDAYS: { key: WeekDay; label: string }[] = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' },
];

function emptyScheduleConfig(): ScheduleConfig {
  const days = {} as Record<WeekDay, DaySchedule>;
  for (const { key } of WEEKDAYS) {
    days[key] = { enabled: false, ranges: [{ from: '09:00', to: '13:00' }, { from: '14:00', to: '18:00' }] };
  }
  return { enabled: false, slotDuration: 30, days };
}

interface DoctorProfile {
  name: string;
  specialty: string;
  phone: string;
  description: string;
  profileImage: string;
  onlineConsultation: boolean;
  gender: string;
  schedule: string;
  scheduleConfig?: ScheduleConfig;
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
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>(emptyScheduleConfig());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [imgError, setImgError] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          if (data.scheduleConfig) {
            setScheduleConfig({ ...emptyScheduleConfig(), ...data.scheduleConfig, days: { ...emptyScheduleConfig().days, ...data.scheduleConfig.days } });
          }
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
          scheduleConfig,
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

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingPhoto(true);
    setMessage('');
    try {
      const token = await user.getIdToken();
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/doctors/me/photo', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (res.ok) {
        const data = await res.json();
        setProfile((prev) => prev ? { ...prev, profileImage: data.url } : prev);
        setImgError(false);
        setMessage('Foto actualizada correctamente');
      } else {
        const err = await res.json().catch(() => null);
        setMessage(err?.error ?? 'Error al subir la foto');
      }
    } catch {
      setMessage('Error al subir la foto');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-200 disabled:opacity-50"
                >
                  {uploadingPhoto ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Cambiar foto
                    </>
                  )}
                </button>
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
              <label className="block text-sm font-medium text-gray-700">Horarios de atención (texto libre)</label>
              <input
                type="text"
                value={profile?.schedule ?? ''}
                onChange={(e) => update('schedule', e.target.value)}
                placeholder="Ej: Lunes a Viernes 9:00 - 18:00"
                className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#4dbad9] focus:ring-2 focus:ring-[#4dbad9]/20"
              />
            </div>
          </div>

          {/* Schedule Config */}
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Configuración de Horarios</h2>
                <p className="mt-0.5 text-xs text-gray-400">Configurá los rangos horarios por día para que los pacientes puedan pedir turnos</p>
              </div>
              <button
                type="button"
                onClick={() => setScheduleConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${scheduleConfig.enabled ? 'bg-[#4dbad9]' : 'bg-gray-200'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${scheduleConfig.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {scheduleConfig.enabled && (
              <div className="mt-5 space-y-4">
                {/* Slot duration */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Duración del turno:</label>
                  <select
                    value={scheduleConfig.slotDuration}
                    onChange={(e) => setScheduleConfig((prev) => ({ ...prev, slotDuration: parseInt(e.target.value) }))}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-[#4dbad9]"
                  >
                    <option value={15}>15 min</option>
                    <option value={20}>20 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                  </select>
                </div>

                {/* Days */}
                <div className="space-y-3">
                  {WEEKDAYS.map(({ key, label }) => {
                    const day = scheduleConfig.days[key];
                    return (
                      <div key={key} className={`rounded-xl border p-4 transition ${day.enabled ? 'border-[#4dbad9]/30 bg-[#4dbad9]/5' : 'border-gray-100 bg-gray-50'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                const newDays = { ...scheduleConfig.days };
                                newDays[key] = { ...day, enabled: !day.enabled };
                                setScheduleConfig((prev) => ({ ...prev, days: newDays }));
                              }}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${day.enabled ? 'bg-[#4dbad9]' : 'bg-gray-300'}`}
                            >
                              <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${day.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                            <span className={`text-sm font-medium ${day.enabled ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
                          </div>
                          {day.enabled && day.ranges.length < 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newDays = { ...scheduleConfig.days };
                                newDays[key] = { ...day, ranges: [...day.ranges, { from: '14:00', to: '18:00' }] };
                                setScheduleConfig((prev) => ({ ...prev, days: newDays }));
                              }}
                              className="text-xs font-medium text-[#4dbad9] hover:underline"
                            >
                              + Agregar turno
                            </button>
                          )}
                        </div>

                        {day.enabled && (
                          <div className="mt-3 space-y-2">
                            {day.ranges.map((range, ri) => (
                              <div key={ri} className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 w-14">{ri === 0 ? 'Turno 1' : 'Turno 2'}</span>
                                <input
                                  type="time"
                                  value={range.from}
                                  onChange={(e) => {
                                    const newDays = { ...scheduleConfig.days };
                                    const newRanges = [...day.ranges];
                                    newRanges[ri] = { ...range, from: e.target.value };
                                    newDays[key] = { ...day, ranges: newRanges };
                                    setScheduleConfig((prev) => ({ ...prev, days: newDays }));
                                  }}
                                  className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-[#4dbad9]"
                                />
                                <span className="text-xs text-gray-400">a</span>
                                <input
                                  type="time"
                                  value={range.to}
                                  onChange={(e) => {
                                    const newDays = { ...scheduleConfig.days };
                                    const newRanges = [...day.ranges];
                                    newRanges[ri] = { ...range, to: e.target.value };
                                    newDays[key] = { ...day, ranges: newRanges };
                                    setScheduleConfig((prev) => ({ ...prev, days: newDays }));
                                  }}
                                  className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-[#4dbad9]"
                                />
                                {day.ranges.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newDays = { ...scheduleConfig.days };
                                      newDays[key] = { ...day, ranges: day.ranges.filter((_, i) => i !== ri) };
                                      setScheduleConfig((prev) => ({ ...prev, days: newDays }));
                                    }}
                                    className="ml-1 text-red-400 hover:text-red-600"
                                  >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
