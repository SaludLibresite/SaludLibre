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
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "./firebase";

const APPOINTMENTS_COLLECTION = "appointments";
const APPOINTMENT_DOCUMENTS_COLLECTION = "appointmentDocuments";

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
      throw new Error("Cita no encontrada");
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

// Get appointments for a specific patient
export async function getAppointmentsByPatientId(patientId) {
  try {
    const appointmentsRef = collection(db, APPOINTMENTS_COLLECTION);
    const q = query(
      appointmentsRef,
      where("patientId", "==", patientId),
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
    console.error("Error getting patient appointments:", error);
    throw error;
  }
}

// Create appointment request from patient
export async function requestAppointment(appointmentData) {
  try {
    const appointmentId = `APT-${Date.now().toString().slice(-6)}`;

    const docRef = await addDoc(collection(db, APPOINTMENTS_COLLECTION), {
      ...appointmentData,
      appointmentId,
      status: "pending", // Pending doctor approval
      requestedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      id: docRef.id,
      appointmentId,
      ...appointmentData,
      status: "pending",
    };
  } catch (error) {
    console.error("Error requesting appointment:", error);
    throw error;
  }
}

// Approve appointment request
export async function approveAppointment(id, doctorNotes = "") {
  try {
    const updateData = {
      status: "scheduled",
      approvedAt: new Date(),
      updatedAt: new Date(),
    };

    if (doctorNotes) {
      updateData.doctorNotes = doctorNotes;
    }

    await updateAppointment(id, updateData);
    return true;
  } catch (error) {
    console.error("Error approving appointment:", error);
    throw error;
  }
}

// Reject appointment request
export async function rejectAppointment(id, reason = "") {
  try {
    const updateData = {
      status: "rejected",
      rejectedAt: new Date(),
      updatedAt: new Date(),
    };

    if (reason) {
      updateData.rejectionReason = reason;
    }

    await updateAppointment(id, updateData);
    return true;
  } catch (error) {
    console.error("Error rejecting appointment:", error);
    throw error;
  }
}

// Get pending appointment requests for a doctor
export async function getPendingAppointments(doctorId) {
  try {
    const appointmentsRef = collection(db, APPOINTMENTS_COLLECTION);
    const q = query(
      appointmentsRef,
      where("doctorId", "==", doctorId),
      where("status", "==", "pending"),
      orderBy("requestedAt", "desc")
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
    console.error("Error getting pending appointments:", error);
    throw error;
  }
}

// Get available time slots for a doctor
export async function getAvailableTimeSlots(doctorId, date) {
  try {
    // Get existing appointments for the date
    const appointmentsRef = collection(db, APPOINTMENTS_COLLECTION);
    const q = query(
      appointmentsRef,
      where("doctorId", "==", doctorId),
      where("date", "==", date),
      where("status", "in", ["scheduled", "pending"])
    );

    const querySnapshot = await getDocs(q);
    const bookedSlots = [];

    querySnapshot.forEach((doc) => {
      const appointment = doc.data();
      if (appointment.time) {
        bookedSlots.push(appointment.time);
      }
    });

    // Generate available slots (assuming 9 AM to 6 PM, 30-minute intervals)
    const allSlots = [];
    for (let hour = 9; hour < 18; hour++) {
      allSlots.push(`${hour.toString().padStart(2, "0")}:00`);
      allSlots.push(`${hour.toString().padStart(2, "0")}:30`);
    }

    // Filter out booked slots
    const availableSlots = allSlots.filter(
      (slot) => !bookedSlots.includes(slot)
    );

    return availableSlots;
  } catch (error) {
    console.error("Error getting available time slots:", error);
    throw error;
  }
}

// Cancel appointment
export async function cancelAppointment(
  id,
  reason = "",
  cancelledBy = "patient"
) {
  try {
    const updateData = {
      status: "cancelled",
      cancelledAt: new Date(),
      cancelledBy,
      updatedAt: new Date(),
    };

    if (reason) {
      updateData.cancellationReason = reason;
    }

    await updateAppointment(id, updateData);
    return true;
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    throw error;
  }
}

// Reschedule appointment
export async function rescheduleAppointment(id, newDate, newTime, reason = "") {
  try {
    const updateData = {
      date: newDate,
      time: newTime,
      status: "rescheduled",
      rescheduledAt: new Date(),
      updatedAt: new Date(),
    };

    if (reason) {
      updateData.rescheduleReason = reason;
    }

    await updateAppointment(id, updateData);
    return true;
  } catch (error) {
    console.error("Error rescheduling appointment:", error);
    throw error;
  }
}

// Upload document for appointment
export async function uploadAppointmentDocument(
  file,
  appointmentId,
  title,
  uploadedBy,
  metadata = {}
) {
  try {
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `appointment-documents/${appointmentId}/${fileName}`;
    const fileRef = ref(storage, filePath);

    // Upload file to Firebase Storage
    const snapshot = await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Save document metadata to Firestore
    const documentData = {
      appointmentId,
      title,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      filePath,
      downloadURL,
      uploadedBy,
      uploadedAt: new Date(),
      ...metadata,
    };

    const docRef = await addDoc(
      collection(db, APPOINTMENT_DOCUMENTS_COLLECTION),
      documentData
    );

    return {
      id: docRef.id,
      ...documentData,
    };
  } catch (error) {
    console.error("Error uploading appointment document:", error);
    throw error;
  }
}

// Get documents for an appointment
export async function getAppointmentDocuments(appointmentId) {
  try {
    const documentsRef = collection(db, APPOINTMENT_DOCUMENTS_COLLECTION);
    const q = query(
      documentsRef,
      where("appointmentId", "==", appointmentId),
      orderBy("uploadedAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    const documents = [];
    querySnapshot.forEach((doc) => {
      documents.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return documents;
  } catch (error) {
    console.error("Error getting appointment documents:", error);
    throw error;
  }
}

// Delete appointment document
export async function deleteAppointmentDocument(documentId, filePath) {
  try {
    // Delete file from Storage
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);

    // Delete document metadata from Firestore
    await deleteDoc(doc(db, APPOINTMENT_DOCUMENTS_COLLECTION, documentId));

    return true;
  } catch (error) {
    console.error("Error deleting appointment document:", error);
    throw error;
  }
}

// Update document title
export async function updateAppointmentDocumentTitle(documentId, newTitle) {
  try {
    const docRef = doc(db, APPOINTMENT_DOCUMENTS_COLLECTION, documentId);
    await updateDoc(docRef, {
      title: newTitle,
      updatedAt: new Date(),
    });

    return true;
  } catch (error) {
    console.error("Error updating document title:", error);
    throw error;
  }
}
