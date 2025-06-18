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

const DOCTORS_COLLECTION = "doctors";

// Get all doctors
export async function getAllDoctors() {
  try {
    const doctorsRef = collection(db, DOCTORS_COLLECTION);
    const q = query(doctorsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    const doctors = [];
    querySnapshot.forEach((doc) => {
      doctors.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return doctors;
  } catch (error) {
    console.error("Error getting doctors:", error);
    throw error;
  }
}

// Get doctor by ID
export async function getDoctorById(id) {
  try {
    const docRef = doc(db, DOCTORS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      };
    } else {
      throw new Error("Doctor not found");
    }
  } catch (error) {
    console.error("Error getting doctor:", error);
    throw error;
  }
}

// Get doctor by slug
export async function getDoctorBySlug(slug) {
  try {
    const doctorsRef = collection(db, DOCTORS_COLLECTION);
    const q = query(doctorsRef, where("slug", "==", slug));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      };
    } else {
      throw new Error("Doctor not found");
    }
  } catch (error) {
    console.error("Error getting doctor by slug:", error);
    throw error;
  }
}

// Get doctor by user ID (for authenticated users)
export async function getDoctorByUserId(userId) {
  try {
    const doctorsRef = collection(db, DOCTORS_COLLECTION);
    const q = query(doctorsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      };
    } else {
      return null; // No doctor profile found for this user
    }
  } catch (error) {
    console.error("Error getting doctor by user ID:", error);
    throw error;
  }
}

// Create a new doctor
export async function createDoctor(doctorData) {
  try {
    const docRef = await addDoc(collection(db, DOCTORS_COLLECTION), {
      ...doctorData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error creating doctor:", error);
    throw error;
  }
}

// Update doctor
export async function updateDoctor(id, doctorData) {
  try {
    const docRef = doc(db, DOCTORS_COLLECTION, id);
    await updateDoc(docRef, {
      ...doctorData,
      updatedAt: new Date(),
    });

    return true;
  } catch (error) {
    console.error("Error updating doctor:", error);
    throw error;
  }
}

// Delete doctor
export async function deleteDoctor(id) {
  try {
    await deleteDoc(doc(db, DOCTORS_COLLECTION, id));
    return true;
  } catch (error) {
    console.error("Error deleting doctor:", error);
    throw error;
  }
}

// Generate slug from name and specialty
export function generateSlug(name, specialty) {
  const nameSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim();

  const specialtySlug = specialty
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim();

  return `${nameSlug}-${specialtySlug}-${Date.now()}`;
}
