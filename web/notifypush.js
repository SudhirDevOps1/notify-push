/**
 * NotifyPush Universal Web Client
 * Lightweight, zero-dependency browser client for instant real-time push alerts.
 * Works in vanilla HTML, React, Vue, Next.js, WordPress, Shopify, etc.
 * 
 * Usage:
 *   <script src="notifypush.js"></script>
 *   <script>
 *     NotifyPush.send({
 *       topic: 'my-website-alerts',
 *       title: 'New Contact Form Message 📩',
 *       message: 'User John Doe submitted the contact form.',
 *       priority: 'high',
 *       tags: ['contact', 'lead']
 *     });
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

  var NotifyPush = {
    /**
     * Dispatch an instant push notification from any webpage
     * @param {Object} options
     * @param {string} options.topic - Secret channel/topic name (e.g. 'my-shop-alerts')
     * @param {string} options.title - Notification title
     * @param {string} options.message - Notification body text
     * @param {string|number} [options.priority='default'] - 'min', 'low', 'default', 'high', 'urgent' (or 1-5)
     * @param {Array<string>|string} [options.tags] - Emojis/tags (e.g. ['bell', 'warning'])
     * @param {string} [options.clickUrl] - Direct URL opened when notification is clicked
     * @param {string} [options.serverUrl='https://ntfy.sh'] - Gateway server (or custom Docker URL)
     * @param {string} [options.token] - Optional Bearer auth token for protected topics
     * @returns {Promise<{success: boolean, id?: string, error?: string}>}
     */
    send: function (options) {
      options = options || {};
      var topic = (options.topic || '').trim();
      if (!topic) {
        return Promise.reject(new Error('NotifyPush: topic is required'));
      }

      var server = (options.serverUrl || DEFAULT_SERVER).replace(/\/+$/, '');
      var url = server + '/' + encodeURIComponent(topic);

      var headers = {};
      if (options.title) {
        // Encode non-ASCII characters using UTF-8 RFC 2047 if needed or direct header
        headers['Title'] = options.title;
      }
      if (options.priority) {
        headers['Priority'] = String(options.priority);
      }
      if (options.tags) {
        var tagsStr = Array.isArray(options.tags) ? options.tags.join(',') : String(options.tags);
        headers['Tags'] = tagsStr;
      }
      if (options.clickUrl) {
        headers['Click'] = options.clickUrl;
      }
      if (options.token) {
        headers['Authorization'] = 'Bearer ' + options.token.trim();
      }

      var body = options.message || '';

      return fetch(url, {
        method: 'POST',
        headers: headers,
        body: body
      })
        .then(function (res) {
          if (!res.ok) {
            throw new Error('NotifyPush: HTTP ' + res.status + ' ' + res.statusText);
          }
          return res.json().catch(function () {
            return { success: true };
          });
        })
        .then(function (data) {
          return {
            success: true,
            id: data.id || null,
            time: data.time || Date.now()
          };
        })
        .catch(function (err) {
          console.error('[NotifyPush Error]', err);
          return {
            success: false,
            error: err.message
          };
        });
    },

    /**
     * Automatically binds a form (e.g. Contact Us, Lead Form) to send a push alert on submit
     * @param {string|HTMLFormElement} formSelector - Form CSS selector or DOM element
     * @param {Object} config - { topic, title, priority, tags, serverUrl, token, includeFields }
     */
    bindForm: function (formSelector, config) {
      config = config || {};
      var form = typeof formSelector === 'string' ? document.querySelector(formSelector) : formSelector;
      if (!form) {
        console.warn('NotifyPush.bindForm: form element not found:', formSelector);
        return;
      }

      form.addEventListener('submit', function (e) {
        var formData = new FormData(form);
        var entries = [];
        formData.forEach(function (value, key) {
          // Exclude sensitive fields like passwords or credit cards
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
          clickUrl: config.clickUrl || window.location.href,
          serverUrl: config.serverUrl,
          token: config.token
        });
      });
    },

    /**
     * Automatically monitors JavaScript runtime errors and sends critical alert
     * @param {Object} config - { topic, serverUrl, token, title }
     */
    captureErrors: function (config) {
      config = config || {};
      if (!config.topic) return;

      var lastErrorTime = 0;
      window.addEventListener('error', function (event) {
        var now = Date.now();
        // Debounce alert by 10 seconds to avoid spamming
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
          token: config.token
        });
      });
    }
  };

  return NotifyPush;
});
