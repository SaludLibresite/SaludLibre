export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { paymentId } = req.query;

    if (!paymentId) {
      return res.status(400).json({ message: 'Payment ID is required' });
    }

    // Consultar el estado del pago en MercadoPago usando API REST
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      },
    });

    if (!response.ok) {
      return res.status(400).json({ message: 'Payment not found' });
    }

    const paymentStatus = await response.json();

    res.status(200).json({
      id: paymentStatus.id,
      status: paymentStatus.status,
      status_detail: paymentStatus.status_detail,
      transaction_amount: paymentStatus.transaction_amount,
      currency_id: paymentStatus.currency_id,
      date_approved: paymentStatus.date_approved,
      payment_method_id: paymentStatus.payment_method_id,
      external_reference: paymentStatus.external_reference,
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ 
      message: 'Error checking payment status',
      error: error.message 
    });
  }
}
