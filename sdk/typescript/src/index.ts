import { ClientConfig, SendOptions, DispatchResult } from './types';
export * from './types';
export * from './crypto';

function encodeHeaderValue(value: string): string {
  if (/[^\x00-\x7F]/.test(value)) {
    if (typeof Buffer !== 'undefined') {
      return `=?utf-8?B?${Buffer.from(value, 'utf-8').toString('base64')}?=`;
    }
    try {
      return `=?utf-8?B?${btoa(unescape(encodeURIComponent(value)))}?=`;
    } catch {
      return value;
    }
  }
  return value;
}

export class NotifyPushClient {
  private serverUrl: string;
  private defaultTopic: string;
  private token?: string;
  private defaultTimeout: number;

  constructor(config?: ClientConfig) {
    const envServer = typeof process !== 'undefined' ? process.env?.NOTIFY_SERVER || process.env?.NTFY_SERVER : undefined;
    const envTopic = typeof process !== 'undefined' ? process.env?.NOTIFY_TOPIC || process.env?.NTFY_TOPIC : undefined;
    const envToken = typeof process !== 'undefined' ? process.env?.NOTIFY_TOKEN || process.env?.NTFY_TOKEN : undefined;

    this.serverUrl = (config?.serverUrl || envServer || 'https://ntfy.sh').replace(/\/+$/, '');
    this.defaultTopic = config?.defaultTopic || envTopic || '';
    this.token = config?.token || envToken;
    this.defaultTimeout = config?.timeoutMs ?? 4500;
  }

  /**
   * Dispatches a push notification alert.
   * Resilient by design: never throws unhandled exceptions that could crash host application.
   */
  async send(options: SendOptions): Promise<DispatchResult> {
    const topic = options.topic || this.defaultTopic;
    const server = (options.serverUrl || this.serverUrl).replace(/\/+$/, '');
    const token = options.token || this.token;
    const timeoutMs = options.timeoutMs ?? this.defaultTimeout;

    if (!topic) {
      return { success: false, error: 'NotifyPush Error: No topic configured.' };
    }

    const headers: Record<string, string> = {
      'Title': encodeHeaderValue(options.title),
      'Priority': options.priority || 'default',
      'Content-Type': 'text/plain; charset=utf-8'
    };

    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (options.tags && options.tags.length > 0) headers['Tags'] = options.tags.join(',');
    if (options.clickUrl) headers['Click'] = options.clickUrl;
    if (options.delay) headers['Delay'] = options.delay;

    if (options.actions && options.actions.length > 0) {
      headers['Actions'] = options.actions.map(act => {
        const parts = [`action=${act.action}`, `label=${act.label}`];
        if (act.url) parts.push(`url=${act.url}`);
        if (act.method) parts.push(`method=${act.method}`);
        if (act.body) parts.push(`body=${act.body}`);
        if (act.clear) parts.push('clear=true');
        return parts.join(', ');
      }).join('; ');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${server}/${encodeURIComponent(topic)}`, {
        method: 'POST',
        headers,
        body: options.message,
        signal: controller.signal
      });
      clearTimeout(timer);

      if (!response.ok) {
        const bodyText = await response.text().catch(() => response.statusText);
        return {
          success: false,
          statusCode: response.status,
          error: `HTTP ${response.status}: ${bodyText}`
        };
      }

      const resJson = await response.json().catch(() => ({}));
      return {
        success: true,
        statusCode: response.status,
        id: resJson.id
      };
    } catch (err: any) {
      clearTimeout(timer);
      const isTimeout = err.name === 'AbortError';
      const msg = isTimeout ? `Request timed out after ${timeoutMs}ms` : (err.message || 'Network error');
      return {
        success: false,
        error: msg
      };
    }
  }
}

export const notify = new NotifyPushClient();
export default NotifyPushClient;
