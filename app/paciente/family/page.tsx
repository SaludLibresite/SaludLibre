'use client';

import PatientLayout from '@/components/layout/PatientLayout';
import { useFamily } from '@/components/providers/FamilyContext';
import { useAuth } from '@/components/providers/AuthProvider';
import { useState } from 'react';
import toast from 'react-hot-toast';
import type { FamilyMember } from '@/src/modules/patients/domain/FamilyMemberEntity';

const RELATIONSHIPS = [
  'Hijo/a', 'Esposo/a', 'Padre', 'Madre', 'Hermano/a', 'Abuelo/a', 'Nieto/a', 'Sobrino/a', 'Tío/a', 'Primo/a', 'Otro',
];

const GENDERS = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Femenino' },
  { value: 'other', label: 'Otro' },
];

const INPUT = 'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition';
const LABEL = 'mb-1 block text-sm font-medium text-gray-700';

interface FormState {
  name: string;
  relationship: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  allergies: string;
  currentMedications: string;
  insuranceProvider: string;
  insuranceNumber: string;
  emergencyContact: string;
  emergencyPhone: string;
}

const emptyForm: FormState = {
  name: '', relationship: '', dateOfBirth: '', gender: 'other',
  phone: '', email: '', allergies: '', currentMedications: '',
  insuranceProvider: '', insuranceNumber: '', emergencyContact: '', emergencyPhone: '',
};

function toDateInput(val: unknown): string {
  if (!val) return '';
  const d = val instanceof Date ? val : new Date(val as string);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function memberToForm(m: FamilyMember): FormState {
  return {
    name: m.name ?? '',
    relationship: m.relationship ?? '',
    dateOfBirth: toDateInput(m.dateOfBirth),
    gender: m.gender ?? 'other',
    phone: m.phone ?? '',
    email: m.email ?? '',
    allergies: m.allergies ?? '',
    currentMedications: m.currentMedications ?? '',
    insuranceProvider: m.insuranceProvider ?? '',
    insuranceNumber: m.insuranceNumber ?? '',
    emergencyContact: m.emergencyContact ?? '',
    emergencyPhone: m.emergencyPhone ?? '',
  };
}

function calcAge(dob: string): string {
  if (!dob) return '';
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
  return `${age} años`;
}

export default function FamilyPage() {
  const { user } = useAuth();
  const { familyMembers, loading, reload } = useFamily();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<FamilyMember | null>(null);

  function update(key: keyof FormState, val: string) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  function openAdd() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(m: FamilyMember) {
    setForm(memberToForm(m));
    setEditingId(m.id);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function getHeaders() {
    const token = await user!.getIdToken();
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return; }
    if (!form.relationship) { toast.error('Seleccioná la relación familiar'); return; }
    if (!form.dateOfBirth) { toast.error('La fecha de nacimiento es obligatoria'); return; }

    setSaving(true);
    try {
      const headers = await getHeaders();
      const body = { ...form, dateOfBirth: form.dateOfBirth };

      if (editingId) {
        const res = await fetch(`/api/patients/me/family/${editingId}`, {
          method: 'PATCH', headers, body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('Error al actualizar');
        toast.success('Familiar actualizado');
      } else {
        const res = await fetch('/api/patients/me/family', {
          method: 'POST', headers, body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('Error al agregar');
        toast.success('Familiar agregado');
      }
      reload();
      closeForm();
    } catch {
      toast.error('No se pudo guardar. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(member: FamilyMember) {
    setDeletingId(member.id);
    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/patients/me/family/${member.id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('Error al eliminar');
      toast.success(`${member.name} eliminado/a`);
      reload();
    } catch {
      toast.error('No se pudo eliminar');
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  }

  return (
    <PatientLayout>
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Grupo Familiar</h1>
            <p className="mt-1 text-sm text-gray-500">
              Administrá los miembros de tu familia para agendar turnos en su nombre.
            </p>
          </div>
          {!showForm && (
            <button onClick={openAdd}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 transition shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Agregar familiar
            </button>
          )}
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingId ? 'Editar familiar' : 'Nuevo familiar'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={LABEL}>Nombre completo <span className="text-red-500">*</span></label>
                <input className={INPUT} value={form.name} onChange={e => update('name', e.target.value)} placeholder="Nombre y apellido" />
              </div>

              <div>
                <label className={LABEL}>Relación <span className="text-red-500">*</span></label>
                <select className={INPUT} value={form.relationship} onChange={e => update('relationship', e.target.value)}>
                  <option value="">Seleccionar…</option>
                  {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className={LABEL}>Género</label>
                <select className={INPUT} value={form.gender} onChange={e => update('gender', e.target.value)}>
                  {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>

              <div>
                <label className={LABEL}>Fecha de nacimiento <span className="text-red-500">*</span></label>
                <input type="date" className={INPUT} value={form.dateOfBirth} onChange={e => update('dateOfBirth', e.target.value)} />
              </div>

              <div>
                <label className={LABEL}>Teléfono</label>
                <input type="tel" className={INPUT} value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+54 11 0000-0000" />
              </div>

              <div>
                <label className={LABEL}>Email</label>
                <input type="email" className={INPUT} value={form.email} onChange={e => update('email', e.target.value)} placeholder="email@ejemplo.com" />
              </div>

              <div>
                <label className={LABEL}>Obra social / Prepaga</label>
                <input className={INPUT} value={form.insuranceProvider} onChange={e => update('insuranceProvider', e.target.value)} placeholder="Ej: OSDE, Swiss Medical" />
              </div>

              <div>
                <label className={LABEL}>N° de afiliado</label>
                <input className={INPUT} value={form.insuranceNumber} onChange={e => update('insuranceNumber', e.target.value)} placeholder="N° de afiliado" />
              </div>

              <div className="sm:col-span-2">
                <label className={LABEL}>Alergias</label>
                <input className={INPUT} value={form.allergies} onChange={e => update('allergies', e.target.value)} placeholder="Ej: Penicilina, Ibuprofeno…" />
              </div>

              <div className="sm:col-span-2">
                <label className={LABEL}>Medicamentos actuales</label>
                <input className={INPUT} value={form.currentMedications} onChange={e => update('currentMedications', e.target.value)} placeholder="Ej: Losartán 50mg…" />
              </div>

              <div>
                <label className={LABEL}>Contacto de emergencia</label>
                <input className={INPUT} value={form.emergencyContact} onChange={e => update('emergencyContact', e.target.value)} placeholder="Nombre" />
              </div>

              <div>
                <label className={LABEL}>Tel. emergencia</label>
                <input type="tel" className={INPUT} value={form.emergencyPhone} onChange={e => update('emergencyPhone', e.target.value)} placeholder="+54 11 0000-0000" />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button onClick={handleSave} disabled={saving}
                className="rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50 transition">
                {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Agregar familiar'}
              </button>
              <button onClick={closeForm}
                className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Members list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />
          </div>
        ) : familyMembers.length === 0 && !showForm ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-100">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Sin familiares registrados</h3>
            <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">Agregá miembros de tu familia para poder agendar turnos y gestionar su salud desde tu cuenta.</p>
            <button onClick={openAdd}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 transition">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Agregar mi primer familiar
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {familyMembers.map(m => (
              <div key={m.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-700 font-bold text-lg">
                      {m.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{m.name}</h3>
                      <p className="text-sm text-gray-500">
                        {m.relationship}
                        {m.dateOfBirth ? ` · ${calcAge(typeof m.dateOfBirth === 'string' ? m.dateOfBirth : new Date(m.dateOfBirth).toISOString())}` : ''}
                        {m.gender === 'male' ? ' · Masculino' : m.gender === 'female' ? ' · Femenino' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => openEdit(m)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition" title="Editar">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => setConfirmDelete(m)} disabled={deletingId === m.id}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50" title="Eliminar">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>

                {/* Details row */}
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500">
                  {m.phone && <span className="flex items-center gap-1">📞 {m.phone}</span>}
                  {m.email && <span className="flex items-center gap-1">✉️ {m.email}</span>}
                  {m.insuranceProvider && <span className="flex items-center gap-1">🏥 {m.insuranceProvider}{m.insuranceNumber ? ` (${m.insuranceNumber})` : ''}</span>}
                  {m.allergies && <span className="flex items-center gap-1">⚠️ {m.allergies}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
              </div>
              <h3 className="text-center text-lg font-semibold text-gray-900">Eliminar familiar</h3>
              <p className="mt-2 text-center text-sm text-gray-500">
                ¿Estás seguro de que querés eliminar a <strong>{confirmDelete.name}</strong>? Esta acción no se puede deshacer.
              </p>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setConfirmDelete(null)}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                  Cancelar
                </button>
                <button onClick={() => handleDelete(confirmDelete)} disabled={deletingId === confirmDelete.id}
                  className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition">
                  {deletingId === confirmDelete.id ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </PatientLayout>
  );
}
