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
      throw new Error("Paciente no encontrado");
    }
  } catch (error) {
    console.error("Error getting patient:", error);
    throw error;
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
export async function createPatientDirect(patientData) {
  try {
    // Generate patient ID
    const patientId = `PAT-${Date.now().toString().slice(-6)}`;

    const docRef = await addDoc(collection(db, PATIENTS_COLLECTION), {
      ...patientData,
      patientId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      id: docRef.id,
      patientId,
      ...patientData,
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

// Add medical note to patient
export async function addMedicalNote(patientId, note) {
  try {
    const patient = await getPatientById(patientId);
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
