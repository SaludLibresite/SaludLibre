import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";

const PRESCRIPTIONS_COLLECTION = "prescriptions";

// Create prescription using API
export async function createPrescription(
  prescriptionData,
  appointmentId = null
) {
  try {
    const response = await fetch("/api/prescriptions/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prescriptionData,
        appointmentId,
      }),
    });

    if (!response.ok) {
      let errorMessage = "Error creating prescription";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        console.error("API Error Details:", errorData);
      } catch (jsonError) {
        console.error(
          "Could not parse error response:",
          response.status,
          response.statusText
        );
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error creating prescription:", error);
    throw error;
  }
}

// Get prescriptions for a doctor
export async function getPrescriptionsByDoctorId(doctorId) {
  try {
    const prescriptionsRef = collection(db, PRESCRIPTIONS_COLLECTION);
    const q = query(
      prescriptionsRef,
      where("doctorId", "==", doctorId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    const prescriptions = [];
    querySnapshot.forEach((doc) => {
      prescriptions.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return prescriptions;
  } catch (error) {
    console.error("Error getting prescriptions:", error);
    throw error;
  }
}

// Get prescriptions for a patient
export async function getPrescriptionsByPatientId(patientId) {
  try {
    const prescriptionsRef = collection(db, PRESCRIPTIONS_COLLECTION);
    const q = query(
      prescriptionsRef,
      where("patientId", "==", patientId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    const prescriptions = [];
    querySnapshot.forEach((doc) => {
      prescriptions.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return prescriptions;
  } catch (error) {
    console.error("Error getting patient prescriptions:", error);
    throw error;
  }
}

// Get prescriptions for an appointment
export async function getPrescriptionsByAppointmentId(appointmentId) {
  try {
    const prescriptionsRef = collection(db, PRESCRIPTIONS_COLLECTION);
    const q = query(
      prescriptionsRef,
      where("appointmentId", "==", appointmentId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    const prescriptions = [];
    querySnapshot.forEach((doc) => {
      prescriptions.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return prescriptions;
  } catch (error) {
    console.error("Error getting appointment prescriptions:", error);
    throw error;
  }
}

// Delete prescription (metadata only, no file to delete)
export async function deletePrescription(prescriptionId) {
  try {
    // Delete prescription metadata from Firestore
    await deleteDoc(doc(db, PRESCRIPTIONS_COLLECTION, prescriptionId));

    return true;
  } catch (error) {
    console.error("Error deleting prescription:", error);
    throw error;
  }
}
