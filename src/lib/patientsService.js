import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";

const PATIENTS_COLLECTION = "patients";

// Get all patients for a specific doctor
export async function getPatientsByDoctorId(doctorId) {
  try {
    const patientsRef = collection(db, PATIENTS_COLLECTION);
    const q = query(
      patientsRef,
      where("doctorId", "==", doctorId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    const patients = [];
    querySnapshot.forEach((doc) => {
      patients.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return patients;
  } catch (error) {
    console.error("Error getting patients:", error);
    throw error;
  }
}

// Get patient by ID
export async function getPatientById(id) {
  try {
    const docRef = doc(db, PATIENTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      };
    } else {
      console.warn(`Paciente no encontrado con ID: ${id}`);
      return null;
    }
  } catch (error) {
    console.error("Error getting patient:", error);
    return null;
  }
}

// Create a new patient with Firebase Auth user and email notification
export async function createPatient(patientData, doctorId, doctorUserId) {
  try {
    const response = await fetch("/api/patients/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        patientData,
        doctorId,
        doctorUserId,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Error al crear paciente");
    }

    return result;
  } catch (error) {
    console.error("Error creating patient:", error);
    throw error;
  }
}

// Create a new patient (legacy method for direct Firestore)
export async function createPatientDirect(patientData, doctorId, doctorData) {
  try {
    // Generate patient ID
    const patientId = `PAT-${Date.now().toString().slice(-6)}`;

    // Create doctors array with the creating doctor as primary
    const doctors = [
      {
        doctorId: doctorId,
        doctorUserId: doctorData.userId,
        doctorName: doctorData.nombre,
        doctorSpecialty: doctorData.especialidad,
        assignedAt: new Date(),
        isPrimary: true,
      },
    ];

    const docRef = await addDoc(collection(db, PATIENTS_COLLECTION), {
      ...patientData,
      patientId,
      doctors: doctors,
      // Keep legacy fields for backward compatibility
      doctorId: doctorId,
      doctorUserId: doctorData.userId,
      doctorName: doctorData.nombre,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      id: docRef.id,
      patientId,
      ...patientData,
      doctors: doctors,
    };
  } catch (error) {
    console.error("Error creating patient:", error);
    throw error;
  }
}

// Update patient
export async function updatePatient(id, patientData) {
  try {
    const docRef = doc(db, PATIENTS_COLLECTION, id);
    await updateDoc(docRef, {
      ...patientData,
      updatedAt: new Date(),
    });

    return true;
  } catch (error) {
    console.error("Error updating patient:", error);
    throw error;
  }
}

// Delete patient
export async function deletePatient(id) {
  try {
    await deleteDoc(doc(db, PATIENTS_COLLECTION, id));
    return true;
  } catch (error) {
    console.error("Error deleting patient:", error);
    throw error;
  }
}

// Search patients by name or email
export async function searchPatients(doctorId, searchTerm) {
  try {
    const patients = await getPatientsByDoctorId(doctorId);

    if (!searchTerm) return patients;

    return patients.filter(
      (patient) =>
        patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone?.includes(searchTerm)
    );
  } catch (error) {
    console.error("Error searching patients:", error);
    throw error;
  }
}

// Search ALL patients globally (for doctor assignment)
export async function searchAllPatients(searchTerm) {
  try {
    const patientsRef = collection(db, PATIENTS_COLLECTION);
    const querySnapshot = await getDocs(patientsRef);

    const allPatients = [];
    querySnapshot.forEach((doc) => {
      allPatients.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    if (!searchTerm) return allPatients;

    return allPatients.filter(
      (patient) =>
        patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone?.includes(searchTerm) ||
        patient.patientId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  } catch (error) {
    console.error("Error searching all patients:", error);
    throw error;
  }
}

// Assign existing patient to doctor
export async function assignPatientToDoctor(patientId, doctorId, doctorData) {
  try {
    const patient = await getPatientById(patientId);
    
    if (!patient) {
      throw new Error(`Paciente no encontrado con ID: ${patientId}`);
    }
    
    // Create doctors array if it doesn't exist
    const doctors = patient.doctors || [];
    
    // Check if doctor is already assigned
    const isDoctorAssigned = doctors.some(doc => doc.doctorId === doctorId);
    
    if (isDoctorAssigned) {
      throw new Error("Este doctor ya tiene acceso a este paciente");
    }
    
    // Add new doctor to the array
    const newDoctor = {
      doctorId: doctorId,
      doctorUserId: doctorData.userId,
      doctorName: doctorData.nombre,
      doctorSpecialty: doctorData.especialidad,
      assignedAt: new Date(),
      isPrimary: doctors.length === 0, // First doctor is primary
    };
    
    doctors.push(newDoctor);
    
    // Update patient document
    await updatePatient(patientId, {
      doctors: doctors,
      // Keep legacy fields for backward compatibility
      ...(doctors.length === 1 && {
        doctorId: doctorId,
        doctorUserId: doctorData.userId,
        doctorName: doctorData.nombre,
      }),
    });

    return {
      success: true,
      message: "Paciente asignado exitosamente",
      patient: {
        ...patient,
        doctors: doctors,
      },
    };
  } catch (error) {
    console.error("Error assigning patient to doctor:", error);
    throw error;
  }
}

// Get patients where doctor has access (either as primary or in doctors array)
export async function getPatientsByDoctorAccess(doctorId) {
  try {
    const patientsRef = collection(db, PATIENTS_COLLECTION);
    
    // Query for patients where this doctor is the primary doctor (legacy)
    const primaryQuery = query(
      patientsRef,
      where("doctorId", "==", doctorId),
      orderBy("createdAt", "desc")
    );
    
    // Query for patients where this doctor is in the doctors array
    const accessQuery = query(
      patientsRef,
      where("doctors", "array-contains-any", [
        { doctorId: doctorId }
      ])
    );

    const [primarySnapshot, accessSnapshot] = await Promise.all([
      getDocs(primaryQuery),
      getDocs(accessQuery).catch(() => ({ docs: [] })) // Handle if query fails
    ]);

    const patients = new Map();

    // Add primary patients
    primarySnapshot.forEach((doc) => {
      patients.set(doc.id, {
        id: doc.id,
        ...doc.data(),
      });
    });

    // Add patients from doctors array
    accessSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.doctors && data.doctors.some(d => d.doctorId === doctorId)) {
        patients.set(doc.id, {
          id: doc.id,
          ...data,
        });
      }
    });

    return Array.from(patients.values());
  } catch (error) {
    console.error("Error getting patients by doctor access:", error);
    // Fallback to legacy method
    return await getPatientsByDoctorId(doctorId);
  }
}

// Add medical note to patient
export async function addMedicalNote(patientId, note) {
  try {
    const patient = await getPatientById(patientId);
    
    if (!patient) {
      throw new Error(`Paciente no encontrado con ID: ${patientId}`);
    }
    
    const medicalHistory = patient.medicalHistory || [];

    const newNote = {
      id: Date.now(),
      date: new Date(),
      ...note,
    };

    medicalHistory.unshift(newNote);

    await updatePatient(patientId, {
      medicalHistory,
    });

    return newNote;
  } catch (error) {
    console.error("Error adding medical note:", error);
    throw error;
  }
}

// Get patients with upcoming appointments
export async function getPatientsWithUpcomingAppointments(doctorId) {
  try {
    const patients = await getPatientsByDoctorId(doctorId);
    return patients.filter((patient) => patient.nextAppointment);
  } catch (error) {
    console.error("Error getting patients with appointments:", error);
    throw error;
  }
}

// Get patients paginated for superadmin
export async function getPatientsPaginated({ page = 1, limit = 20, search = "", sort = "recent" } = {}) {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      sort,
    });

    const response = await fetch(`/api/superadmin/patients?${params}`);

    if (!response.ok) {
      throw new Error("Error fetching patients");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error getting paginated patients:", error);
    throw error;
  }
}
