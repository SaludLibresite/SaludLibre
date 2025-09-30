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

const PATIENT_DOCUMENTS_COLLECTION = "patientDocuments";

// Upload personal document for patient
export async function uploadPatientDocument(
  file,
  patientId,
  title,
  uploadedBy,
  metadata = {}
) {
  try {
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `patient-documents/${patientId}/${fileName}`;
    const fileRef = ref(storage, filePath);

    // Upload file to Firebase Storage
    const snapshot = await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Save document metadata to Firestore
    const documentData = {
      patientId,
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
      collection(db, PATIENT_DOCUMENTS_COLLECTION),
      documentData
    );

    return {
      id: docRef.id,
      ...documentData,
    };
  } catch (error) {
    console.error("Error uploading patient document:", error);
    throw error;
  }
}

// Get documents for a patient
export async function getPatientDocuments(patientId) {
  try {
    const documentsRef = collection(db, PATIENT_DOCUMENTS_COLLECTION);
    const q = query(
      documentsRef,
      where("patientId", "==", patientId),
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
    console.error("Error getting patient documents:", error);
    throw error;
  }
}

// Delete patient document
export async function deletePatientDocument(documentId) {
  try {
    // Get document data first
    const docRef = doc(db, PATIENT_DOCUMENTS_COLLECTION, documentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error("Documento no encontrado");
    }

    const documentData = docSnap.data();

    // Delete file from Storage
    if (documentData.filePath) {
      const fileRef = ref(storage, documentData.filePath);
      await deleteObject(fileRef);
    }

    // Delete document from Firestore
    await deleteDoc(docRef);

    return true;
  } catch (error) {
    console.error("Error deleting patient document:", error);
    throw error;
  }
}

// Update patient document title
export async function updatePatientDocumentTitle(documentId, newTitle) {
  try {
    const docRef = doc(db, PATIENT_DOCUMENTS_COLLECTION, documentId);
    await updateDoc(docRef, {
      title: newTitle,
      updatedAt: new Date(),
    });

    return true;
  } catch (error) {
    console.error("Error updating patient document title:", error);
    throw error;
  }
}

// Get patient document by ID
export async function getPatientDocumentById(documentId) {
  try {
    const docRef = doc(db, PATIENT_DOCUMENTS_COLLECTION, documentId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      };
    } else {
      throw new Error("Documento no encontrado");
    }
  } catch (error) {
    console.error("Error getting patient document:", error);
    throw error;
  }
}
