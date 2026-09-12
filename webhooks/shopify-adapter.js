/**
 * Shopify Webhook Adapter for NotifyPush
 * 
 * Converts Shopify orders/create, orders/fulfilled, and app events into push alerts.
 */

function transformShopifyEvent(headers, order) {
  const topic = headers['x-shopify-topic'] || 'orders/create';

  switch (topic) {
    case 'orders/create':
    case 'orders/paid': {
      const orderNumber = order.order_number || order.name || 'New';
      const totalPrice = order.total_price || '0.00';
      const currency = order.currency || 'USD';
      const customer = order.customer ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() : (order.email || 'Customer');
      const itemCount = order.line_items ? order.line_items.length : 1;

      return {
        title: `🛍️ New Order #${orderNumber}: ${currency} ${totalPrice}`,
        message: `Customer: ${customer}\nItems: ${itemCount} item(s)\nStatus: ${order.financial_status || 'paid'}`,
        priority: 'high',
        tags: ['shopping_bags', 'package', 'dollar'],
        clickUrl: order.admin_graphql_api_id ? `https://admin.shopify.com` : null,
        actions: [
          { action: 'view', label: 'View in Shopify', url: 'https://admin.shopify.com' }
        ]
      };
    }

    case 'orders/fulfilled': {
      return {
        title: `📦 Order #${order.order_number || ''} Fulfilled`,
        message: `Shipment confirmed for ${order.email || 'customer'}`,
        priority: 'default',
        tags: ['package', 'truck']
      };
    }

    default:
      return {
        title: `[Shopify] ${topic}`,
        message: `Order ID: ${order.id || 'N/A'}`,
        priority: 'default',
        tags: ['shopping_bags']
      };
  }
}

module.exports = { transformShopifyEvent };
