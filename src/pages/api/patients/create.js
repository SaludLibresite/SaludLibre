import { adminAuth, adminDb } from "../../../lib/firebase-admin";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const { patientData, doctorId, doctorUserId } = req.body;

    if (!patientData || !doctorId || !doctorUserId) {
      return res.status(400).json({
        message:
          "Faltan campos requeridos: patientData, doctorId, doctorUserId",
      });
    }

    // Get doctor information
    const doctorDoc = await adminDb.collection("doctors").doc(doctorId).get();
    if (!doctorDoc.exists) {
      return res.status(404).json({ message: "Doctor no encontrado" });
    }
    
    const doctorData = doctorDoc.data();

    // Verify the doctor making the request
    try {
      await adminAuth.getUser(doctorUserId);
    } catch (error) {
      return res
        .status(401)
        .json({ message: "No autorizado: Doctor inválido" });
    }

    // Generate a temporary password for the patient
    const temporaryPassword = generateTemporaryPassword();

    // Create the user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email: patientData.email,
      password: temporaryPassword,
      displayName: patientData.name,
      emailVerified: false,
    });

    // Generate patient ID
    const patientId = `PAT-${Date.now().toString().slice(-6)}`;

    // Create doctors array with the creating doctor as primary
    const doctors = [
      {
        doctorId: doctorId,
        doctorUserId: doctorUserId,
        doctorName: doctorData.nombre,
        doctorSpecialty: doctorData.especialidad,
        assignedAt: new Date(),
        isPrimary: true,
      },
    ];

    // Prepare patient data for Firestore
    const patientFirestoreData = {
      ...patientData,
      patientId: patientId,
      userId: userRecord.uid,
      doctors: doctors,
      // Keep legacy fields for backward compatibility
      doctorId: doctorId,
      doctorUserId: doctorUserId,
      doctorName: doctorData.nombre,
      userType: "patient",
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      temporaryPassword: true, // Flag to force password change on first login
    };

    // Save patient data to Firestore
    const patientRef = await adminDb
      .collection("patients")
      .add(patientFirestoreData);

    // Send welcome email to patient
    await sendWelcomeEmail({
      patientName: patientData.name,
      patientEmail: patientData.email,
      temporaryPassword: temporaryPassword,
      doctorName: doctorData.nombre,
    });

    res.status(201).json({
      success: true,
      patientId: patientId,
      userId: userRecord.uid,
      temporaryPassword: temporaryPassword,
      message: "Paciente creado exitosamente y correo de bienvenida enviado",
    });
  } catch (error) {
    console.error("Error creating patient:", error);

    // If there was an error, try to clean up any created user
    if (error.userRecord?.uid) {
      try {
        await adminAuth.deleteUser(error.userRecord.uid);
      } catch (cleanupError) {
        console.error("Error cleaning up user:", cleanupError);
      }
    }

    // Translate Firebase errors to Spanish
    let errorMessage = "Error al crear paciente";

    if (error.code) {
      switch (error.code) {
        case "auth/email-already-exists":
          errorMessage = "Ya existe una cuenta con este correo electrónico";
          break;
        case "auth/invalid-email":
          errorMessage = "El correo electrónico no es válido";
          break;
        case "auth/weak-password":
          errorMessage = "La contraseña es muy débil";
          break;
        default:
          errorMessage = error.message || "Error al crear paciente";
      }
    } else if (
      error.message &&
      error.message.includes("email address is already in use")
    ) {
      errorMessage = "Ya existe una cuenta con este correo electrónico";
    } else {
      errorMessage = error.message || "Error al crear paciente";
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
}

// Helper function to generate temporary password
function generateTemporaryPassword() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Helper function to send welcome email
async function sendWelcomeEmail({
  patientName,
  patientEmail,
  temporaryPassword,
  doctorName,
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
          .credentials { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .button { display: inline-block; background: linear-gradient(135deg, #f59e0b, #eab308); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
          .warning { background: #fef2f2; border: 1px solid #f87171; border-radius: 8px; padding: 15px; margin: 20px 0; color: #dc2626; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>¡Bienvenido a Salud Libre!</h1>
          <p>Su cuenta de paciente ha sido creada exitosamente</p>
        </div>
        
        <div class="content">
          <h2>Hola ${patientName},</h2>
          
          <p>Su doctor <strong>${doctorName}</strong> ha creado una cuenta para usted en nuestro sistema Salud Libre. Ahora podrá acceder a sus citas, historial médico, recetas y mucho más desde nuestro portal de pacientes.</p>
          
          <div class="credentials">
            <h3>📧 Sus credenciales de acceso:</h3>
            <p><strong>Email:</strong> ${patientEmail}</p>
            <p><strong>Contraseña temporal:</strong> <code style="background: #374151; color: #f9fafb; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${temporaryPassword}</code></p>
          </div>
          
          <div class="warning">
            <h4>⚠️ Importante:</h4>
            <p>Por su seguridad, deberá cambiar esta contraseña temporal en su primer inicio de sesión.</p>
          </div>
          
          <h3>🩺 ¿Qué puede hacer con su cuenta?</h3>
          <ul>
            <li>Ver y programar citas médicas</li>
            <li>Acceder a su historial médico</li>
            <li>Descargar recetas digitales</li>
            <li>Comunicarse con su doctor</li>
            <li>Gestionar sus datos personales</li>
          </ul>
          
          <a href="${
            process.env.NEXT_PUBLIC_APP_URL || "https://medicos-ar.vercel.app"
          }/paciente/login" class="button">
            Iniciar Sesión Ahora
          </a>
          
          <h3>📞 ¿Necesita ayuda?</h3>
          <p>Si tiene alguna pregunta o problema para acceder a su cuenta, no dude en contactar directamente con ${doctorName} o nuestro equipo de soporte.</p>
        </div>
        
        <div class="footer">
          <p>Este correo fue enviado desde <strong>Salud Libre</strong></p>
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
        "Salud Libre <noreply@email.jhernandez.mx>",
      to: [patientEmail],
      subject: `¡Bienvenido a Salud Libre! - Cuenta creada por ${doctorName}`,
      html: emailHtml,
    });

    console.log(`Welcome email sent successfully to ${patientEmail}`);
  } catch (error) {
    console.error("Error sending welcome email:", error);
    // Don't throw error here as patient was already created successfully
  }
}
