import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const { patientName, patientEmail, doctorName } = req.body;

    if (!patientName || !patientEmail) {
      return res.status(400).json({
        message: "Faltan campos requeridos: patientName, patientEmail",
      });
    }

    // Send welcome email for self-registration
    await sendPatientWelcomeEmail({
      patientName,
      patientEmail,
      doctorName,
    });

    res.status(200).json({
      success: true,
      message: "Email de bienvenida enviado exitosamente",
    });
  } catch (error) {
    console.error("Error sending welcome email:", error);
    res.status(500).json({
      success: false,
      message: "Error al enviar el email de bienvenida",
    });
  }
}

// Helper function to send welcome email for self-registered patients
async function sendPatientWelcomeEmail({
  patientName,
  patientEmail,
  doctorName = "nuestro equipo médico"
}) {
  try {
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenido a Salud Libre</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b, #eab308); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; color: #6b7280; }
          .button { display: inline-block; background: linear-gradient(135deg, #f59e0b, #eab308); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
          .features { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .features h3 { color: #0c4a6e; margin-top: 0; }
          .features ul { color: #0369a1; margin: 10px 0; }
          .features li { margin-bottom: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>¡Bienvenido a Salud Libre!</h1>
          <p>Su cuenta de paciente ha sido creada exitosamente</p>
        </div>

        <div class="content">
          <h2>Hola ${patientName},</h2>

          <p>¡Felicitaciones! Su registro en <strong>MédicsAR</strong> ha sido completado exitosamente. Ahora forma parte de nuestra plataforma médica integral.</p>

          <div class="features">
            <h3>🩺 ¿Qué puede hacer con su cuenta?</h3>
            <ul>
              <li>Buscar y agendar citas con especialistas</li>
              <li>Gestionar su historial médico personal</li>
              <li>Acceder a recetas digitales</li>
              <li>Comunicarse directamente con sus doctores</li>
              <li>Actualizar su información personal y médica</li>
              <li>Recibir recordatorios de citas</li>
            </ul>
          </div>

          <p>Para comenzar a utilizar nuestros servicios, simplemente inicie sesión con su email y contraseña.</p>

          <a href="${
            process.env.NEXT_PUBLIC_APP_URL || "https://medicos-ar.vercel.app"
          }/paciente/login" class="button">
            Iniciar Sesión Ahora
          </a>

          <h3>📞 ¿Necesita ayuda?</h3>
          <p>Si tiene alguna pregunta o necesita asistencia, no dude en contactarnos:</p>
          <ul>
            <li>Visite nuestra sección de <a href="${
              process.env.NEXT_PUBLIC_APP_URL || "https://medicos-ar.vercel.app"
            }/preguntas-frecuentes">Preguntas Frecuentes</a></li>
            <li>Contacte directamente con ${doctorName} si ya tiene un doctor asignado</li>
          </ul>
        </div>

        <div class="footer">
          <p>Este correo fue enviado desde <strong>MédicsAR</strong></p>
          <p>Si recibió este correo por error, puede ignorarlo de manera segura.</p>
          <p style="margin-top: 10px; font-size: 12px;">
            <a href="${
              process.env.NEXT_PUBLIC_APP_URL || "https://medicos-ar.vercel.app"
            }" style="color: #f59e0b;">medicos-ar.vercel.app</a>
          </p>
        </div>
      </body>
      </html>
    `;

    await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL ||
        "MédicsAR <noreply@email.jhernandez.mx>",
      to: [patientEmail],
      subject: `¡Bienvenido a Salud Libre! - Registro completado`,
      html: emailHtml,
    });

    console.log(`Welcome email sent successfully to ${patientEmail}`);
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw error;
  }
}
