'use client';

import AdminLayout from '@/components/layout/AdminLayout';
import SubscriptionGuard from '@/components/guards/SubscriptionGuard';
import { useAuth } from '@/components/providers/AuthProvider';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodType?: string;
  allergies?: string[];
  address?: string;
  createdAt?: string;
}

export default function PatientDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const token = await user!.getIdToken();
        const res = await fetch(`/api/patients/${params.id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setPatient(data.patient);
        }
      } catch { /* */ } finally { setLoading(false); }
    }
    load();
  }, [user, params.id]);

  if (loading) {
    return <AdminLayout><div className="flex justify-center py-16"><div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#4dbad9]" /></div></AdminLayout>;
  }

  if (!patient) {
    return <AdminLayout><div className="py-16 text-center"><h2 className="text-xl font-bold text-gray-900">Paciente no encontrado</h2><Link href="/admin/patients" className="mt-4 inline-block text-[#4dbad9] hover:underline">Volver</Link></div></AdminLayout>;
  }

  const fields = [
    { label: 'Email', value: patient.email },
    { label: 'Teléfono', value: patient.phone },
    { label: 'Fecha de nacimiento', value: patient.dateOfBirth },
    { label: 'Género', value: patient.gender },
    { label: 'Grupo sanguíneo', value: patient.bloodType },
    { label: 'Dirección', value: patient.address },
  ];

  return (
    <AdminLayout>
      <SubscriptionGuard feature="patients">
        <div>
          <Link href="/admin/patients" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Volver
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-xl font-bold text-green-600">
              {patient.firstName?.[0]}{patient.lastName?.[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{patient.firstName} {patient.lastName}</h1>
              <p className="text-sm text-gray-500">Paciente</p>
            </div>
          </div>

          <div className="mt-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Información personal</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              {fields.map((f) => f.value && (
                <div key={f.label}>
                  <dt className="text-sm font-medium text-gray-500">{f.label}</dt>
                  <dd className="mt-1 text-sm text-gray-900">{f.value}</dd>
                </div>
              ))}
            </dl>
            {patient.allergies && patient.allergies.length > 0 && (
              <div className="mt-4">
                <dt className="text-sm font-medium text-gray-500">Alergias</dt>
                <div className="mt-1 flex flex-wrap gap-2">
                  {patient.allergies.map((a) => (
                    <span key={a} className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">{a}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </SubscriptionGuard>
    </AdminLayout>
  );
}
