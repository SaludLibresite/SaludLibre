/**
 * ============================================================
 * V1 → V2 Migration Script
 * ============================================================
 * Reads all V1 collections from Firebase, transforms documents
 * to match V2 domain entities, and writes to new v2_* collections.
 *
 * Features:
 *   - Idempotent: uses same doc IDs, overwrites safely
 *   - Batched: 500 writes per batch (Firestore limit)
 *   - Dry-run mode: pass --dry-run to preview without writing
 *   - Selective: pass --collection=doctors to migrate one collection
 *   - New-only: pass --new-only to skip docs already in V2
 *
 * Usage:
 *   npx tsx scripts/migration/migrate-v1-to-v2.ts
 *   npx tsx scripts/migration/migrate-v1-to-v2.ts --dry-run
 *   npx tsx scripts/migration/migrate-v1-to-v2.ts --collection=doctors
 *   npx tsx scripts/migration/migrate-v1-to-v2.ts --collection=doctors --new-only
 *   npx tsx scripts/migration/migrate-v1-to-v2.ts --collection=doctors --new-only --dry-run
 * ============================================================
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// --------------- Config ---------------

const __dirname = dirname(fileURLToPath(import.meta.url));
// Navigate from v2/scripts/migration/ → saludlibre/medicos-ar/.env.local
const envContent = readFileSync(resolve(__dirname, '..', '..', '..', 'medicos-ar', '.env.local'), 'utf-8');
const env: Record<string, string> = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[match[1].trim()] = val;
  }
}

const privateKey = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}
const db = getFirestore();

// --------------- CLI Args ---------------

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const NEW_ONLY = args.includes('--new-only');
const collectionArg = args.find(a => a.startsWith('--collection='))?.split('=')[1];
const BATCH_SIZE = 500;

// --------------- Helpers ---------------

function tsToDate(val: unknown): Date {
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === 'string') return new Date(val);
  return new Date(0);
}

function tsToDateOrNull(val: unknown): Date | null {
  if (val === null || val === undefined) return null;
  return tsToDate(val);
}

function mapGender(v1Gender: string): string {
  const map: Record<string, string> = {
    'Masculino': 'male',
    'Femenino': 'female',
    'masculino': 'male',
    'femenino': 'female',
    'Male': 'male',
    'Female': 'female',
    'Otro': 'other',
    'otro': 'other',
  };
  return map[v1Gender] ?? 'not_specified';
}

/** Merge V1 time ("11:00") into a date for unified dateTime */
function mergeDateTime(dateVal: unknown, timeStr: string): Date {
  const d = tsToDate(dateVal);
  if (timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    d.setHours(h ?? 0, m ?? 0, 0, 0);
  }
  return d;
}

// --------------- Mappers ---------------

function mapDoctor(id: string, d: FirebaseFirestore.DocumentData) {
  return {
    id,
    userId: d.userId ?? '',
    name: d.nombre ?? '',
    slug: d.slug ?? '',
    email: d.email ?? '',
    phone: d.telefono ?? '',
    gender: mapGender(d.genero ?? ''),
    specialty: d.especialidad ?? '',
    description: d.descripcion ?? '',
    profileImage: d.photoURL || d.imagen || '',
    schedule: d.horario ?? '',
    onlineConsultation: d.consultaOnline ?? false,
    location: {
      latitude: d.latitude ?? 0,
      longitude: d.longitude ?? 0,
      formattedAddress: d.formattedAddress ?? d.ubicacion ?? '',
    },
    verified: d.verified ?? false,
    subscription: {
      status: d.subscriptionStatus ?? 'inactive',
      planId: d.subscriptionPlanId ?? '',
      planName: d.subscriptionPlan ?? '',
      expiresAt: tsToDateOrNull(d.subscriptionExpiresAt),
    },
    professional: {
      profession: d.profesion ?? '',
      licenseNumber: d.matricula ?? '',
      officeAddress: d.domicilio ?? '',
      signatureUrl: d.signatureURL ?? null,
      stampUrl: d.stampURL ?? null,
    },
    createdAt: tsToDate(d.createdAt),
    updatedAt: tsToDate(d.updatedAt),
    _migratedAt: FieldValue.serverTimestamp(),
    _sourceCollection: 'doctors',
  };
}

function mapPatient(id: string, d: FirebaseFirestore.DocumentData) {
  const doctors = Array.isArray(d.doctors)
    ? d.doctors.map((doc: Record<string, unknown>) => ({
        doctorId: doc.doctorId ?? '',
        doctorUserId: doc.doctorUserId ?? '',
        doctorName: doc.doctorName ?? '',
        doctorSpecialty: doc.doctorSpecialty ?? '',
        assignedAt: tsToDate(doc.assignedAt),
        isPrimary: doc.isPrimary ?? false,
      }))
    : [];

  return {
    id,
    userId: d.userId ?? '',
    userType: d.userType ?? 'patient',
    name: d.name ?? '',
    email: d.email ?? '',
    phone: d.phone ?? '',
    dni: d.dni ?? '',
    dateOfBirth: d.dateOfBirth ? new Date(d.dateOfBirth) : new Date(0),
    gender: mapGender(d.gender ?? ''),
    address: d.address ?? '',
    profilePhoto: d.profilePhoto ?? null,
    allergies: d.allergies ?? '',
    currentMedications: d.currentMedications ?? '',
    medicalHistory: d.medicalHistory ?? '',
    insurance: {
      provider: d.insuranceProvider ?? d.obraSocial ?? '',
      number: d.insuranceNumber ?? '',
    },
    emergencyContact: {
      name: d.emergencyContact ?? '',
      phone: d.emergencyPhone ?? '',
    },
    registrationMethod: d.registrationMethod ?? 'email',
    isActive: d.isActive ?? true,
    dataComplete: d.dataComplete ?? false,
    referralCode: d.referralCode ?? '',
    temporaryPassword: d.temporaryPassword ?? false,
    googleInfo: d.googleInfo ?? null,
    doctors,
    createdAt: tsToDate(d.createdAt),
    updatedAt: tsToDate(d.updatedAt),
    _migratedAt: FieldValue.serverTimestamp(),
    _sourceCollection: 'patients',
  };
}

function mapAppointment(id: string, d: FirebaseFirestore.DocumentData) {
  return {
    id,
    appointmentId: d.appointmentId ?? '',
    patientId: d.patientId ?? '',
    patientUserId: d.patientUserId ?? '',
    doctorId: d.doctorId ?? '',
    patientName: d.patientName ?? '',
    patientEmail: d.patientEmail ?? '',
    patientPhone: d.patientPhone ?? '',
    doctorName: d.doctorName ?? '',
    doctorSpecialty: d.doctorSpecialty ?? '',
    doctorGender: d.doctorGender ?? '',
    dateTime: mergeDateTime(d.date, d.time ?? ''),
    durationMinutes: d.duration ?? 30,
    type: d.type ?? 'consultation',
    reason: d.reason ?? '',
    urgency: d.urgency ?? 'normal',
    notes: d.notes ?? '',
    status: d.status ?? 'pending',
    requestedAt: tsToDate(d.requestedAt ?? d.createdAt),
    approvedAt: tsToDateOrNull(d.approvedAt),
    createdAt: tsToDate(d.createdAt),
    updatedAt: tsToDate(d.updatedAt),
    _migratedAt: FieldValue.serverTimestamp(),
    _sourceCollection: 'appointments',
  };
}

function mapPrescription(id: string, d: FirebaseFirestore.DocumentData) {
  const doctorInfo = d.doctorInfo ?? {};
  const patientInfo = d.patientInfo ?? {};
  return {
    id,
    appointmentId: d.appointmentId ?? '',
    doctorId: d.doctorId ?? '',
    patientId: d.patientId ?? '',
    doctorSnapshot: {
      doctorDocId: doctorInfo.id ?? '',
      userId: doctorInfo.userId ?? '',
      name: doctorInfo.nombre ?? '',
      specialty: doctorInfo.especialidad ?? '',
      profession: doctorInfo.profesion ?? '',
      phone: doctorInfo.telefono ?? '',
      officeAddress: doctorInfo.domicilio ?? '',
      licenseNumber: doctorInfo.matricula ?? '',
      signatureUrl: doctorInfo.signatureURL ?? null,
      stampUrl: doctorInfo.stampURL ?? null,
    },
    patientSnapshot: {
      patientDocId: patientInfo.id ?? '',
      name: patientInfo.name ?? '',
      age: patientInfo.age ?? 0,
      dateOfBirth: patientInfo.dateOfBirth ? new Date(patientInfo.dateOfBirth) : new Date(0),
      gender: patientInfo.gender ?? '',
      dni: patientInfo.dni ?? '',
      insuranceProvider: patientInfo.obraSocial ?? '',
    },
    medications: Array.isArray(d.medications)
      ? d.medications.map((m: Record<string, string>) => ({
          name: m.name ?? '',
          dosage: m.dosage ?? '',
          frequency: m.frequency ?? '',
          duration: m.duration ?? '',
          instructions: m.instructions ?? '',
        }))
      : [],
    diagnosis: d.diagnosis ?? '',
    notes: d.notes ?? '',
    createdAt: tsToDate(d.createdAt),
    updatedAt: tsToDate(d.updatedAt),
    _migratedAt: FieldValue.serverTimestamp(),
    _sourceCollection: 'prescriptions',
  };
}

function mapMedicalDocument(id: string, d: FirebaseFirestore.DocumentData, source: string) {
  return {
    id,
    patientId: d.patientId ?? '',
    doctorId: d.doctorId ?? '',
    fileName: d.fileName ?? '',
    fileSize: d.fileSize ?? 0,
    fileType: d.fileType ?? '',
    filePath: d.filePath ?? '',
    downloadUrl: d.downloadURL ?? '',
    title: d.title ?? '',
    category: d.category ?? 'general',
    uploadedBy: d.uploadedBy ?? '',
    uploadedByRole: d.uploadedByRole ?? 'doctor',
    uploadedAt: tsToDate(d.uploadedAt),
    createdAt: tsToDate(d.uploadedAt),
    updatedAt: tsToDate(d.uploadedAt),
    _migratedAt: FieldValue.serverTimestamp(),
    _sourceCollection: source,
  };
}

function mapFamilyMember(id: string, d: FirebaseFirestore.DocumentData) {
  return {
    id,
    familyMemberId: d.familyMemberId ?? '',
    primaryPatientId: d.primaryPatientId ?? '',
    doctorId: d.doctorId ?? '',
    name: d.name ?? '',
    relationship: d.relationship ?? '',
    dateOfBirth: d.dateOfBirth ? new Date(d.dateOfBirth) : new Date(0),
    gender: mapGender(d.gender ?? ''),
    phone: d.phone ?? '',
    email: d.email ?? '',
    allergies: d.allergies ?? '',
    currentMedications: d.currentMedications ?? '',
    notes: d.notes ?? '',
    insuranceProvider: d.insuranceProvider ?? '',
    insuranceNumber: d.insuranceNumber ?? '',
    emergencyContact: d.emergencyContact ?? '',
    emergencyPhone: d.emergencyPhone ?? '',
    isActive: d.isActive ?? true,
    createdAt: tsToDate(d.createdAt),
    updatedAt: tsToDate(d.updatedAt),
    _migratedAt: FieldValue.serverTimestamp(),
    _sourceCollection: 'familyMembers',
  };
}

function mapSubscription(id: string, d: FirebaseFirestore.DocumentData) {
  return {
    id,
    userId: d.userId ?? '',
    planId: d.planId ?? '',
    planName: d.planName ?? '',
    price: d.price ?? 0,
    status: d.status ?? 'inactive',
    activationType: d.activationType ?? 'manual',
    activatedBy: d.activatedBy ?? '',
    paymentMethod: d.paymentMethod ?? 'manual_activation',
    activatedAt: tsToDate(d.activatedAt),
    expiresAt: tsToDate(d.expiresAt),
    deactivatedAt: tsToDateOrNull(d.deactivatedAt),
    createdAt: tsToDate(d.createdAt),
    updatedAt: tsToDate(d.updatedAt),
    _migratedAt: FieldValue.serverTimestamp(),
    _sourceCollection: 'subscriptions',
  };
}

function mapSubscriptionPlan(id: string, d: FirebaseFirestore.DocumentData) {
  return {
    id,
    planId: d.id ?? '',
    name: d.name ?? '',
    description: d.description ?? '',
    price: d.price ?? 0,
    durationDays: d.duration ?? 30,
    isActive: d.isActive ?? true,
    isPopular: d.isPopular ?? false,
    features: Array.isArray(d.features) ? d.features : [],
    createdAt: tsToDate(d.createdAt),
    updatedAt: tsToDate(d.updatedAt),
    _migratedAt: FieldValue.serverTimestamp(),
    _sourceCollection: 'subscriptionPlans',
  };
}

function mapPayment(id: string, d: FirebaseFirestore.DocumentData) {
  return {
    id,
    subscriptionId: d.subscriptionId ?? '',
    status: d.status ?? 'pending',
    paymentMethod: d.paymentMethod ?? 'manual_activation',
    transactionAmount: d.transactionAmount ?? 0,
    approvedAt: tsToDate(d.approvedAt),
    activatedBy: d.activatedBy ?? '',
    createdAt: tsToDate(d.createdAt),
    updatedAt: tsToDate(d.createdAt),
    _migratedAt: FieldValue.serverTimestamp(),
    _sourceCollection: 'payments',
  };
}

function mapReferral(id: string, d: FirebaseFirestore.DocumentData) {
  return {
    id,
    referrerDoctorId: d.referrerDoctorId ?? '',
    referredDoctorId: d.referredDoctorId ?? '',
    referredDoctorName: d.referredDoctorName ?? '',
    referredDoctorEmail: d.referredDoctorEmail ?? '',
    referredDoctorSpecialty: d.referredDoctorSpecialty ?? '',
    status: d.status ?? 'pending',
    confirmedAt: tsToDateOrNull(d.confirmedAt),
    createdAt: tsToDate(d.createdAt),
    updatedAt: tsToDate(d.createdAt),
    _migratedAt: FieldValue.serverTimestamp(),
    _sourceCollection: 'referrals',
  };
}

function mapSpecialty(id: string, d: FirebaseFirestore.DocumentData) {
  return {
    id,
    title: d.title ?? '',
    description: d.description ?? '',
    isActive: d.isActive ?? true,
    imagePath: d.imagePath ?? '',
    imageUrl: d.imageUrl ?? '',
    createdAt: tsToDate(d.createdAt),
    updatedAt: tsToDate(d.updatedAt),
    _migratedAt: FieldValue.serverTimestamp(),
    _sourceCollection: 'specialties',
  };
}

function mapSystemConfig(id: string, d: FirebaseFirestore.DocumentData) {
  return {
    id,
    ...d,
    lastUpdated: tsToDate(d.lastUpdated),
    _migratedAt: FieldValue.serverTimestamp(),
    _sourceCollection: 'system_config',
  };
}

// --------------- Migration Engine ---------------

interface MigrationJob {
  source: string;
  target: string;
  mapper: (id: string, data: FirebaseFirestore.DocumentData) => Record<string, unknown>;
}

const MIGRATION_JOBS: MigrationJob[] = [
  { source: 'doctors', target: 'v2_doctors', mapper: mapDoctor },
  { source: 'patients', target: 'v2_patients', mapper: mapPatient },
  { source: 'appointments', target: 'v2_appointments', mapper: mapAppointment },
  { source: 'prescriptions', target: 'v2_prescriptions', mapper: mapPrescription },
  { source: 'medicalFiles', target: 'v2_medical_documents', mapper: (id, d) => mapMedicalDocument(id, d, 'medicalFiles') },
  { source: 'patientDocuments', target: 'v2_medical_documents', mapper: (id, d) => mapMedicalDocument(id, d, 'patientDocuments') },
  { source: 'familyMembers', target: 'v2_family_members', mapper: mapFamilyMember },
  { source: 'subscriptions', target: 'v2_subscriptions', mapper: mapSubscription },
  { source: 'subscriptionPlans', target: 'v2_subscription_plans', mapper: mapSubscriptionPlan },
  { source: 'payments', target: 'v2_payments', mapper: mapPayment },
  { source: 'referrals', target: 'v2_referrals', mapper: mapReferral },
  { source: 'specialties', target: 'v2_specialties', mapper: mapSpecialty },
  { source: 'system_config', target: 'v2_system_config', mapper: mapSystemConfig },
];

async function migrateCollection(job: MigrationJob): Promise<number> {
  console.log(`\n📦 Migrando: ${job.source} → ${job.target}`);

  const sourceSnap = await db.collection(job.source).get();
  if (sourceSnap.empty) {
    console.log(`   ⚠️  Colección vacía, saltando.`);
    return 0;
  }

  console.log(`   📄 ${sourceSnap.size} documentos encontrados en V1`);

  // If --new-only, fetch existing V2 doc IDs to skip them
  let existingIds: Set<string> | null = null;
  if (NEW_ONLY) {
    const targetSnap = await db.collection(job.target).select().get();
    existingIds = new Set(targetSnap.docs.map(d => d.id));
    console.log(`   📋 ${existingIds.size} documentos ya existen en V2`);
  }

  let batchCount = 0;
  let totalWritten = 0;
  let skipped = 0;
  let batch = db.batch();

  for (const docSnap of sourceSnap.docs) {
    // Skip if already exists in V2 and --new-only mode
    if (existingIds && existingIds.has(docSnap.id)) {
      skipped++;
      continue;
    }

    try {
      const mapped = job.mapper(docSnap.id, docSnap.data());

      if (DRY_RUN) {
        if (totalWritten === 0) {
          console.log(`   🔍 [DRY RUN] Sample output:`);
          console.log(JSON.stringify(mapped, null, 2).slice(0, 500));
        }
      } else {
        const targetRef = db.collection(job.target).doc(docSnap.id);
        batch.set(targetRef, mapped, { merge: true });
      }

      batchCount++;
      totalWritten++;

      if (batchCount >= BATCH_SIZE && !DRY_RUN) {
        await batch.commit();
        console.log(`   ✅ Batch committed (${totalWritten} docs so far)`);
        batch = db.batch();
        batchCount = 0;
      }
    } catch (err) {
      console.error(`   ❌ Error migrando doc ${docSnap.id}:`, err);
    }
  }

  // Commit remaining
  if (batchCount > 0 && !DRY_RUN) {
    await batch.commit();
  }

  const modeLabel = DRY_RUN ? '[DRY RUN] ' : '';
  const action = DRY_RUN ? 'analizados' : 'migrados';
  console.log(`   ✅ ${modeLabel}${totalWritten} documentos ${action}${NEW_ONLY ? `, ${skipped} omitidos (ya existían)` : ''}`);
  return totalWritten;
}

// --------------- Main ---------------

async function main() {
  console.log('='.repeat(60));
  console.log('   SaludLibre V1 → V2 Migration');
  console.log(`   Mode: ${DRY_RUN ? '🔍 DRY RUN (no writes)' : '🚀 LIVE MIGRATION'}`);
  if (NEW_ONLY) console.log(`   Filter: 🆕 Solo documentos nuevos (--new-only)`);
  if (collectionArg) console.log(`   Collection: ${collectionArg} only`);
  console.log('='.repeat(60));

  const jobs = collectionArg
    ? MIGRATION_JOBS.filter(j => j.source === collectionArg)
    : MIGRATION_JOBS;

  if (jobs.length === 0) {
    console.error(`❌ Colección "${collectionArg}" no encontrada en los jobs de migración.`);
    process.exit(1);
  }

  let totalDocs = 0;
  const results: { source: string; count: number }[] = [];

  for (const job of jobs) {
    const count = await migrateCollection(job);
    totalDocs += count;
    results.push({ source: job.source, count });
  }

  console.log('\n' + '='.repeat(60));
  console.log('   RESUMEN DE MIGRACIÓN');
  console.log('='.repeat(60));
  for (const r of results) {
    console.log(`   ${r.source.padEnd(25)} → ${r.count} docs`);
  }
  console.log(`\n   Total: ${totalDocs} documentos ${DRY_RUN ? 'analizados' : 'migrados'}`);
  console.log('='.repeat(60));

  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
