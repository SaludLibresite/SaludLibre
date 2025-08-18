import { manuallyActivateSubscription } from '../../../lib/subscriptionsService';
import { updateDoctor } from '../../../lib/doctorsService';

// Lista de emails autorizados como superadmin
const SUPERADMIN_EMAILS = ["juan@jhernandez.mx"];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { 
      userId, 
      planId, 
      planName, 
      price, 
      startDate, 
      endDate, 
      activatedBy 
    } = req.body;

    // Validar que el usuario que activa sea superadmin
    if (!SUPERADMIN_EMAILS.includes(activatedBy)) {
      return res.status(403).json({ message: 'Unauthorized: Not a superadmin' });
    }

    // Validar datos requeridos
    if (!userId || !planId || !planName || !price || !startDate || !endDate) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['userId', 'planId', 'planName', 'price', 'startDate', 'endDate']
      });
    }

    // Validar fechas
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      return res.status(400).json({ 
        message: 'End date must be after start date' 
      });
    }

    // Activar suscripción manualmente
    const subscription = await manuallyActivateSubscription(userId, {
      planId,
      planName,
      price: parseFloat(price),
      startDate: start,
      endDate: end,
      activatedBy,
    });

    // Actualizar perfil del doctor
    await updateDoctor(userId, {
      subscriptionStatus: 'active',
      subscriptionPlan: planName,
      subscriptionExpiresAt: end,
      updatedAt: new Date(),
    });

    res.status(200).json({
      message: 'Subscription activated successfully',
      subscription: {
        id: subscription.id,
        userId,
        planName,
        price,
        status: 'active',
        activatedAt: start,
        expiresAt: end,
        activationType: 'manual',
        activatedBy,
      }
    });

  } catch (error) {
    console.error('Error activating subscription manually:', error);
    res.status(500).json({ 
      message: 'Error activating subscription',
      error: error.message 
    });
  }
}
