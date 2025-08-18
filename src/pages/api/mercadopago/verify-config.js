// API para verificar configuración de MercadoPago
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verificar variables de entorno
    const config = {
      hasAccessToken: !!process.env.MERCADOPAGO_ACCESS_TOKEN,
      hasPublicKey: !!process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY,
      hasWebhookSecret: !!process.env.MERCADOPAGO_WEBHOOK_SECRET,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      nodeEnv: process.env.NODE_ENV,
      tokenPrefix: process.env.MERCADOPAGO_ACCESS_TOKEN?.substring(0, 15) + '...',
      publicKeyPrefix: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY?.substring(0, 15) + '...',
    };

    // Verificar si las credenciales son de producción
    const isProduction = process.env.MERCADOPAGO_ACCESS_TOKEN?.startsWith('APP_USR-');
    const isPublicKeyProduction = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY?.startsWith('APP_USR-');

    // Probar conexión con MercadoPago
    let connectionTest = null;
    try {
      const response = await fetch('https://api.mercadopago.com/users/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        connectionTest = {
          success: true,
          userSiteId: userData.site_id,
          userCountryId: userData.country_id,
          userStatus: userData.status,
        };
      } else {
        connectionTest = {
          success: false,
          status: response.status,
          error: await response.text(),
        };
      }
    } catch (error) {
      connectionTest = {
        success: false,
        error: error.message,
      };
    }

    res.status(200).json({
      config,
      isProduction,
      isPublicKeyProduction,
      connectionTest,
      credentialsMatch: isProduction === isPublicKeyProduction,
    });

  } catch (error) {
    console.error('Error verifying MercadoPago config:', error);
    res.status(500).json({ 
      message: 'Error verifying configuration',
      error: error.message 
    });
  }
}
