import { Resend } from "resend";
import { adminDb } from "../../../lib/firebase-admin";
import {
  emailLayout,
  ctaButton,
  detailCard,
  infoBox,
  statusBadge,
  formatDate,
  APP_URL,
  BRAND,
} from "../../../lib/emailTemplates";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const { appointmentData } = req.body;

    if (!appointmentData) {
      return res.status(400).json({
        success: false,
        message: "Faltan datos de la cita",
      });
    }

    // Support both English and Spanish field names for backward compatibility
    const patientName = appointmentData.patientName || appointmentData.nombre;
    const patientEmail = appointmentData.patientEmail || appointmentData.email;
    const patientPhone = appointmentData.patientPhone || appointmentData.telefono;
    const fecha = appointmentData.fecha || (appointmentData.date ? new Date(appointmentData.date).toISOString().split("T")[0] : null);
    const hora = appointmentData.time || appointmentData.hora;
    const tipoConsulta = appointmentData.type || appointmentData.tipoConsulta;
    const descripcion = appointmentData.reason || appointmentData.descripcion;
    const { doctorId, doctorName, appointmentId } = appointmentData;

    // Get doctor information for email
    let doctorEmail = null;
    let doctorData = null;

    if (doctorId) {
      try {
        const doctorDoc = await adminDb.collection("doctors").doc(doctorId).get();
        if (doctorDoc.exists) {
          doctorData = doctorDoc.data();
          doctorEmail = doctorData.email;
        }
      } catch (error) {
        console.error("Error fetching doctor data:", error);
      }
    }

    const formattedDate = formatDate(fecha);
    const consultaType = tipoConsulta === "virtual" ? "Virtual" : "Presencial";
    const resolvedDoctorName = doctorName || doctorData?.nombre || "Tu médico";

    // Send email to patient
    if (patientEmail) {
      await sendPatientRequestEmail({
        patientName,
        patientEmail,
        doctorName: resolvedDoctorName,
        appointmentDate: formattedDate,
        appointmentTime: hora,
        consultaType,
        appointmentId,
        doctorAddress: doctorData?.direccion,
        doctorPhone: doctorData?.telefono,
        doctorSpecialty: doctorData?.especialidad,
      });
    }

    // Send email to doctor
    if (doctorEmail) {
      await sendDoctorRequestEmail({
        doctorName: resolvedDoctorName,
        doctorEmail,
        patientName,
        patientEmail,
        patientPhone,
        appointmentDate: formattedDate,
        appointmentTime: hora,
        consultaType,
        descripcion,
        appointmentId,
      });
    }

    res.status(200).json({
      success: true,
      message: "Correos enviados exitosamente",
      emailsSent: { patient: !!patientEmail, doctor: !!doctorEmail },
    });
  } catch (error) {
    console.error("Error sending confirmation emails:", error);
    res.status(500).json({
      success: false,
      message: "Error al enviar correos de confirmación",
      error: error.message,
    });
  }
}

// ─── Email to Patient: Appointment Requested ────────────────────────────────

async function sendPatientRequestEmail({
  patientName,
  patientEmail,
  doctorName,
  appointmentDate,
  appointmentTime,
  consultaType,
  appointmentId,
  doctorAddress,
  doctorPhone,
  doctorSpecialty,
}) {
  const body = `
    <p style="margin: 0 0 16px; color: ${BRAND.textDark}; font-size: 16px; line-height: 1.6;">
      Hola <strong>${patientName}</strong>,
    </p>
    <p style="margin: 0 0 20px; color: ${BRAND.textDark}; font-size: 15px; line-height: 1.6;">
      Tu solicitud de cita médica fue registrada con éxito. El profesional revisará tu solicitud y recibirás un correo cuando sea confirmada.
    </p>
    
    <p style="margin: 0 0 8px; color: ${BRAND.textMuted}; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Estado actual</p>
    ${statusBadge("⏳ Pendiente de confirmación", "#fef3c7", "#92400e")}
    
    ${detailCard("📋 Detalles de tu cita", [
      ["Nº de cita", appointmentId || "—"],
      ["Profesional", doctorName],
      ["Especialidad", doctorSpecialty],
      ["Fecha", appointmentDate],
      ["Hora", appointmentTime],
      ["Modalidad", consultaType],
      ["Dirección", consultaType === "Presencial" ? doctorAddress : null],
      ["Teléfono", doctorPhone],
    ])}
    
    ${infoBox(`
      <strong>¿Qué sigue?</strong>
      <ul style="margin: 8px 0 0; padding-left: 20px;">
        <li>Tu médico revisará la solicitud y confirmará la cita</li>
        <li>Recibirás un correo de confirmación cuando sea aceptada</li>
        <li>Si necesitás cancelar o reprogramar, contactá directamente al consultorio</li>
        ${consultaType === "Virtual" ? "<li>Para consultas virtuales, recibirás el enlace de videoconferencia con la confirmación</li>" : ""}
      </ul>
    `, "info")}
    
    ${ctaButton("Ver mis citas", `${APP_URL}/paciente/mis-citas`)}
    
    <p style="margin: 24px 0 0; color: ${BRAND.textMuted}; font-size: 13px; line-height: 1.5; text-align: center;">
      Si tenés alguna duda, podés contactar directamente al consultorio de ${doctorName}.
    </p>
  `;

  const html = emailLayout({
    title: "Solicitud de Cita Registrada",
    preheader: `Tu cita con ${doctorName} para el ${appointmentDate} está pendiente de confirmación.`,
    body,
  });

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Salud Libre <noreply@email.jhernandez.mx>",
      to: [patientEmail],
      subject: `⏳ Tu cita con ${doctorName} está pendiente de confirmación`,
      html,
    });
    console.log(`Patient request email sent to ${patientEmail}`);
  } catch (error) {
    console.error("Error sending patient request email:", error);
    throw error;
  }
}

// ─── Email to Doctor: New Appointment Request ───────────────────────────────

async function sendDoctorRequestEmail({
  doctorName,
  doctorEmail,
  patientName,
  patientEmail,
  patientPhone,
  appointmentDate,
  appointmentTime,
  consultaType,
  descripcion,
  appointmentId,
}) {
  const body = `
    <p style="margin: 0 0 16px; color: ${BRAND.textDark}; font-size: 16px; line-height: 1.6;">
      Hola <strong>${doctorName}</strong>,
    </p>
    <p style="margin: 0 0 20px; color: ${BRAND.textDark}; font-size: 15px; line-height: 1.6;">
      Tenés una nueva solicitud de cita a través de <strong>Salud Libre</strong>. Revisá los detalles y confirmala desde tu panel de administración.
    </p>
    
    ${detailCard("👤 Datos del paciente", [
      ["Nombre", patientName],
      ["Email", `<a href="mailto:${patientEmail}" style="color: ${BRAND.primary};">${patientEmail}</a>`],
      ["Teléfono", patientPhone ? `<a href="tel:${patientPhone}" style="color: ${BRAND.primary};">${patientPhone}</a>` : null],
    ], BRAND.accent, BRAND.accentLight)}
    
    ${detailCard("📅 Cita solicitada", [
      ["Nº de cita", appointmentId || "—"],
      ["Fecha", appointmentDate],
      ["Hora", appointmentTime],
      ["Modalidad", consultaType],
    ])}
    
    ${descripcion ? infoBox(`
      <strong>📝 Motivo de consulta:</strong><br/>
      ${descripcion}
    `, "warning") : ""}
    
    ${infoBox(`
      <strong>⚡ Acciones requeridas:</strong>
      <ul style="margin: 8px 0 0; padding-left: 20px;">
        <li>Revisá tu agenda para confirmar disponibilidad</li>
        <li>Confirmá o reprogramá la cita desde tu panel</li>
        <li>El paciente recibirá un correo automático al confirmar</li>
      </ul>
    `, "info")}
    
    ${ctaButton("Ir a mi agenda", `${APP_URL}/admin/schedule`, BRAND.primary)}
    
    <p style="margin: 24px 0 0; color: ${BRAND.textMuted}; font-size: 13px; line-height: 1.5; text-align: center;">
      También podés contactar al paciente directamente por teléfono o WhatsApp.
    </p>
  `;

  const html = emailLayout({
    title: "Nueva Solicitud de Cita",
    preheader: `${patientName} quiere reservar una cita para el ${appointmentDate}.`,
    body,
  });

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Salud Libre <noreply@email.jhernandez.mx>",
      to: [doctorEmail],
      subject: `🔔 ${patientName} solicita una cita — ${appointmentDate}`,
      html,
    });
    console.log(`Doctor notification email sent to ${doctorEmail}`);
  } catch (error) {
    console.error("Error sending doctor notification email:", error);
    throw error;
  }
}
