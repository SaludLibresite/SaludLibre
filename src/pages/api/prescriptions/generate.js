import jsPDF from "jspdf";
import admin from "../../../lib/firebase-admin";

// Helper function to load image and convert to base64
async function loadImageAsBase64(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const buffer = await response.buffer();
    const base64 = buffer.toString("base64");

    // Determine image type from URL or response headers
    const contentType = response.headers.get("content-type") || "image/png";
    const format =
      contentType.includes("jpeg") || contentType.includes("jpg")
        ? "JPEG"
        : "PNG";

    return {
      data: base64,
      format: format,
    };
  } catch (error) {
    console.error("Error loading image:", error);
    return null;
  }
}

// Helper function to generate barcode as text (simplified)
function generateBarcodeText(text) {
  // For now, return the text ID that will be displayed
  // In production, this would integrate with a proper barcode generator
  return text;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { prescriptionData, prescriptionId } = req.body;

    if (!prescriptionData) {
      return res.status(400).json({ message: "Prescription data is required" });
    }

    console.log("Generating PDF for prescription data:", {
      doctorId: prescriptionData.doctorInfo?.id,
      patientName: prescriptionData.patientInfo?.name,
      medicationsCount: prescriptionData.medications?.length,
      prescriptionId: prescriptionId,
    });

    // Validate required data
    if (
      !prescriptionData.doctorInfo ||
      !prescriptionData.patientInfo ||
      !prescriptionData.medications
    ) {
      return res.status(400).json({
        message: "Missing required prescription data",
        missing: {
          doctorInfo: !prescriptionData.doctorInfo,
          patientInfo: !prescriptionData.patientInfo,
          medications: !prescriptionData.medications,
        },
      });
    }

    // Generate PDF
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = 25;

    // Set default font
    pdf.setFont("helvetica");

    // Modern header with gradient-style background
    pdf.setFillColor(255, 193, 7); // Bright yellow
    pdf.rect(0, 0, pageWidth, 50, "F");

    // Header shadow effect
    pdf.setFillColor(255, 235, 59); // Light yellow
    pdf.rect(0, 45, pageWidth, 5, "F");

    // Clinic name
    pdf.setFontSize(28);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(68, 68, 68); // Dark gray
    pdf.text("SALUD LIBRE", pageWidth / 2, 25, { align: "center" });

    // Subtitle
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(102, 102, 102);
    pdf.text("Plataforma de Salud Digital", pageWidth / 2, 38, {
      align: "center",
    });

    yPosition = 65;

    // Modern title with icon
    pdf.setFontSize(26);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(255, 152, 0); // Orange
    pdf.text("RECETA MEDICA", pageWidth / 2, yPosition, { align: "center" });

    yPosition += 20;

    // Modern decorative line with gradient effect
    pdf.setDrawColor(255, 193, 7);
    pdf.setLineWidth(3);
    pdf.line(margin + 20, yPosition, pageWidth - margin - 20, yPosition);

    pdf.setDrawColor(255, 235, 59);
    pdf.setLineWidth(1);
    pdf.line(
      margin + 15,
      yPosition + 2,
      pageWidth - margin - 15,
      yPosition + 2
    );

    yPosition += 20;

    // Modern doctor information card
    pdf.setFillColor(255, 248, 225); // Very light yellow
    pdf.setDrawColor(255, 193, 7);
    pdf.setLineWidth(2);
    pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 60, 8, 8, "FD");

    yPosition += 12;
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(68, 68, 68);
    pdf.text("INFORMACION DEL MEDICO", margin + 12, yPosition);

    yPosition += 10;
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(68, 68, 68);
    pdf.text(
      `Nombre y Apellido: ${prescriptionData.doctorInfo.nombre}`,
      margin + 12,
      yPosition
    );

    yPosition += 7;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(102, 102, 102);

    const rightColumnX = pageWidth / 2 + 10;
    pdf.text(
      `Profesión: ${prescriptionData.doctorInfo.profesion || "Médico"}`,
      margin + 12,
      yPosition
    );
    pdf.text(
      `Especialidad: ${prescriptionData.doctorInfo.especialidad}`,
      rightColumnX,
      yPosition
    );

    yPosition += 6;
    pdf.text(
      `Matrícula: ${prescriptionData.doctorInfo.matricula || "N/A"}`,
      margin + 12,
      yPosition
    );
    pdf.text(
      `Teléfono: ${prescriptionData.doctorInfo.telefono}`,
      rightColumnX,
      yPosition
    );

    yPosition += 6;
    const domicilioText = pdf.splitTextToSize(
      `Domicilio: ${prescriptionData.doctorInfo.domicilio || "No especificado"}`,
      pageWidth - 2 * margin - 24
    );
    pdf.text(domicilioText, margin + 12, yPosition);
    yPosition += domicilioText.length * 5;

    yPosition += 10;

    // Modern patient information card
    pdf.setFillColor(254, 249, 195); // Light yellow
    pdf.setDrawColor(255, 235, 59);
    pdf.setLineWidth(2);
    pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 48, 8, 8, "FD");

    yPosition += 12;
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(68, 68, 68);
    pdf.text("DATOS DEL PACIENTE", margin + 12, yPosition);

    yPosition += 10;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(68, 68, 68);
    pdf.text(
      `Paciente: ${prescriptionData.patientInfo.name}`,
      margin + 12,
      yPosition
    );
    pdf.text(
      `Fecha Nacimiento: ${
        prescriptionData.patientInfo.dateOfBirth
          ? new Date(prescriptionData.patientInfo.dateOfBirth).toLocaleDateString(
              "es-ES"
            )
          : "N/A"
      }`,
      rightColumnX,
      yPosition
    );

    yPosition += 6;
    pdf.text(
      `DNI: ${prescriptionData.patientInfo.dni || "No especificado"}`,
      margin + 12,
      yPosition
    );
    pdf.text(
      `Sexo: ${prescriptionData.patientInfo.gender || "No especificado"}`,
      rightColumnX,
      yPosition
    );

    yPosition += 6;
    pdf.text(
      `OOSS/Plan Médico: ${prescriptionData.patientInfo.obraSocial || "Particular"}`,
      margin + 12,
      yPosition
    );

    yPosition += 25;

    // Diagnosis section (if exists)
    if (prescriptionData.diagnosis && prescriptionData.diagnosis.trim()) {
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = 30;
      }

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(68, 68, 68);
      pdf.text("DIAGNOSTICO", margin, yPosition);

      yPosition += 10;
      pdf.setFillColor(255, 248, 225);
      pdf.setDrawColor(255, 193, 7);
      pdf.setLineWidth(1);

      const diagnosisLines = pdf.splitTextToSize(
        prescriptionData.diagnosis,
        pageWidth - 2 * margin - 20
      );
      const diagnosisHeight = Math.max(20, diagnosisLines.length * 6 + 12);

      pdf.roundedRect(
        margin,
        yPosition,
        pageWidth - 2 * margin,
        diagnosisHeight,
        6,
        6,
        "FD"
      );

      yPosition += 8;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(68, 68, 68);
      pdf.text(diagnosisLines, margin + 10, yPosition);
      yPosition += diagnosisLines.length * 6 + 12;
    }

    // RP: (Prescription) section - Official format
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = 30;
    }

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(68, 68, 68);
    pdf.text("MEDICACION PRESCRITA", margin, yPosition);
    
    yPosition += 8;
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(255, 152, 0);
    pdf.text("RP:", margin, yPosition);
    yPosition += 12;

    // Medications with modern card design
    prescriptionData.medications.forEach((medication, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = 30;
      }

      // Modern medication card
      const medicationHeight = medication.instructions ? 40 : 32;
      pdf.setFillColor(255, 252, 231); // Very light yellow
      pdf.setDrawColor(255, 193, 7);
      pdf.setLineWidth(1.5);
      pdf.roundedRect(
        margin,
        yPosition,
        pageWidth - 2 * margin,
        medicationHeight,
        6,
        6,
        "FD"
      );

      yPosition += 10;

      // Medication number badge
      pdf.setFillColor(255, 193, 7);
      pdf.circle(margin + 15, yPosition - 2, 8, "F");
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(68, 68, 68);
      pdf.text(`${index + 1}`, margin + 12, yPosition + 2);

      // Medication name
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(245, 124, 0);
      pdf.text(`${medication.name}`, margin + 28, yPosition + 2);

      yPosition += 10;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(102, 102, 102);

      // Dosage and frequency
      pdf.text(`Dosis: ${medication.dosage}`, margin + 15, yPosition);
      pdf.text(`Frecuencia: ${medication.frequency}`, rightColumnX, yPosition);

      yPosition += 6;
      if (medication.duration) {
        pdf.text(`Duracion: ${medication.duration}`, margin + 15, yPosition);
        yPosition += 6;
      }

      // Instructions with modern styling
      if (medication.instructions) {
        pdf.setFont("helvetica", "italic");
        pdf.setTextColor(136, 136, 136);
        const instructions = pdf.splitTextToSize(
          `${medication.instructions}`,
          pageWidth - 2 * margin - 25
        );
        pdf.text(instructions, margin + 15, yPosition);
        yPosition += instructions.length * 5;
      }

      yPosition += 12;
    });

    // Notes/Observations section
    if (prescriptionData.notes && prescriptionData.notes.trim()) {
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = 30;
      }

      yPosition += 10;
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(68, 68, 68);
      pdf.text("OBSERVACIONES", margin, yPosition);

      yPosition += 10;
      pdf.setFillColor(255, 248, 225);
      pdf.setDrawColor(255, 193, 7);
      pdf.setLineWidth(1);

      const notesLines = pdf.splitTextToSize(
        prescriptionData.notes,
        pageWidth - 2 * margin - 20
      );
      const notesHeight = Math.max(20, notesLines.length * 6 + 12);

      pdf.roundedRect(
        margin,
        yPosition,
        pageWidth - 2 * margin,
        notesHeight,
        6,
        6,
        "FD"
      );

      yPosition += 8;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(68, 68, 68);
      pdf.text(notesLines, margin + 10, yPosition);
      yPosition += notesLines.length * 6 + 12;
    }

    // Modern footer section
    const footerY = pageHeight - 70;

    // Modern footer background
    pdf.setFillColor(255, 248, 225);
    pdf.rect(0, footerY - 10, pageWidth, 80, "F");

    // Modern footer line with gradient
    pdf.setDrawColor(255, 193, 7);
    pdf.setLineWidth(3);
    pdf.line(margin, footerY, pageWidth - margin, footerY);

    // Date with icon
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(102, 102, 102);
    pdf.text(
      `📅 ${new Date(prescriptionData.createdAt).toLocaleDateString("es-ES")}`,
      margin,
      footerY + 15
    );

    // Signature and stamp area
    const signatureAreaY = footerY + 10;
    let signatureX = pageWidth - margin - 130;

    // Load and add signature image if available
    if (prescriptionData.doctorInfo.signatureURL) {
      try {
        const signatureData = await loadImageAsBase64(
          prescriptionData.doctorInfo.signatureURL
        );
        if (signatureData) {
          pdf.addImage(
            `data:image/${signatureData.format.toLowerCase()};base64,${
              signatureData.data
            }`,
            signatureData.format,
            signatureX,
            signatureAreaY - 5,
            60, // width
            25 // height
          );

          // Add label below signature
          pdf.setFontSize(8);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(136, 136, 136);
          pdf.text("Firma Digital", signatureX + 15, signatureAreaY + 25);
        } else {
          // Fallback text if image fails to load
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(255, 152, 0);
          pdf.text("✍️ Firma Digital", signatureX, signatureAreaY);
        }
        signatureX += 70;
      } catch (error) {
        console.error("Error loading signature:", error);
        // Fallback text
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(255, 152, 0);
        pdf.text("✍️ Firma Digital", signatureX, signatureAreaY);
        signatureX += 70;
      }
    }

    // Load and add stamp image if available
    if (prescriptionData.doctorInfo.stampURL) {
      try {
        const stampData = await loadImageAsBase64(
          prescriptionData.doctorInfo.stampURL
        );
        if (stampData) {
          pdf.addImage(
            `data:image/${stampData.format.toLowerCase()};base64,${
              stampData.data
            }`,
            stampData.format,
            signatureX,
            signatureAreaY - 5,
            50, // width
            25 // height
          );

          // Add label below stamp
          pdf.setFontSize(8);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(136, 136, 136);
          pdf.text("Sello Profesional", signatureX + 10, signatureAreaY + 25);
        } else {
          // Fallback text if image fails to load
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(255, 152, 0);
          pdf.text("🏥 Sello Digital", signatureX, signatureAreaY);
        }
      } catch (error) {
        console.error("Error loading stamp:", error);
        // Fallback text
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(255, 152, 0);
        pdf.text("🏥 Sello Digital", signatureX, signatureAreaY);
      }
    }

    // Professional validation line
    pdf.setDrawColor(255, 193, 7);
    pdf.setLineWidth(2);
    pdf.line(
      pageWidth - margin - 130,
      signatureAreaY + 15,
      pageWidth - margin - 20,
      signatureAreaY + 15
    );

    pdf.setFontSize(9);
    pdf.setTextColor(136, 136, 136);
    pdf.text(
      "Firma y Sello Profesional",
      pageWidth - margin - 130,
      signatureAreaY + 25
    );

    // Prescription ID and date at bottom
    const prescId = prescriptionId || `IF-2024-${Date.now().toString().slice(-8)}-APN-MS`;
    
    // Add prescription ID
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(68, 68, 68);
    pdf.text(`Número: ${prescId}`, pageWidth / 2, pageHeight - 35, {
      align: "center",
    });

    // Legal text from Ministry of Health
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(102, 102, 102);
    const legalText = [
      "Esta receta fue creada por un emisor inscripto y validado",
      "en el Registro de Recetarios Electrónicos del Ministerio de Salud de la Nación",
    ];
    
    legalText.forEach((line, index) => {
      pdf.text(line, pageWidth / 2, pageHeight - 22 + (index * 4), {
        align: "center",
      });
    });

    // Footer signature
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(255, 152, 0);
    pdf.text(
      "Receta Digital - Salud Libre",
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(pdf.output("arraybuffer"));

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", pdfBuffer.length);

    // Send PDF
    res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error("Error generating prescription PDF:", error);
    res.status(500).json({
      message: "Error generating prescription PDF",
      error: error.message,
    });
  }
}
