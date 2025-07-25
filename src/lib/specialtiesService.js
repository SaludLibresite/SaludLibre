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

    console.log(
      "Starting image upload for file:",
      file.name,
      "Size:",
      file.size
    );

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

    console.log("Upload details:", {
      path: imagePath,
      bucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      fileType: file.type,
      fileSize: file.size,
    });

    // Crear referencia al archivo en Storage
    const imageRef = ref(storage, imagePath);
    console.log("Storage reference created:", imageRef);

    // Subir archivo
    console.log("Starting upload...");
    const snapshot = await uploadBytes(imageRef, file);
    console.log("Upload completed successfully:", {
      fullPath: snapshot.ref.fullPath,
      bucket: snapshot.ref.bucket,
      name: snapshot.ref.name,
    });

    // Obtener URL de descarga
    console.log("Getting download URL...");
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log("Download URL obtained:", downloadURL);

    // Verificar que la URL sea válida y tenga el formato correcto
    if (!downloadURL || !downloadURL.includes("googleapis.com")) {
      throw new Error("URL de descarga inválida generada");
    }

    // Verificar que la URL use el bucket correcto
    const expectedBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (expectedBucket && !downloadURL.includes(expectedBucket)) {
      console.warn("⚠️ Warning: URL uses unexpected bucket:", {
        url: downloadURL,
        expected: expectedBucket,
      });
    }

    // Test the URL accessibility con timeout
    let urlTestResult = "not_tested";
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const testResponse = await fetch(downloadURL, {
        method: "HEAD",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      urlTestResult = testResponse.status;
      console.log("✅ URL accessibility test passed:", testResponse.status);
    } catch (urlError) {
      console.warn(
        "⚠️ URL accessibility test failed (but continuing):",
        urlError.message
      );
      urlTestResult = "failed";
    }

    const result = {
      success: true,
      url: downloadURL,
      path: imagePath,
      bucket: snapshot.ref.bucket,
      urlTest: urlTestResult,
    };

    console.log("🎉 Image upload completed successfully:", result);
    return result;
  } catch (error) {
    console.error("❌ Error uploading image:", error);
    console.error("Error details:", {
      code: error.code,
      message: error.message,
      name: error.name,
      stack: error.stack?.split("\n").slice(0, 3), // First 3 lines of stack
    });

    // Provide more specific error messages
    let errorMessage = error.message;
    if (error.code === "storage/unauthorized") {
      errorMessage =
        "No tienes permisos para subir archivos. Verifica las reglas de Firebase Storage.";
    } else if (error.code === "storage/canceled") {
      errorMessage = "La subida fue cancelada.";
    } else if (error.code === "storage/unknown") {
      errorMessage =
        "Error desconocido. Verifica tu conexión a internet y la configuración de Firebase.";
    } else if (error.code === "storage/invalid-url") {
      errorMessage =
        "URL de Firebase Storage inválida. Verifica la configuración del bucket.";
    } else if (error.code === "storage/quota-exceeded") {
      errorMessage = "Se ha excedido la cuota de almacenamiento de Firebase.";
    } else if (error.name === "AbortError") {
      errorMessage = "La operación fue cancelada por timeout.";
    }

    return {
      success: false,
      error: errorMessage,
      code: error.code,
      originalError: error.message,
    };
  }
};

// Función para validar y reparar URLs de imágenes
export const validateAndFixImageUrl = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== "string") {
    return null;
  }

  // Si es una URL relativa o local, devolverla tal como está
  if (imageUrl.startsWith("/") || imageUrl.startsWith("./")) {
    return imageUrl;
  }

  let fixedUrl = imageUrl;

  // Corregir URLs del bucket antiguo al nuevo (solo para Firebase Storage)
  if (
    fixedUrl.includes("firebasestorage.googleapis.com") &&
    fixedUrl.includes("doctore-eae95.firebasestorage.app")
  ) {
    fixedUrl = fixedUrl.replace(
      "doctore-eae95.firebasestorage.app",
      "doctore-eae95.appspot.com"
    );
    console.log("🔧 Fixed URL from old bucket:", {
      original: imageUrl,
      fixed: fixedUrl,
    });
  }

  // Asegurar que usa HTTPS
  if (fixedUrl.startsWith("http://")) {
    fixedUrl = fixedUrl.replace("http://", "https://");
    console.log("🔧 Fixed URL to use HTTPS:", fixedUrl);
  }

  return fixedUrl;
};

// Función para probar si una URL de imagen es accesible
export const testImageUrl = async (imageUrl, timeout = 5000) => {
  if (!imageUrl) return { success: false, error: "No URL provided" };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(imageUrl, {
      method: "HEAD",
      signal: controller.signal,
      cache: "no-cache",
    });

    clearTimeout(timeoutId);

    return {
      success: response.ok,
      status: response.status,
      headers: {
        contentType: response.headers.get("content-type"),
        contentLength: response.headers.get("content-length"),
        cacheControl: response.headers.get("cache-control"),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.name === "AbortError" ? "timeout" : error.message,
      code: error.code,
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
