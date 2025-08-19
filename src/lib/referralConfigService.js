import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  setDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

const SYSTEM_CONFIG_COLLECTION = "system_config";
const REFERRAL_CONFIG_DOC = "referral_rewards_config";

// Default configuration
export const DEFAULT_REFERRAL_CONFIG = {
  referralsPerReward: 3,
  rewardDays: 30,
  systemEnabled: true,
  allowNewReferrals: true,
  maxRewardsPerDoctor: null, // null = unlimited
  description: "Configuración del sistema de recompensas por referidos",
  lastUpdated: new Date(),
  updatedBy: null,
};

// Get current referral configuration
export async function getReferralConfiguration() {
  try {
    const configRef = doc(db, SYSTEM_CONFIG_COLLECTION, REFERRAL_CONFIG_DOC);
    const configSnap = await getDoc(configRef);
    
    if (configSnap.exists()) {
      return {
        id: configSnap.id,
        ...configSnap.data(),
      };
    } else {
      // Create default configuration if it doesn't exist
      await setDoc(configRef, DEFAULT_REFERRAL_CONFIG);
      return {
        id: REFERRAL_CONFIG_DOC,
        ...DEFAULT_REFERRAL_CONFIG,
      };
    }
  } catch (error) {
    console.error("Error getting referral configuration:", error);
    return {
      id: REFERRAL_CONFIG_DOC,
      ...DEFAULT_REFERRAL_CONFIG,
    };
  }
}

// Update referral configuration
export async function updateReferralConfiguration(updates, updatedBy) {
  try {
    const configRef = doc(db, SYSTEM_CONFIG_COLLECTION, REFERRAL_CONFIG_DOC);
    
    const updateData = {
      ...updates,
      lastUpdated: new Date(),
      updatedBy,
    };
    
    await updateDoc(configRef, updateData);
    
    return {
      id: REFERRAL_CONFIG_DOC,
      ...updateData,
    };
  } catch (error) {
    console.error("Error updating referral configuration:", error);
    throw error;
  }
}

// Toggle doctor's referral capability
export async function toggleDoctorReferralStatus(doctorId, enabled, updatedBy) {
  try {
    const doctorRef = doc(db, "doctors", doctorId);
    
    await updateDoc(doctorRef, {
      "referralSettings.enabled": enabled,
      "referralSettings.lastToggled": new Date(),
      "referralSettings.toggledBy": updatedBy,
    });
    
    return true;
  } catch (error) {
    console.error("Error toggling doctor referral status:", error);
    throw error;
  }
}

// Get doctor's referral settings
export async function getDoctorReferralSettings(doctorId) {
  try {
    const doctorRef = doc(db, "doctors", doctorId);
    const doctorSnap = await getDoc(doctorRef);
    
    if (doctorSnap.exists()) {
      const data = doctorSnap.data();
      return data.referralSettings || {
        enabled: true, // Default enabled
        lastToggled: null,
        toggledBy: null,
        reasonDisabled: null,
      };
    }
    
    return {
      enabled: true,
      lastToggled: null,
      toggledBy: null,
      reasonDisabled: null,
    };
  } catch (error) {
    console.error("Error getting doctor referral settings:", error);
    return {
      enabled: true,
      lastToggled: null,
      toggledBy: null,
      reasonDisabled: null,
    };
  }
}

// Disable doctor referrals (when they reach limit)
export async function disableDoctorReferrals(doctorId, reason, updatedBy) {
  try {
    const doctorRef = doc(db, "doctors", doctorId);
    
    await updateDoc(doctorRef, {
      "referralSettings.enabled": false,
      "referralSettings.lastToggled": new Date(),
      "referralSettings.toggledBy": updatedBy,
      "referralSettings.reasonDisabled": reason,
    });
    
    return true;
  } catch (error) {
    console.error("Error disabling doctor referrals:", error);
    throw error;
  }
}

// Check if doctor can still refer (based on limits)
export async function canDoctorRefer(doctorId) {
  try {
    // Get current configuration
    const config = await getReferralConfiguration();
    
    if (!config.systemEnabled || !config.allowNewReferrals) {
      return {
        canRefer: false,
        reason: "Sistema de referidos deshabilitado globalmente",
      };
    }
    
    // Get doctor's settings
    const doctorSettings = await getDoctorReferralSettings(doctorId);
    
    if (!doctorSettings.enabled) {
      return {
        canRefer: false,
        reason: doctorSettings.reasonDisabled || "Referidos deshabilitados para este doctor",
      };
    }
    
    // Check if doctor has reached maximum rewards
    if (config.maxRewardsPerDoctor) {
      const doctorRef = doc(db, "doctors", doctorId);
      const doctorSnap = await getDoc(doctorRef);
      
      if (doctorSnap.exists()) {
        const data = doctorSnap.data();
        const approvedRewards = data.referralRewards?.approvedRewards || 0;
        
        if (approvedRewards >= config.maxRewardsPerDoctor) {
          return {
            canRefer: false,
            reason: `Ya alcanzó el límite máximo de ${config.maxRewardsPerDoctor} recompensas`,
          };
        }
      }
    }
    
    return {
      canRefer: true,
      reason: null,
    };
  } catch (error) {
    console.error("Error checking if doctor can refer:", error);
    return {
      canRefer: false,
      reason: "Error verificando permisos de referido",
    };
  }
}

// Get all doctors with their referral settings for admin
export async function getAllDoctorsWithSettings() {
  try {
    const doctorsQuery = query(
      collection(db, "doctors"),
      where("referralCode", "!=", null)
    );
    
    const querySnapshot = await getDocs(doctorsQuery);
    const doctors = [];
    
    for (const doc of querySnapshot.docs) {
      const doctorData = doc.data();
      const referralSettings = await getDoctorReferralSettings(doc.id);
      const canReferResult = await canDoctorRefer(doc.id);
      
      doctors.push({
        id: doc.id,
        ...doctorData,
        referralSettings,
        canRefer: canReferResult.canRefer,
        referralBlockReason: canReferResult.reason,
        displayName: doctorData.nombre || 
                    `${doctorData.firstName || ''} ${doctorData.lastName || ''}`.trim() ||
                    'Doctor',
      });
    }
    
    return doctors.sort((a, b) => 
      (b.referralStats?.confirmedReferrals || 0) - (a.referralStats?.confirmedReferrals || 0)
    );
  } catch (error) {
    console.error("Error getting all doctors with settings:", error);
    throw error;
  }
}

// Auto-disable doctor referrals when they reach a certain threshold
export async function checkAndDisableIfNeeded(doctorId, approvedRewards) {
  try {
    const config = await getReferralConfiguration();
    
    if (config.maxRewardsPerDoctor && approvedRewards >= config.maxRewardsPerDoctor) {
      await disableDoctorReferrals(
        doctorId, 
        `Límite máximo de ${config.maxRewardsPerDoctor} recompensas alcanzado`,
        "system"
      );
      
      return {
        disabled: true,
        reason: `Límite máximo de ${config.maxRewardsPerDoctor} recompensas alcanzado`,
      };
    }
    
    return {
      disabled: false,
      reason: null,
    };
  } catch (error) {
    console.error("Error checking auto-disable:", error);
    return {
      disabled: false,
      reason: null,
    };
  }
}
