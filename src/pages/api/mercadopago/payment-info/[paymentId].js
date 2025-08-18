// API endpoint para obtener información de un pago desde MercadoPago
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { paymentId } = req.query;

    if (!paymentId) {
      return res.status(400).json({ message: 'Payment ID is required' });
    }

    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      return res.status(500).json({ message: 'MercadoPago access token not configured' });
    }

    console.log('Fetching payment info for ID:', paymentId);

    // Obtener información del pago desde MercadoPago
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('MercadoPago API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      return res.status(response.status).json({ 
        message: 'Error fetching payment from MercadoPago',
        error: errorData
      });
    }

    const paymentInfo = await response.json();

    console.log('Payment info retrieved:', {
      id: paymentInfo.id,
      status: paymentInfo.status,
      status_detail: paymentInfo.status_detail,
      transaction_amount: paymentInfo.transaction_amount,
      payment_method_id: paymentInfo.payment_method_id,
      preference_id: paymentInfo.preference_id,
      date_approved: paymentInfo.date_approved
    });

    // Devolver la información del pago
    res.status(200).json(paymentInfo);

  } catch (error) {
    console.error('Error fetching payment info:', error);
    res.status(500).json({ 
      message: 'Error fetching payment info',
      error: error.message 
    });
  }
}
