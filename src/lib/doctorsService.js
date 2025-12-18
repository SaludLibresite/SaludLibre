import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  setDoc,
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
    const docSnap = await getDoc(docSnap);

    if (docSnap.exists()) {
      const doctorData = docSnap.data();
      
      // Convertir Timestamps de Firebase a Dates
      const processedDoctorData = {
        ...doctorData,
        createdAt: doctorData.createdAt?.toDate?.() || doctorData.createdAt,
        updatedAt: doctorData.updatedAt?.toDate?.() || doctorData.updatedAt,
        subscriptionExpiresAt: doctorData.subscriptionExpiresAt?.toDate?.() || doctorData.subscriptionExpiresAt,
        subscriptionActivatedAt: doctorData.subscriptionActivatedAt?.toDate?.() || doctorData.subscriptionActivatedAt,
      };
      
      return {
        id: docSnap.id,
        ...processedDoctorData,
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
      const doctorData = doc.data();
      
      // Convertir Timestamps de Firebase a Dates
      const processedDoctorData = {
        ...doctorData,
        createdAt: doctorData.createdAt?.toDate?.() || doctorData.createdAt,
        updatedAt: doctorData.updatedAt?.toDate?.() || doctorData.updatedAt,
        subscriptionExpiresAt: doctorData.subscriptionExpiresAt?.toDate?.() || doctorData.subscriptionExpiresAt,
        subscriptionActivatedAt: doctorData.subscriptionActivatedAt?.toDate?.() || doctorData.subscriptionActivatedAt,
      };
      
      return {
        id: doc.id,
        ...processedDoctorData,
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
    console.log('getDoctorByUserId called with userId:', userId);
    const doctorsRef = collection(db, DOCTORS_COLLECTION);
    const q = query(doctorsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    console.log('Query executed, docs found:', querySnapshot.size);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const doctorData = doc.data();
      
      // Convertir Timestamps de Firebase a Dates
      const processedDoctorData = {
        ...doctorData,
        createdAt: doctorData.createdAt?.toDate?.() || doctorData.createdAt,
        updatedAt: doctorData.updatedAt?.toDate?.() || doctorData.updatedAt,
        subscriptionExpiresAt: doctorData.subscriptionExpiresAt?.toDate?.() || doctorData.subscriptionExpiresAt,
        subscriptionActivatedAt: doctorData.subscriptionActivatedAt?.toDate?.() || doctorData.subscriptionActivatedAt,
      };
      
      console.log('Doctor found:', { 
        id: doc.id, 
        email: processedDoctorData.email, 
        userId: processedDoctorData.userId,
        subscriptionStatus: processedDoctorData.subscriptionStatus,
        subscriptionPlan: processedDoctorData.subscriptionPlan,
        subscriptionExpiresAt: processedDoctorData.subscriptionExpiresAt,
      });
      
      return {
        id: doc.id,
        ...processedDoctorData,
      };
    } else {
      console.log('No doctor profile found for userId:', userId);
      
      // Additional debugging: let's check if there are any doctors with similar email
      try {
        const allDocsQuery = query(doctorsRef);
        const allDocsSnapshot = await getDocs(allDocsQuery);
        console.log('Total doctors in database:', allDocsSnapshot.size);
        
        allDocsSnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Existing doctor:', { 
            id: doc.id, 
            email: data.email, 
            userId: data.userId,
            isGoogleUser: data.isGoogleUser 
          });
        });
      } catch (debugError) {
        console.error('Debug query error:', debugError);
      }
      
      return null; // No doctor profile found for this user
    }
  } catch (error) {
    console.error("Error getting doctor by user ID:", error);
    throw error;
  }
}

// Get doctor by email (alternative lookup method)
export async function getDoctorByEmail(email) {
  try {
    console.log('getDoctorByEmail called with email:', email);
    const doctorsRef = collection(db, DOCTORS_COLLECTION);
    const q = query(doctorsRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    console.log('Email query executed, docs found:', querySnapshot.size);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const doctorData = doc.data();
      
      // Convertir Timestamps de Firebase a Dates
      const processedDoctorData = {
        ...doctorData,
        createdAt: doctorData.createdAt?.toDate?.() || doctorData.createdAt,
        updatedAt: doctorData.updatedAt?.toDate?.() || doctorData.updatedAt,
        subscriptionExpiresAt: doctorData.subscriptionExpiresAt?.toDate?.() || doctorData.subscriptionExpiresAt,
        subscriptionActivatedAt: doctorData.subscriptionActivatedAt?.toDate?.() || doctorData.subscriptionActivatedAt,
      };
      
      console.log('Doctor found by email:', { 
        id: doc.id, 
        email: processedDoctorData.email, 
        userId: processedDoctorData.userId,
        subscriptionStatus: processedDoctorData.subscriptionStatus,
        subscriptionExpiresAt: processedDoctorData.subscriptionExpiresAt,
      });
      
      return {
        id: doc.id,
        ...processedDoctorData,
      };
    } else {
      console.log('No doctor profile found for email:', email);
      return null;
    }
  } catch (error) {
    console.error("Error getting doctor by email:", error);
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

// Create or update doctor (upsert)
export async function upsertDoctor(id, doctorData) {
  try {
    const docRef = doc(db, DOCTORS_COLLECTION, id);
    await setDoc(docRef, {
      ...doctorData,
      updatedAt: new Date(),
    }, { merge: true }); // merge: true permite actualizar o crear

    return true;
  } catch (error) {
    console.error("Error upserting doctor:", error);
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
export function generateSlug(name, specialty = "") {
  const nameSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim();

  if (specialty) {
    const specialtySlug = specialty
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();

    return `${nameSlug}-${specialtySlug}-${Date.now()}`;
  }

  return `${nameSlug}-${Date.now()}`;
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

/**
 * Get doctors with pagination and search (via API)
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @param {string} params.search - Search term
 * @param {string} params.filter - Filter (all, pending, verified)
 * @returns {Promise<Object>} - Paginated doctors data
 */
export async function getDoctorsPaginated({ page = 1, limit = 20, search = "", filter = "all" } = {}) {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      filter,
    });

    const response = await fetch(`/api/superadmin/doctors?${params}`);
    
    if (!response.ok) {
      throw new Error('Error fetching doctors');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error getting paginated doctors:", error);
    throw error;
  }
}

// Check if email already exists in doctors collection (for Google auth)
// Only checks for non-Google users to avoid conflicts
export async function checkEmailExists(email) {
  try {
    const doctorsRef = collection(db, DOCTORS_COLLECTION);
    const q = query(doctorsRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    // Check if any of the found doctors are NOT Google users
    let hasNonGoogleUser = false;
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.isGoogleUser) {
        hasNonGoogleUser = true;
      }
    });
    
    return hasNonGoogleUser;
  } catch (error) {
    console.error("Error checking email exists:", error);
    return false;
  }
}

// Check if email exists with traditional registration (not Google)
export async function checkEmailExistsTraditional(email) {
  try {
    const doctorsRef = collection(db, DOCTORS_COLLECTION);
    const q = query(doctorsRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return false;
    }
    
    // Check if any of the doctors with this email are NOT Google users
    let hasTraditionalUser = false;
    querySnapshot.forEach((doc) => {
      const doctor = doc.data();
      if (!doctor.isGoogleUser) {
        hasTraditionalUser = true;
      }
    });
    
    return hasTraditionalUser;
  } catch (error) {
    console.error("Error checking email exists:", error);
    return false;
  }
}

// Create doctor profile from Google authentication
export async function createDoctorFromGoogle(user, referralCode = null) {
  try {
    // Generate a base name from display name or email
    const baseName = user.displayName || user.email.split('@')[0];
    
    const doctorData = {
      userId: user.uid,
      email: user.email,
      nombre: baseName,
      imagen: user.photoURL || "img/doctor-1.jpg", // Use standard field name
      // Mark as incomplete profile that needs to be filled
      profileCompleted: false, // Use consistent field name
      isGoogleUser: true,
      // Basic required fields with default values to avoid validation issues
      telefono: "Sin especificar",
      especialidad: "Por definir",
      descripcion: "Perfil en configuración - Complete su información profesional",
      horario: "Lunes a Viernes, 9:00 AM - 5:00 PM",
      genero: "Sin especificar",
      ubicacion: "Sin especificar",
      latitude: null,
      longitude: null,
      formattedAddress: "",
      consultaOnline: false,
      rango: "Normal",
      verified: false,
      slug: generateSlug(baseName, 'Médico'), // Generate slug immediately
      // Timestamps
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Referral information
      referralCode: referralCode || null,
      isActive: true,
    };

    console.log('Creating doctor document with data:', {
      userId: doctorData.userId,
      email: doctorData.email,
      nombre: doctorData.nombre,
      slug: doctorData.slug
    });

    const docRef = await addDoc(collection(db, DOCTORS_COLLECTION), doctorData);
    
    console.log('Doctor document created successfully with ID:', docRef.id);

    return {
      id: docRef.id,
      ...doctorData,
    };
  } catch (error) {
    console.error("Error creating doctor from Google:", error);
    throw error;
  }
}

// Check if doctor profile is complete
export async function isDoctorProfileComplete(userId) {
  try {
    const doctor = await getDoctorByUserId(userId);
    if (!doctor) return false;
    
    return doctor.profileComplete === true;
  } catch (error) {
    console.error("Error checking doctor profile completeness:", error);
    return false;
  }
}

// Update doctor profile completion status
export async function updateDoctorProfileCompletion(doctorId, profileData) {
  try {
    const updateData = {
      ...profileData,
      profileComplete: true,
      updatedAt: new Date(),
    };

    // Generate slug if nombre is provided
    if (profileData.nombre) {
      updateData.slug = generateSlug(profileData.nombre, profileData.especialidad);
    }

    const docRef = doc(db, DOCTORS_COLLECTION, doctorId);
    await updateDoc(docRef, updateData);

    return updateData;
  } catch (error) {
    console.error("Error updating doctor profile completion:", error);
    throw error;
  }
}

// Get total count of registered doctors
export async function getDoctorsCount() {
  try {
    const doctorsRef = collection(db, DOCTORS_COLLECTION);
    const querySnapshot = await getDocs(doctorsRef);
    return querySnapshot.size;
  } catch (error) {
    console.error("Error getting doctors count:", error);
    return 0; // Return 0 as fallback
  }
}
