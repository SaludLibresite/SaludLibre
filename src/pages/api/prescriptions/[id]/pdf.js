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
      profesion: prescriptionData.doctorInfo?.profesion || "Médico",
      especialidad:
        prescriptionData.doctorInfo?.especialidad || "Medicina General",
      telefono: prescriptionData.doctorInfo?.telefono || "No especificado",
      domicilio: prescriptionData.doctorInfo?.domicilio || "No especificado",
      matricula: prescriptionData.doctorInfo?.matricula || "N/A",
      signatureURL: prescriptionData.doctorInfo?.signatureURL || null,
      stampURL: prescriptionData.doctorInfo?.stampURL || null,
      ...prescriptionData.doctorInfo,
    };

    prescriptionData.patientInfo = {
      name: prescriptionData.patientInfo?.name || "Paciente",
      age: prescriptionData.patientInfo?.age || "N/A",
      dateOfBirth: prescriptionData.patientInfo?.dateOfBirth || null,
      dni: prescriptionData.patientInfo?.dni || "No especificado",
      gender: prescriptionData.patientInfo?.gender || "No especificado",
      obraSocial: prescriptionData.patientInfo?.obraSocial || "Particular",
      ...prescriptionData.patientInfo,
    };

    if (!prescriptionData.createdAt) {
      prescriptionData.createdAt = new Date();
    }

    // Generate PDF
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = 15;

    // Set default font
    pdf.setFont("helvetica");

    // Header - Simple black and white design
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("SALUD LIBRE", margin, 15);
    
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "normal");
    pdf.text("RECETA MEDICA", margin, 23);
    
    // Line separator
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.line(margin, 28, pageWidth - margin, 28);
    
    // Date in top right
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(0, 0, 0);
    pdf.text(
      `Fecha de emision: ${new Date(prescriptionData.createdAt).toLocaleDateString("es-ES")}`,
      pageWidth - margin,
      15,
      { align: "right" }
    );
    
    // Prescription number
    const headerPrescId = prescriptionData.id
      ? `IF-2024-${prescriptionData.id.slice(-8).toUpperCase()}-APN-MS`
      : `IF-2024-${Date.now().toString().slice(-8)}-APN-MS`;
    
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Numero: ${headerPrescId}`, pageWidth - margin, 21, { align: "right" });
    
    yPosition = 38;

    // Professional information section
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("INFORMACION DEL PROFESIONAL", margin, yPosition);
    
    // Line under title
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.3);
    pdf.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2);
    
    yPosition += 7;
    
    // Doctor data
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text(
      prescriptionData.doctorInfo.nombre || "No especificado",
      margin,
      yPosition
    );
    
    yPosition += 6;
    const rightColumnX = pageWidth / 2 + 5;
    
    // Two columns
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(0, 0, 0);
    
    pdf.text(`Profesion: ${prescriptionData.doctorInfo.profesion || "Médico"}`, margin, yPosition);
    pdf.text(`Matricula: ${prescriptionData.doctorInfo.matricula || "N/A"}`, rightColumnX, yPosition);
    
    yPosition += 5;
    pdf.text(`Domicilio: ${prescriptionData.doctorInfo.domicilio || "No especificado"}`, margin, yPosition);

    yPosition += 12;

    // Patient information section
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("DATOS DEL PACIENTE", margin, yPosition);
    
    // Line under title
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.3);
    pdf.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2);
    
    yPosition += 7;
    
    // Patient data in structured format
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    
    pdf.text(
      prescriptionData.patientInfo.name || "No especificado",
      margin,
      yPosition
    );
    
    yPosition += 6;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    
    // Row 1
    pdf.text(
      `DNI: ${prescriptionData.patientInfo.dni || "No especificado"}`,
      margin,
      yPosition
    );
    pdf.text(
      `Sexo: ${prescriptionData.patientInfo.gender || "No especificado"}`,
      rightColumnX,
      yPosition
    );
    
    yPosition += 5;
    pdf.text(
      `Fecha Nac: ${prescriptionData.patientInfo.dateOfBirth
        ? new Date(prescriptionData.patientInfo.dateOfBirth).toLocaleDateString("es-ES")
        : "N/A"}`,
      margin,
      yPosition
    );
    
    yPosition += 5;
    pdf.setTextColor(68, 68, 68);
    pdf.text(`OOSS/Plan Medico:`, margin + 3, yPosition);
    
    yPosition += 4;
    pdf.setTextColor(0, 0, 0);
    pdf.text(
      prescriptionData.patientInfo.obraSocial || "Particular",
      margin + 3,
      yPosition
    );

    yPosition += 12;

    // Diagnosis section (if exists)
    if (prescriptionData.diagnosis && prescriptionData.diagnosis.trim()) {
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = 30;
      }

      // Diagnosis box
      const diagnosisLines = pdf.splitTextToSize(
        prescriptionData.diagnosis,
        pageWidth - 2 * margin - 6
      );
      const diagnosisHeight = Math.max(15, diagnosisLines.length * 5 + 10);
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      pdf.text("DIAGNOSTICO", margin, yPosition);
      
      // Line under title
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.3);
      pdf.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2);

      yPosition += 7;
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(0, 0, 0);
      pdf.text(diagnosisLines, margin, yPosition);
      yPosition += diagnosisLines.length * 5 + 5;
    }

    // Medications section with RP format
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("MEDICACION PRESCRITA", margin, yPosition);
    
    // Line under title
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.3);
    pdf.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2);
    
    yPosition += 7;
    
    // RP: label
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("RP:", margin, yPosition);
    
    yPosition += 8;

    // Medications list with cleaner format
    prescriptionData.medications.forEach((medication, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = 30;
      }

      // Medication number and name
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${index + 1}. ${medication.name}`, margin + 3, yPosition);

      yPosition += 5;
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");

      // Dosage and frequency
      pdf.text(`Dosis: ${medication.dosage}`, margin + 6, yPosition);
      pdf.text(`Frecuencia: ${medication.frequency}`, rightColumnX, yPosition);

      yPosition += 4;
      if (medication.duration) {
        pdf.text(`Duracion: ${medication.duration}`, margin + 6, yPosition);
        yPosition += 4;
      }

      // Instructions
      if (medication.instructions) {
        const instructions = pdf.splitTextToSize(
          medication.instructions,
          pageWidth - 2 * margin - 12
        );
        pdf.text(instructions, margin + 6, yPosition);
        yPosition += instructions.length * 4;
      }

      // Separator line
      yPosition += 3;
      pdf.setDrawColor(220, 220, 220);
      pdf.setLineWidth(0.2);
      pdf.line(margin + 3, yPosition, pageWidth - margin - 3, yPosition);
      yPosition += 5;
    });

    // Simple notes section
    if (prescriptionData.notes) {
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = 30;
      }

      yPosition += 8;
      
      const notesLines = pdf.splitTextToSize(
        prescriptionData.notes,
        pageWidth - 2 * margin - 6
      );
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      pdf.text("OBSERVACIONES", margin, yPosition);
      
      // Line under title
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.3);
      pdf.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2);

      yPosition += 7;
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(0, 0, 0);
      pdf.text(notesLines, margin, yPosition);
      yPosition += notesLines.length * 5 + 5;
    }

    // Footer section with signatures
    const footerY = pageHeight - 60;

    // Simple line separator
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.3);
    pdf.line(margin, footerY, pageWidth - margin, footerY);

    // Signature and stamp area
    const signatureAreaY = footerY + 8;
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

    // Barcode section - positioned in bottom left corner
    const barcodeWidth = 50;
    const barcodeHeight = 10;
    const barcodeX = margin;
    const barcodeY = pageHeight - 28;
    
    // Draw barcode background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(barcodeX, barcodeY, barcodeWidth, barcodeHeight, "F");
    
    // Draw barcode border
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.3);
    pdf.rect(barcodeX, barcodeY, barcodeWidth, barcodeHeight);
    
    // Generate barcode pattern (simplified)
    const barcodeId = prescriptionData.id || Date.now().toString();
    const numBars = 25;
    
    // Draw barcode lines with better spacing
    pdf.setDrawColor(0, 0, 0);
    const barSpacing = (barcodeWidth - 4) / numBars;
    
    for (let i = 0; i < numBars; i++) {
      const seed = barcodeId.charCodeAt(i % barcodeId.length);
      const barHeight = (seed % 3) + 1;
      const lineWidth = barHeight === 1 ? 0.4 : barHeight === 2 ? 0.8 : 1.2;
      
      pdf.setLineWidth(lineWidth);
      const xPos = barcodeX + 2 + (i * barSpacing);
      pdf.line(xPos, barcodeY + 1, xPos, barcodeY + barcodeHeight - 1);
    }
    
    // Prescription number below barcode
    const prescId = prescriptionData.id
      ? `IF-2024-${prescriptionData.id.slice(-8).toUpperCase()}-APN-MS`
      : `IF-2024-${Date.now().toString().slice(-8)}-APN-MS`;
    
    pdf.setFontSize(5);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(0, 0, 0);
    pdf.text(prescId, barcodeX, barcodeY + barcodeHeight + 3);

    // Legal text from Ministry of Health
    pdf.setFontSize(5.5);
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(102, 102, 102);
    pdf.text(
      "Esta receta fue creada por un emisor inscripto y validado",
      pageWidth / 2,
      pageHeight - 15,
      { align: "center" }
    );
    pdf.text(
      "en el Registro de Recetarios Electronicos del Ministerio de Salud de la Nacion",
      pageWidth / 2,
      pageHeight - 11,
      { align: "center" }
    );

    // Footer
    pdf.setFontSize(6.5);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(0, 0, 0);
    pdf.text(
      "Receta Digital - Salud Libre",
      pageWidth / 2,
      pageHeight - 6,
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
