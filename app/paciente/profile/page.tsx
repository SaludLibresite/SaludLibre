'use client';

import PatientLayout from '@/components/layout/PatientLayout';
import { useAuth } from '@/components/providers/AuthProvider';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

interface PatientProfile {
  name: string;
  email: string;
  phone: string;
  dni: string;
  dateOfBirth: string;       // YYYY-MM-DD for <input type="date">
  gender: string;
  address: string;
  // insurance (v2 nested object)
  insuranceProvider: string;
  insuranceNumber: string;
  // medical
  bloodType: string;
  allergies: string;
  currentMedications: string;
  medicalHistory: string;
  // emergency contact (v2 nested object)
  emergencyContactName: string;
  emergencyContactPhone: string;
}

function toDateInput(val: unknown): string {
  if (!val) return '';
  const d = val instanceof Date ? val : new Date(val as string);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractProfile(p: any): PatientProfile {
  const ec = p.emergencyContact;
  const emergencyContactName = typeof ec === 'object' && ec !== null ? (ec.name ?? '') : (typeof ec === 'string' ? ec : '');
  const emergencyContactPhone = typeof ec === 'object' && ec !== null ? (ec.phone ?? '') : (p.emergencyPhone ?? '');

  const ins = p.insurance;
  const insuranceProvider = typeof ins === 'object' && ins !== null
    ? (ins.provider ?? '')
    : (p.insuranceProvider ?? p.obraSocial ?? p.healthInsurance ?? '');
  const insuranceNumber = typeof ins === 'object' && ins !== null
    ? (ins.number ?? '')
    : (p.insuranceNumber ?? '');

  return {
    name: p.name ?? p.displayName ?? '',
    email: p.email ?? '',
    phone: p.phone ?? '',
    dni: p.dni ?? '',
    dateOfBirth: toDateInput(p.dateOfBirth ?? p.birthDate),
    gender: p.gender ?? '',
    address: p.address ?? '',
    insuranceProvider,
    insuranceNumber,
    bloodType: p.bloodType ?? '',
    allergies: typeof p.allergies === 'string' ? p.allergies : '',
    currentMedications: typeof p.currentMedications === 'string' ? p.currentMedications : '',
    medicalHistory: typeof p.medicalHistory === 'string' ? p.medicalHistory : '',
    emergencyContactName,
    emergencyContactPhone,
  };
}

const INPUT_CLS = 'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-colors';
const LABEL_CLS = 'mb-1 block text-sm font-medium text-[var(--color-text-secondary)]';

export default function PatientProfilePage() {
  const { user } = useAuth();
  const [form, setForm] = useState<PatientProfile>({
    name: '', email: '', phone: '', dni: '', dateOfBirth: '', gender: '',
    address: '', insuranceProvider: '', insuranceNumber: '',
    bloodType: '', allergies: '', currentMedications: '', medicalHistory: '',
    emergencyContactName: '', emergencyContactPhone: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/patients/me', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setForm(extractProfile(data.patient ?? data));
        }
      } catch { /* */ } finally { setLoading(false); }
    })();
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const payload = {
        name: form.name,
        phone: form.phone,
        dni: form.dni,
        dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth).toISOString() : undefined,
        gender: form.gender,
        address: form.address,
        insurance: { provider: form.insuranceProvider, number: form.insuranceNumber },
        bloodType: form.bloodType,
        allergies: form.allergies,
        currentMedications: form.currentMedications,
        medicalHistory: form.medicalHistory,
        emergencyContact: { name: form.emergencyContactName, phone: form.emergencyContactPhone },
      };
      const res = await fetch('/api/patients/me', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) toast.success('Perfil actualizado');
      else toast.error('Error al guardar');
    } catch { toast.error('Error al guardar'); } finally { setSaving(false); }
  }

  function field(key: keyof PatientProfile) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  if (loading) {
    return (
      <PatientLayout>
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-[var(--color-surface-elevated)]" />
          <div className="h-96 animate-pulse rounded-xl bg-[var(--color-surface-elevated)]" />
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Mi Perfil</h1>
          <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">Información personal y datos médicos</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Personal */}
          <section className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 shadow-[var(--shadow-sm)]">
            <h2 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">Datos Personales</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLS}>Nombre completo</label>
                <input value={form.name} onChange={field('name')} className={INPUT_CLS} />
              </div>
              <div>
                <label className={LABEL_CLS}>Email</label>
                <input
                  value={form.email}
                  disabled
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-2.5 text-sm text-[var(--color-text-muted)]"
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Teléfono</label>
                <input value={form.phone} onChange={field('phone')} className={INPUT_CLS} />
              </div>
              <div>
                <label className={LABEL_CLS}>DNI</label>
                <input value={form.dni} onChange={field('dni')} className={INPUT_CLS} />
              </div>
              <div>
                <label className={LABEL_CLS}>Fecha de nacimiento</label>
                <input type="date" value={form.dateOfBirth} onChange={field('dateOfBirth')} className={INPUT_CLS} />
              </div>
              <div>
                <label className={LABEL_CLS}>Género</label>
                <select value={form.gender} onChange={field('gender')} className={INPUT_CLS}>
                  <option value="">Seleccionar</option>
                  <option value="male">Masculino</option>
                  <option value="female">Femenino</option>
                  <option value="other">Otro</option>
                  <option value="not_specified">Prefiero no decir</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL_CLS}>Dirección</label>
                <input value={form.address} onChange={field('address')} className={INPUT_CLS} />
              </div>
            </div>
          </section>

          {/* Medical */}
          <section className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 shadow-[var(--shadow-sm)]">
            <h2 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">Información Médica</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLS}>Obra Social / Seguro</label>
                <input value={form.insuranceProvider} onChange={field('insuranceProvider')} placeholder="Ej: OSDE, Swiss Medical…" className={INPUT_CLS} />
              </div>
              <div>
                <label className={LABEL_CLS}>N° de afiliado</label>
                <input value={form.insuranceNumber} onChange={field('insuranceNumber')} className={INPUT_CLS} />
              </div>
              <div>
                <label className={LABEL_CLS}>Grupo sanguíneo</label>
                <select value={form.bloodType} onChange={field('bloodType')} className={INPUT_CLS}>
                  <option value="">No especificado</option>
                  {BLOOD_TYPES.map((bt) => (
                    <option key={bt} value={bt}>{bt}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL_CLS}>Alergias</label>
                <textarea value={form.allergies} onChange={field('allergies')} rows={2} placeholder="Ej: Penicilina, mariscos…" className={INPUT_CLS} />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL_CLS}>Medicación actual</label>
                <textarea value={form.currentMedications} onChange={field('currentMedications')} rows={2} placeholder="Medicamentos que tomás actualmente" className={INPUT_CLS} />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL_CLS}>Antecedentes médicos</label>
                <textarea value={form.medicalHistory} onChange={field('medicalHistory')} rows={2} placeholder="Enfermedades previas, cirugías, etc." className={INPUT_CLS} />
              </div>
            </div>
          </section>

          {/* Emergency contact */}
          <section className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 shadow-[var(--shadow-sm)]">
            <h2 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">Contacto de Emergencia</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLS}>Nombre</label>
                <input value={form.emergencyContactName} onChange={field('emergencyContactName')} placeholder="Ej: María García" className={INPUT_CLS} />
              </div>
              <div>
                <label className={LABEL_CLS}>Teléfono</label>
                <input value={form.emergencyContactPhone} onChange={field('emergencyContactPhone')} placeholder="Ej: +54 9 11 1234-5678" className={INPUT_CLS} />
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[var(--color-primary)] px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
            >
              {saving ? 'Guardando…' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </PatientLayout>
  );
}
