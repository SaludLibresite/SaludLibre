import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "./firebase";

const SPECIALTIES_COLLECTION = "specialties";

// Get all specialties
export async function getAllSpecialties() {
  try {
    const specialtiesRef = collection(db, SPECIALTIES_COLLECTION);
    const q = query(specialtiesRef, orderBy("title", "asc"));
    const querySnapshot = await getDocs(q);

    const specialties = [];
    querySnapshot.forEach((doc) => {
      specialties.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return specialties;
  } catch (error) {
    console.error("Error getting specialties:", error);
    throw error;
  }
}

// Get specialty by ID
export async function getSpecialtyById(id) {
  try {
    const docRef = doc(db, SPECIALTIES_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      };
    } else {
      throw new Error("Specialty not found");
    }
  } catch (error) {
    console.error("Error getting specialty:", error);
    throw error;
  }
}

// Create a new specialty
export async function createSpecialty(specialtyData) {
  try {
    const docRef = await addDoc(collection(db, SPECIALTIES_COLLECTION), {
      ...specialtyData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      id: docRef.id,
      ...specialtyData,
    };
  } catch (error) {
    console.error("Error creating specialty:", error);
    throw error;
  }
}

// Update specialty
export async function updateSpecialty(id, specialtyData, oldImagePath = null) {
  try {
    const docRef = doc(db, SPECIALTIES_COLLECTION, id);
    await updateDoc(docRef, {
      ...specialtyData,
      updatedAt: new Date(),
    });

    // Si hay una nueva imagen y una imagen anterior, eliminar la anterior
    if (
      specialtyData.imagePath &&
      oldImagePath &&
      specialtyData.imagePath !== oldImagePath
    ) {
      await deleteSpecialtyImage(oldImagePath);
    }

    return true;
  } catch (error) {
    console.error("Error updating specialty:", error);
    throw error;
  }
}

// Delete specialty
export async function deleteSpecialty(id, imagePath = null) {
  try {
    // Eliminar la imagen si existe
    if (imagePath) {
      await deleteSpecialtyImage(imagePath);
    }

    await deleteDoc(doc(db, SPECIALTIES_COLLECTION, id));
    return true;
  } catch (error) {
    console.error("Error deleting specialty:", error);
    throw error;
  }
}

// Create default specialties (initial setup)
export async function createDefaultSpecialties() {
  const defaultSpecialties = [
    {
      title: "Cardiología",
      description:
        "Especialistas en el diagnóstico y tratamiento de enfermedades del corazón.",
      imageUrl: "/img/doctor-1.jpg",
      isActive: true,
    },
    {
      title: "Neurología",
      description: "Expertos en el sistema nervioso y trastornos cerebrales.",
      imageUrl: "/img/doctor-2.jpg",
      isActive: true,
    },
    {
      title: "Pediatría",
      description:
        "Cuidado especializado para niños, desde recién nacidos hasta adolescentes.",
      imageUrl: "/img/doctor-3.jpg",
      isActive: true,
    },
    {
      title: "Dermatología",
      description:
        "Especialistas en el diagnóstico y tratamiento de afecciones de la piel.",
      imageUrl: "/img/doctor-4.jpg",
      isActive: true,
    },
    {
      title: "Traumatología",
      description:
        "Tratamiento de lesiones y enfermedades del sistema musculoesquelético.",
      imageUrl: "/img/doctor-5.jpg",
      isActive: true,
    },
  ];

  try {
    const promises = defaultSpecialties.map((specialty) =>
      createSpecialty(specialty)
    );
    await Promise.all(promises);
    return true;
  } catch (error) {
    console.error("Error creating default specialties:", error);
    throw error;
  }
}

// Función para subir imagen de especialidad
export const uploadSpecialtyImage = async (file, specialtyId = null) => {
  try {
    if (!file) throw new Error("No file provided");

    // Validar tipo de archivo
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        "Tipo de archivo no permitido. Solo se permiten imágenes JPG, PNG o WebP"
      );
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error("El archivo es demasiado grande. Máximo 5MB");
    }

    // Crear nombre único para el archivo
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name.replace(
      /[^a-zA-Z0-9.-]/g,
      "_"
    )}`;
    const imagePath = `specialties/${fileName}`;

    // Crear referencia al archivo en Storage
    const imageRef = ref(storage, imagePath);

    // Subir archivo
    const snapshot = await uploadBytes(imageRef, file);

    // Obtener URL de descarga
    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      success: true,
      url: downloadURL,
      path: imagePath,
    };
  } catch (error) {
    console.error("Error uploading image:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Función para eliminar imagen de especialidad
export const deleteSpecialtyImage = async (imagePath) => {
  try {
    if (!imagePath) return { success: true };

    // Crear referencia al archivo
    const imageRef = ref(storage, imagePath);

    // Eliminar archivo
    await deleteObject(imageRef);

    return { success: true };
  } catch (error) {
    console.error("Error deleting image:", error);
    // No lanzamos error aquí porque la eliminación de imagen no debe impedir otras operaciones
    return { success: false, error: error.message };
  }
};
