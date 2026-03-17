import type { Appointment } from '../domain/AppointmentEntity';
import type { AppointmentRepository } from '../domain/AppointmentRepository';
import type { DoctorRepository } from '@/src/modules/doctors/domain/DoctorRepository';
import type { PatientRepository } from '@/src/modules/patients/domain/PatientRepository';
import type { EmailService } from '@/src/shared/domain/ports/EmailService';
import type { AppointmentStatus, AppointmentType, AppointmentUrgency } from '@/src/shared/domain/types';

// ============================================================
// Appointment Application Services (Use Cases)
// ============================================================

// --- DTOs ---

export interface RequestAppointmentInput {
  patientId: string;
  patientUserId: string;
  doctorId: string;
  dateTime: Date;
  durationMinutes?: number;
  type: AppointmentType;
  reason: string;
  urgency: AppointmentUrgency;
  notes?: string;
}

export interface RescheduleInput {
  appointmentId: string;
  newDateTime: Date;
  reason?: string;
}

export interface AvailableSlot {
  dateTime: Date;
  durationMinutes: number;
}

export interface AppointmentListFilters {
  status?: AppointmentStatus;
  fromDate?: Date;
  toDate?: Date;
}

// --- Service ---

export class AppointmentService {
  constructor(
    private readonly appointmentRepo: AppointmentRepository,
    private readonly doctorRepo: DoctorRepository,
    private readonly patientRepo: PatientRepository,
    private readonly emailService: EmailService,
  ) {}

  /** Get appointment by Firestore ID */
  async getById(id: string): Promise<Appointment | null> {
    return this.appointmentRepo.findById(id);
  }

  /** Get appointment by human-readable ID (APT-XXXXXX) */
  async getByAppointmentId(appointmentId: string): Promise<Appointment | null> {
    return this.appointmentRepo.findByAppointmentId(appointmentId);
  }

  /** Patient requests a new appointment (status: pending) */
  async request(input: RequestAppointmentInput): Promise<Appointment> {
    const [doctor, patient] = await Promise.all([
      this.doctorRepo.findById(input.doctorId),
      this.patientRepo.findById(input.patientId),
    ]);

    if (!doctor) throw new Error('Doctor not found');
    if (!patient) throw new Error('Patient not found');

    const now = new Date();
    const appointmentId = `APT-${Math.random().toString().slice(2, 8)}`;

    const appointment: Appointment = {
      id: '',
      appointmentId,
      patientId: input.patientId,
      patientUserId: input.patientUserId,
      doctorId: input.doctorId,
      patientName: patient.name,
      patientEmail: patient.email,
      patientPhone: patient.phone,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialty,
      doctorGender: doctor.gender,
      dateTime: input.dateTime,
      durationMinutes: input.durationMinutes ?? 30,
      type: input.type,
      reason: input.reason,
      urgency: input.urgency,
      notes: input.notes ?? '',
      status: 'pending',
      requestedAt: now,
      approvedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    await this.appointmentRepo.save(appointment);

    // Send confirmation emails (fire-and-forget)
    this.sendRequestEmails(appointment, doctor.email).catch(() => {});

    return appointment;
  }

  /** Doctor confirms (approves) a pending appointment */
  async confirm(appointmentId: string): Promise<void> {
    const appointment = await this.appointmentRepo.findById(appointmentId);
    if (!appointment) throw new Error('Appointment not found');
    if (appointment.status !== 'pending') {
      throw new Error(`Cannot confirm appointment with status: ${appointment.status}`);
    }

    const now = new Date();
    await this.appointmentRepo.update(appointmentId, {
      status: 'confirmed',
      approvedAt: now,
      updatedAt: now,
    });

    // Notify patient
    this.emailService
      .send({
        to: { email: appointment.patientEmail, name: appointment.patientName },
        subject: 'Tu turno ha sido confirmado',
        html: `<p>Hola ${appointment.patientName}, tu turno con ${appointment.doctorName} el ${appointment.dateTime.toLocaleDateString('es-AR')} ha sido confirmado.</p>`,
      })
      .catch(() => {});
  }

  /** Doctor rejects a pending appointment */
  async reject(appointmentId: string, reason?: string): Promise<void> {
    const appointment = await this.appointmentRepo.findById(appointmentId);
    if (!appointment) throw new Error('Appointment not found');
    if (appointment.status !== 'pending') {
      throw new Error(`Cannot reject appointment with status: ${appointment.status}`);
    }

    await this.appointmentRepo.update(appointmentId, {
      status: 'cancelled',
      notes: reason ? `Rechazado: ${reason}` : appointment.notes,
      updatedAt: new Date(),
    });
  }

  /** Cancel an appointment (patient or doctor) */
  async cancel(appointmentId: string, reason?: string): Promise<void> {
    const appointment = await this.appointmentRepo.findById(appointmentId);
    if (!appointment) throw new Error('Appointment not found');

    const cancellable: AppointmentStatus[] = ['pending', 'scheduled', 'confirmed'];
    if (!cancellable.includes(appointment.status)) {
      throw new Error(`Cannot cancel appointment with status: ${appointment.status}`);
    }

    await this.appointmentRepo.update(appointmentId, {
      status: 'cancelled',
      notes: reason ? `Cancelado: ${reason}` : appointment.notes,
      updatedAt: new Date(),
    });
  }

  /** Doctor marks appointment as completed */
  async complete(appointmentId: string, doctorNotes?: string): Promise<void> {
    const appointment = await this.appointmentRepo.findById(appointmentId);
    if (!appointment) throw new Error('Appointment not found');

    const completable: AppointmentStatus[] = ['confirmed', 'in_progress'];
    if (!completable.includes(appointment.status)) {
      throw new Error(`Cannot complete appointment with status: ${appointment.status}`);
    }

    await this.appointmentRepo.update(appointmentId, {
      status: 'completed',
      notes: doctorNotes ?? appointment.notes,
      updatedAt: new Date(),
    });
  }

  /** Reschedule an appointment to a new date/time */
  async reschedule(input: RescheduleInput): Promise<void> {
    const appointment = await this.appointmentRepo.findById(input.appointmentId);
    if (!appointment) throw new Error('Appointment not found');

    const reschedulable: AppointmentStatus[] = ['pending', 'scheduled', 'confirmed'];
    if (!reschedulable.includes(appointment.status)) {
      throw new Error(`Cannot reschedule appointment with status: ${appointment.status}`);
    }

    await this.appointmentRepo.update(input.appointmentId, {
      dateTime: input.newDateTime,
      status: 'pending', // Needs re-confirmation
      notes: input.reason
        ? `${appointment.notes}\nReprogramado: ${input.reason}`
        : appointment.notes,
      updatedAt: new Date(),
    });
  }

  /** List appointments for a patient, optionally filtered */
  async listByPatient(patientId: string, filters?: AppointmentListFilters): Promise<Appointment[]> {
    let appointments = await this.appointmentRepo.findByPatientId(patientId);
    return this.applyFilters(appointments, filters);
  }

  /** List appointments for a doctor, optionally filtered */
  async listByDoctor(doctorId: string, filters?: AppointmentListFilters): Promise<Appointment[]> {
    let appointments = await this.appointmentRepo.findByDoctorId(doctorId);
    return this.applyFilters(appointments, filters);
  }

  /** Get available time slots for a doctor on a given date range */
  async getAvailableSlots(
    doctorId: string,
    start: Date,
    end: Date,
    slotDurationMinutes: number = 30,
  ): Promise<AvailableSlot[]> {
    const existing = await this.appointmentRepo.findByDateRange(doctorId, start, end);
    const bookedTimes = new Set(
      existing
        .filter(a => a.status !== 'cancelled')
        .map(a => a.dateTime.getTime()),
    );

    const slots: AvailableSlot[] = [];
    const cursor = new Date(start);
    while (cursor < end) {
      const hour = cursor.getHours();
      // Working hours: 8-20
      if (hour >= 8 && hour < 20 && !bookedTimes.has(cursor.getTime())) {
        slots.push({
          dateTime: new Date(cursor),
          durationMinutes: slotDurationMinutes,
        });
      }
      cursor.setMinutes(cursor.getMinutes() + slotDurationMinutes);
    }

    return slots;
  }

  // --- Private helpers ---

  private applyFilters(
    appointments: Appointment[],
    filters?: AppointmentListFilters,
  ): Appointment[] {
    if (!filters) return appointments;

    if (filters.status) {
      appointments = appointments.filter(a => a.status === filters.status);
    }
    if (filters.fromDate) {
      appointments = appointments.filter(a => a.dateTime >= filters.fromDate!);
    }
    if (filters.toDate) {
      appointments = appointments.filter(a => a.dateTime <= filters.toDate!);
    }

    return appointments.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
  }

  private async sendRequestEmails(appointment: Appointment, doctorEmail: string): Promise<void> {
    const dateStr = appointment.dateTime.toLocaleDateString('es-AR');
    const timeStr = appointment.dateTime.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    await Promise.all([
      this.emailService.send({
        to: { email: appointment.patientEmail, name: appointment.patientName },
        subject: 'Solicitud de turno enviada',
        html: `<p>Hola ${appointment.patientName}, tu solicitud de turno con ${appointment.doctorName} (${appointment.doctorSpecialty}) para el ${dateStr} a las ${timeStr} fue enviada. Te avisaremos cuando sea confirmada.</p>`,
      }),
      this.emailService.send({
        to: { email: doctorEmail, name: appointment.doctorName },
        subject: 'Nueva solicitud de turno',
        html: `<p>Tenés un nuevo turno pendiente de ${appointment.patientName} para el ${dateStr} a las ${timeStr}. Motivo: ${appointment.reason}.</p>`,
      }),
    ]);
  }
}
