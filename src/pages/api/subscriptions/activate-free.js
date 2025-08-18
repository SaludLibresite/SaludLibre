import { updateDoctor, upsertDoctor, getDoctorByUserId } from '../../../lib/doctorsService';
import { getActiveSubscriptionPlans } from '../../../lib/subscriptionsService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'UserId is required' });
    }

    // Obtener los planes activos para encontrar el plan gratuito
    const activePlans = await getActiveSubscriptionPlans();
    const freePlan = activePlans.find(plan => plan.price === 0 || plan.price === undefined);
    
    if (!freePlan) {
      return res.status(400).json({ message: 'Plan gratuito no disponible' });
    }

    console.log('Free plan found:', { id: freePlan.id, name: freePlan.name });

    // Intentar obtener el doctor (puede no existir)
    let doctor = null;
    try {
      doctor = await getDoctorByUserId(userId);
    } catch (error) {
      console.log('Doctor not found, will update with subscription info:', userId);
    }

    // Si el doctor existe, verificar que no tenga ya una suscripción activa
    if (doctor && doctor.subscriptionStatus === 'active' && doctor.subscriptionExpiresAt) {
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

    const subscriptionData = {
      subscriptionStatus: 'active',
      subscriptionPlan: freePlan.name,
      subscriptionPlanId: freePlan.id, // Usar el ID real del plan
      subscriptionExpiresAt: expiresAt,
      subscriptionActivatedAt: new Date(),
      lastPaymentAmount: 0,
      lastPaymentMethod: 'free',
      verified: true, // Activar verificación con plan gratuito
      updatedAt: new Date(),
    };

    let updatedDoctor = null;
    
    if (doctor) {
      // Si el doctor existe, actualizar usando su ID de documento
      await updateDoctor(doctor.id, subscriptionData);
      updatedDoctor = { ...doctor, ...subscriptionData };
    } else {
      // Si no existe, usar upsert con userId como ID del documento
      await upsertDoctor(userId, {
        userId: userId,
        ...subscriptionData
      });
      updatedDoctor = { id: userId, userId: userId, ...subscriptionData };
    }

    console.log(`✅ Free plan activated for user ${userId}${doctor ? ` (${doctor.nombre})` : ''}`);
    console.log('Updated doctor data:', updatedDoctor);

    res.status(200).json({ 
      message: 'Plan gratuito activado exitosamente',
      subscription: {
        status: 'active',
        plan: freePlan.name,
        planId: freePlan.id,
        expiresAt: expiresAt
      },
      doctorId: updatedDoctor.id
    });

  } catch (error) {
    console.error('Error activating free plan:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
}
