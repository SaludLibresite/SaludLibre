import { updateDoctor, getDoctorById } from '../../../lib/doctorsService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'UserId is required' });
    }

    // Verificar que el doctor existe
    const doctor = await getDoctorById(userId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Verificar que no tenga ya una suscripción activa
    if (doctor.subscriptionStatus === 'active' && doctor.subscriptionExpiresAt) {
      const expirationDate = doctor.subscriptionExpiresAt.toDate ? 
        doctor.subscriptionExpiresAt.toDate() : 
        new Date(doctor.subscriptionExpiresAt);
      
      if (expirationDate > new Date()) {
        return res.status(400).json({ 
          message: 'Ya tienes una suscripción activa' 
        });
      }
    }

    // Calcular fecha de expiración (30 días desde ahora)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Actualizar el doctor con el plan gratuito
    await updateDoctor(userId, {
      subscriptionStatus: 'active',
      subscriptionPlan: 'Plan Gratuito',
      subscriptionPlanId: 'plan_gratuito',
      subscriptionExpiresAt: expiresAt,
      subscriptionActivatedAt: new Date(),
      lastPaymentAmount: 0,
      lastPaymentMethod: 'free',
      verified: true, // Activar verificación con plan gratuito
      updatedAt: new Date(),
    });

    console.log(`✅ Free plan activated for doctor ${userId} (${doctor.nombre})`);

    res.status(200).json({ 
      message: 'Plan gratuito activado exitosamente',
      subscription: {
        status: 'active',
        plan: 'Plan Gratuito',
        expiresAt: expiresAt
      }
    });

  } catch (error) {
    console.error('Error activating free plan:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
}
