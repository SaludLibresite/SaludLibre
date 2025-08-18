import { updateSubscription, getUserSubscription } from '../../../lib/subscriptionsService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    // Validar datos requeridos
    if (!userId) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['userId']
      });
    }

    // Obtener la suscripción actual
    const currentSubscription = await getUserSubscription(userId);
    
    if (!currentSubscription) {
      return res.status(404).json({ 
        message: 'No se encontró una suscripción activa' 
      });
    }

    // Solo renovar planes gratuitos
    if (currentSubscription.price !== 0) {
      return res.status(400).json({ 
        message: 'Solo se pueden renovar planes gratuitos automáticamente' 
      });
    }

    // Renovar por 30 días más
    const newExpiryDate = new Date();
    newExpiryDate.setDate(newExpiryDate.getDate() + 30);

    const updatedSubscription = await updateSubscription(currentSubscription.id, {
      expiresAt: newExpiryDate,
      status: 'active',
      renewedAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: 'Plan gratuito renovado por 30 días más',
      subscription: updatedSubscription,
      expiresAt: newExpiryDate
    });

  } catch (error) {
    console.error('Error renewing free subscription:', error);
    res.status(500).json({ 
      message: 'Error renewing subscription',
      error: error.message 
    });
  }
}
