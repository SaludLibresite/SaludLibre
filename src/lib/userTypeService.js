import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Detect user type based on Firebase Auth user
 * @param {Object} user - Firebase Auth user object
 * @returns {Promise<{type: string, profile: Object}>} User type and profile data
 */
export async function detectUserType(user) {
  if (!user) {
    console.log('detectUserType: No user provided');
    return { type: null, profile: null };
  }

  console.log('detectUserType: Checking user:', user.email);

  try {
    // Add retry mechanism for eventual consistency
    let retries = 3;
    let lastError;
    
    while (retries > 0) {
      try {
        // Check if user is a doctor
        const doctorsQuery = query(
          collection(db, "doctors"),
          where("userId", "==", user.uid)
        );
        const doctorsSnapshot = await getDocs(doctorsQuery);

        if (!doctorsSnapshot.empty) {
          const doctorData = doctorsSnapshot.docs[0].data();
          
          // Convertir Timestamps de Firebase a Dates para evitar problemas de serialización
          const processedDoctorData = {
            ...doctorData,
            createdAt: doctorData.createdAt?.toDate?.() || doctorData.createdAt,
            updatedAt: doctorData.updatedAt?.toDate?.() || doctorData.updatedAt,
            subscriptionExpiresAt: doctorData.subscriptionExpiresAt?.toDate?.() || doctorData.subscriptionExpiresAt,
            subscriptionActivatedAt: doctorData.subscriptionActivatedAt?.toDate?.() || doctorData.subscriptionActivatedAt,
          };
          
          console.log('detectUserType: Doctor found:', {
            id: doctorsSnapshot.docs[0].id,
            isGoogleUser: processedDoctorData.isGoogleUser,
            profileComplete: processedDoctorData.profileComplete,
            nombre: processedDoctorData.nombre,
            subscriptionStatus: processedDoctorData.subscriptionStatus,
            subscriptionPlan: processedDoctorData.subscriptionPlan,
            subscriptionExpiresAt: processedDoctorData.subscriptionExpiresAt,
          });
          
          return {
            type: "doctor",
            profile: {
              id: doctorsSnapshot.docs[0].id,
              ...processedDoctorData,
            },
          };
        }

        console.log('detectUserType: No doctor profile found, checking patients...');

        // Check if user is a patient
        const patientsQuery = query(
          collection(db, "patients"),
          where("userId", "==", user.uid)
        );
        const patientsSnapshot = await getDocs(patientsQuery);

        if (!patientsSnapshot.empty) {
          const patientData = patientsSnapshot.docs[0].data();
          return {
            type: "patient",
            profile: {
              id: patientsSnapshot.docs[0].id,
              ...patientData,
            },
          };
        }

        // Check if user is superadmin (you can add more sophisticated logic here)
        // For now, we'll check if the email matches certain criteria
        const superAdminEmails = [
          "admin@medicos-ar.com",
          "superadmin@medicos-ar.com",
          "juan@jhernandez.mx", // Add existing superadmin email
          // Add more superadmin emails as needed
        ];

        if (superAdminEmails.includes(user.email)) {
          return {
            type: "superadmin",
            profile: {
              id: user.uid,
              email: user.email,
              displayName: user.displayName,
            },
          };
        }

        // User exists in auth but not in any collection
        // If this is the first attempt, break and return unknown
        // If this is a retry, throw to trigger another retry
        if (retries === 3) {
          break;
        } else {
          throw new Error('User not found in any collection');
        }
      } catch (queryError) {
        lastError = queryError;
        retries--;
        if (retries > 0) {
          console.log(`detectUserType: Query failed, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    }

    // If we get here, user exists in auth but not in any collection
    console.log('detectUserType: User exists in auth but not found in any collection');
    return { type: "unknown", profile: null };
  } catch (error) {
    console.error("Error detecting user type:", error);
    throw error;
  }
}

/**
 * Get user by type and user ID
 * @param {string} type - User type ('doctor' or 'patient')
 * @param {string} userId - Firebase Auth user ID
 * @returns {Promise<Object>} User profile data
 */
export async function getUserByType(type, userId) {
  if (!type || !userId) {
    return null;
  }

  try {
    const collectionName = type === "doctor" ? "doctors" : "patients";
    const userQuery = query(
      collection(db, collectionName),
      where("userId", "==", userId)
    );
    const userSnapshot = await getDocs(userQuery);

    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
      
      // Convertir Timestamps de Firebase a Dates
      const processedUserData = {
        ...userData,
        createdAt: userData.createdAt?.toDate?.() || userData.createdAt,
        updatedAt: userData.updatedAt?.toDate?.() || userData.updatedAt,
        subscriptionExpiresAt: userData.subscriptionExpiresAt?.toDate?.() || userData.subscriptionExpiresAt,
        subscriptionActivatedAt: userData.subscriptionActivatedAt?.toDate?.() || userData.subscriptionActivatedAt,
      };
      
      return {
        id: userSnapshot.docs[0].id,
        ...processedUserData,
      };
    }

    return null;
  } catch (error) {
    console.error(`Error getting ${type} by userId:`, error);
    throw error;
  }
}

/**
 * Validate if user can access a specific panel
 * @param {string} userType - Current user type
 * @param {string} requiredType - Required user type for the panel
 * @returns {boolean} Whether user can access the panel
 */
export function canAccessPanel(userType, requiredType) {
  if (!userType || !requiredType) {
    return false;
  }

  // Each user type can only access their specific panel
  return userType === requiredType;
}

/**
 * Get redirect URL based on user type and intended destination
 * @param {string} userType - Current user type
 * @param {string} intendedPanel - Panel user is trying to access ('doctor', 'patient', 'superadmin')
 * @returns {string} Redirect URL
 */
export function getRedirectUrl(userType, intendedPanel) {
  // If user can access the intended panel, return appropriate dashboard
  if (canAccessPanel(userType, intendedPanel)) {
    switch (intendedPanel) {
      case "doctor":
        return "/admin";
      case "patient":
        return "/paciente/dashboard";
      case "superadmin":
        return "/superadmin";
      default:
        return "/";
    }
  }

  // If user cannot access intended panel, redirect to appropriate login
  switch (intendedPanel) {
    case "doctor":
    case "superadmin":
      return "/auth/login";
    case "patient":
      return "/paciente/login";
    default:
      return "/";
  }
}
