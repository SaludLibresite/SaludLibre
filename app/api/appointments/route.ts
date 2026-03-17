import { NextRequest, NextResponse } from 'next/server';
import { getAppointmentService } from '@/src/infrastructure/container';
import { requireAuth, jsonOk, jsonError, jsonCreated } from '@/src/infrastructure/api/auth';
import { adminDb } from '@/src/infrastructure/config/firebase.admin';

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Normalize a legacy appointment document to the v2 shape. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeLegacyAppointment(id: string, d: Record<string, any>) {
  // Legacy stores date (Timestamp) + time (string "11:00") separately
  let dateTime: Date | null = null;
  if (d.dateTime?.toDate) {
    dateTime = d.dateTime.toDate();
  } else if (d.date?.toDate) {
    const base = d.date.toDate() as Date;
    if (d.time && typeof d.time === 'string') {
      const [hh, mm] = d.time.split(':').map(Number);
      base.setHours(hh ?? 0, mm ?? 0, 0, 0);
    }
    dateTime = base;
  }

  return {
    id,
    appointmentId: d.appointmentId ?? id,
    patientId: d.patientId ?? '',
    patientUserId: d.patientUserId ?? '',
    doctorId: d.doctorId ?? '',
    patientName: d.patientName ?? '',
    patientEmail: d.patientEmail ?? '',
    patientPhone: d.patientPhone ?? '',
    doctorName: d.doctorName ?? '',
    doctorSpecialty: d.doctorSpecialty ?? d.specialty ?? '',
    doctorGender: d.doctorGender ?? '',
    dateTime: dateTime?.toISOString() ?? null,
    durationMinutes: d.durationMinutes ?? d.duration ?? 30,
    type: d.type ?? 'consultation',
    reason: d.reason ?? d.motivo ?? '',
    urgency: d.urgency ?? 'normal',
    notes: d.notes ?? '',
    status: d.status ?? 'pending',
    requestedAt: d.requestedAt?.toDate?.()?.toISOString() ?? d.createdAt?.toDate?.()?.toISOString() ?? null,
    approvedAt: d.approvedAt?.toDate?.()?.toISOString() ?? null,
    createdAt: d.createdAt?.toDate?.()?.toISOString() ?? null,
    updatedAt: d.updatedAt?.toDate?.()?.toISOString() ?? null,
    _source: 'legacy' as const,
  };
}

/** Normalize a v2 appointment (already has correct field names) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeV2Appointment(apt: any) {
  return {
    ...apt,
    dateTime: apt.dateTime instanceof Date ? apt.dateTime.toISOString() : (apt.dateTime ?? null),
    requestedAt: apt.requestedAt instanceof Date ? apt.requestedAt.toISOString() : (apt.requestedAt ?? null),
    approvedAt: apt.approvedAt instanceof Date ? apt.approvedAt.toISOString() : (apt.approvedAt ?? null),
    createdAt: apt.createdAt instanceof Date ? apt.createdAt.toISOString() : (apt.createdAt ?? null),
    updatedAt: apt.updatedAt instanceof Date ? apt.updatedAt.toISOString() : (apt.updatedAt ?? null),
    _source: 'v2' as const,
  };
}

// ─── GET /api/appointments ─────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = request.nextUrl;
    const statusFilter = searchParams.get('status') ?? undefined;
    const limitParam = parseInt(searchParams.get('limit') ?? '50', 10);
    const familyMemberId = searchParams.get('familyMemberId') ?? undefined;

    const allAppointments: ReturnType<typeof normalizeLegacyAppointment>[] = [];

    if (user.userType === 'doctor' && user.doctorId) {
      // Doctor path — v2 only
      const appointments = await getAppointmentService().listByDoctor(user.doctorId, {
        status: statusFilter as never,
      });
      return jsonOk({ appointments: appointments.map(normalizeV2Appointment), total: appointments.length });
    }

    // ── Patient path ──────────────────────────────────────────────────────────

    // 1. V2 appointments
    if (user.patientId) {
      const v2Apts = await getAppointmentService().listByPatient(user.patientId, {
        status: statusFilter as never,
      });
      allAppointments.push(...v2Apts.map(normalizeV2Appointment));
    }

    // 2. Legacy appointments — by patientId (legacy doc ID)
    const legacyPatientSnap = await adminDb
      .collection('patients')
      .where('userId', '==', user.uid)
      .limit(1)
      .get();

    if (!legacyPatientSnap.empty) {
      const legacyPatientId = legacyPatientSnap.docs[0].id;

      // Appointments where the patient is primary patient
      const legacySnap = await adminDb
        .collection('appointments')
        .where('patientId', '==', legacyPatientId)
        .get();

      const existingIds = new Set(allAppointments.map((a) => a.appointmentId));
      legacySnap.forEach((doc) => {
        const normalized = normalizeLegacyAppointment(doc.id, doc.data());
        if (!existingIds.has(normalized.appointmentId)) {
          allAppointments.push(normalized);
          existingIds.add(normalized.appointmentId);
        }
      });

      // Also fetch appointments for the selected family member (legacy)
      if (familyMemberId) {
        const famSnap = await adminDb
          .collection('appointments')
          .where('patientId', '==', familyMemberId)
          .get();
        famSnap.forEach((doc) => {
          const normalized = normalizeLegacyAppointment(doc.id, doc.data());
          if (!existingIds.has(normalized.appointmentId)) {
            allAppointments.push(normalized);
            existingIds.add(normalized.appointmentId);
          }
        });
      }
    }

    // Apply status filter
    const filtered = statusFilter
      ? allAppointments.filter((a) => a.status === statusFilter)
      : allAppointments;

    // Sort by dateTime descending, then limit
    filtered.sort((a, b) => {
      const da = a.dateTime ? new Date(a.dateTime).getTime() : 0;
      const db = b.dateTime ? new Date(b.dateTime).getTime() : 0;
      return db - da;
    });

    const appointments = filtered.slice(0, limitParam);

    // Resolve missing doctorName in batch for legacy appointments
    const missingDoctorIds = [
      ...new Set(
        appointments
          .filter((a) => !a.doctorName && a.doctorId)
          .map((a) => a.doctorId),
      ),
    ];

    if (missingDoctorIds.length > 0) {
      const doctorMap: Record<string, { name: string; specialty: string }> = {};

      // Try v2_doctors first
      const v2DoctorSnaps = await Promise.all(
        missingDoctorIds.map((id) => adminDb.collection('v2_doctors').doc(id).get()),
      );
      v2DoctorSnaps.forEach((snap) => {
        if (snap.exists) {
          const d = snap.data()!;
          doctorMap[snap.id] = { name: d.name ?? '', specialty: d.specialty ?? '' };
        }
      });

      // Legacy fallback for any still missing
      const stillMissing = missingDoctorIds.filter((id) => !doctorMap[id]);
      if (stillMissing.length > 0) {
        const legacySnaps = await Promise.all(
          stillMissing.map((id) => adminDb.collection('doctors').doc(id).get()),
        );
        legacySnaps.forEach((snap) => {
          if (snap.exists) {
            const d = snap.data()!;
            doctorMap[snap.id] = {
              name: d.name ?? d.displayName ?? '',
              specialty: d.specialty ?? d.especialidad ?? '',
            };
          }
        });
      }

      // Patch appointments in place
      for (let i = 0; i < appointments.length; i++) {
        const a = appointments[i];
        if (!a.doctorName && a.doctorId && doctorMap[a.doctorId]) {
          appointments[i] = {
            ...a,
            doctorName: doctorMap[a.doctorId].name,
            doctorSpecialty: a.doctorSpecialty || doctorMap[a.doctorId].specialty,
          };
        }
      }
    }

    return jsonOk({ appointments, total: appointments.length });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}

// ─── POST /api/appointments ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();
    const appointment = await getAppointmentService().request({
      patientId: user.patientId ?? body.patientId,
      patientUserId: user.uid,
      doctorId: body.doctorId,
      dateTime: new Date(body.dateTime),
      durationMinutes: body.durationMinutes,
      type: body.type,
      reason: body.reason,
      urgency: body.urgency ?? 'normal',
      notes: body.notes,
    });

    return jsonCreated({ appointment });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
