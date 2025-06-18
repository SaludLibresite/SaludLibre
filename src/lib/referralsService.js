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
  increment,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";

const REFERRALS_COLLECTION = "referrals";
const PATIENT_REFERRALS_COLLECTION = "patient_referrals";
const DOCTORS_COLLECTION = "doctors";

// Generate a unique referral code for patient referrals
export function generateReferralCode() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";

  let code = "REF-";
  // 3 random letters
  for (let i = 0; i < 3; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  // 4 random numbers
  for (let i = 0; i < 4; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }

  return code;
}

// Create a new patient referral
export async function createReferral(referralData) {
  try {
    const newReferral = {
      ...referralData,
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(
      collection(db, PATIENT_REFERRALS_COLLECTION),
      newReferral
    );
    return docRef.id;
  } catch (error) {
    console.error("Error creating referral:", error);
    throw error;
  }
}

// Get all referrals for a doctor
export async function getAllReferrals(doctorId) {
  try {
    const referralsQuery = query(
      collection(db, PATIENT_REFERRALS_COLLECTION),
      where("referringDoctorId", "==", doctorId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(referralsQuery);
    const referrals = [];

    querySnapshot.forEach((doc) => {
      referrals.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return referrals;
  } catch (error) {
    console.error("Error getting referrals:", error);
    throw error;
  }
}

// Update referral status
export async function updateReferralStatus(referralId, newStatus) {
  try {
    const referralRef = doc(db, PATIENT_REFERRALS_COLLECTION, referralId);
    await updateDoc(referralRef, {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error updating referral status:", error);
    throw error;
  }
}

// Get top referrers for patient referrals
export async function getTopReferrers(limit = 10) {
  try {
    // Get all referrals and group by referring doctor
    const referralsQuery = query(
      collection(db, PATIENT_REFERRALS_COLLECTION),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(referralsQuery);
    const referralsByDoctor = {};

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const doctorId = data.referringDoctorId;
      const doctorName = data.referringDoctorName;

      if (!referralsByDoctor[doctorId]) {
        referralsByDoctor[doctorId] = {
          doctorId,
          doctorName,
          totalReferrals: 0,
        };
      }
      referralsByDoctor[doctorId].totalReferrals++;
    });

    // Convert to array and sort
    const topReferrers = Object.values(referralsByDoctor)
      .sort((a, b) => b.totalReferrals - a.totalReferrals)
      .slice(0, limit);

    return topReferrers;
  } catch (error) {
    console.error("Error getting top referrers:", error);
    throw error;
  }
}

// Generate a unique referral code for doctor registration (original function)
export function generateDoctorReferralCode(doctorName) {
  const cleanName = doctorName
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .substring(0, 3);
  const randomNum = Math.floor(Math.random() * 9000) + 1000;
  return `${cleanName}${randomNum}`;
}

// Create or get referral code for a doctor
export async function createReferralCode(doctorId, doctorName) {
  try {
    // Check if doctor already has a referral code
    const doctorRef = doc(db, DOCTORS_COLLECTION, doctorId);
    const doctorSnap = await getDoc(doctorRef);

    if (doctorSnap.exists() && doctorSnap.data().referralCode) {
      return doctorSnap.data().referralCode;
    }

    // Generate new referral code
    let referralCode;
    let isUnique = false;

    while (!isUnique) {
      referralCode = generateDoctorReferralCode(doctorName);

      // Check if code is unique
      const existingDoctorsQuery = query(
        collection(db, DOCTORS_COLLECTION),
        where("referralCode", "==", referralCode)
      );
      const existingDocs = await getDocs(existingDoctorsQuery);

      if (existingDocs.empty) {
        isUnique = true;
      }
    }

    // Update or create doctor with referral code
    if (doctorSnap.exists()) {
      await updateDoc(doctorRef, {
        referralCode,
        referralStats: {
          totalReferrals: 0,
          pendingReferrals: 0,
          confirmedReferrals: 0,
          lastReferralDate: null,
        },
      });
    } else {
      // Create new doctor document if it doesn't exist
      await setDoc(doctorRef, {
        id: doctorId,
        firstName: doctorName.split(" ")[0] || "Doctor",
        lastName: doctorName.split(" ").slice(1).join(" ") || "",
        referralCode,
        referralStats: {
          totalReferrals: 0,
          pendingReferrals: 0,
          confirmedReferrals: 0,
          lastReferralDate: null,
        },
        createdAt: new Date(),
      });
    }

    return referralCode;
  } catch (error) {
    console.error("Error creating referral code:", error);
    throw error;
  }
}

// Get referral link for a doctor
export function getReferralLink(referralCode) {
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://tu-dominio.com";
  return `${baseUrl}/auth/register?ref=${referralCode}`;
}

// Validate referral code
export async function validateReferralCode(referralCode) {
  try {
    if (!referralCode) return null;

    const doctorsQuery = query(
      collection(db, DOCTORS_COLLECTION),
      where("referralCode", "==", referralCode.toUpperCase())
    );

    const querySnapshot = await getDocs(doctorsQuery);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      };
    }

    return null;
  } catch (error) {
    console.error("Error validating referral code:", error);
    return null;
  }
}

// Register a referral when a new doctor signs up
export async function registerReferral(
  referrerDoctorId,
  referredDoctorId,
  referredDoctorData
) {
  try {
    // Create referral record
    const referralData = {
      referrerDoctorId,
      referredDoctorId,
      referredDoctorName: `${referredDoctorData.firstName} ${referredDoctorData.lastName}`,
      referredDoctorEmail: referredDoctorData.email,
      referredDoctorSpecialty: referredDoctorData.specialty,
      status: "pending", // pending, confirmed, cancelled
      createdAt: new Date(),
      confirmedAt: null,
    };

    const referralRef = await addDoc(
      collection(db, REFERRALS_COLLECTION),
      referralData
    );

    // Update referrer's stats
    const referrerRef = doc(db, DOCTORS_COLLECTION, referrerDoctorId);
    await updateDoc(referrerRef, {
      "referralStats.totalReferrals": increment(1),
      "referralStats.pendingReferrals": increment(1),
      "referralStats.lastReferralDate": new Date(),
    });

    return referralRef.id;
  } catch (error) {
    console.error("Error registering referral:", error);
    throw error;
  }
}

// Confirm a referral (when referred doctor completes profile)
export async function confirmReferral(referralId, referrerDoctorId) {
  try {
    const referralRef = doc(db, REFERRALS_COLLECTION, referralId);

    // Update referral status
    await updateDoc(referralRef, {
      status: "confirmed",
      confirmedAt: new Date(),
    });

    // Update referrer's stats
    const referrerRef = doc(db, DOCTORS_COLLECTION, referrerDoctorId);
    await updateDoc(referrerRef, {
      "referralStats.pendingReferrals": increment(-1),
      "referralStats.confirmedReferrals": increment(1),
    });

    return true;
  } catch (error) {
    console.error("Error confirming referral:", error);
    throw error;
  }
}

// Get referrals for a doctor
export async function getReferralsByDoctorId(doctorId) {
  try {
    const referralsQuery = query(
      collection(db, REFERRALS_COLLECTION),
      where("referrerDoctorId", "==", doctorId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(referralsQuery);
    const referrals = [];

    querySnapshot.forEach((doc) => {
      referrals.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return referrals;
  } catch (error) {
    console.error("Error getting referrals:", error);
    throw error;
  }
}

// Get referral statistics for a doctor
export async function getReferralStats(doctorId) {
  try {
    const doctorRef = doc(db, DOCTORS_COLLECTION, doctorId);
    const doctorSnap = await getDoc(doctorRef);

    if (doctorSnap.exists()) {
      const data = doctorSnap.data();
      return {
        referralCode: data.referralCode || null,
        referralStats: data.referralStats || {
          totalReferrals: 0,
          pendingReferrals: 0,
          confirmedReferrals: 0,
          lastReferralDate: null,
        },
      };
    }

    return null;
  } catch (error) {
    console.error("Error getting referral stats:", error);
    throw error;
  }
}
