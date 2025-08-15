import { createSubscription, createPayment } from '../../../lib/subscriptionsService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { planId, planName, price, userId, userEmail } = req.body;

    // Crear la preferencia usando la API REST de MercadoPago
    const preference = {
      items: [
        {
          title: `Suscripción ${planName}`,
          unit_price: parseFloat(price),
          quantity: 1,
          currency_id: 'ARS',
        }
      ],
      payer: {
        email: userEmail,
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/failure`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/pending`,
      },
      auto_return: 'approved',
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/mercadopago/webhook`,
      external_reference: `${userId}_${planId}_${Date.now()}`,
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
      payment_methods: {
        excluded_payment_types: [
          { id: 'ticket' }, // Excluir efectivo
        ],
        installments: 12, // Máximo 12 cuotas
      },
      statement_descriptor: 'MEDICOS-AR',
    };

    // Llamar a la API de MercadoPago directamente
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preference),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('MercadoPago API Error:', errorData);
      throw new Error(`MercadoPago API Error: ${response.status}`);
    }

    const preferenceData = await response.json();

    // Crear la suscripción en estado pending
    const subscriptionData = {
      userId,
      planId,
      planName,
      price: parseFloat(price),
      status: 'pending',
      paymentPreferenceId: preferenceData.id,
      externalReference: preference.external_reference,
      createdAt: new Date(),
    };

    const subscription = await createSubscription(subscriptionData);

    // Crear el registro de pago inicial
    const paymentData = {
      subscriptionId: subscription.id,
      userId,
      amount: parseFloat(price),
      currency: 'ARS',
      status: 'pending',
      paymentMethod: 'mercadopago',
      preferenceId: preferenceData.id,
      externalReference: preference.external_reference,
    };

    await createPayment(paymentData);

    res.status(200).json({
      preferenceId: preferenceData.id,
      initPoint: preferenceData.init_point,
      sandboxInitPoint: preferenceData.sandbox_init_point,
      subscriptionId: subscription.id,
    });

  } catch (error) {
    console.error('Error creating payment preference:', error);
    res.status(500).json({ 
      message: 'Error creating payment preference',
      error: error.message 
    });
  }
}
