import { createSubscription, createPayment } from '../../../lib/subscriptionsService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { planId, planName, price, userId, userEmail } = req.body;

    // Validar datos requeridos
    if (!planId || !planName || !price || !userId || !userEmail) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['planId', 'planName', 'price', 'userId', 'userEmail']
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validar precio
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({ message: 'Invalid price value' });
    }

    // Validar configuración de MercadoPago
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      return res.status(500).json({ message: 'MercadoPago access token not configured' });
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      return res.status(500).json({ message: 'App URL not configured' });
    }

    // Crear la preferencia usando la API REST de MercadoPago
    const preference = {
      items: [
        {
          title: `Suscripción ${planName}`,
          unit_price: numericPrice,
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
      external_reference: `sub_${Date.now()}`,
      statement_descriptor: 'SALUDLIBRE',
    };

    console.log('Creating MercadoPago preference with data:', {
      preference,
      tokenInfo: {
        hasToken: !!process.env.MERCADOPAGO_ACCESS_TOKEN,
        tokenPrefix: process.env.MERCADOPAGO_ACCESS_TOKEN?.substring(0, 15) + '...',
        tokenSuffix: '...' + process.env.MERCADOPAGO_ACCESS_TOKEN?.substring(process.env.MERCADOPAGO_ACCESS_TOKEN.length - 15),
        appUrl: process.env.NEXT_PUBLIC_APP_URL
      }
    });

    // Llamar a la API de MercadoPago directamente
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preference),
    });

    console.log('MercadoPago API Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('MercadoPago API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        preference: preference,
        requestHeaders: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN?.substring(0, 15)}...`,
        }
      });
      throw new Error(`MercadoPago API Error: ${response.status} - ${JSON.stringify(errorData)}`);
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
