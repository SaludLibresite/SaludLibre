import { getUserSubscription } from '../../../../lib/subscriptionsService';
import { getDoctorById } from '../../../../lib/doctorsService';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'UserId is required' });
    }

    // Obtener datos del usuario
    const subscription = await getUserSubscription(userId);
    const doctor = await getDoctorById(userId);

    res.status(200).json({
      userId,
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        planName: subscription.planName,
        price: subscription.price,
        expiresAt: subscription.expiresAt,
        createdAt: subscription.createdAt,
        paymentPreferenceId: subscription.paymentPreferenceId
      } : null,
      doctor: doctor ? {
        subscriptionStatus: doctor.subscriptionStatus,
        subscriptionPlan: doctor.subscriptionPlan,
        subscriptionExpiresAt: doctor.subscriptionExpiresAt
      } : null
    });

  } catch (error) {
    console.error('Error checking user status:', error);
    res.status(500).json({ 
      message: 'Error checking user status',
      error: error.message 
    });
  }
}
