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
      throw new Error("Doctor no encontrado");
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
      throw new Error("Doctor no encontrado");
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

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

// Get doctors near a location
export async function getDoctorsNearLocation(
  latitude,
  longitude,
  radiusKm = 10
) {
  try {
    // Get all verified doctors first
    const doctors = await getAllDoctors();
    const verifiedDoctors = doctors.filter(
      (doctor) => doctor.verified === true
    );

    // Filter doctors that have location data and are within the radius
    const nearbyDoctors = verifiedDoctors
      .filter((doctor) => {
        return (
          doctor.latitude !== null &&
          doctor.longitude !== null &&
          doctor.latitude !== undefined &&
          doctor.longitude !== undefined
        );
      })
      .map((doctor) => {
        const distance = calculateDistance(
          latitude,
          longitude,
          doctor.latitude,
          doctor.longitude
        );
        return {
          ...doctor,
          distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
        };
      })
      .filter((doctor) => doctor.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance); // Sort by distance

    return nearbyDoctors;
  } catch (error) {
    console.error("Error getting nearby doctors:", error);
    throw error;
  }
}
