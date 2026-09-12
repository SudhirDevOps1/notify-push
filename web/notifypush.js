/**
 * NotifyPush Universal Web Client
 * Lightweight, zero-dependency browser and Node.js client for instant real-time push alerts.
 * Features built-in AES-256-GCM Zero-Knowledge End-to-End Encryption (E2EE).
 * Works in vanilla HTML, React, Vue, Next.js, WordPress, Shopify, Node.js, etc.
 * 
 * Usage:
 *   <script src="notifypush.js"></script>
 *   <script>
 *     // Simple usage
 *     NotifyPush.send({
 *       topic: 'my-website-alerts',
 *       title: 'New Contact Form Message 📩',
 *       message: 'User John Doe submitted the contact form.',
 *       password: 'my-e2ee-secret-passphrase' // Optional: Zero-Knowledge AES-256-GCM E2EE
 *     });
 * 
 *     // Or with instance configuration
 *     const notify = new NotifyPush({
 *       topic: 'my-website-alerts',
 *       password: 'my-e2ee-secret-passphrase'
 *     });
 *     notify.send({ title: 'Lead 🚀', message: 'Ready to convert!' });
 *   </script>
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NotifyPush = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DEFAULT_SERVER = 'https://ntfy.sh';

  /**
   * Helper: Convert ArrayBuffer / Uint8Array to Base64
   */
  function bufferToBase64(buf) {
    var bytes = new Uint8Array(buf);
    var binary = '';
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    if (typeof btoa === 'function') {
      return btoa(binary);
    } else if (typeof Buffer !== 'undefined') {
      return Buffer.from(binary, 'binary').toString('base64');
    }
    throw new Error('No base64 encoder available in environment');
  }

  /**
   * Helper: Convert Base64 to Uint8Array
   */
  function base64ToBuffer(b64) {
    if (typeof atob === 'function') {
      var binary = atob(b64);
      var bytes = new Uint8Array(binary.length);
      for (var i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    } else if (typeof Buffer !== 'undefined') {
      return new Uint8Array(Buffer.from(b64, 'base64'));
    }
    throw new Error('No base64 decoder available in environment');
  }

  /**
   * Encrypt payload using standard AES-256-GCM with SHA-256 key derivation.
   * Compatible with Android (E2eeHelper.kt) and Desktop (desktop/crypto.js).
   */
  async function encryptE2ee(payloadObj, passphrase) {
    var textEncoder = new TextEncoder();
    var passBytes = textEncoder.encode(passphrase);

    // 1. Browser / Node Web Crypto API
    var subtle = (typeof crypto !== 'undefined' && crypto.subtle) ||
                 (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle);

    if (subtle) {
      var keyDigest = await subtle.digest('SHA-256', passBytes);
      var cryptoKey = await subtle.importKey('raw', keyDigest, { name: 'AES-GCM' }, false, ['encrypt']);

      var iv = new Uint8Array(12);
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(iv);
      } else if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.getRandomValues) {
        globalThis.crypto.getRandomValues(iv);
      } else {
        throw new Error('Cryptographically secure RNG not available');
      }

      var plainBytes = textEncoder.encode(JSON.stringify(payloadObj));
      var cipherBuffer = await subtle.encrypt(
        { name: 'AES-GCM', iv: iv, tagLength: 128 },
        cryptoKey,
        plainBytes
      );

      return JSON.stringify({
        _e2e: 1,
        iv: bufferToBase64(iv),
        data: bufferToBase64(cipherBuffer)
      });
    }

    // 2. Node.js native crypto fallback
    try {
      var nodeCrypto = require('crypto');
      var key = nodeCrypto.createHash('sha256').update(passphrase, 'utf8').digest();
      var nodeIv = nodeCrypto.randomBytes(12);
      var cipher = nodeCrypto.createCipheriv('aes-256-gcm', key, nodeIv);
      var ciphertext = Buffer.concat([
        cipher.update(JSON.stringify(payloadObj), 'utf8'),
        cipher.final()
      ]);
      var authTag = cipher.getAuthTag();
      var fullData = Buffer.concat([ciphertext, authTag]);

      return JSON.stringify({
        _e2e: 1,
        iv: nodeIv.toString('base64'),
        data: fullData.toString('base64')
      });
    } catch (e) {
      throw new Error('E2EE encryption unavailable: Web Crypto API or Node crypto module required');
    }
  }

  /**
   * Decrypt E2EE payload using standard AES-256-GCM.
   */
  async function decryptE2ee(envelopeJson, passphrase) {
    var envelope = typeof envelopeJson === 'string' ? JSON.parse(envelopeJson) : envelopeJson;
    if (!envelope || envelope._e2e !== 1 || !envelope.iv || !envelope.data) return null;

    var textEncoder = new TextEncoder();
    var passBytes = textEncoder.encode(passphrase);
    var ivBytes = base64ToBuffer(envelope.iv);
    var dataBytes = base64ToBuffer(envelope.data);

    var subtle = (typeof crypto !== 'undefined' && crypto.subtle) ||
                 (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle);

    if (subtle) {
      try {
        var keyDigest = await subtle.digest('SHA-256', passBytes);
        var cryptoKey = await subtle.importKey('raw', keyDigest, { name: 'AES-GCM' }, false, ['decrypt']);
        var decryptedBuffer = await subtle.decrypt(
          { name: 'AES-GCM', iv: ivBytes, tagLength: 128 },
          cryptoKey,
          dataBytes
        );
        var decryptedStr = new TextDecoder().decode(decryptedBuffer);
        return JSON.parse(decryptedStr);
      } catch (e) {
        return null;
      }
    }

    try {
      var nodeCrypto = require('crypto');
      var key = nodeCrypto.createHash('sha256').update(passphrase, 'utf8').digest();
      var dataBuf = Buffer.from(envelope.data, 'base64');
      if (dataBuf.length < 16) return null;
      var cipherText = dataBuf.subarray(0, dataBuf.length - 16);
      var authTag = dataBuf.subarray(dataBuf.length - 16);
      var nodeIv = Buffer.from(envelope.iv, 'base64');

      var decipher = nodeCrypto.createDecipheriv('aes-256-gcm', key, nodeIv);
      decipher.setAuthTag(authTag);
      var decrypted = Buffer.concat([decipher.update(cipherText), decipher.final()]);
      return JSON.parse(decrypted.toString('utf8'));
    } catch (e) {
      return null;
    }
  }

  /**
   * Constructor for instance-based usage
   */
  function NotifyPush(defaultOptions) {
    if (!(this instanceof NotifyPush)) {
      return new NotifyPush(defaultOptions);
    }
    this.defaults = defaultOptions || {};
  }

  NotifyPush.prototype.send = function (options) {
    var merged = Object.assign({}, this.defaults, options || {});
    return NotifyPush.send(merged);
  };

  NotifyPush.prototype.bindForm = function (formSelector, config) {
    var merged = Object.assign({}, this.defaults, config || {});
    return NotifyPush.bindForm(formSelector, merged);
  };

  NotifyPush.prototype.captureErrors = function (config) {
    var merged = Object.assign({}, this.defaults, config || {});
    return NotifyPush.captureErrors(merged);
  };

  /**
   * Static: Dispatch an instant push notification
   * @param {Object} options
   * @param {string} options.topic - Secret channel/topic name (e.g. 'my-shop-alerts')
   * @param {string} options.title - Notification title
   * @param {string} options.message - Notification body text
   * @param {string|number} [options.priority='default'] - 'min', 'low', 'default', 'high', 'urgent' (or 1-5)
   * @param {Array<string>|string} [options.tags] - Emojis/tags (e.g. ['bell', 'warning'])
   * @param {string} [options.clickUrl] - Direct URL opened when notification is clicked
   * @param {string} [options.serverUrl='https://ntfy.sh'] - Gateway server (or custom Docker URL)
   * @param {string} [options.token] - Optional Bearer auth token for protected topics
   * @param {string} [options.password] - Optional E2EE passphrase for Zero-Knowledge AES-256-GCM encryption
   * @returns {Promise<{success: boolean, id?: string, error?: string}>}
   */
  NotifyPush.send = async function (options) {
    options = options || {};
    var topic = (options.topic || '').trim();
    if (!topic) {
      return Promise.reject(new Error('NotifyPush: topic is required'));
    }

    var server = (options.serverUrl || DEFAULT_SERVER).replace(/\/+$/, '');
    var url = server + '/' + encodeURIComponent(topic);

    var headers = {};
    var body = options.message || '';

    // Handle Zero-Knowledge End-to-End Encryption
    if (options.password && options.password.trim()) {
      var payloadToEncrypt = {
        title: options.title || '',
        message: options.message || '',
        tags: options.tags || [],
        clickUrl: options.clickUrl || null
      };
      try {
        body = await encryptE2ee(payloadToEncrypt, options.password.trim());
        headers['Title'] = '🔒 Encrypted Alert';
        headers['Tags'] = 'lock';
      } catch (encErr) {
        console.error('[NotifyPush E2EE Error]', encErr);
        return { success: false, error: 'E2EE encryption failed: ' + encErr.message };
      }
    } else {
      if (options.title) {
        headers['Title'] = options.title;
      }
      if (options.tags) {
        var tagsStr = Array.isArray(options.tags) ? options.tags.join(',') : String(options.tags);
        headers['Tags'] = tagsStr;
      }
      if (options.clickUrl) {
        headers['Click'] = options.clickUrl;
      }
    }

    if (options.priority) {
      headers['Priority'] = String(options.priority);
    }
    if (options.token) {
      headers['Authorization'] = 'Bearer ' + options.token.trim();
    }

    try {
      var res = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: body
      });

      if (!res.ok) {
        throw new Error('NotifyPush: HTTP ' + res.status + ' ' + res.statusText);
      }

      var data = await res.json().catch(function () {
        return { success: true };
      });

      return {
        success: true,
        id: data.id || null,
        time: data.time || Date.now()
      };
    } catch (err) {
      console.error('[NotifyPush Error]', err);
      return {
        success: false,
        error: err.message
      };
    }
  };

  /**
   * Automatically binds a form to send a push alert on submit
   */
  NotifyPush.bindForm = function (formSelector, config) {
    config = config || {};
    var form = typeof formSelector === 'string' ? document.querySelector(formSelector) : formSelector;
    if (!form) {
      console.warn('NotifyPush.bindForm: form element not found:', formSelector);
      return;
    }

    form.addEventListener('submit', function () {
      var formData = new FormData(form);
      var entries = [];
      formData.forEach(function (value, key) {
        var lowerKey = key.toLowerCase();
        if (!lowerKey.includes('password') && !lowerKey.includes('card') && !lowerKey.includes('cvv')) {
          entries.push(key + ': ' + value);
        }
      });

      var message = entries.length > 0 ? entries.join('\n') : 'New submission received from website form.';

      NotifyPush.send({
        topic: config.topic,
        title: config.title || 'New Form Submission 📝',
        message: message,
        priority: config.priority || 'high',
        tags: config.tags || ['envelope', 'memo'],
        clickUrl: config.clickUrl || (typeof window !== 'undefined' ? window.location.href : null),
        serverUrl: config.serverUrl,
        token: config.token,
        password: config.password
      });
    });
  };

  /**
   * Automatically monitors JavaScript runtime errors and sends critical alert
   */
  NotifyPush.captureErrors = function (config) {
    config = config || {};
    if (!config.topic || typeof window === 'undefined') return;

    var lastErrorTime = 0;
    window.addEventListener('error', function (event) {
      var now = Date.now();
      if (now - lastErrorTime < 10000) return;
      lastErrorTime = now;

      var errMsg = (event.message || 'Unknown error') + ' at ' + (event.filename || '') + ':' + (event.lineno || 0);
      NotifyPush.send({
        topic: config.topic,
        title: config.title || '⚠️ Website JavaScript Error',
        message: errMsg,
        priority: 'urgent',
        tags: ['rotating_light', 'warning'],
        clickUrl: window.location.href,
        serverUrl: config.serverUrl,
        token: config.token,
        password: config.password
      });
    });
  };

  // Expose cryptographic utilities for advanced integrations
  NotifyPush.encrypt = encryptE2ee;
  NotifyPush.decrypt = decryptE2ee;

  return NotifyPush;
});
