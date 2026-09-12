/**
 * NotifyPush Cloudflare Worker Gateway
 * 
 * Deploy on Cloudflare Workers (Free 100,000 requests/day).
 * Accepts inbound webhooks at:
 * POST https://your-worker.workers.dev/:provider/:topic
 * Example: POST /github/my-gh-alerts-9901
 * Example: POST /stripe/store-sales-8812
 */

import { transformGitHubEvent } from './github-adapter.js';
import { transformStripeEvent } from './stripe-adapter.js';
import { transformRazorpayEvent } from './razorpay-adapter.js';
import { transformShopifyEvent } from './shopify-adapter.js';

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('NotifyPush Webhook Gateway - Send POST request.', { status: 200 });
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    if (pathParts.length < 2) {
      return new Response('Format: /:provider/:topic (e.g. /github/my-topic)', { status: 400 });
    }

    const [provider, topic] = pathParts;
    const headers = Object.fromEntries(request.headers.entries());

    let payload;
    try {
      payload = await request.json();
    } catch (e) {
      payload = {};
    }

    let alert = null;
    if (provider === 'github') {
      alert = transformGitHubEvent(headers, payload);
    } else if (provider === 'stripe') {
      alert = transformStripeEvent(payload);
    } else if (provider === 'razorpay') {
      alert = transformRazorpayEvent(payload);
    } else if (provider === 'shopify') {
      alert = transformShopifyEvent(headers, payload);
    }

    if (!alert) {
      return new Response('Event ignored or empty.', { status: 200 });
    }

    // Dispatch to ntfy server
    const serverUrl = env.NOTIFY_SERVER || 'https://ntfy.sh';
    const postUrl = `${serverUrl}/${encodeURIComponent(topic)}`;

    const dispatchHeaders = {
      'Title': alert.title,
      'Priority': alert.priority || 'default',
      'Tags': Array.isArray(alert.tags) ? alert.tags.join(',') : (alert.tags || '')
    };

    if (alert.clickUrl) dispatchHeaders['Click'] = alert.clickUrl;
    if (alert.actions && Array.isArray(alert.actions)) {
      dispatchHeaders['Actions'] = alert.actions.map(a => `action=${a.action}, label=${a.label}, url=${a.url}`).join('; ');
    }

    const res = await fetch(postUrl, {
      method: 'POST',
      headers: dispatchHeaders,
      body: alert.message
    });

    return new Response(JSON.stringify({ success: res.ok, status: res.status }), {
      status: res.ok ? 200 : 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
