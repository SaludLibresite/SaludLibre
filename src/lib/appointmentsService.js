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

const APPOINTMENTS_COLLECTION = "appointments";

// Get all appointments for a specific doctor
export async function getAppointmentsByDoctorId(doctorId) {
  try {
    const appointmentsRef = collection(db, APPOINTMENTS_COLLECTION);
    const q = query(
      appointmentsRef,
      where("doctorId", "==", doctorId),
      orderBy("date", "desc")
    );
    const querySnapshot = await getDocs(q);

    const appointments = [];
    querySnapshot.forEach((doc) => {
      appointments.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return appointments;
  } catch (error) {
    console.error("Error getting appointments:", error);
    throw error;
  }
}

// Get appointment by ID
export async function getAppointmentById(id) {
  try {
    const docRef = doc(db, APPOINTMENTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      };
    } else {
      throw new Error("Appointment not found");
    }
  } catch (error) {
    console.error("Error getting appointment:", error);
    throw error;
  }
}

// Create a new appointment
export async function createAppointment(appointmentData) {
  try {
    // Generate appointment ID
    const appointmentId = `APT-${Date.now().toString().slice(-6)}`;

    const docRef = await addDoc(collection(db, APPOINTMENTS_COLLECTION), {
      ...appointmentData,
      appointmentId,
      status: appointmentData.status || "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      id: docRef.id,
      appointmentId,
      ...appointmentData,
    };
  } catch (error) {
    console.error("Error creating appointment:", error);
    throw error;
  }
}

// Update appointment
export async function updateAppointment(id, appointmentData) {
  try {
    const docRef = doc(db, APPOINTMENTS_COLLECTION, id);
    await updateDoc(docRef, {
      ...appointmentData,
      updatedAt: new Date(),
    });

    return true;
  } catch (error) {
    console.error("Error updating appointment:", error);
    throw error;
  }
}

// Delete appointment
export async function deleteAppointment(id) {
  try {
    await deleteDoc(doc(db, APPOINTMENTS_COLLECTION, id));
    return true;
  } catch (error) {
    console.error("Error deleting appointment:", error);
    throw error;
  }
}

// Get upcoming appointments for a doctor
export async function getUpcomingAppointments(doctorId) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointments = await getAppointmentsByDoctorId(doctorId);

    return appointments
      .filter((appointment) => {
        const appointmentDate = appointment.date?.toDate
          ? appointment.date.toDate()
          : new Date(appointment.date);
        return appointmentDate >= today && appointment.status !== "cancelled";
      })
      .sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateA - dateB;
      });
  } catch (error) {
    console.error("Error getting upcoming appointments:", error);
    throw error;
  }
}

// Get recent appointments for a doctor
export async function getRecentAppointments(doctorId) {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const appointments = await getAppointmentsByDoctorId(doctorId);

    return appointments
      .filter((appointment) => {
        const appointmentDate = appointment.date?.toDate
          ? appointment.date.toDate()
          : new Date(appointment.date);
        return appointmentDate < today && appointment.status === "completed";
      })
      .sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateB - dateA;
      });
  } catch (error) {
    console.error("Error getting recent appointments:", error);
    throw error;
  }
}

// Get appointments by status
export async function getAppointmentsByStatus(doctorId, status) {
  try {
    const appointmentsRef = collection(db, APPOINTMENTS_COLLECTION);
    const q = query(
      appointmentsRef,
      where("doctorId", "==", doctorId),
      where("status", "==", status),
      orderBy("date", "desc")
    );

    const querySnapshot = await getDocs(q);
    const appointments = [];

    querySnapshot.forEach((doc) => {
      appointments.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return appointments;
  } catch (error) {
    console.error("Error getting appointments by status:", error);
    throw error;
  }
}

// Update appointment status
export async function updateAppointmentStatus(id, status, notes = "") {
  try {
    const updateData = {
      status,
      updatedAt: new Date(),
    };

    if (notes) {
      updateData.notes = notes;
    }

    if (status === "completed") {
      updateData.completedAt = new Date();
    }

    await updateAppointment(id, updateData);
    return true;
  } catch (error) {
    console.error("Error updating appointment status:", error);
    throw error;
  }
}
