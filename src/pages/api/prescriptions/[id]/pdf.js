import jsPDF from "jspdf";
import admin from "../../../../lib/firebase-admin";

// Helper function to load image as base64 (siguiendo el patrón de tu otro proyecto)
async function loadImageAsBase64(imageUrl) {
  try {
    console.log(`🖼️ Cargando imagen: ${imageUrl.substring(0, 100)}...`);

    const response = await fetch(imageUrl, {
      headers: {
        Accept: "image/*",
        "User-Agent": "Mozilla/5.0 (compatible; PDF Generator)",
      },
    });

    if (!response.ok) {
      console.warn(`⚠️ Error HTTP ${response.status} al cargar imagen`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = response.headers.get("content-type") || "image/jpeg";

    console.log(
      `✅ Imagen cargada exitosamente (${arrayBuffer.byteLength} bytes)`
    );
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error(`❌ Error cargando imagen ${imageUrl}:`, error);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: "Prescription ID is required" });
    }

    // Get Firestore instance with error handling
    console.log("Initializing Firebase Admin...");
    console.log("Admin object:", {
      hasAdmin: !!admin,
      hasFirestore: !!admin.firestore,
      projectId: process.env.FIREBASE_PROJECT_ID ? "Set" : "Missing",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? "Set" : "Missing",
    });

    const db = admin.firestore();
    console.log("Firestore instance obtained successfully");

    // Fetch prescription data
    const prescriptionDoc = await db.collection("prescriptions").doc(id).get();

    if (!prescriptionDoc.exists) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    const prescriptionData = {
      id: prescriptionDoc.id,
      ...prescriptionDoc.data(),
    };

    // Convert Firestore timestamp to Date
    if (prescriptionData.createdAt && prescriptionData.createdAt.toDate) {
      prescriptionData.createdAt = prescriptionData.createdAt.toDate();
    }

    console.log("Generating PDF for prescription:", id);
    console.log(
      "Full prescription data:",
      JSON.stringify(prescriptionData, null, 2)
    );
    console.log("Prescription data structure:", {
      hasDoctorInfo: !!prescriptionData.doctorInfo,
      hasPatientInfo: !!prescriptionData.patientInfo,
      hasMedications: !!prescriptionData.medications,
      doctorInfo: prescriptionData.doctorInfo,
      patientInfo: prescriptionData.patientInfo,
      medications: prescriptionData.medications,
    });

    // Handle legacy prescriptions that might not have complete structure
    if (!prescriptionData.doctorInfo && prescriptionData.doctorId) {
      // This is likely a legacy prescription, try to reconstruct doctor info
      console.log(
        "Legacy prescription detected, attempting to fetch doctor data..."
      );

      try {
        const doctorDoc = await db
          .collection("doctors")
          .doc(prescriptionData.doctorId)
          .get();
        if (doctorDoc.exists) {
          const doctorData = doctorDoc.data();
          prescriptionData.doctorInfo = {
            nombre: doctorData.nombre || "Doctor",
            especialidad: doctorData.especialidad || "Medicina General",
            telefono: doctorData.telefono || "No especificado",
            matricula: doctorData.matricula || doctorData.referralCode || "N/A",
            signatureURL: doctorData.signatureURL || null,
            stampURL: doctorData.stampURL || null,
          };
        }
      } catch (error) {
        console.error(
          "Error fetching doctor data for legacy prescription:",
          error
        );
      }
    }

    // Validate required data with fallbacks
    if (!prescriptionData.doctorInfo) {
      console.warn("No doctor info found, using fallbacks");
      prescriptionData.doctorInfo = {
        nombre: "Doctor",
        especialidad: "Medicina General",
        telefono: "No especificado",
        matricula: "N/A",
        signatureURL: null,
        stampURL: null,
      };
    }

    if (!prescriptionData.patientInfo) {
      console.warn("No patient info found, using fallbacks");
      prescriptionData.patientInfo = {
        name: "Paciente",
        age: "N/A",
      };
    }

    if (
      !prescriptionData.medications ||
      !Array.isArray(prescriptionData.medications)
    ) {
      console.warn("No medications found, using empty array");
      prescriptionData.medications = [];
    }
    // Ensure we have minimum required data with fallbacks
    prescriptionData.doctorInfo = {
      nombre: prescriptionData.doctorInfo?.nombre || "Doctor",
      especialidad:
        prescriptionData.doctorInfo?.especialidad || "Medicina General",
      telefono: prescriptionData.doctorInfo?.telefono || "No especificado",
      matricula: prescriptionData.doctorInfo?.matricula || "N/A",
      signatureURL: prescriptionData.doctorInfo?.signatureURL || null,
      stampURL: prescriptionData.doctorInfo?.stampURL || null,
      ...prescriptionData.doctorInfo,
    };

    prescriptionData.patientInfo = {
      name: prescriptionData.patientInfo?.name || "Paciente",
      age: prescriptionData.patientInfo?.age || "N/A",
      ...prescriptionData.patientInfo,
    };

    if (!prescriptionData.createdAt) {
      prescriptionData.createdAt = new Date();
    }

    // Generate PDF
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = 25;

    // Set default font
    pdf.setFont("helvetica");

    // Simple header
    // Platform name
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0); // Black
    pdf.text("SALUD LIBRE", pageWidth / 2, yPosition, { align: "center" });

    yPosition += 8;
    // Title with yellow accent
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(255, 193, 7); // Yellow
    pdf.text("RECETA MEDICA", pageWidth / 2, yPosition, { align: "center" });

    yPosition += 6;
    // Subtitle
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(102, 102, 102); // Gray
    pdf.text("Plataforma de Salud Digital", pageWidth / 2, yPosition, {
      align: "center",
    });

    yPosition += 10;
    // Simple line separator
    pdf.setDrawColor(255, 193, 7); // Yellow
    pdf.setLineWidth(1);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);

    yPosition += 15;

    // Simple doctor information section
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0); // Black
    pdf.text("INFORMACION DEL MEDICO", margin, yPosition);

    yPosition += 8;
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0); // Black
    pdf.text(
      `${prescriptionData.doctorInfo.nombre || "No especificado"}`,
      margin,
      yPosition
    );

    yPosition += 6;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(102, 102, 102); // Gray

    const rightColumnX = pageWidth / 2 + 10;
    pdf.text(
      `Especialidad: ${
        prescriptionData.doctorInfo.especialidad || "No especificado"
      }`,
      margin,
      yPosition
    );
    pdf.text(
      `Telefono: ${prescriptionData.doctorInfo.telefono || "No especificado"}`,
      rightColumnX,
      yPosition
    );

    yPosition += 6;
    pdf.text(
      `Matricula: ${prescriptionData.doctorInfo.matricula || "N/A"}`,
      margin,
      yPosition
    );

    yPosition += 15;

    // Simple patient information section
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0); // Black
    pdf.text("DATOS DEL PACIENTE", margin, yPosition);

    yPosition += 8;
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0); // Black
    pdf.text(
      `${prescriptionData.patientInfo.name || "No especificado"}`,
      margin,
      yPosition
    );

    yPosition += 6;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(102, 102, 102); // Gray
    pdf.text(
      `Edad: ${prescriptionData.patientInfo.age || "N/A"} años`,
      margin,
      yPosition
    );
    pdf.text(
      `Fecha: ${new Date(prescriptionData.createdAt).toLocaleDateString(
        "es-ES"
      )}`,
      rightColumnX,
      yPosition
    );

    yPosition += 20;

    // Simple medications section
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0); // Black
    pdf.text("MEDICACION PRESCRITA", margin, yPosition);
    yPosition += 15;

    // Simple medications list
    prescriptionData.medications.forEach((medication, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = 30;
      }

      // Simple medication entry
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0); // Black
      pdf.text(`${index + 1}. ${medication.name}`, margin, yPosition);

      yPosition += 6;
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(102, 102, 102); // Gray

      // Dosage and frequency
      pdf.text(`Dosis: ${medication.dosage}`, margin + 5, yPosition);
      pdf.text(`Frecuencia: ${medication.frequency}`, rightColumnX, yPosition);

      yPosition += 5;
      if (medication.duration) {
        pdf.text(`Duracion: ${medication.duration}`, margin + 5, yPosition);
        yPosition += 5;
      }

      // Instructions
      if (medication.instructions) {
        const instructions = pdf.splitTextToSize(
          `Instrucciones: ${medication.instructions}`,
          pageWidth - 2 * margin - 10
        );
        pdf.text(instructions, margin + 5, yPosition);
        yPosition += instructions.length * 4;
      }

      yPosition += 8;
    });

    // Simple notes section
    if (prescriptionData.notes) {
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = 30;
      }

      yPosition += 10;
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0); // Black
      pdf.text("OBSERVACIONES", margin, yPosition);

      yPosition += 8;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(0, 0, 0); // Black

      const notes = pdf.splitTextToSize(
        prescriptionData.notes,
        pageWidth - 2 * margin
      );
      pdf.text(notes, margin, yPosition);
      yPosition += notes.length * 5 + 10;
    }

    // Simple footer section
    const footerY = pageHeight - 50;

    // Simple line separator
    pdf.setDrawColor(255, 193, 7); // Yellow
    pdf.setLineWidth(1);
    pdf.line(margin, footerY, pageWidth - margin, footerY);

    // Date
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(102, 102, 102); // Gray
    pdf.text(
      `Fecha de emision: ${new Date(
        prescriptionData.createdAt
      ).toLocaleDateString("es-ES")}`,
      margin,
      footerY + 10
    );

    // Signature and stamp area
    const signatureAreaY = footerY + 5;
    let signatureX = pageWidth - margin - 120;

    // Add signature image if available
    if (prescriptionData.doctorInfo.signatureURL) {
      try {
        console.log("🖊️ Cargando firma digital...");
        const signatureBase64 = await loadImageAsBase64(
          prescriptionData.doctorInfo.signatureURL
        );
        if (signatureBase64) {
          pdf.addImage(
            signatureBase64,
            "JPEG",
            signatureX,
            signatureAreaY - 5,
            60, // width
            25 // height
          );

          // Add label below signature
          pdf.setFontSize(7);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(102, 102, 102);
          pdf.text("Firma Digital", signatureX + 10, signatureAreaY + 20);
          console.log("✅ Firma agregada al PDF");
        } else {
          // Fallback text if image fails to load
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(102, 102, 102);
          pdf.text("Firma Digital", signatureX, signatureAreaY);
        }
      } catch (error) {
        console.error("Error cargando firma:", error);
        // Fallback text
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(102, 102, 102);
        pdf.text("Firma Digital", signatureX, signatureAreaY);
      }
      signatureX += 60;
    }

    // Add stamp image if available
    if (prescriptionData.doctorInfo.stampURL) {
      try {
        console.log("🏥 Cargando sello profesional...");
        const stampBase64 = await loadImageAsBase64(
          prescriptionData.doctorInfo.stampURL
        );
        if (stampBase64) {
          pdf.addImage(
            stampBase64,
            "JPEG",
            signatureX,
            signatureAreaY - 5,
            50, // width
            25 // height
          );

          // Add label below stamp
          pdf.setFontSize(7);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(102, 102, 102);
          pdf.text("Sello Profesional", signatureX + 5, signatureAreaY + 20);
          console.log("✅ Sello agregado al PDF");
        } else {
          // Fallback text if image fails to load
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(102, 102, 102);
          pdf.text("Sello Digital", signatureX, signatureAreaY);
        }
      } catch (error) {
        console.error("Error cargando sello:", error);
        // Fallback text
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(102, 102, 102);
        pdf.text("Sello Digital", signatureX, signatureAreaY);
      }
    }

    // Simple footer disclaimer
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(102, 102, 102);
    pdf.text(
      "Receta generada digitalmente por Salud Libre",
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(pdf.output("arraybuffer"));

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="receta-${prescriptionData.patientInfo.name.replace(
        /\s+/g,
        "_"
      )}.pdf"`
    );

    // Send PDF
    res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error("Error generating prescription PDF:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Error generating prescription PDF",
      error: error.message,
      details: {
        prescriptionId: req.query.id,
        errorLocation: error.stack?.split("\n")[1]?.trim(),
      },
    });
  }
}
