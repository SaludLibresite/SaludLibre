import jsPDF from "jspdf";

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

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Sample prescription data with your doctor info
    const prescriptionData = {
      doctorInfo: {
        nombre: "Dr. Juan Hernandez",
        especialidad: "Gastroenterología",
        telefono: "2211592542",
        matricula: "DRJ7861",
        signatureURL:
          "https://firebasestorage.googleapis.com/v0/b/doctore-eae95.firebasestorage.app/o/signatures%2FqnQt5SMFNeMzzTyLqCRoZouQsmd2%2F1751951183699-climate-wizard-tbsi-580-3.webp?alt=media&token=b893bc6e-cec3-4dea-bb6f-f70b68afe922",
        stampURL:
          "https://firebasestorage.googleapis.com/v0/b/doctore-eae95.firebasestorage.app/o/stamps%2FqnQt5SMFNeMzzTyLqCRoZouQsmd2%2F1751951192097-logo-transparente.png?alt=media&token=41455b2e-57f3-4c98-b012-f85150c7b7dc",
      },
      patientInfo: {
        name: "María García",
        age: 45,
      },
      medications: [
        {
          name: "Omeprazol",
          dosage: "20mg",
          frequency: "1 vez al día",
          duration: "4 semanas",
          instructions: "Tomar en ayunas, 30 minutos antes del desayuno",
        },
        {
          name: "Ranitidina",
          dosage: "150mg",
          frequency: "2 veces al día",
          duration: "2 semanas",
          instructions: "Tomar después de las comidas principales",
        },
      ],
      notes:
        "Control en 2 semanas. Dieta blanda y evitar alimentos irritantes.",
      createdAt: new Date(),
    };

    console.log("Generating test PDF with data:", prescriptionData);

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
    pdf.text("🩺 Plataforma de Salud Digital", pageWidth / 2, 38, {
      align: "center",
    });

    yPosition = 65;

    // Modern title with icon
    pdf.setFontSize(26);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(255, 152, 0); // Orange
    pdf.text("📋 RECETA MÉDICA", pageWidth / 2, yPosition, { align: "center" });

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
    pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 45, 8, 8, "FD");

    yPosition += 12;
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(255, 152, 0);
    pdf.text("👨‍⚕️ INFORMACIÓN DEL MÉDICO", margin + 12, yPosition);

    yPosition += 12;
    pdf.setFontSize(13);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(68, 68, 68);
    pdf.text(prescriptionData.doctorInfo.nombre, margin + 12, yPosition);

    yPosition += 8;
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(102, 102, 102);

    const rightColumnX = pageWidth / 2 + 10;
    pdf.text(
      `🏥 ${prescriptionData.doctorInfo.especialidad}`,
      margin + 12,
      yPosition
    );
    pdf.text(
      `📱 ${prescriptionData.doctorInfo.telefono}`,
      rightColumnX,
      yPosition
    );

    yPosition += 6;
    pdf.text(
      `🆔 Mat: ${prescriptionData.doctorInfo.matricula}`,
      margin + 12,
      yPosition
    );

    yPosition += 20;

    // Modern patient information card
    pdf.setFillColor(254, 249, 195); // Light yellow
    pdf.setDrawColor(255, 235, 59);
    pdf.setLineWidth(2);
    pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 35, 8, 8, "FD");

    yPosition += 12;
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(245, 124, 0);
    pdf.text("👤 DATOS DEL PACIENTE", margin + 12, yPosition);

    yPosition += 12;
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(68, 68, 68);
    pdf.text(prescriptionData.patientInfo.name, margin + 12, yPosition);

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(102, 102, 102);
    pdf.text(
      `🎂 ${prescriptionData.patientInfo.age} años`,
      rightColumnX,
      yPosition
    );

    yPosition += 8;
    pdf.text(
      `📅 ${prescriptionData.createdAt.toLocaleDateString("es-ES")}`,
      margin + 12,
      yPosition
    );

    yPosition += 25;

    // Modern medications section
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(255, 152, 0);
    pdf.text("💊 MEDICACIÓN PRESCRITA", margin, yPosition);
    yPosition += 18;

    // Medications with modern card design
    prescriptionData.medications.forEach((medication, index) => {
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
      pdf.text(medication.name, margin + 28, yPosition + 2);

      yPosition += 10;
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(102, 102, 102);

      // Dosage and frequency with icons
      pdf.text(`💊 ${medication.dosage}`, margin + 15, yPosition);
      pdf.text(`⏰ ${medication.frequency}`, rightColumnX, yPosition);

      yPosition += 6;
      if (medication.duration) {
        pdf.text(`📅 ${medication.duration}`, margin + 15, yPosition);
        yPosition += 6;
      }

      // Instructions with modern styling
      if (medication.instructions) {
        pdf.setFont("helvetica", "italic");
        pdf.setTextColor(136, 136, 136);
        const instructions = pdf.splitTextToSize(
          `💡 ${medication.instructions}`,
          pageWidth - 2 * margin - 25
        );
        pdf.text(instructions, margin + 15, yPosition);
        yPosition += instructions.length * 5;
      }

      yPosition += 12;
    });

    // Modern notes section
    if (prescriptionData.notes) {
      yPosition += 15;
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255, 152, 0);
      pdf.text("📝 OBSERVACIONES", margin, yPosition);

      yPosition += 12;
      pdf.setFillColor(255, 248, 225);
      pdf.setDrawColor(255, 193, 7);
      pdf.setLineWidth(1);
      pdf.roundedRect(
        margin,
        yPosition,
        pageWidth - 2 * margin,
        25,
        6,
        6,
        "FD"
      );

      yPosition += 10;
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(68, 68, 68);

      const notes = pdf.splitTextToSize(
        prescriptionData.notes,
        pageWidth - 2 * margin - 20
      );
      pdf.text(notes, margin + 10, yPosition);
      yPosition += notes.length * 6 + 15;
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
      `📅 ${prescriptionData.createdAt.toLocaleDateString("es-ES")}`,
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
        }
        signatureX += 70;
      } catch (error) {
        console.error("Error loading signature:", error);
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
        }
      } catch (error) {
        console.error("Error loading stamp:", error);
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

    // Modern footer disclaimer
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(255, 152, 0);
    pdf.text(
      "🌟 Receta generada digitalmente por Salud Libre",
      pageWidth / 2,
      pageHeight - 15,
      { align: "center" }
    );

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(pdf.output("arraybuffer"));

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader("Content-Disposition", `inline; filename="receta-test.pdf"`);

    // Send PDF
    res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error("Error generating test PDF:", error);
    res.status(500).json({
      message: "Error generating test PDF",
      error: error.message,
    });
  }
}
