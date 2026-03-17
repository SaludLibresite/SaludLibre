import { FirestoreDoctorRepository } from '@/src/modules/doctors/infrastructure/FirestoreDoctorRepository';
import { FirestorePatientRepository } from '@/src/modules/patients/infrastructure/FirestorePatientRepository';
import { FirestoreFamilyMemberRepository } from '@/src/modules/patients/infrastructure/FirestoreFamilyMemberRepository';
import { FirestoreAppointmentRepository } from '@/src/modules/appointments/infrastructure/FirestoreAppointmentRepository';
import { FirestorePrescriptionRepository } from '@/src/modules/prescriptions/infrastructure/FirestorePrescriptionRepository';
import { FirestoreMedicalDocumentRepository } from '@/src/modules/medical-records/infrastructure/FirestoreMedicalDocumentRepository';
import {
  FirestoreSubscriptionRepository,
  FirestoreSubscriptionPlanRepository,
  FirestorePaymentRepository,
} from '@/src/modules/subscriptions/infrastructure/FirestoreSubscriptionRepository';
import { FirestoreReferralRepository } from '@/src/modules/referrals/infrastructure/FirestoreReferralRepository';
import { FirestoreSpecialtyRepository } from '@/src/modules/specialties/infrastructure/FirestoreSpecialtyRepository';
import { FirestoreReviewRepository } from '@/src/modules/reviews/infrastructure/FirestoreReviewRepository';
import { FirestoreVideoConsultationRepository } from '@/src/modules/video-consultations/infrastructure/FirestoreVideoConsultationRepository';

import { ResendEmailService } from '@/src/infrastructure/external/ResendEmailService';
import { MercadoPagoGateway } from '@/src/infrastructure/external/MercadoPagoGateway';
import { DailyVideoService } from '@/src/infrastructure/external/DailyVideoService';
import { FirebaseFileStorage } from '@/src/infrastructure/external/FirebaseFileStorage';

import { DoctorService } from '@/src/modules/doctors/application/DoctorService';
import { PatientService } from '@/src/modules/patients/application/PatientService';
import { AppointmentService } from '@/src/modules/appointments/application/AppointmentService';
import { PrescriptionService } from '@/src/modules/prescriptions/application/PrescriptionService';
import { MedicalRecordService } from '@/src/modules/medical-records/application/MedicalRecordService';
import { SubscriptionService } from '@/src/modules/subscriptions/application/SubscriptionService';
import { ReferralService } from '@/src/modules/referrals/application/ReferralService';
import { SpecialtyService } from '@/src/modules/specialties/application/SpecialtyService';
import { ReviewService } from '@/src/modules/reviews/application/ReviewService';
import { VideoConsultationService } from '@/src/modules/video-consultations/application/VideoConsultationService';

// ============================================================
// Composition Root — Dependency Injection Container
// ============================================================
// Single place that wires all dependencies together.
// API routes import services from here — never instantiate directly.
// Uses lazy singleton pattern to avoid initializing unused services.
// ============================================================

// --- Repositories (singletons) ---

const doctorRepo = new FirestoreDoctorRepository();
const patientRepo = new FirestorePatientRepository();
const familyMemberRepo = new FirestoreFamilyMemberRepository();
const appointmentRepo = new FirestoreAppointmentRepository();
const prescriptionRepo = new FirestorePrescriptionRepository();
const medicalDocumentRepo = new FirestoreMedicalDocumentRepository();
const subscriptionRepo = new FirestoreSubscriptionRepository();
const subscriptionPlanRepo = new FirestoreSubscriptionPlanRepository();
const paymentRepo = new FirestorePaymentRepository();
const referralRepo = new FirestoreReferralRepository();
const specialtyRepo = new FirestoreSpecialtyRepository();
const reviewRepo = new FirestoreReviewRepository();
const videoConsultationRepo = new FirestoreVideoConsultationRepository();

// --- External services (lazy — avoid init errors if env vars missing) ---

let _emailService: ResendEmailService | null = null;
function getEmailService() {
  if (!_emailService) _emailService = new ResendEmailService();
  return _emailService;
}

let _paymentGateway: MercadoPagoGateway | null = null;
function getPaymentGateway() {
  if (!_paymentGateway) _paymentGateway = new MercadoPagoGateway();
  return _paymentGateway;
}

let _videoService: DailyVideoService | null = null;
function getVideoService() {
  if (!_videoService) _videoService = new DailyVideoService();
  return _videoService;
}

const fileStorage = new FirebaseFileStorage();

// --- Application Services (lazy singletons) ---

let _doctorService: DoctorService | null = null;
export function getDoctorService() {
  if (!_doctorService) {
    _doctorService = new DoctorService(doctorRepo, appointmentRepo, reviewRepo, fileStorage);
  }
  return _doctorService;
}

let _patientService: PatientService | null = null;
export function getPatientService() {
  if (!_patientService) {
    _patientService = new PatientService(patientRepo, familyMemberRepo, getEmailService(), fileStorage);
  }
  return _patientService;
}

let _appointmentService: AppointmentService | null = null;
export function getAppointmentService() {
  if (!_appointmentService) {
    _appointmentService = new AppointmentService(appointmentRepo, doctorRepo, patientRepo, getEmailService());
  }
  return _appointmentService;
}

let _prescriptionService: PrescriptionService | null = null;
export function getPrescriptionService() {
  if (!_prescriptionService) {
    _prescriptionService = new PrescriptionService(prescriptionRepo, doctorRepo, patientRepo);
  }
  return _prescriptionService;
}

let _medicalRecordService: MedicalRecordService | null = null;
export function getMedicalRecordService() {
  if (!_medicalRecordService) {
    _medicalRecordService = new MedicalRecordService(medicalDocumentRepo, fileStorage);
  }
  return _medicalRecordService;
}

let _subscriptionService: SubscriptionService | null = null;
export function getSubscriptionService() {
  if (!_subscriptionService) {
    _subscriptionService = new SubscriptionService(
      subscriptionRepo, subscriptionPlanRepo, paymentRepo, doctorRepo, getPaymentGateway(),
    );
  }
  return _subscriptionService;
}

let _referralService: ReferralService | null = null;
export function getReferralService() {
  if (!_referralService) {
    _referralService = new ReferralService(referralRepo, doctorRepo);
  }
  return _referralService;
}

let _specialtyService: SpecialtyService | null = null;
export function getSpecialtyService() {
  if (!_specialtyService) {
    _specialtyService = new SpecialtyService(specialtyRepo, fileStorage);
  }
  return _specialtyService;
}

let _reviewService: ReviewService | null = null;
export function getReviewService() {
  if (!_reviewService) {
    _reviewService = new ReviewService(reviewRepo, appointmentRepo);
  }
  return _reviewService;
}

let _videoConsultationService: VideoConsultationService | null = null;
export function getVideoConsultationService() {
  if (!_videoConsultationService) {
    _videoConsultationService = new VideoConsultationService(
      videoConsultationRepo, appointmentRepo, getVideoService(),
    );
  }
  return _videoConsultationService;
}
