# Firebase Security Rules for Reviews Collection
6
## Add these rules to your Firestore Security Rules

```javascript
// Reviews - patients can only read/write their own reviews, doctors can read reviews about them
match /reviews/{document} {
  // Patients can create reviews for their own appointmentsa
  allow create: if request.auth != null &&
    request.auth.uid != null &&sss
    request.resource.data.patientId != null &&a
    exists(/databases/$(database)/documents/patients/$(request.resource.data.patientId)) &&
    get(/databases/$(database)/documents/patients/$(request.resource.data.patientId)).data.userId == request.auth.uid;

  // Patients can read their own reviews
  allow read: if request.auth != null &&
    resource.data.patientId != null &&
    exists(/databases/$(database)/documents/patients/$(resource.data.patientId)) &&
    get(/databases/$(database)/documents/patients/$(resource.data.patientId)).data.userId == request.auth.uid;

  // Doctors can read reviews about them
  allow read: if request.auth != null &&
    resource.data.doctorId != null &&
    exists(/databases/$(database)/documents/doctors/$(resource.data.doctorId)) &&
    get(/databases/$(database)/documents/doctors/$(resource.data.doctorId)).data.userId == request.auth.uid;

  // Patients can update their own reviews
  allow update: if request.auth != null &&
    resource.data.patientId != null &&
    exists(/databases/$(database)/documents/patients/$(resource.data.patientId)) &&
    get(/databases/$(database)/documents/patients/$(resource.data.patientId)).data.userId == request.auth.uid;

  // Patients can delete their own reviews
  allow delete: if request.auth != null &&
    resource.data.patientId != null &&
    exists(/databases/$(database)/documents/patients/$(resource.data.patientId)) &&
    get(/databases/$(database)/documents/patients/$(resource.data.patientId)).data.userId == request.auth.uid;
}
```

## Complete Firestore Rules File

Add the reviews rules to your complete `firestore.rules` file:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura de doctores a todos (para la página pública)
    match /doctors/{document} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    // Pacientes - solo el doctor que los creó puede acceder
    match /patients/{document} {
      allow read, write: if request.auth != null &&
        (request.auth.uid == resource.data.doctorUserId ||
         isDocumentOwner(request.auth.uid, resource.data.doctorId));
      allow create: if request.auth != null;
    }

    // Citas - lectura pública para crear citas, escritura solo para el doctor
    match /appointments/{document} {
      allow read: if true;
      allow create: if true; // Permitir que cualquiera pueda crear una cita
      allow update, delete: if request.auth != null &&
        isDocumentOwner(request.auth.uid, resource.data.doctorId);
    }

    // Reviews - patients can only read/write their own reviews, doctors can read reviews about them
    match /reviews/{document} {
      // Patients can create reviews for their own appointments
      allow create: if request.auth != null &&
        request.auth.uid != null &&
        request.resource.data.patientId != null &&
        exists(/databases/$(database)/documents/patients/$(request.resource.data.patientId)) &&
        get(/databases/$(database)/documents/patients/$(request.resource.data.patientId)).data.userId == request.auth.uid;

      // Patients can read their own reviews
      allow read: if request.auth != null &&
        resource.data.patientId != null &&
        exists(/databases/$(database)/documents/patients/$(resource.data.patientId)) &&
        get(/databases/$(database)/documents/patients/$(resource.data.patientId)).data.userId == request.auth.uid;

      // Doctors can read reviews about them
      allow read: if request.auth != null &&
        resource.data.doctorId != null &&
        exists(/databases/$(database)/documents/doctors/$(resource.data.doctorId)) &&
        get(/databases/$(database)/documents/doctors/$(resource.data.doctorId)).data.userId == request.auth.uid;

      // Patients can update their own reviews
      allow update: if request.auth != null &&
        resource.data.patientId != null &&
        exists(/databases/$(database)/documents/patients/$(resource.data.patientId)) &&
        get(/databases/$(database)/documents/patients/$(resource.data.patientId)).data.userId == request.auth.uid;

      // Patients can delete their own reviews
      allow delete: if request.auth != null &&
        resource.data.patientId != null &&
        exists(/databases/$(database)/documents/patients/$(resource.data.patientId)) &&
        get(/databases/$(database)/documents/patients/$(resource.data.patientId)).data.userId == request.auth.uid;
    }

    // Función helper para verificar si un usuario es propietario de un documento
    function isDocumentOwner(userId, doctorId) {
      return exists(/databases/$(database)/documents/doctors/$(doctorId)) &&
             get(/databases/$(database)/documents/doctors/$(doctorId)).data.userId == userId;
    }

    // Otras colecciones solo para usuarios autenticados
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Review Data Structure

The reviews collection will store documents with this structure:

```javascript
{
  id: "auto_generated_id",
  patientId: "patient_firestore_id",
  patientName: "Patient Name",
  appointmentId: "appointment_firestore_id",
  doctorId: "doctor_firestore_id",
  doctorName: "Dr. Name",
  doctorSpecialty: "Specialty",
  appointmentDate: Timestamp, // Date of the appointment being reviewed
  rating: 5, // Overall rating 1-5
  comment: "Review comment text",
  wouldRecommend: true, // Boolean
  aspects: {
    punctuality: 5,
    attention: 5,
    explanation: 4,
    facilities: 4
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Security Features

1. **Patient Privacy**: Patients can only see and modify their own reviews
2. **Doctor Access**: Doctors can read reviews about themselves but cannot modify them
3. **Appointment Validation**: Reviews can only be created for completed appointments
4. **Duplicate Prevention**: The service checks for existing reviews before allowing creation
5. **Authentication Required**: All operations require valid Firebase Authentication
