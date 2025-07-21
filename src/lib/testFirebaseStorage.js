import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

export const testFirebaseStorage = async () => {
  try {
    console.log("Testing Firebase Storage connection...");
    console.log("Storage bucket:", process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    
    // Create a simple test file
    const testData = new Blob(["Hello Firebase Storage!"], { type: "text/plain" });
    const testFile = new File([testData], "test.txt", { type: "text/plain" });
    
    // Create a reference
    const testRef = ref(storage, `test/${Date.now()}_test.txt`);
    console.log("Test reference:", testRef);
    
    // Upload the file
    console.log("Uploading test file...");
    const snapshot = await uploadBytes(testRef, testFile);
    console.log("Test file uploaded successfully:", snapshot);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log("Test file download URL:", downloadURL);
    
    // Test URL accessibility
    try {
      const response = await fetch(downloadURL, { method: 'HEAD' });
      console.log("URL accessibility test:", response.status);
    } catch (urlError) {
      console.warn("URL accessibility test failed:", urlError);
    }
    
    return {
      success: true,
      message: "Firebase Storage is working correctly",
      url: downloadURL,
      bucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    };
  } catch (error) {
    console.error("Firebase Storage test failed:", error);
    
    let errorMessage = error.message;
    if (error.code === 'storage/unauthorized') {
      errorMessage = "Sin permisos para Firebase Storage. Verifica las reglas de seguridad.";
    } else if (error.code === 'storage/invalid-url') {
      errorMessage = "URL de Firebase Storage inválida. Verifica NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET en .env.local";
    }
    
    return {
      success: false,
      error: errorMessage,
      code: error.code,
      bucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    };
  }
};