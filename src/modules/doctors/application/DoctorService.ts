import type { Doctor } from '../domain/DoctorEntity';
import type { DoctorRepository } from '../domain/DoctorRepository';
import type { AppointmentRepository } from '@/src/modules/appointments/domain/AppointmentRepository';
import type { ReviewRepository } from '@/src/modules/reviews/domain/ReviewRepository';
import type { FileStorage } from '@/src/shared/domain/ports/FileStorage';

// ============================================================
// Doctor Application Services (Use Cases)
// ============================================================
// Each method represents a single use case from the legacy audit.
// Dependencies are injected via constructor (Hexagonal pattern).
// ============================================================

// --- DTOs ---

export interface DoctorListFilters {
  specialty?: string;
  location?: string;
  onlineConsultation?: boolean;
  verifiedOnly?: boolean;
}

export interface DoctorDashboardStats {
  totalAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
  cancelledAppointments: number;
  averageRating: number;
  totalReviews: number;
}

export interface UpdateDoctorProfileInput {
  name?: string;
  phone?: string;
  description?: string;
  specialty?: string;
  schedule?: string;
  onlineConsultation?: boolean;
  location?: Doctor['location'];
  professional?: Partial<Doctor['professional']>;
}

export interface CreateDoctorProfileInput {
  userId: string;
  name: string;
  email: string;
  phone: string;
  gender: Doctor['gender'];
  specialty: string;
  description: string;
  schedule: string;
  onlineConsultation: boolean;
  location: Doctor['location'];
  professional: Doctor['professional'];
}

// --- Service ---

export class DoctorService {
  constructor(
    private readonly doctorRepo: DoctorRepository,
    private readonly appointmentRepo: AppointmentRepository,
    private readonly reviewRepo: ReviewRepository,
    private readonly fileStorage: FileStorage,
  ) {}

  /** Get a single doctor by Firestore document ID */
  async getById(id: string): Promise<Doctor | null> {
    return this.doctorRepo.findById(id);
  }

  /** Get a single doctor by URL slug (public profile page) */
  async getBySlug(slug: string): Promise<Doctor | null> {
    return this.doctorRepo.findBySlug(slug);
  }

  /** Get a single doctor by Firebase Auth UID (dashboard) */
  async getByUserId(userId: string): Promise<Doctor | null> {
    return this.doctorRepo.findByUserId(userId);
  }

  /** List verified doctors with optional filters (public directory) */
  async listVerified(filters?: DoctorListFilters): Promise<Doctor[]> {
    let doctors = await this.doctorRepo.findVerified();

    if (filters?.specialty) {
      doctors = doctors.filter(d =>
        d.specialty.toLowerCase() === filters.specialty!.toLowerCase(),
      );
    }
    if (filters?.onlineConsultation !== undefined) {
      doctors = doctors.filter(d => d.onlineConsultation === filters.onlineConsultation);
    }

    return doctors;
  }

  /** List ALL doctors — superadmin only */
  async listAll(): Promise<Doctor[]> {
    return this.doctorRepo.findAll();
  }

  /** List doctors by specialty (related doctors section) */
  async listBySpecialty(specialty: string, excludeId?: string): Promise<Doctor[]> {
    const doctors = await this.doctorRepo.findBySpecialty(specialty);
    return excludeId ? doctors.filter(d => d.id !== excludeId) : doctors;
  }

  /** Create a new doctor profile (registration) */
  async createProfile(input: CreateDoctorProfileInput): Promise<Doctor> {
    const existing = await this.doctorRepo.findByUserId(input.userId);
    if (existing) {
      throw new Error('Doctor profile already exists for this user');
    }

    const slug = this.generateSlug(input.name, input.specialty);
    const now = new Date();
    const doctor: Doctor = {
      id: '',     // Firestore auto-generates
      userId: input.userId,
      name: input.name,
      slug,
      email: input.email,
      phone: input.phone,
      gender: input.gender,
      specialty: input.specialty,
      description: input.description,
      profileImage: '',
      schedule: input.schedule,
      onlineConsultation: input.onlineConsultation,
      location: input.location,
      verified: false,
      subscription: {
        status: 'inactive',
        planId: '',
        planName: 'Free',
        expiresAt: null,
      },
      professional: input.professional,
      createdAt: now,
      updatedAt: now,
    };

    await this.doctorRepo.save(doctor);
    return doctor;
  }

  /** Update an existing doctor profile */
  async updateProfile(doctorId: string, input: UpdateDoctorProfileInput): Promise<void> {
    const doctor = await this.doctorRepo.findById(doctorId);
    if (!doctor) {
      throw new Error('Doctor not found');
    }

    const updates: Partial<Doctor> = { updatedAt: new Date() };

    if (input.name !== undefined) updates.name = input.name;
    if (input.phone !== undefined) updates.phone = input.phone;
    if (input.description !== undefined) updates.description = input.description;
    if (input.specialty !== undefined) updates.specialty = input.specialty;
    if (input.schedule !== undefined) updates.schedule = input.schedule;
    if (input.onlineConsultation !== undefined) updates.onlineConsultation = input.onlineConsultation;
    if (input.location !== undefined) updates.location = input.location;

    if (input.professional) {
      updates.professional = { ...doctor.professional, ...input.professional };
    }

    // Regenerate slug if name or specialty changed
    if (input.name || input.specialty) {
      updates.slug = this.generateSlug(
        input.name ?? doctor.name,
        input.specialty ?? doctor.specialty,
      );
    }

    await this.doctorRepo.update(doctorId, updates);
  }

  /** Upload/update profile photo */
  async updateProfilePhoto(doctorId: string, file: Buffer, contentType: string): Promise<string> {
    const doctor = await this.doctorRepo.findById(doctorId);
    if (!doctor) throw new Error('Doctor not found');

    const stored = await this.fileStorage.upload({
      path: `doctors/${doctorId}/profile.${contentType.split('/')[1] ?? 'jpg'}`,
      content: file,
      contentType,
    });

    await this.doctorRepo.update(doctorId, {
      profileImage: stored.downloadUrl,
      updatedAt: new Date(),
    });

    return stored.downloadUrl;
  }

  /** Verify a doctor — superadmin only */
  async verify(doctorId: string): Promise<void> {
    await this.doctorRepo.update(doctorId, {
      verified: true,
      updatedAt: new Date(),
    });
  }

  /** Delete a doctor — superadmin only */
  async delete(doctorId: string): Promise<void> {
    await this.doctorRepo.delete(doctorId);
  }

  /** Get dashboard statistics for a doctor */
  async getDashboardStats(doctorId: string): Promise<DoctorDashboardStats> {
    const [appointments, reviews] = await Promise.all([
      this.appointmentRepo.findByDoctorId(doctorId),
      this.reviewRepo.findByDoctorId(doctorId),
    ]);

    const completed = appointments.filter(a => a.status === 'completed').length;
    const pending = appointments.filter(a =>
      a.status === 'pending' || a.status === 'scheduled' || a.status === 'confirmed',
    ).length;
    const cancelled = appointments.filter(a => a.status === 'cancelled').length;

    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return {
      totalAppointments: appointments.length,
      completedAppointments: completed,
      pendingAppointments: pending,
      cancelledAppointments: cancelled,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
    };
  }

  // --- Private helpers ---

  private generateSlug(name: string, specialty: string): string {
    return `${name}-${specialty}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
