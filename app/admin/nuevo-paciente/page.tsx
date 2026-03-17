'use client';

import AdminLayout from '@/components/layout/AdminLayout';
import SubscriptionGuard from '@/components/guards/SubscriptionGuard';
import { useAuth } from '@/components/providers/AuthProvider';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NuevoPacientePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '', gender: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        router.push('/admin/patients');
      } else {
        const data = await res.json();
        setError(data.error || 'Error al crear paciente');
      }
    } catch {
      setError('Error al crear paciente');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <SubscriptionGuard feature="nuevo-paciente">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Paciente</h1>
          <p className="mt-1 text-sm text-gray-500">Registrá un nuevo paciente en tu consultorio</p>

          {error && <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <form onSubmit={handleSubmit} className="mt-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input type="text" required value={form.firstName} onChange={(e) => update('firstName', e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#4dbad9] focus:ring-2 focus:ring-[#4dbad9]/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Apellido</label>
                <input type="text" required value={form.lastName} onChange={(e) => update('lastName', e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#4dbad9] focus:ring-2 focus:ring-[#4dbad9]/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#4dbad9] focus:ring-2 focus:ring-[#4dbad9]/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#4dbad9] focus:ring-2 focus:ring-[#4dbad9]/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha de nacimiento</label>
                <input type="date" value={form.dateOfBirth} onChange={(e) => update('dateOfBirth', e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#4dbad9] focus:ring-2 focus:ring-[#4dbad9]/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Género</label>
                <select value={form.gender} onChange={(e) => update('gender', e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#4dbad9] focus:ring-2 focus:ring-[#4dbad9]/20">
                  <option value="">Seleccionar</option>
                  <option value="male">Masculino</option>
                  <option value="female">Femenino</option>
                  <option value="other">Otro</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => router.back()} className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={saving}
                className="rounded-xl bg-[#4dbad9] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3da8c5] disabled:opacity-50">
                {saving ? 'Guardando...' : 'Registrar Paciente'}
              </button>
            </div>
          </form>
        </div>
      </SubscriptionGuard>
    </AdminLayout>
  );
}
