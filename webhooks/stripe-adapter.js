/**
 * Stripe Webhook Adapter for NotifyPush
 * 
 * Converts Stripe billing events (payment_intent.succeeded, invoice.payment_failed, etc.)
 * into instant formatted push alerts.
 */

function transformStripeEvent(event) {
  const type = event.type || '';
  const data = event.data?.object || {};

  switch (type) {
    case 'payment_intent.succeeded': {
      const amount = (data.amount / 100).toFixed(2);
      const currency = (data.currency || 'usd').toUpperCase();
      const customer = data.receipt_email || data.customer || 'Customer';
      return {
        title: `💳 Payment Received: ${currency} ${amount}`,
        message: `Payer: ${customer}\nPayment Intent: ${data.id}`,
        priority: 'high',
        tags: ['moneybag', 'credit_card', 'white_check_mark'],
        clickUrl: `https://dashboard.stripe.com/payments/${data.id}`,
        actions: [
          { action: 'view', label: 'View in Stripe', url: `https://dashboard.stripe.com/payments/${data.id}` }
        ]
      };
    }

    case 'invoice.payment_failed': {
      const amount = (data.amount_due / 100).toFixed(2);
      const currency = (data.currency || 'usd').toUpperCase();
      const customer = data.customer_email || data.customer || 'Customer';
      return {
        title: `🚨 Stripe Payment Failed: ${currency} ${amount}`,
        message: `Customer: ${customer}\nAttempt count: ${data.attempt_count || 1}. Action required.`,
        priority: 'urgent',
        tags: ['warning', 'fire', 'credit_card'],
        clickUrl: `https://dashboard.stripe.com/invoices/${data.id}`,
        actions: [
          { action: 'view', label: 'View Invoice', url: `https://dashboard.stripe.com/invoices/${data.id}` }
        ]
      };
    }

    case 'customer.subscription.deleted': {
      const plan = data.plan?.nickname || data.items?.data?.[0]?.price?.nickname || 'Pro Plan';
      return {
        title: `⚠️ Subscription Canceled: ${plan}`,
        message: `Customer: ${data.customer}\nStatus: Canceled`,
        priority: 'high',
        tags: ['x', 'disappointed'],
        clickUrl: `https://dashboard.stripe.com/subscriptions/${data.id}`
      };
    }

    case 'checkout.session.completed': {
      const amount = data.amount_total ? (data.amount_total / 100).toFixed(2) : '0.00';
      const currency = (data.currency || 'usd').toUpperCase();
      const email = data.customer_details?.email || 'Customer';
      return {
        title: `🎉 New Checkout Succeeded: ${currency} ${amount}`,
        message: `Customer: ${email}\nSession: ${data.id.slice(-8)}`,
        priority: 'high',
        tags: ['tada', 'shopping_bags'],
        clickUrl: `https://dashboard.stripe.com/payments/${data.payment_intent || ''}`
      };
    }

    default:
      return {
        title: `[Stripe] ${type}`,
        message: `Event ID: ${event.id}`,
        priority: 'default',
        tags: ['credit_card']
      };
  }
}

module.exports = { transformStripeEvent };
