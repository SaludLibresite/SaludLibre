import { getFirestore, FieldValue } from "firebase-admin/firestore";
import admin from "../../../lib/firebase-admin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { prescriptionData, appointmentId } = req.body;

    if (!prescriptionData) {
      return res.status(400).json({ message: "Prescription data is required" });
    }

    console.log(
      "Received prescription data:",
      JSON.stringify(prescriptionData, null, 2)
    );
    console.log("Doctor info structure:", {
      hasId: !!prescriptionData.doctorInfo?.id,
      hasUserId: !!prescriptionData.doctorInfo?.userId,
      hasNombre: !!prescriptionData.doctorInfo?.nombre,
      nombre: prescriptionData.doctorInfo?.nombre,
      doctorInfo: prescriptionData.doctorInfo,
    });

    // Validate required data
    if (
      !prescriptionData.doctorInfo ||
      !prescriptionData.patientInfo ||
      !prescriptionData.medications
    ) {
      return res.status(400).json({
        message: "Missing required prescription data",
      });
    }

    // Get Firestore instance
    const db = getFirestore();

    // Create prescription metadata
    const prescriptionDoc = {
      appointmentId: appointmentId || null,
      doctorId: prescriptionData.doctorInfo.userId,
      patientId: prescriptionData.patientInfo.id,
      doctorInfo: prescriptionData.doctorInfo,
      patientInfo: prescriptionData.patientInfo,
      medications: prescriptionData.medications,
      diagnosis: prescriptionData.diagnosis || "",
      notes: prescriptionData.notes || "",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Save to Firestore
    const docRef = await db.collection("prescriptions").add(prescriptionDoc);

    // Return success response with prescription data
    res.status(200).json({
      success: true,
      prescriptionId: docRef.id,
      message: "Prescription created successfully",
      prescription: {
        id: docRef.id,
        ...prescriptionDoc,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error creating prescription:", error);
    res.status(500).json({
      message: "Error creating prescription",
      error: error.message,
    });
  }
}
