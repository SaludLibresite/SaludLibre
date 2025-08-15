// Configuración de MercadoPago Checkout Pro
const MERCADOPAGO_CONFIG = {
  publicKey: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY,
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://tu-dominio.com' 
    : 'http://localhost:3000',
};

// Crear preferencia de pago para Checkout Pro
export const createPaymentPreference = async (subscriptionData) => {
  try {
    const response = await fetch('/api/mercadopago/create-preference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionData),
    });

    if (!response.ok) {
      throw new Error('Error creating payment preference');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating payment preference:', error);
    throw error;
  }
};

// Inicializar MercadoPago Checkout Pro
export const initMercadoPago = () => {
  if (typeof window !== 'undefined' && window.MercadoPago) {
    const mp = new window.MercadoPago(MERCADOPAGO_CONFIG.publicKey, {
      locale: 'es-AR'
    });
    return mp;
  }
  return null;
};

// Crear checkout usando Checkout Pro
export const createCheckout = async (preferenceId) => {
  const mp = initMercadoPago();
  if (!mp) {
    throw new Error('MercadoPago no está disponible');
  }

  try {
    const checkout = mp.checkout({
      preference: {
        id: preferenceId
      },
      autoOpen: true, // Se abre automáticamente
    });
    
    return checkout;
  } catch (error) {
    console.error('Error creating checkout:', error);
    throw error;
  }
};

// Verificar estado del pago
export const checkPaymentStatus = async (paymentId) => {
  try {
    const response = await fetch(`/api/mercadopago/payment-status/${paymentId}`);
    
    if (!response.ok) {
      throw new Error('Error checking payment status');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking payment status:', error);
    throw error;
  }
};

// Script para cargar MercadoPago SDK
export const loadMercadoPagoScript = () => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined') {
      if (window.MercadoPago) {
        resolve(window.MercadoPago);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.async = true;
      script.onload = () => {
        if (window.MercadoPago) {
          resolve(window.MercadoPago);
        } else {
          reject(new Error('MercadoPago SDK no se cargó correctamente'));
        }
      };
      script.onerror = () => reject(new Error('Error cargando MercadoPago SDK'));
      document.head.appendChild(script);
    } else {
      reject(new Error('Window no está disponible'));
    }
  });
};
