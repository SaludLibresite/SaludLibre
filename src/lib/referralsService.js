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
import { REFERRAL_REWARDS_CONFIG } from "./referralRewardsConfig";
import { getReferralConfiguration, canDoctorRefer } from "./referralConfigService";

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
    // Check if the doctor can refer based on current configuration
    const canReferResult = await canDoctorRefer(doctorId);
    if (!canReferResult.canRefer) {
      throw new Error(canReferResult.reason);
    }

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
        referralRewards: {
          eligibleRewards: 0,
          pendingRewards: 0,
          approvedRewards: 0,
          totalRewardsEarned: 0,
        },
        referralSettings: {
          enabled: true,
          lastToggled: new Date(),
          toggledBy: "self",
          reasonDisabled: null,
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
        referralRewards: {
          eligibleRewards: 0,
          pendingRewards: 0,
          approvedRewards: 0,
          totalRewardsEarned: 0,
        },
        referralSettings: {
          enabled: true,
          lastToggled: new Date(),
          toggledBy: "self",
          reasonDisabled: null,
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
    // Check if the referrer can still refer
    const canReferResult = await canDoctorRefer(referrerDoctorId);
    if (!canReferResult.canRefer) {
      console.warn(`Referrer ${referrerDoctorId} cannot refer: ${canReferResult.reason}`);
      // Don't throw error, just don't create the referral
      return null;
    }

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

    // Update eligible rewards
    await updateEligibleRewards(referrerDoctorId);

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
        referralRewards: data.referralRewards || {
          eligibleRewards: 0,
          pendingRewards: 0,
          approvedRewards: 0,
          totalRewardsEarned: 0,
        },
      };
    }

    return null;
  } catch (error) {
    console.error("Error getting referral stats:", error);
    throw error;
  }
}

// Get all doctors with referral data for superadmin
export async function getAllDoctorsWithReferrals() {
  try {
    const doctorsQuery = query(
      collection(db, DOCTORS_COLLECTION),
      where("referralCode", "!=", null)
    );

    const querySnapshot = await getDocs(doctorsQuery);
    const doctorsWithReferrals = [];

    for (const doc of querySnapshot.docs) {
      const doctorData = doc.data();
      const referrals = await getReferralsByDoctorId(doc.id);
      
      // Calculate eligible rewards using config
      const confirmedReferrals = doctorData.referralStats?.confirmedReferrals || 0;
      const eligibleRewards = Math.floor(confirmedReferrals / REFERRAL_REWARDS_CONFIG.REFERRALS_PER_REWARD);
      const currentEligibleRewards = doctorData.referralRewards?.eligibleRewards || 0;
      
      // Get doctor's full name with fallback
      const doctorName = doctorData.nombre || 
                        `${doctorData.firstName || ''} ${doctorData.lastName || ''}`.trim() ||
                        'Doctor';
      
      doctorsWithReferrals.push({
        id: doc.id,
        ...doctorData,
        displayName: doctorName,
        referrals,
        newEligibleRewards: Math.max(0, eligibleRewards - currentEligibleRewards),
        progressToNextReward: confirmedReferrals % REFERRAL_REWARDS_CONFIG.REFERRALS_PER_REWARD,
        nextRewardIn: REFERRAL_REWARDS_CONFIG.REFERRALS_PER_REWARD - (confirmedReferrals % REFERRAL_REWARDS_CONFIG.REFERRALS_PER_REWARD),
      });
    }

    return doctorsWithReferrals.sort((a, b) => 
      (b.referralStats?.confirmedReferrals || 0) - (a.referralStats?.confirmedReferrals || 0)
    );
  } catch (error) {
    console.error("Error getting all doctors with referrals:", error);
    throw error;
  }
}

// Update eligible rewards for a doctor
export async function updateEligibleRewards(doctorId) {
  try {
    // Get current configuration
    const config = await getReferralConfiguration();
    
    const doctorRef = doc(db, DOCTORS_COLLECTION, doctorId);
    const doctorSnap = await getDoc(doctorRef);
    
    if (doctorSnap.exists()) {
      const data = doctorSnap.data();
      const confirmedReferrals = data.referralStats?.confirmedReferrals || 0;
      const eligibleRewards = Math.floor(confirmedReferrals / config.referralsPerReward);
      
      await updateDoc(doctorRef, {
        "referralRewards.eligibleRewards": eligibleRewards,
      });
      
      return eligibleRewards;
    }
    
    return 0;
  } catch (error) {
    console.error("Error updating eligible rewards:", error);
    throw error;
  }
}

// Create a reward request
export async function createRewardRequest(doctorId, rewardType = "subscription_extension") {
  try {
    // Check if doctor can still refer and request rewards
    const canReferResult = await canDoctorRefer(doctorId);
    if (!canReferResult.canRefer) {
      throw new Error(canReferResult.reason);
    }

    // Get current configuration for reward days
    const config = await getReferralConfiguration();
    
    const rewardData = {
      doctorId,
      rewardType,
      status: "pending", // pending, approved, rejected
      rewardValue: config.rewardDays,
      createdAt: new Date(),
      approvedAt: null,
      approvedBy: null,
    };

    const rewardRef = await addDoc(collection(db, "referral_rewards"), rewardData);

    // Update doctor's pending rewards count
    const doctorRef = doc(db, DOCTORS_COLLECTION, doctorId);
    await updateDoc(doctorRef, {
      "referralRewards.pendingRewards": increment(1),
    });

    return rewardRef.id;
  } catch (error) {
    console.error("Error creating reward request:", error);
    throw error;
  }
}

// Get all pending reward requests for superadmin
export async function getPendingRewardRequests() {
  try {
    const rewardsQuery = query(
      collection(db, "referral_rewards"),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(rewardsQuery);
    const pendingRewards = [];

    for (const doc of querySnapshot.docs) {
      const rewardData = doc.data();
      
      // Get doctor data
      const doctorRef = await getDoc(doc(db, DOCTORS_COLLECTION, rewardData.doctorId));
      const doctorData = doctorRef.exists() ? doctorRef.data() : null;

      pendingRewards.push({
        id: doc.id,
        ...rewardData,
        doctorData,
      });
    }

    return pendingRewards;
  } catch (error) {
    console.error("Error getting pending reward requests:", error);
    throw error;
  }
}

// Approve a reward request
export async function approveRewardRequest(rewardId, approvedBy) {
  try {
    const rewardRef = doc(db, "referral_rewards", rewardId);
    const rewardSnap = await getDoc(rewardRef);
    
    if (!rewardSnap.exists()) {
      throw new Error("Reward request not found");
    }
    
    const rewardData = rewardSnap.data();
    
    // Update reward status
    await updateDoc(rewardRef, {
      status: "approved",
      approvedAt: new Date(),
      approvedBy,
    });

    // Update doctor's reward stats
    const doctorRef = doc(db, DOCTORS_COLLECTION, rewardData.doctorId);
    await updateDoc(doctorRef, {
      "referralRewards.pendingRewards": increment(-1),
      "referralRewards.approvedRewards": increment(1),
      "referralRewards.totalRewardsEarned": increment(rewardData.rewardValue || 30),
    });

    return true;
  } catch (error) {
    console.error("Error approving reward request:", error);
    throw error;
  }
}

// Reject a reward request
export async function rejectRewardRequest(rewardId, rejectedBy, reason = "") {
  try {
    const rewardRef = doc(db, "referral_rewards", rewardId);
    const rewardSnap = await getDoc(rewardRef);
    
    if (!rewardSnap.exists()) {
      throw new Error("Reward request not found");
    }
    
    const rewardData = rewardSnap.data();
    
    // Update reward status
    await updateDoc(rewardRef, {
      status: "rejected",
      rejectedAt: new Date(),
      rejectedBy,
      rejectionReason: reason,
    });

    // Update doctor's pending rewards count
    const doctorRef = doc(db, DOCTORS_COLLECTION, rewardData.doctorId);
    await updateDoc(doctorRef, {
      "referralRewards.pendingRewards": increment(-1),
    });

    return true;
  } catch (error) {
    console.error("Error rejecting reward request:", error);
    throw error;
  }
}

// Update all doctors' eligible rewards (utility function)
export async function updateAllEligibleRewards() {
  try {
    const doctorsQuery = query(
      collection(db, DOCTORS_COLLECTION),
      where("referralCode", "!=", null)
    );

    const querySnapshot = await getDocs(doctorsQuery);
    const updates = [];

    for (const doc of querySnapshot.docs) {
      const doctorData = doc.data();
      const confirmedReferrals = doctorData.referralStats?.confirmedReferrals || 0;
      const eligibleRewards = Math.floor(confirmedReferrals / 3);
      
      if (eligibleRewards !== (doctorData.referralRewards?.eligibleRewards || 0)) {
        updates.push(
          updateDoc(doc.ref, {
            "referralRewards.eligibleRewards": eligibleRewards,
          })
        );
      }
    }

    await Promise.all(updates);
    return updates.length;
  } catch (error) {
    console.error("Error updating all eligible rewards:", error);
    throw error;
  }
}
