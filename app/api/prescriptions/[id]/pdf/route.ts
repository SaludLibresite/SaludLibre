import { NextRequest, NextResponse } from 'next/server';
import { getPrescriptionService } from '@/src/infrastructure/container';
import { requireAuth, jsonError } from '@/src/infrastructure/api/auth';
import jsPDF from 'jspdf';

type Params = { params: Promise<{ id: string }> };

async function loadImageAsBase64(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl, {
      headers: { Accept: 'image/*', 'User-Agent': 'Mozilla/5.0 (compatible; PDF Generator)' },
    });
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    return `data:${mimeType};base64,${base64}`;
  } catch {
    return null;
  }
}

// GET /api/prescriptions/[id]/pdf — Generate and return prescription PDF
export async function GET(request: NextRequest, { params }: Params) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { id } = await params;
    const rx = await getPrescriptionService().getById(id);
    if (!rx) return jsonError('Prescription not found', 404);

    // Verify ownership
    const isDoctor = user.userType === 'doctor' && rx.doctorId === user.uid;
    const isPatient = user.patientId && rx.patientId === user.patientId;
    const isSuperadmin = user.userType === 'superadmin';
    if (!isDoctor && !isPatient && !isSuperadmin) {
      return jsonError('Insufficient permissions', 403);
    }

    const doc = rx.doctorSnapshot;
    const pat = rx.patientSnapshot;
    const createdDate = rx.createdAt instanceof Date ? rx.createdAt : new Date();

    // ── Generate PDF ──────────────────────────────────────────

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let y = 15;

    pdf.setFont('helvetica');

    // Header
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('SALUD LIBRE', margin, y);

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text('RECETA MEDICA', margin, y + 8);

    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y + 13, pageWidth - margin, y + 13);

    // Date & number top right
    pdf.setFontSize(9);
    pdf.text(
      `Fecha de emision: ${createdDate.toLocaleDateString('es-AR')}`,
      pageWidth - margin, y, { align: 'right' },
    );
    const prescId = `IF-2024-${rx.id.slice(-8).toUpperCase()}-APN-MS`;
    pdf.setFontSize(8);
    pdf.text(`Numero: ${prescId}`, pageWidth - margin, y + 6, { align: 'right' });

    y = 38;

    // ── Professional info ──
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INFORMACION DEL PROFESIONAL', margin, y);
    pdf.setLineWidth(0.3);
    pdf.line(margin, y + 2, pageWidth - margin, y + 2);
    y += 7;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text(doc.name || 'Doctor', margin, y);
    y += 6;

    const rightCol = pageWidth / 2 + 5;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text(`Profesion: ${doc.profession || 'Medico'}`, margin, y);
    pdf.text(`Matricula: ${doc.licenseNumber || 'N/A'}`, rightCol, y);
    y += 5;
    pdf.text(`Especialidad: ${doc.specialty || 'Medicina General'}`, margin, y);
    y += 5;
    pdf.text(`Domicilio: ${doc.officeAddress || 'No especificado'}`, margin, y);

    y += 12;

    // ── Patient info ──
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DATOS DEL PACIENTE', margin, y);
    pdf.setLineWidth(0.3);
    pdf.line(margin, y + 2, pageWidth - margin, y + 2);
    y += 7;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text(pat.name || 'Paciente', margin, y);
    y += 6;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text(`Sexo: ${pat.gender || 'No especificado'}`, margin, y);
    pdf.text(`Edad: ${pat.age ?? 'N/A'} anios`, rightCol, y);
    y += 5;
    if (pat.dateOfBirth) {
      const dob = pat.dateOfBirth instanceof Date ? pat.dateOfBirth : new Date(pat.dateOfBirth);
      pdf.text(`Fecha Nac: ${dob.toLocaleDateString('es-AR')}`, margin, y);
      y += 5;
    }
    if (pat.dni) {
      pdf.text(`DNI: ${pat.dni}`, margin, y);
      y += 5;
    }
    pdf.setTextColor(68, 68, 68);
    pdf.text('OOSS/Plan Medico:', margin + 3, y);
    y += 4;
    pdf.setTextColor(0, 0, 0);
    pdf.text(pat.insuranceProvider || 'Particular', margin + 3, y);
    y += 12;

    // ── Diagnosis ──
    if (rx.diagnosis?.trim()) {
      if (y > pageHeight - 60) { pdf.addPage(); y = 30; }
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DIAGNOSTICO', margin, y);
      pdf.setLineWidth(0.3);
      pdf.line(margin, y + 2, pageWidth - margin, y + 2);
      y += 7;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const diagLines = pdf.splitTextToSize(rx.diagnosis, pageWidth - 2 * margin);
      pdf.text(diagLines, margin, y);
      y += diagLines.length * 5 + 5;
    }

    // ── Medications ──
    if (y > pageHeight - 60) { pdf.addPage(); y = 30; }
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('MEDICACION PRESCRITA', margin, y);
    pdf.setLineWidth(0.3);
    pdf.line(margin, y + 2, pageWidth - margin, y + 2);
    y += 7;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RP:', margin, y);
    y += 8;

    rx.medications.forEach((med, idx) => {
      if (y > pageHeight - 80) { pdf.addPage(); y = 30; }

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${idx + 1}. ${med.name}`, margin + 3, y);
      y += 5;

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Dosis: ${med.dosage}`, margin + 6, y);
      pdf.text(`Frecuencia: ${med.frequency}`, rightCol, y);
      y += 4;

      if (med.duration) {
        pdf.text(`Duracion: ${med.duration}`, margin + 6, y);
        y += 4;
      }
      if (med.instructions) {
        const instrLines = pdf.splitTextToSize(med.instructions, pageWidth - 2 * margin - 12);
        pdf.text(instrLines, margin + 6, y);
        y += instrLines.length * 4;
      }

      y += 3;
      pdf.setDrawColor(220, 220, 220);
      pdf.setLineWidth(0.2);
      pdf.line(margin + 3, y, pageWidth - margin - 3, y);
      y += 5;
    });

    // ── Notes ──
    if (rx.notes?.trim()) {
      if (y > pageHeight - 60) { pdf.addPage(); y = 30; }
      y += 8;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('OBSERVACIONES', margin, y);
      pdf.setLineWidth(0.3);
      pdf.line(margin, y + 2, pageWidth - margin, y + 2);
      y += 7;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const notesLines = pdf.splitTextToSize(rx.notes, pageWidth - 2 * margin);
      pdf.text(notesLines, margin, y);
      y += notesLines.length * 5 + 5;
    }

    // ── Footer with signatures ──
    const footerY = pageHeight - 60;
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.3);
    pdf.line(margin, footerY, pageWidth - margin, footerY);

    const signatureAreaY = footerY + 8;
    let signatureX = pageWidth - margin - 120;

    if (doc.signatureUrl) {
      const sigB64 = await loadImageAsBase64(doc.signatureUrl);
      if (sigB64) {
        pdf.addImage(sigB64, 'JPEG', signatureX, signatureAreaY - 5, 60, 25);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(102, 102, 102);
        pdf.text('Firma Digital', signatureX + 10, signatureAreaY + 20);
      }
      signatureX += 60;
    }

    if (doc.stampUrl) {
      const stampB64 = await loadImageAsBase64(doc.stampUrl);
      if (stampB64) {
        pdf.addImage(stampB64, 'JPEG', signatureX, signatureAreaY - 5, 50, 25);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(102, 102, 102);
        pdf.text('Sello Profesional', signatureX + 5, signatureAreaY + 20);
      }
    }

    // Barcode
    const barcodeX = margin;
    const barcodeY = pageHeight - 28;
    const barcodeWidth = 50;
    const barcodeHeight = 10;
    pdf.setFillColor(255, 255, 255);
    pdf.rect(barcodeX, barcodeY, barcodeWidth, barcodeHeight, 'F');
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.3);
    pdf.rect(barcodeX, barcodeY, barcodeWidth, barcodeHeight);

    const numBars = 25;
    const barSpacing = (barcodeWidth - 4) / numBars;
    for (let i = 0; i < numBars; i++) {
      const seed = rx.id.charCodeAt(i % rx.id.length);
      const barH = (seed % 3) + 1;
      pdf.setLineWidth(barH === 1 ? 0.4 : barH === 2 ? 0.8 : 1.2);
      pdf.setDrawColor(0, 0, 0);
      pdf.line(barcodeX + 2 + i * barSpacing, barcodeY + 1, barcodeX + 2 + i * barSpacing, barcodeY + barcodeHeight - 1);
    }

    pdf.setFontSize(5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text(prescId, barcodeX, barcodeY + barcodeHeight + 3);

    // Legal text
    pdf.setFontSize(5.5);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(102, 102, 102);
    pdf.text('Esta receta fue creada por un emisor inscripto y validado', pageWidth / 2, pageHeight - 15, { align: 'center' });
    pdf.text('en el Registro de Recetarios Electronicos del Ministerio de Salud de la Nacion', pageWidth / 2, pageHeight - 11, { align: 'center' });

    pdf.setFontSize(6.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Receta Digital - Salud Libre', pageWidth / 2, pageHeight - 6, { align: 'center' });

    // ── Return PDF ──
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
    const safePatientName = pat.name.replace(/\s+/g, '_').replace(/[^\w-]/g, '');

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': pdfBuffer.length.toString(),
        'Content-Disposition': `inline; filename="receta-${safePatientName}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating prescription PDF:', error);
    return jsonError(error instanceof Error ? error.message : 'Error generating PDF', 500);
  }
}
