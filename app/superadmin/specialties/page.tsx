'use client';

import SuperAdminLayout from '@/components/layout/SuperAdminLayout';
import { useAuth } from '@/components/providers/AuthProvider';
import { useEffect, useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

interface Specialty {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  imagePath: string;
  isActive: boolean;
  createdAt?: string;
}

type ViewMode = 'grid' | 'table';

const PER_PAGE = 12;
const FALLBACK_IMG = '/img/doctor-1.jpg';

export default function SuperAdminSpecialtiesPage() {
  const { user } = useAuth();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [page, setPage] = useState(1);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Specialty | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', isActive: true });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Specialty | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const getToken = useCallback(async () => {
    if (!user) return null;
    return user.getIdToken();
  }, [user]);

  async function loadSpecialties() {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch('/api/superadmin/specialties', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSpecialties(data.specialties ?? []);
      }
    } catch { /* */ } finally { setLoading(false); }
  }

  useEffect(() => { loadSpecialties(); }, [user]);

  // Filter + paginate
  const filtered = specialties.filter(s =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const activeCount = specialties.filter(s => s.isActive !== false).length;
  const inactiveCount = specialties.length - activeCount;

  // Reset page on search
  useEffect(() => { setPage(1); }, [searchTerm]);

  // ── Modal helpers ──
  function openCreate() {
    setEditing(null);
    setFormData({ title: '', description: '', isActive: true });
    setSelectedFile(null);
    setImagePreview('');
    setShowModal(true);
  }

  function openEdit(spec: Specialty) {
    setEditing(spec);
    setFormData({ title: spec.title, description: spec.description, isActive: spec.isActive });
    setSelectedFile(null);
    setImagePreview(spec.imageUrl || '');
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);
    setSelectedFile(null);
    setImagePreview('');
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Solo se permiten imágenes JPG, PNG o WebP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar 5 MB');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title.trim()) return;
    const token = await getToken();
    if (!token) return;
    setSaving(true);

    try {
      const fd = new FormData();
      fd.append('title', formData.title.trim());
      fd.append('description', formData.description.trim());
      fd.append('isActive', String(formData.isActive));
      if (selectedFile) fd.append('image', selectedFile);

      const url = editing
        ? `/api/superadmin/specialties/${editing.id}`
        : '/api/superadmin/specialties';

      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      if (res.ok) {
        toast.success(editing ? 'Especialidad actualizada' : 'Especialidad creada');
        closeModal();
        setLoading(true);
        await loadSpecialties();
      } else {
        toast.error('Error al guardar');
      }
    } catch { toast.error('Error al guardar'); } finally { setSaving(false); }
  }

  async function toggleActive(spec: Specialty) {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch(`/api/superadmin/specialties/${spec.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !spec.isActive }),
      });
      if (res.ok) {
        setSpecialties(prev => prev.map(s => s.id === spec.id ? { ...s, isActive: !s.isActive } : s));
        toast.success(spec.isActive ? 'Desactivada' : 'Activada');
      }
    } catch { toast.error('Error'); }
  }

  function openDeleteModal(spec: Specialty) {
    setDeleteTarget(spec);
    setDeleteConfirmText('');
  }

  function closeDeleteModal() {
    setDeleteTarget(null);
    setDeleteConfirmText('');
  }

  async function handlePermanentDelete() {
    if (!deleteTarget) return;
    const token = await getToken();
    if (!token) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/superadmin/specialties/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSpecialties(prev => prev.filter(s => s.id !== deleteTarget.id));
        toast.success('Especialidad eliminada permanentemente');
        closeDeleteModal();
      } else {
        toast.error('Error al eliminar');
      }
    } catch { toast.error('Error al eliminar'); } finally { setDeleting(false); }
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Especialidades</h1>
            <p className="mt-1 text-sm text-gray-500">
              {specialties.length} total · {activeCount} activas · {inactiveCount} inactivas
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Nueva especialidad
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{specialties.length}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
                <p className="text-xs text-gray-500">Activas</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{inactiveCount}</p>
                <p className="text-xs text-gray-500">Inactivas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar: search + view toggle */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Buscar especialidades..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50"
            />
          </div>
          <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <svg className="inline-block h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              {' '}Tarjetas
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${viewMode === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <svg className="inline-block h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              {' '}Tabla
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-gray-100 h-64" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-white py-16 text-center shadow-sm ring-1 ring-gray-100">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
            <p className="mt-3 text-gray-500">{searchTerm ? 'Sin resultados para la búsqueda' : 'No hay especialidades'}</p>
            {!searchTerm && (
              <button onClick={openCreate} className="mt-4 text-sm font-medium text-purple-600 hover:underline">
                Crear la primera especialidad
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* ── Grid View ── */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginated.map(spec => (
              <div
                key={spec.id}
                className={`group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition hover:shadow-md ${!spec.isActive ? 'opacity-60' : ''}`}
              >
                {/* Image */}
                <div className="relative h-40 overflow-hidden bg-gray-100">
                  <img
                    src={spec.imageUrl || FALLBACK_IMG}
                    alt={spec.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                  />
                  {/* Status badge */}
                  <div className="absolute left-3 top-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-sm ${
                      spec.isActive ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${spec.isActive ? 'bg-green-200' : 'bg-red-200'}`} />
                      {spec.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  {/* Hover actions */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => openEdit(spec)}
                      className="rounded-xl bg-white/90 px-4 py-2 text-xs font-semibold text-gray-900 shadow-sm hover:bg-white transition"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => toggleActive(spec)}
                      className={`rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition ${
                        spec.isActive ? 'bg-red-500/90 text-white hover:bg-red-600' : 'bg-green-500/90 text-white hover:bg-green-600'
                      }`}
                    >
                      {spec.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => openDeleteModal(spec)}
                      className="rounded-xl bg-red-600/90 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900">{spec.title}</h3>
                  <p className="mt-1 text-xs text-gray-500 line-clamp-2">{spec.description || 'Sin descripción'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── Table View ── */
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-400">Imagen</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-400">Especialidad</th>
                  <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase text-gray-400 md:table-cell">Descripción</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-400">Estado</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-gray-400">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map(spec => (
                  <tr key={spec.id} className={`hover:bg-gray-50/50 transition ${!spec.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                        <img
                          src={spec.imageUrl || FALLBACK_IMG}
                          alt={spec.title}
                          className="h-full w-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{spec.title}</p>
                    </td>
                    <td className="hidden px-5 py-3 md:table-cell">
                      <p className="max-w-xs text-sm text-gray-500 line-clamp-2">{spec.description || '—'}</p>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => toggleActive(spec)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition ${
                          spec.isActive
                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${spec.isActive ? 'bg-green-500' : 'bg-red-400'}`} />
                        {spec.isActive ? 'Activa' : 'Inactiva'}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(spec)}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-purple-600 hover:bg-purple-50 transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => openDeleteModal(spec)}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between rounded-2xl bg-white px-5 py-3 shadow-sm ring-1 ring-gray-100">
            <p className="text-xs text-gray-500">
              {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} de {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition disabled:opacity-30"
              >
                ← Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => {
                  const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                  return (
                    <span key={p}>
                      {showEllipsis && <span className="px-1 text-xs text-gray-300">…</span>}
                      <button
                        onClick={() => setPage(p)}
                        className={`min-w-8 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                          p === page ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  );
                })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition disabled:opacity-30"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Create/Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={closeModal}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? 'Editar especialidad' : 'Nueva especialidad'}
              </h2>
              <button onClick={closeModal} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSave} className="space-y-5 p-6">
              {/* Image upload */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Imagen</label>
                <div className="flex items-start gap-4">
                  {/* Preview */}
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                    )}
                  </div>
                  {/* Upload controls */}
                  <div className="flex-1 space-y-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      {selectedFile ? 'Cambiar imagen' : 'Subir imagen'}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <p className="text-[11px] text-gray-400">JPG, PNG o WebP. Máx 5 MB.</p>
                    {selectedFile && (
                      <button
                        type="button"
                        onClick={() => { setSelectedFile(null); setImagePreview(editing?.imageUrl || ''); }}
                        className="text-xs font-medium text-red-500 hover:text-red-700"
                      >
                        Cancelar nueva imagen
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nombre <span className="text-red-400">*</span>
                </label>
                <input
                  value={formData.title}
                  onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
                  required
                  placeholder="Ej: Cardiología"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Describe la especialidad médica..."
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50 resize-none"
                />
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData(f => ({ ...f, isActive: e.target.checked }))}
                    className="sr-only"
                  />
                  <div className={`h-6 w-11 rounded-full transition ${formData.isActive ? 'bg-purple-600' : 'bg-gray-200'}`} />
                  <div className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${formData.isActive ? 'translate-x-5' : ''}`} />
                </div>
                <span className="text-sm text-gray-700">
                  {formData.isActive ? 'Activa — Visible en el sitio' : 'Inactiva — Oculta del sitio'}
                </span>
              </label>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !formData.title.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Guardando...
                    </>
                  ) : editing ? 'Actualizar' : 'Crear especialidad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={closeDeleteModal}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
              </div>
              <h3 className="mt-4 text-center text-lg font-semibold text-gray-900">Eliminar especialidad</h3>
              <p className="mt-2 text-center text-sm text-gray-500">
                Esta acción es <strong className="text-red-600">permanente</strong> y no se puede deshacer. Para confirmar, escribí el nombre de la especialidad:
              </p>
              <p className="mt-2 text-center text-sm font-semibold font-mono text-gray-900 select-none">{deleteTarget.title}</p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="Escribí el nombre aquí..."
                className="mt-3 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-200/50"
                autoFocus
              />
              <div className="mt-5 flex gap-3">
                <button
                  onClick={closeDeleteModal}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePermanentDelete}
                  disabled={deleteConfirmText !== deleteTarget.title || deleting}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Eliminando...' : 'Eliminar permanentemente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}
