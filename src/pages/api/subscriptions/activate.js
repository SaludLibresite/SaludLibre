import { updateSubscription } from '../../../lib/subscriptionsService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { subscriptionId, userId } = req.body;

    // Validar datos requeridos
    if (!subscriptionId || !userId) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['subscriptionId', 'userId']
      });
    }

    // Activar la suscripción
    const updatedSubscription = await updateSubscription(subscriptionId, {
      status: 'active',
      activatedAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: 'Suscripción activada exitosamente',
      subscription: updatedSubscription
    });

  } catch (error) {
    console.error('Error activating subscription:', error);
    res.status(500).json({ 
      message: 'Error activating subscription',
      error: error.message 
    });
  }
}
