'use client';

import PatientLayout from '@/components/layout/PatientLayout';
import { useAuth } from '@/components/providers/AuthProvider';
import { useFamily } from '@/components/providers/FamilyContext';
import { useEffect, useState } from 'react';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface MedicalRecord {
  id: string;
  type: 'prescription' | 'document';
  title: string;
  doctorName: string;
  dateIso: string;
  fileUrl?: string;
  // prescription-specific
  diagnosis?: string;
  medications?: Medication[];
  notes?: string;
  // document-specific
  description?: string;
}

function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function medicationSummary(meds: Medication[]): string {
  if (!meds?.length) return '';
  return meds.map((m) => m.name).join(', ');
}

export default function PatientMedicalRecordsPage() {
  const { user } = useAuth();
  const { selectedMember } = useFamily();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'prescription' | 'document'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setRecords([]);
    (async () => {
      try {
        const token = await user.getIdToken();
        const params = new URLSearchParams();
        if (selectedMember) params.set('familyMemberId', selectedMember.id);

        const [presRes, docsRes] = await Promise.all([
          fetch(`/api/prescriptions?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/medical-documents?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const items: MedicalRecord[] = [];

        if (presRes.ok) {
          const data = await presRes.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (data.prescriptions ?? []).forEach((p: any) => {
            const meds: Medication[] = Array.isArray(p.medications) ? p.medications : [];
            const doctorName = p.doctorSnapshot?.name ?? p.doctorName ?? '';
            items.push({
              id: p.id,
              type: 'prescription',
              title: p.diagnosis || 'Receta médica',
              doctorName,
              dateIso: p.createdAt ?? p.date ?? '',
              fileUrl: p.fileUrl,
              diagnosis: p.diagnosis,
              medications: meds,
              notes: p.notes,
            });
          });
        }

        if (docsRes.ok) {
          const data = await docsRes.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (data.documents ?? []).forEach((d: any) => {
            items.push({
              id: d.id,
              type: 'document',
              title: d.title ?? d.type ?? 'Documento',
              doctorName: d.doctorName ?? '',
              dateIso: d.createdAt ?? d.date ?? '',
              fileUrl: d.fileUrl,
              description: typeof d.description === 'string' ? d.description : '',
            });
          });
        }

        items.sort((a, b) => (b.dateIso > a.dateIso ? 1 : -1));
        setRecords(items);
      } catch { /* */ } finally { setLoading(false); }
    })();
  }, [user, selectedMember]);

  const filtered = tab === 'all' ? records : records.filter((r) => r.type === tab);

  const counts = {
    prescription: records.filter((r) => r.type === 'prescription').length,
    document: records.filter((r) => r.type === 'document').length,
  };

  return (
    <PatientLayout>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Historial Médico</h1>
          <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
            {selectedMember ? `Registros de ${selectedMember.name}` : 'Recetas y documentos médicos'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {([
            { id: 'all', label: 'Todos', count: records.length },
            { id: 'prescription', label: 'Recetas', count: counts.prescription },
            { id: 'document', label: 'Documentos', count: counts.document },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-[var(--color-primary)] text-white shadow-[var(--shadow-sm)]'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] hover:bg-[var(--color-surface-elevated)]'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  tab === t.id ? 'bg-white/20 text-white' : 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Records */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-[var(--color-surface-elevated)]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-10 text-center shadow-[var(--shadow-sm)]">
            <svg className="mx-auto h-12 w-12 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="mt-3 text-[var(--color-text-secondary)]">No hay registros médicos todavía</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((rec) => {
              const isOpen = expanded === rec.id;
              const isPrescription = rec.type === 'prescription';

              return (
                <div key={rec.id} className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
                  {/* Row */}
                  <div className="flex items-center gap-4 p-5">
                    {/* Icon */}
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      isPrescription
                        ? 'bg-[var(--color-success-light)] text-[var(--color-success)]'
                        : 'bg-[var(--color-info-light)] text-[var(--color-info)]'
                    }`}>
                      {isPrescription ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47m0 0l-2.47 2.47m2.47-2.47l2.47 2.47m-2.47-2.47l-2.47-2.47" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-[var(--color-text-primary)]">{rec.title}</p>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {rec.doctorName ? `Dr. ${rec.doctorName} · ` : ''}{formatDate(rec.dateIso)}
                      </p>
                      {isPrescription && rec.medications && rec.medications.length > 0 && (
                        <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">
                          {medicationSummary(rec.medications)}
                        </p>
                      )}
                      {!isPrescription && rec.description && (
                        <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">{rec.description}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-2">
                      {isPrescription && rec.medications && rec.medications.length > 0 && (
                        <button
                          onClick={() => setExpanded(isOpen ? null : rec.id)}
                          className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-elevated)]"
                        >
                          {isOpen ? 'Ocultar' : 'Ver detalle'}
                        </button>
                      )}
                      {rec.fileUrl && (
                        <a
                          href={rec.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-elevated)]"
                        >
                          Descargar
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Expanded medications detail */}
                  {isOpen && isPrescription && rec.medications && (
                    <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-5 pb-5 pt-4">
                      {rec.diagnosis && (
                        <p className="mb-3 text-sm font-medium text-[var(--color-text-secondary)]">
                          Diagnóstico: <span className="font-normal">{rec.diagnosis}</span>
                        </p>
                      )}
                      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">Medicamentos</p>
                      <div className="space-y-3">
                        {rec.medications.map((med, i) => (
                          <div key={i} className="rounded-lg bg-[var(--color-surface)] p-3 border border-[var(--color-border)]">
                            <p className="font-medium text-[var(--color-text-primary)]">{med.name}</p>
                            <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-[var(--color-text-secondary)] sm:grid-cols-4">
                              {med.dosage && <span>Dosis: {med.dosage}</span>}
                              {med.frequency && <span>Frecuencia: {med.frequency}</span>}
                              {med.duration && <span>Duración: {med.duration}</span>}
                            </div>
                            {med.instructions && (
                              <p className="mt-1 text-xs text-[var(--color-text-muted)]">{med.instructions}</p>
                            )}
                          </div>
                        ))}
                      </div>
                      {rec.notes && (
                        <p className="mt-3 text-xs text-[var(--color-text-secondary)]">
                          <span className="font-medium">Notas:</span> {rec.notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PatientLayout>
  );
}
