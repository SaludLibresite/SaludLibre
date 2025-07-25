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

const FAMILY_MEMBERS_COLLECTION = "familyMembers";

// Get all family members for a primary patient
export async function getFamilyMembersByPrimaryPatientId(primaryPatientId) {
  try {
    const familyRef = collection(db, FAMILY_MEMBERS_COLLECTION);
    const q = query(
      familyRef,
      where("primaryPatientId", "==", primaryPatientId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    const familyMembers = [];
    querySnapshot.forEach((doc) => {
      familyMembers.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return familyMembers;
  } catch (error) {
    console.error("Error getting family members:", error);
    throw error;
  }
}

// Get family member by ID
export async function getFamilyMemberById(id) {
  try {
    const docRef = doc(db, FAMILY_MEMBERS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      };
    } else {
      throw new Error("Familiar no encontrado");
    }
  } catch (error) {
    console.error("Error getting family member:", error);
    throw error;
  }
}

// Create a new family member
export async function createFamilyMember(familyMemberData) {
  try {
    // Generate family member ID
    const familyMemberId = `FAM-${Date.now().toString().slice(-6)}`;

    const docRef = await addDoc(collection(db, FAMILY_MEMBERS_COLLECTION), {
      ...familyMemberData,
      familyMemberId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      id: docRef.id,
      familyMemberId,
      ...familyMemberData,
    };
  } catch (error) {
    console.error("Error creating family member:", error);
    throw error;
  }
}

// Update family member
export async function updateFamilyMember(id, familyMemberData) {
  try {
    const docRef = doc(db, FAMILY_MEMBERS_COLLECTION, id);
    await updateDoc(docRef, {
      ...familyMemberData,
      updatedAt: new Date(),
    });

    return true;
  } catch (error) {
    console.error("Error updating family member:", error);
    throw error;
  }
}

// Delete family member
export async function deleteFamilyMember(id) {
  try {
    const docRef = doc(db, FAMILY_MEMBERS_COLLECTION, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting family member:", error);
    throw error;
  }
}

// Search family members
export async function searchFamilyMembers(primaryPatientId, searchTerm) {
  try {
    const familyMembers = await getFamilyMembersByPrimaryPatientId(
      primaryPatientId
    );

    if (!searchTerm) return familyMembers;

    const filtered = familyMembers.filter((member) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        member.name?.toLowerCase().includes(searchLower) ||
        member.email?.toLowerCase().includes(searchLower) ||
        member.phone?.toLowerCase().includes(searchLower) ||
        member.relationship?.toLowerCase().includes(searchLower)
      );
    });

    return filtered;
  } catch (error) {
    console.error("Error searching family members:", error);
    throw error;
  }
}

// Get all patients under care (primary + family members) for a primary patient
export async function getAllPatientsUnderCare(
  primaryPatientId,
  primaryPatientData
) {
  try {
    const familyMembers = await getFamilyMembersByPrimaryPatientId(
      primaryPatientId
    );

    // Create a list with primary patient first, then family members
    const allPatients = [
      {
        id: primaryPatientId,
        isPrimary: true,
        relationship: "Usted",
        ...primaryPatientData,
      },
      ...familyMembers.map((member) => ({
        ...member,
        isPrimary: false,
      })),
    ];

    return allPatients;
  } catch (error) {
    console.error("Error getting all patients under care:", error);
    throw error;
  }
}

// Validate family member data
export function validateFamilyMemberData(data) {
  const errors = {};

  if (!data.name?.trim()) {
    errors.name = "El nombre es requerido";
  }

  if (!data.relationship?.trim()) {
    errors.relationship = "La relación familiar es requerida";
  }

  if (!data.dateOfBirth) {
    errors.dateOfBirth = "La fecha de nacimiento es requerida";
  }

  if (!data.gender) {
    errors.gender = "El género es requerido";
  }

  if (data.email && !/\S+@\S+\.\S+/.test(data.email)) {
    errors.email = "El email no es válido";
  }

  // Validate age (must be reasonable)
  if (data.dateOfBirth) {
    const birthDate = new Date(data.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();

    if (age < 0 || age > 120) {
      errors.dateOfBirth = "La fecha de nacimiento no es válida";
    }
  }

  return errors;
}

// Get family member statistics
export async function getFamilyMemberStats(primaryPatientId) {
  try {
    const familyMembers = await getFamilyMembersByPrimaryPatientId(
      primaryPatientId
    );

    const stats = {
      total: familyMembers.length,
      children: familyMembers.filter((m) =>
        ["hijo", "hija", "hijo/a"].includes(m.relationship?.toLowerCase())
      ).length,
      adults: familyMembers.filter((m) => {
        const age = calculateAge(m.dateOfBirth);
        return age >= 18;
      }).length,
      minors: familyMembers.filter((m) => {
        const age = calculateAge(m.dateOfBirth);
        return age < 18;
      }).length,
    };

    return stats;
  } catch (error) {
    console.error("Error getting family member stats:", error);
    throw error;
  }
}

// Helper function to calculate age
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return 0;

  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

// Predefined relationship options
export const RELATIONSHIP_OPTIONS = [
  { value: "esposo", label: "Esposo" },
  { value: "esposa", label: "Esposa" },
  { value: "hijo", label: "Hijo" },
  { value: "hija", label: "Hija" },
  { value: "padre", label: "Padre" },
  { value: "madre", label: "Madre" },
  { value: "hermano", label: "Hermano" },
  { value: "hermana", label: "Hermana" },
  { value: "abuelo", label: "Abuelo" },
  { value: "abuela", label: "Abuela" },
  { value: "nieto", label: "Nieto" },
  { value: "nieta", label: "Nieta" },
  { value: "otro", label: "Otro" },
];
