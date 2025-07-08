import admin from "../../../lib/firebase-admin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Get Firestore instance
    const db = admin.firestore();

    // Get all prescriptions
    const prescriptionsSnapshot = await db.collection("prescriptions").get();

    if (prescriptionsSnapshot.empty) {
      return res.status(200).json({
        message: "No prescriptions found to migrate",
        migrated: 0,
      });
    }

    let migratedCount = 0;
    const batch = db.batch();

    for (const doc of prescriptionsSnapshot.docs) {
      const data = doc.data();

      // Check if this prescription needs migration (has old structure)
      if (!data.doctorInfo && data.doctorId) {
        console.log(
          `Migrating prescription ${doc.id} for doctor ${data.doctorId}`
        );

        try {
          // Fetch doctor data
          const doctorDoc = await db
            .collection("doctors")
            .doc(data.doctorId)
            .get();

          if (doctorDoc.exists) {
            const doctorData = doctorDoc.data();

            // Create new structure with doctor info
            const updatedData = {
              ...data,
              doctorInfo: {
                id: doctorData.id || data.doctorId,
                userId: doctorData.userId,
                nombre: doctorData.nombre || "Doctor",
                especialidad: doctorData.especialidad || "Medicina General",
                telefono: doctorData.telefono || "No especificado",
                matricula:
                  doctorData.matricula || doctorData.referralCode || "N/A",
                signatureURL: doctorData.signatureURL || null,
                stampURL: doctorData.stampURL || null,
              },
              // Ensure patientInfo exists
              patientInfo: data.patientInfo || {
                id: data.patientId,
                name: "Paciente",
                age: "N/A",
              },
              // Ensure medications exists
              medications: data.medications || [],
              // Remove old file-related fields if they exist
              filePath: null,
              downloadURL: null,
              fileName: null,
            };

            // Add to batch update
            batch.update(doc.ref, updatedData);
            migratedCount++;
          } else {
            console.warn(
              `Doctor ${data.doctorId} not found for prescription ${doc.id}`
            );
          }
        } catch (error) {
          console.error(`Error migrating prescription ${doc.id}:`, error);
        }
      }
    }

    // Execute batch update
    if (migratedCount > 0) {
      await batch.commit();
      console.log(`Successfully migrated ${migratedCount} prescriptions`);
    }

    res.status(200).json({
      message: `Migration completed successfully`,
      totalPrescriptions: prescriptionsSnapshot.size,
      migratedCount,
      alreadyUpToDate: prescriptionsSnapshot.size - migratedCount,
    });
  } catch (error) {
    console.error("Error during migration:", error);
    res.status(500).json({
      message: "Error during migration",
      error: error.message,
    });
  }
}
