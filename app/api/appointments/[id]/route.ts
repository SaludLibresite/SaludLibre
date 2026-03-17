import { NextRequest, NextResponse } from 'next/server';
import { getAppointmentService, getVideoConsultationService } from '@/src/infrastructure/container';
import { requireAuth, jsonOk, jsonError } from '@/src/infrastructure/api/auth';
import { adminDb } from '@/src/infrastructure/config/firebase.admin';

type Params = { params: Promise<{ id: string }> };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeLegacyAppointment(id: string, d: Record<string, any>) {
  let dateTime: string | null = null;
  if (d.dateTime?.toDate) {
    dateTime = d.dateTime.toDate().toISOString();
  } else if (d.date?.toDate) {
    const base = d.date.toDate() as Date;
    if (d.time && typeof d.time === 'string') {
      const [hh, mm] = d.time.split(':').map(Number);
      base.setHours(hh ?? 0, mm ?? 0, 0, 0);
    }
    dateTime = base.toISOString();
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
    doctorPhone: d.doctorPhone ?? '',
    dateTime,
    durationMinutes: d.durationMinutes ?? d.duration ?? 30,
    type: d.type ?? 'consultation',
    reason: d.reason ?? d.motivo ?? '',
    urgency: d.urgency ?? 'normal',
    notes: d.notes ?? '',
    status: d.status ?? 'pending',
    isForFamilyMember: d.isForFamilyMember ?? false,
    familyMemberRelationship: d.familyMemberRelationship ?? '',
    primaryPatientId: d.primaryPatientId ?? '',
    requestedAt: d.requestedAt?.toDate?.()?.toISOString() ?? null,
    approvedAt: d.approvedAt?.toDate?.()?.toISOString() ?? null,
    createdAt: d.createdAt?.toDate?.()?.toISOString() ?? null,
    updatedAt: d.updatedAt?.toDate?.()?.toISOString() ?? null,
    _source: 'legacy' as const,
  };
}

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

// GET /api/appointments/[id] — Get appointment detail (v2 + legacy)
export async function GET(request: NextRequest, { params }: Params) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { id } = await params;

    // 1. Try v2
    const v2Apt = await getAppointmentService().getById(id);
    let appointment = null;
    let source: 'v2' | 'legacy' = 'v2';

    if (v2Apt) {
      // Ownership: match by Auth UID, v2 patientId, doctorId, or superadmin
      const isOwner =
        user.userType === 'superadmin' ||
        (!!v2Apt.patientUserId && v2Apt.patientUserId === user.uid) ||
        (!!user.patientId && v2Apt.patientId === user.patientId) ||
        (!!user.doctorId && v2Apt.doctorId === user.doctorId);
      if (!isOwner) return jsonError('Not authorized', 403);
      appointment = normalizeV2Appointment(v2Apt);
    } else {
      // 2. Try legacy
      const legacyDoc = await adminDb.collection('appointments').doc(id).get();
      if (!legacyDoc.exists) return jsonError('Appointment not found', 404);

      const d = legacyDoc.data()!;

      // Ownership: direct userId match, or find legacy patient by userId
      let authorized = user.userType === 'superadmin';

      // Direct auth UID stored in appointment (v2-style field on legacy doc)
      if (!authorized && d.patientUserId === user.uid) authorized = true;

      // Via legacy patients collection
      if (!authorized) {
        const legacyPatientSnap = await adminDb
          .collection('patients')
          .where('userId', '==', user.uid)
          .limit(1)
          .get();
        if (!legacyPatientSnap.empty) {
          const legacyPatientId = legacyPatientSnap.docs[0].id;
          authorized =
            d.patientId === legacyPatientId ||
            d.primaryPatientId === legacyPatientId;
        }
      }

      // Via v2 patientId (mixed case: appointment stored v2 patientId)
      if (!authorized && user.patientId && d.patientId === user.patientId) authorized = true;

      if (!authorized) return jsonError('Not authorized', 403);

      appointment = normalizeLegacyAppointment(id, d);
      source = 'legacy';
    }

    // 3. Check for video room (v2 first, then legacy)
    let videoRoom = null;
    const v2Video = await getVideoConsultationService().getByAppointment(id);
    if (v2Video) {
      videoRoom = {
        roomName: v2Video.roomName,
        roomUrl: v2Video.roomUrl,
        status: v2Video.status,
        scheduledAt: v2Video.scheduledAt instanceof Date ? v2Video.scheduledAt.toISOString() : null,
        expiresAt: v2Video.expiresAt instanceof Date ? v2Video.expiresAt.toISOString() : null,
        source: 'v2',
      };
    } else {
      // Check legacy videoConsultations by appointmentId
      const legacyVideoSnap = await adminDb
        .collection('videoConsultations')
        .where('appointmentId', '==', id)
        .limit(1)
        .get();
      if (!legacyVideoSnap.empty) {
        const vd = legacyVideoSnap.docs[0].data();
        videoRoom = {
          roomName: vd.roomName ?? '',
          roomUrl: vd.roomUrl ?? '',
          status: vd.status ?? 'scheduled',
          scheduledAt: vd.scheduledTime?.toDate?.()?.toISOString() ?? null,
          expiresAt: vd.expiresAt?.toDate?.()?.toISOString() ?? null,
          doctorJoined: vd.doctorJoined ?? false,
          source: 'legacy',
        };
      }
    }

    // 4. If doctorName is missing, look it up from v2_doctors or legacy doctors
    if (!appointment.doctorName && appointment.doctorId) {
      const doctorDoc = await adminDb.collection('v2_doctors').doc(appointment.doctorId).get();
      if (doctorDoc.exists) {
        const dd = doctorDoc.data()!;
        appointment = {
          ...appointment,
          doctorName: dd.name ?? '',
          doctorSpecialty: appointment.doctorSpecialty || dd.specialty || '',
        };
      } else {
        // Try legacy doctors collection
        const legacyDoctorDoc = await adminDb.collection('doctors').doc(appointment.doctorId).get();
        if (legacyDoctorDoc.exists) {
          const dd = legacyDoctorDoc.data()!;
          appointment = {
            ...appointment,
            doctorName: dd.name ?? dd.displayName ?? '',
            doctorSpecialty: appointment.doctorSpecialty || dd.specialty || dd.especialidad || '',
          };
        }
      }
    }

    return jsonOk({ appointment: { ...appointment, _source: source }, videoRoom });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}

// PATCH /api/appointments/[id] — Update appointment status
export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { id } = await params;
    const body = await request.json();
    const { action, reason, notes, dateTime } = body as {
      action: 'confirm' | 'reject' | 'cancel' | 'complete' | 'reschedule';
      reason?: string;
      notes?: string;
      dateTime?: string;
    };

    switch (action) {
      case 'confirm':
        await getAppointmentService().confirm(id);
        break;
      case 'reject':
        await getAppointmentService().reject(id, reason);
        break;
      case 'cancel':
        await getAppointmentService().cancel(id, reason);
        break;
      case 'complete':
        await getAppointmentService().complete(id, notes);
        break;
      case 'reschedule':
        if (!dateTime) return jsonError('dateTime required for reschedule');
        await getAppointmentService().reschedule({
          appointmentId: id,
          newDateTime: new Date(dateTime),
          reason,
        });
        break;
      default:
        return jsonError(`Unknown action: ${action}`);
    }

    return jsonOk({ success: true, action });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Internal server error', 500);
  }
}
