'use client';

import SuperAdminLayout from '@/components/layout/SuperAdminLayout';
import { useAuth } from '@/components/providers/AuthProvider';
import LocationAutocomplete from '@/src/components/shared/LocationAutocomplete';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface Entity {
  id: string;
  type: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  description: string;
  profileImage: string;
  schedule: string;
  location: { latitude: number; longitude: number; formattedAddress: string };
  website: string;
  verified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const TYPE_LABELS: Record<string, { label: string; color: string; dot: string }> = {
  centro_medico: { label: 'Centro Médico', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  farmacia: { label: 'Farmacia', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  laboratorio: { label: 'Laboratorio', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
};

const ENTITY_TYPES = [
  { value: 'centro_medico', label: 'Centro Médico' },
  { value: 'farmacia', label: 'Farmacia' },
  { value: 'laboratorio', label: 'Laboratorio' },
];

function InfoRow({ icon, label, value }: { icon: string; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="mt-0.5 text-base">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">{label}</p>
        <p className="text-sm text-gray-700 break-words">{value}</p>
      </div>
    </div>
  );
}

export default function SuperAdminEntityDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const entityId = params.id as string;

  const [entity, setEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    type: '',
    name: '',
    email: '',
    phone: '',
    description: '',
    schedule: '',
    website: '',
    verified: false,
    location: { formattedAddress: '', latitude: 0, longitude: 0 },
  });

  useEffect(() => {
    if (!user || !entityId) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/superadmin/entities/${entityId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setEntity(data.entity ?? null);
        }
      } catch { /* */ } finally { setLoading(false); }
    })();
  }, [user, entityId]);

  function startEditing() {
    if (!entity) return;
    setEditForm({
      type: entity.type,
      name: entity.name,
      email: entity.email,
      phone: entity.phone,
      description: entity.description,
      schedule: entity.schedule,
      website: entity.website,
      verified: entity.verified,
      location: entity.location ?? { formattedAddress: '', latitude: 0, longitude: 0 },
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
    if (!user || !entity) return;
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/superadmin/entities/${entity.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setEntity(prev => prev ? { ...prev, ...editForm } : prev);
        setEditing(false);
        toast.success('Entidad actualizada');
      } else {
        toast.error('Error al guardar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  }

  async function handleVerify() {
    if (!user || !entity) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/superadmin/entities/${entity.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify' }),
      });
      if (res.ok) {
        setEntity(prev => prev ? { ...prev, verified: true } : prev);
        toast.success('Entidad verificada');
      }
    } catch {
      toast.error('Error al verificar');
    }
  }

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-purple-600" />
        </div>
      </SuperAdminLayout>
    );
  }

  if (!entity) {
    return (
      <SuperAdminLayout>
        <div className="py-20 text-center">
          <p className="text-gray-500">Entidad no encontrada</p>
          <button onClick={() => router.push('/superadmin/entities')} className="mt-4 text-purple-600 hover:underline text-sm">Volver al listado</button>
        </div>
      </SuperAdminLayout>
    );
  }

  const t = TYPE_LABELS[entity.type] ?? { label: entity.type, color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };

  return (
    <SuperAdminLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Back nav */}
        <button onClick={() => router.push('/superadmin/entities')} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Entidades
        </button>

        {/* Hero */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
          <div className="h-24 bg-gradient-to-r from-purple-600 to-blue-500" />
          <div className="relative px-6 pb-6">
            <div className="-mt-10 flex items-end gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-gray-100 text-2xl font-bold text-gray-400 shadow-sm">
                {entity.profileImage ? (
                  <img src={entity.profileImage} alt={entity.name} className="h-full w-full rounded-xl object-cover" referrerPolicy="no-referrer" />
                ) : (
                  entity.name?.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1 pt-2">
                <h1 className="text-xl font-bold text-gray-900">{entity.name}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${t.color}`}>
                    <span className={`h-2 w-2 rounded-full ${t.dot}`} />
                    {t.label}
                  </span>
                  {entity.verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">✓ Verificado</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">Pendiente</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/entidades/${entity.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  Ver perfil
                </a>
                <button
                  onClick={editing ? cancelEditing : startEditing}
                  className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${editing ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-purple-200 text-purple-600 hover:bg-purple-50'}`}
                >
                  {editing ? 'Cancelar edición' : 'Editar'}
                </button>
                {!entity.verified && (
                  <button
                    onClick={handleVerify}
                    className="rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 transition"
                  >
                    Verificar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main info */}
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="mb-4 text-sm font-semibold text-gray-900">Información de contacto</h2>
              {editing ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-medium text-gray-500">Nombre</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-500">Tipo</label>
                    <select
                      value={editForm.type}
                      onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400"
                    >
                      {ENTITY_TYPES.map(et => (
                        <option key={et.value} value={et.value}>{et.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-500">Email</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-500">Teléfono</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-500">Sitio web</label>
                    <input
                      type="url"
                      value={editForm.website}
                      onChange={e => setEditForm(f => ({ ...f, website: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-500">Horario</label>
                    <input
                      type="text"
                      value={editForm.schedule}
                      onChange={e => setEditForm(f => ({ ...f, schedule: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-medium text-gray-500">Dirección</label>
                    <LocationAutocomplete
                      defaultValue={editForm.location.formattedAddress}
                      onSelect={onEditLocationSelect}
                      placeholder="Buscar dirección..."
                    />
                    {editForm.location.formattedAddress && (
                      <p className="mt-2 text-xs text-gray-500">📍 {editForm.location.formattedAddress}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.verified}
                        onChange={e => setEditForm(f => ({ ...f, verified: e.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300 text-green-600"
                      />
                      <span className="text-sm text-gray-700">Verificado</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  <InfoRow icon="📧" label="Email" value={entity.email} />
                  <InfoRow icon="📞" label="Teléfono" value={entity.phone} />
                  <InfoRow icon="🌐" label="Sitio web" value={entity.website} />
                  <InfoRow icon="🕐" label="Horario" value={entity.schedule} />
                  <InfoRow icon="📍" label="Dirección" value={entity.location?.formattedAddress} />
                </div>
              )}

              {editing && (
                <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                  <button onClick={cancelEditing} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
                  <button
                    onClick={saveEditing}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition disabled:opacity-60"
                  >
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              )}
            </div>

            {/* Description */}
            {(editing || entity.description) && (
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <h2 className="mb-3 text-sm font-semibold text-gray-900">Descripción</h2>
                {editing ? (
                  <textarea
                    value={editForm.description}
                    onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                    rows={4}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50"
                  />
                ) : (
                  <p className="text-sm leading-relaxed text-gray-600">{entity.description}</p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Detalles</h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-gray-400">ID</dt>
                  <dd className="mt-0.5 font-mono text-xs text-gray-600 break-all">{entity.id}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">Slug</dt>
                  <dd className="mt-0.5 font-mono text-xs text-gray-600 break-all">{entity.slug}</dd>
                </div>
                {entity.createdAt && (
                  <div>
                    <dt className="text-xs text-gray-400">Creado</dt>
                    <dd className="mt-0.5 text-xs text-gray-600">{new Date(entity.createdAt).toLocaleDateString('es-AR')}</dd>
                  </div>
                )}
                {entity.updatedAt && (
                  <div>
                    <dt className="text-xs text-gray-400">Actualizado</dt>
                    <dd className="mt-0.5 text-xs text-gray-600">{new Date(entity.updatedAt).toLocaleDateString('es-AR')}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
