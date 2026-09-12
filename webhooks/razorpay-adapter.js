/**
 * Razorpay Webhook Adapter for NotifyPush
 * 
 * Converts Razorpay payments (payment.captured, payment.failed, order.paid)
 * into instant push notifications for Indian UPI / Cards / NetBanking.
 */

function transformRazorpayEvent(payload) {
  const event = payload.event || '';
  const payment = payload.payload?.payment?.entity || {};

  switch (event) {
    case 'payment.captured': {
      const amount = (payment.amount / 100).toFixed(2);
      const method = (payment.method || 'UPI').toUpperCase();
      const email = payment.email || payment.contact || 'User';
      return {
        title: `💳 Payment Received: ₹${amount}`,
        message: `Method: ${method}\nCustomer: ${email}\nPayment ID: ${payment.id}`,
        priority: 'high',
        tags: ['moneybag', 'white_check_mark', 'in'],
        clickUrl: `https://dashboard.razorpay.com/app/payments/${payment.id}`,
        actions: [
          { action: 'view', label: 'Open Razorpay', url: `https://dashboard.razorpay.com/app/payments/${payment.id}` }
        ]
      };
    }

    case 'payment.failed': {
      const amount = (payment.amount / 100).toFixed(2);
      const desc = payment.error_description || 'Transaction declined';
      return {
        title: `❌ Payment Failed: ₹${amount}`,
        message: `Reason: ${desc}\nPayer: ${payment.email || payment.contact}`,
        priority: 'urgent',
        tags: ['warning', 'x'],
        clickUrl: `https://dashboard.razorpay.com/app/payments/${payment.id}`
      };
    }

    default:
      return {
        title: `[Razorpay] ${event}`,
        message: `Payment ID: ${payment.id || 'N/A'}`,
        priority: 'default',
        tags: ['in']
      };
  }
}

module.exports = { transformRazorpayEvent };
