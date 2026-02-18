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
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: "Falta el ID de la cita",
      });
    }

    // Get appointment data from Firestore
    const appointmentDoc = await adminDb.collection("appointments").doc(appointmentId).get();
    
    if (!appointmentDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Cita no encontrada",
      });
    }

    const appointment = appointmentDoc.data();

    // Get patient email - from appointment data or patient record
    let patientName = appointment.nombre || appointment.patientName;
    let patientEmail = appointment.email || appointment.patientEmail;

    // If we have a patientId, try to get more complete data from patients collection
    if (appointment.patientId) {
      try {
        const patientDoc = await adminDb.collection("patients").doc(appointment.patientId).get();
        if (patientDoc.exists) {
          const patientData = patientDoc.data();
          patientName = patientName || patientData.name;
          patientEmail = patientEmail || patientData.email;
        }
      } catch (error) {
        console.error("Error fetching patient data:", error);
      }
    }

    // Get doctor data
    let doctorName = appointment.doctorName;
    let doctorData = null;

    if (appointment.doctorId) {
      try {
        const doctorDoc = await adminDb.collection("doctors").doc(appointment.doctorId).get();
        if (doctorDoc.exists) {
          doctorData = doctorDoc.data();
          doctorName = doctorName || doctorData.nombre;
        }
      } catch (error) {
        console.error("Error fetching doctor data:", error);
      }
    }

    if (!patientEmail) {
      return res.status(400).json({
        success: false,
        message: "No se encontró el email del paciente",
      });
    }

    // Parse appointment date
    let appointmentDate;
    if (appointment.date?.toDate) {
      appointmentDate = formatDate(appointment.date.toDate().toISOString());
    } else if (appointment.fecha) {
      appointmentDate = formatDate(appointment.fecha);
    } else {
      appointmentDate = formatDate(appointment.date);
    }

    const appointmentTime = appointment.hora || appointment.time || "Horario por confirmar";
    const consultaType = appointment.tipoConsulta === "virtual" ? "Virtual" : "Presencial";

    // Send confirmed email to patient
    await sendPatientConfirmedEmail({
      patientName,
      patientEmail,
      doctorName: doctorName || "Tu médico",
      appointmentDate,
      appointmentTime,
      consultaType,
      appointmentRef: appointment.appointmentId || appointmentId,
      doctorAddress: doctorData?.direccion,
      doctorPhone: doctorData?.telefono,
      doctorSpecialty: doctorData?.especialidad,
    });

    res.status(200).json({
      success: true,
      message: "Correo de confirmación enviado al paciente",
    });
  } catch (error) {
    console.error("Error sending confirmed email:", error);
    res.status(500).json({
      success: false,
      message: "Error al enviar correo de confirmación",
      error: error.message,
    });
  }
}

// ─── Email to Patient: Appointment Confirmed by Doctor ──────────────────────

async function sendPatientConfirmedEmail({
  patientName,
  patientEmail,
  doctorName,
  appointmentDate,
  appointmentTime,
  consultaType,
  appointmentRef,
  doctorAddress,
  doctorPhone,
  doctorSpecialty,
}) {
  const body = `
    <p style="margin: 0 0 16px; color: ${BRAND.textDark}; font-size: 16px; line-height: 1.6;">
      Hola <strong>${patientName}</strong>,
    </p>
    <p style="margin: 0 0 20px; color: ${BRAND.textDark}; font-size: 15px; line-height: 1.6;">
      ¡Buenas noticias! Tu cita médica ha sido <strong>confirmada</strong> por ${doctorName}. Te esperamos en la fecha y hora indicadas.
    </p>
    
    <p style="margin: 0 0 8px; color: ${BRAND.textMuted}; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Estado</p>
    ${statusBadge("✅ Cita Confirmada", "#d1fae5", "#065f46")}
    
    ${detailCard("📋 Detalles de tu cita confirmada", [
      ["Nº de cita", appointmentRef || "—"],
      ["Profesional", doctorName],
      ["Especialidad", doctorSpecialty],
      ["Fecha", appointmentDate],
      ["Hora", appointmentTime],
      ["Modalidad", consultaType],
      ["Dirección", consultaType === "Presencial" ? doctorAddress : null],
      ["Teléfono", doctorPhone],
    ])}
    
    ${consultaType === "Presencial" ? infoBox(`
      <strong>📍 Recordá para tu visita:</strong>
      <ul style="margin: 8px 0 0; padding-left: 20px;">
        <li>Llegá con 10 minutos de anticipación</li>
        <li>Traé tu documento de identidad</li>
        <li>Si tenés estudios previos, llevalos a la consulta</li>
        ${doctorAddress ? `<li>Dirección: <strong>${doctorAddress}</strong></li>` : ""}
      </ul>
    `, "success") : infoBox(`
      <strong>💻 Consulta Virtual:</strong>
      <ul style="margin: 8px 0 0; padding-left: 20px;">
        <li>Conectate unos minutos antes de la hora programada</li>
        <li>Asegurate de tener buena conexión a internet</li>
        <li>Buscá un lugar tranquilo y bien iluminado</li>
        <li>El enlace de videollamada estará disponible en tu panel</li>
      </ul>
    `, "success")}
    
    ${ctaButton("Ver mi cita", `${APP_URL}/paciente/mis-citas`)}
    
    <p style="margin: 24px 0 0; color: ${BRAND.textMuted}; font-size: 13px; line-height: 1.5; text-align: center;">
      Si necesitás cancelar o reprogramar, contactá al consultorio de ${doctorName}${doctorPhone ? ` al ${doctorPhone}` : ""}.
    </p>
  `;

  const html = emailLayout({
    title: "¡Tu Cita fue Confirmada!",
    preheader: `${doctorName} confirmó tu cita para el ${appointmentDate} a las ${appointmentTime}.`,
    body,
  });

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Salud Libre <noreply@email.jhernandez.mx>",
      to: [patientEmail],
      subject: `✅ ¡Cita confirmada con ${doctorName}! — ${appointmentDate}`,
      html,
    });
    console.log(`Confirmed email sent to ${patientEmail}`);
  } catch (error) {
    console.error("Error sending confirmed email:", error);
    throw error;
  }
}
