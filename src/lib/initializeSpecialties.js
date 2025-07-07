import {
  createDefaultSpecialties,
  getAllSpecialties,
} from "./specialtiesService";

export async function initializeSpecialtiesIfNeeded() {
  try {
    // Check if specialties already exist
    const existingSpecialties = await getAllSpecialties();

    if (existingSpecialties.length === 0) {
      console.log("No specialties found. Creating default specialties...");
      await createDefaultSpecialties();
      console.log("Default specialties created successfully!");
      return true;
    } else {
      console.log(`Found ${existingSpecialties.length} existing specialties`);
      return false;
    }
  } catch (error) {
    console.error("Error initializing specialties:", error);
    throw error;
  }
}

// This function can be called from the superadmin panel to create default specialties
export async function createInitialSpecialties() {
  try {
    await createDefaultSpecialties();
    return {
      success: true,
      message: "Especialidades por defecto creadas exitosamente",
    };
  } catch (error) {
    console.error("Error creating initial specialties:", error);
    return {
      success: false,
      message: "Error al crear especialidades por defecto: " + error.message,
    };
  }
}
