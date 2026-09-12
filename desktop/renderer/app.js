document.addEventListener('DOMContentLoaded', async () => {
  const statusCard = document.getElementById('statusCard');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const statusTopic = document.getElementById('statusTopic');

  const btnToggleConfig = document.getElementById('btnToggleConfig');
  const configForm = document.getElementById('configForm');
  const inputTopic = document.getElementById('inputTopic');
  const inputServer = document.getElementById('inputServer');
  const inputToken = document.getElementById('inputToken');
  const checkSound = document.getElementById('checkSound');

  const notificationList = document.getElementById('notificationList');
  const emptyState = document.getElementById('emptyState');
  const badgeCount = document.getElementById('badgeCount');
  const inputSearch = document.getElementById('inputSearch');

  const btnTest = document.getElementById('btnTest');
  const btnExport = document.getElementById('btnExport');
  const btnClear = document.getElementById('btnClear');
  const btnWebSnippet = document.getElementById('btnWebSnippet');

  const modalWebSnippet = document.getElementById('modalWebSnippet');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const snippetPreview = document.getElementById('snippetPreview');
  const btnCopyWebSnippet = document.getElementById('btnCopyWebSnippet');

  let allNotifications = [];

  // 1. Load Initial Configuration
  const config = await window.notifyPushApi.getConfig();
  inputTopic.value = config.topic || '';
  inputServer.value = config.serverUrl || 'https://ntfy.sh';
  inputToken.value = config.token || '';
  checkSound.checked = config.sound !== false;
  statusTopic.textContent = `Topic: ${config.topic || '--'}`;

  // Toggle Config Form
  btnToggleConfig.addEventListener('click', () => {
    configForm.classList.toggle('collapsed');
    btnToggleConfig.textContent = configForm.classList.contains('collapsed') ? 'Edit' : 'Close';
  });

  // Save Configuration
  configForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newConfig = {
      topic: inputTopic.value.trim(),
      serverUrl: inputServer.value.trim() || 'https://ntfy.sh',
      token: inputToken.value.trim(),
      sound: checkSound.checked
    };

    await window.notifyPushApi.saveConfig(newConfig);
    statusTopic.textContent = `Topic: ${newConfig.topic || '--'}`;
    configForm.classList.add('collapsed');
    btnToggleConfig.textContent = 'Edit';
  });

  // Helper to update status UI
  function applyStatus(status) {
    statusText.textContent = status;
    const isConnected = status.toLowerCase().includes('connected') || status.toLowerCase().includes('listening');
    const isError = status.toLowerCase().includes('error');

    statusDot.className = 'status-dot';
    statusCard.className = 'status-card';

    if (isConnected) {
      statusDot.classList.add('pulse');
    } else if (isError) {
      statusDot.classList.add('error');
      statusCard.classList.add('error');
    }
  }

  // 2. Status Updates
  window.notifyPushApi.onStatusChange((status) => {
    applyStatus(status);
  });

  // Query initial status on load
  try {
    const currentStatus = await window.notifyPushApi.getStatus();
    if (currentStatus) {
      applyStatus(currentStatus);
    }
  } catch (e) {}

  // 3. Render Notifications
  function renderFeed(items) {
    notificationList.innerHTML = '';

    if (!items || items.length === 0) {
      notificationList.appendChild(emptyState);
      badgeCount.textContent = '0';
      return;
    }

    badgeCount.textContent = items.length.toString();

    items.forEach((item) => {
      const card = document.createElement('div');
      let priorityClass = 'default';
      if (item.priority >= 5 || item.priority === 'urgent') priorityClass = 'urgent';
      else if (item.priority === 4 || item.priority === 'high') priorityClass = 'high';
      else if (item.priority <= 2) priorityClass = 'low';

      card.className = `notif-card ${priorityClass}`;

      const dateStr = new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      let tagsHtml = '';
      if (item.tags && item.tags.length > 0) {
        tagsHtml = `<div class="notif-tags">${item.tags.map(t => `<span class="tag-pill">#${escapeHtml(t)}</span>`).join('')}</div>`;
      }

      let linkHtml = '';
      if (item.clickUrl) {
        linkHtml = `<a class="notif-link" data-url="${escapeHtml(item.clickUrl)}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 4px;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>Open Link</a>`;
      }

      const topicBadgeHtml = item.topic ? `
        <span class="notif-topic">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 3px;">
            <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"></path>
            <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"></path>
            <circle cx="12" cy="12" r="2"></circle>
            <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"></path>
            <path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"></path>
          </svg>${escapeHtml(item.topic)}
        </span>` : '';

      card.innerHTML = `
        <div class="notif-header">
          <span class="notif-title">${escapeHtml(item.title || 'Notification')}</span>
          <div style="display: flex; align-items: center; gap: 6px;">
            ${topicBadgeHtml}
            <span class="notif-time">${dateStr}</span>
          </div>
        </div>
        <div class="notif-body">${escapeHtml(item.message || '')}</div>
        ${tagsHtml}
        ${linkHtml}
      `;

      notificationList.appendChild(card);
    });

    // Attach click handlers to links
    notificationList.querySelectorAll('.notif-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const url = link.getAttribute('data-url');
        if (url) window.notifyPushApi.openExternal(url);
      });
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  // 4. Load Initial History
  allNotifications = await window.notifyPushApi.getHistory();
  renderFeed(allNotifications);

  // 5. Real-Time New Notification Listener
  window.notifyPushApi.onNotification((newNotif) => {
    allNotifications.unshift(newNotif);
    filterAndRender();
  });

  // 6. Search / Filter
  function filterAndRender() {
    const query = inputSearch.value.trim().toLowerCase();
    if (!query) {
      renderFeed(allNotifications);
      return;
    }
    const filtered = allNotifications.filter(n =>
      (n.title && n.title.toLowerCase().includes(query)) ||
      (n.message && n.message.toLowerCase().includes(query)) ||
      (n.tags && n.tags.some(t => t.toLowerCase().includes(query))) ||
      (n.topic && n.topic.toLowerCase().includes(query))
    );
    renderFeed(filtered);
  }

  inputSearch.addEventListener('input', filterAndRender);

  // 7. Action Buttons
  btnTest.addEventListener('click', async () => {
    await window.notifyPushApi.testAlert();
  });

  btnExport.addEventListener('click', async () => {
    if (allNotifications.length === 0) {
      alert('No notifications in history to export.');
      return;
    }
    const json = JSON.stringify(allNotifications, null, 2);
    navigator.clipboard.writeText(json);
    alert(`Copied ${allNotifications.length} notifications to clipboard as JSON!`);
  });

  btnClear.addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear all notification history?')) {
      await window.notifyPushApi.clearHistory();
      allNotifications = [];
      renderFeed(allNotifications);
    }
  });

  // 8. Web Integration Snippet Modal
  function getSnippetCode() {
    const activeServer = inputServer.value.trim() || 'https://ntfy.sh';
    const firstTopic = (inputTopic.value || 'my-website').split(',')[0].trim() || 'my-website';
    const activeToken = inputToken.value.trim();

    return `&lt;!-- 1. Include NotifyPush Client --&gt;
&lt;script src="https://cdn.jsdelivr.net/gh/SudhirDevOps1/notify-push@main/web/notifypush.js"&gt;&lt;/script&gt;
&lt;script&gt;
  // 2. Initialize with your website topic
  const notify = new NotifyPush({
    serverUrl: '${activeServer}',
    topic: '${firstTopic}'${activeToken ? `,\n    token: '${activeToken}'` : ''}
  });

  // 3. Send alerts anytime!
  notify.send({
    title: 'New Lead / Order Received! 🚀',
    message: 'A user submitted the contact form on your website.',
    priority: 'high',
    tags: ['globe', 'cart']
  });
&lt;/script&gt;`;
  }

  btnWebSnippet.addEventListener('click', () => {
    snippetPreview.innerHTML = getSnippetCode();
    modalWebSnippet.classList.add('open', 'active');
  });

  btnCloseModal.addEventListener('click', () => {
    modalWebSnippet.classList.remove('open', 'active');
  });

  modalWebSnippet.addEventListener('click', (e) => {
    if (e.target === modalWebSnippet) {
      modalWebSnippet.classList.remove('open', 'active');
    }
  });

  btnCopyWebSnippet.addEventListener('click', () => {
    const textToCopy = snippetPreview.textContent;
    navigator.clipboard.writeText(textToCopy);
    btnCopyWebSnippet.innerHTML = '✅ Copied!';
    setTimeout(() => {
      btnCopyWebSnippet.innerHTML = '📋 Copy HTML Code';
    }, 2000);
  });
});