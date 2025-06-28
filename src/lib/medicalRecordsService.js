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
  deleteObject 
} from "firebase/storage";
import { db, storage } from "./firebase";

const MEDICAL_RECORDS_COLLECTION = "medicalRecords";
const MEDICAL_FILES_COLLECTION = "medicalFiles";

// Medical Records Functions
export async function getMedicalRecordsByPatientId(patientId) {
  try {
    const recordsRef = collection(db, MEDICAL_RECORDS_COLLECTION);
    const q = query(
      recordsRef,
      where("patientId", "==", patientId),
      orderBy("date", "desc")
    );
    const querySnapshot = await getDocs(q);

    const records = [];
    querySnapshot.forEach((doc) => {
      records.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return records;
  } catch (error) {
    console.error("Error getting medical records:", error);
    throw error;
  }
}

export async function createMedicalRecord(recordData) {
  try {
    const docRef = await addDoc(collection(db, MEDICAL_RECORDS_COLLECTION), {
      ...recordData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      id: docRef.id,
      ...recordData,
    };
  } catch (error) {
    console.error("Error creating medical record:", error);
    throw error;
  }
}

export async function updateMedicalRecord(id, recordData) {
  try {
    const docRef = doc(db, MEDICAL_RECORDS_COLLECTION, id);
    await updateDoc(docRef, {
      ...recordData,
      updatedAt: new Date(),
    });

    return true;
  } catch (error) {
    console.error("Error updating medical record:", error);
    throw error;
  }
}

export async function deleteMedicalRecord(id) {
  try {
    await deleteDoc(doc(db, MEDICAL_RECORDS_COLLECTION, id));
    return true;
  } catch (error) {
    console.error("Error deleting medical record:", error);
    throw error;
  }
}

// Medical Files Functions
export async function uploadMedicalFile(file, patientId, doctorId, metadata = {}) {
  try {
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `medical-files/${patientId}/${fileName}`;
    const fileRef = ref(storage, filePath);

    // Upload file to Firebase Storage
    const snapshot = await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Save file metadata to Firestore
    const fileData = {
      patientId,
      doctorId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      filePath,
      downloadURL,
      uploadedAt: new Date(),
      ...metadata,
    };

    const docRef = await addDoc(collection(db, MEDICAL_FILES_COLLECTION), fileData);

    return {
      id: docRef.id,
      ...fileData,
    };
  } catch (error) {
    console.error("Error uploading medical file:", error);
    throw error;
  }
}

export async function getMedicalFilesByPatientId(patientId) {
  try {
    const filesRef = collection(db, MEDICAL_FILES_COLLECTION);
    const q = query(
      filesRef,
      where("patientId", "==", patientId),
      orderBy("uploadedAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    const files = [];
    querySnapshot.forEach((doc) => {
      files.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return files;
  } catch (error) {
    console.error("Error getting medical files:", error);
    throw error;
  }
}

export async function deleteMedicalFile(fileId, filePath) {
  try {
    // Delete file from Storage
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);

    // Delete file metadata from Firestore
    await deleteDoc(doc(db, MEDICAL_FILES_COLLECTION, fileId));

    return true;
  } catch (error) {
    console.error("Error deleting medical file:", error);
    throw error;
  }
}

// Get files by type
export async function getMedicalFilesByType(patientId, fileType) {
  try {
    const files = await getMedicalFilesByPatientId(patientId);
    return files.filter(file => file.category === fileType);
  } catch (error) {
    console.error("Error getting files by type:", error);
    throw error;
  }
}

// Prescriptions Functions
export async function createPrescription(prescriptionData) {
  try {
    const prescription = {
      ...prescriptionData,
      type: "prescription",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await addDoc(collection(db, MEDICAL_RECORDS_COLLECTION), prescription);

    return {
      id: docRef.id,
      ...prescription,
    };
  } catch (error) {
    console.error("Error creating prescription:", error);
    throw error;
  }
}

export async function getPrescriptionsByPatientId(patientId) {
  try {
    const recordsRef = collection(db, MEDICAL_RECORDS_COLLECTION);
    const q = query(
      recordsRef,
      where("patientId", "==", patientId),
      where("type", "==", "prescription"),
      orderBy("date", "desc")
    );
    const querySnapshot = await getDocs(q);

    const prescriptions = [];
    querySnapshot.forEach((doc) => {
      prescriptions.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return prescriptions;
  } catch (error) {
    console.error("Error getting prescriptions:", error);
    throw error;
  }
}

// Lab Results Functions
export async function createLabResult(labData) {
  try {
    const labResult = {
      ...labData,
      type: "lab_result",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await addDoc(collection(db, MEDICAL_RECORDS_COLLECTION), labResult);

    return {
      id: docRef.id,
      ...labResult,
    };
  } catch (error) {
    console.error("Error creating lab result:", error);
    throw error;
  }
}

export async function getLabResultsByPatientId(patientId) {
  try {
    const recordsRef = collection(db, MEDICAL_RECORDS_COLLECTION);
    const q = query(
      recordsRef,
      where("patientId", "==", patientId),
      where("type", "==", "lab_result"),
      orderBy("date", "desc")
    );
    const querySnapshot = await getDocs(q);

    const labResults = [];
    querySnapshot.forEach((doc) => {
      labResults.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return labResults;
  } catch (error) {
    console.error("Error getting lab results:", error);
    throw error;
  }
} 