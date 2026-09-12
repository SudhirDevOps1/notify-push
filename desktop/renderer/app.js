document.addEventListener('DOMContentLoaded', async () => {
  const statusCard = document.getElementById('statusCard');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const statusTopic = document.getElementById('statusTopic');

  const btnToggleConfig = document.getElementById('btnToggleConfig');
  const configForm = document.getElementById('configForm');
  const inputServer = document.getElementById('inputServer');
  const inputToken = document.getElementById('inputToken');
  const checkSound = document.getElementById('checkSound');

  const appsCountBadge = document.getElementById('appsCountBadge');
  const appsList = document.getElementById('appsList');
  const btnShowAddApp = document.getElementById('btnShowAddApp');
  const formAddApp = document.getElementById('formAddApp');
  const inputNewAppName = document.getElementById('inputNewAppName');
  const inputNewAppTopic = document.getElementById('inputNewAppTopic');
  const btnGenRandomTopic = document.getElementById('btnGenRandomTopic');
  const btnCancelAddApp = document.getElementById('btnCancelAddApp');
  const btnCancelAddApp2 = document.getElementById('btnCancelAddApp2');

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
  const selectSnippetApp = document.getElementById('selectSnippetApp');
  const snippetPreview = document.getElementById('snippetPreview');
  const btnCopyWebSnippet = document.getElementById('btnCopyWebSnippet');

  let allNotifications = [];
  let selectedAppFilter = 'all';

  // Web Audio Context Synthesizer for Rich Per-App Sounds
  let audioCtx = null;
  function playAlertChime(priority, tags) {
    if (!checkSound.checked) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const isMoney = tags && (tags.includes('moneybag') || tags.includes('credit_card') || tags.includes('dollar') || tags.includes('shopping_bags'));
      const isUrgent = priority >= 4 || (tags && (tags.includes('fire') || tags.includes('warning') || tags.includes('rotating_light')));

      if (isMoney) {
        // Cash Register Chime: Two cheerful high tones
        playTone(987.77, 0.08, 0);   // B5
        playTone(1318.51, 0.25, 0.08); // E6
      } else if (isUrgent) {
        // Urgent Siren: Fast alternating alert
        playTone(880, 0.12, 0);
        playTone(660, 0.12, 0.12);
        playTone(880, 0.18, 0.24);
      } else {
        // Gentle Notification Ping
        playTone(523.25, 0.12, 0);   // C5
        playTone(659.25, 0.2, 0.1);   // E5
      }
    } catch (e) {}
  }

  function playTone(freq, duration, delay = 0) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(audioCtx.currentTime + delay);
    osc.stop(audioCtx.currentTime + delay + duration);
  }
  let currentConfig = await window.notifyPushApi.getConfig();

  // 1. Render Configured Apps
  function renderApps(apps) {
    appsList.innerHTML = '';
    selectSnippetApp.innerHTML = '';

    const appItems = Array.isArray(apps) ? apps : [];
    appsCountBadge.textContent = `${appItems.length} ${appItems.length === 1 ? 'App' : 'Apps'}`;

    const activeTopics = appItems.map(a => a.topic).join(', ');
    statusTopic.textContent = `Topics: ${activeTopics || '--'}`;

    if (appItems.length === 0) {
      appsList.innerHTML = `
        <div style="text-align: center; padding: 12px; color: var(--text-muted); font-size: 12px;">
          No web apps configured yet. Click <strong>+ Add Web App</strong> to create your first channel!
        </div>
      `;
      return;
    }

    appItems.forEach(app => {
      // Add to Apps List UI
      const card = document.createElement('div');
      card.className = 'app-item-card';
      card.innerHTML = `
        <div class="app-item-left">
          <div class="app-item-title">
            <span>🌐</span>
            <strong>${escapeHtml(app.name)}</strong>
          </div>
          <span class="app-item-topic">#${escapeHtml(app.topic)}</span>
        </div>
        <div class="app-item-actions">
          <button class="app-action-btn btn-app-qr" title="Show QR Code for this Channel" data-id="${app.id}">
            📷 QR
          </button>
          <button class="app-action-btn btn-app-code" title="Copy Website Snippet for this App" data-id="${app.id}">
            📋 Code
          </button>
          <button class="app-action-btn btn-app-test" title="Send Live Test to this App" data-id="${app.id}">
            🔔 Test
          </button>
          <button class="app-action-btn delete btn-app-delete" title="Delete App" data-id="${app.id}">
            🗑️
          </button>
        </div>
      `;
      appsList.appendChild(card);

      // Add to Snippet Modal Dropdown
      const option = document.createElement('option');
      option.value = app.id;
      option.textContent = `${app.name} (#${app.topic})`;
      selectSnippetApp.appendChild(option);
    });

    // Wire action buttons
    appsList.querySelectorAll('.btn-app-qr').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const targetApp = appItems.find(a => a.id === id);
        if (targetApp) {
          openQrModalForApp(targetApp);
        }
      });
    });

    appsList.querySelectorAll('.btn-app-code').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        selectSnippetApp.value = id;
        updateSnippetPreview();
        modalWebSnippet.classList.add('open', 'active');
      });
    });

    appsList.querySelectorAll('.btn-app-test').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        btn.textContent = '⏳ Sending...';
        await window.notifyPushApi.testApp(id);
        btn.textContent = '✅ Sent!';
        setTimeout(() => { btn.textContent = '🔔 Test'; }, 1500);
      });
    });

    appsList.querySelectorAll('.btn-app-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const targetApp = appItems.find(a => a.id === id);
        const name = targetApp ? targetApp.name : 'this app';
        if (confirm(`Are you sure you want to remove "${name}"?`)) {
          const res = await window.notifyPushApi.deleteApp(id);
          if (res && res.apps) {
            currentConfig.apps = res.apps;
            renderApps(res.apps);
          }
        }
      });
    });
  }

  renderApps(currentConfig.apps || []);

  // Form: Add New Web App
  btnShowAddApp.addEventListener('click', () => {
    formAddApp.classList.toggle('collapsed');
    if (!formAddApp.classList.contains('collapsed')) {
      inputNewAppName.focus();
      if (!inputNewAppTopic.value) {
        inputNewAppTopic.value = 'app-' + Math.random().toString(36).substring(2, 9);
      }
    }
  });

  function hideAddAppForm() {
    formAddApp.classList.add('collapsed');
    inputNewAppName.value = '';
    inputNewAppTopic.value = '';
  }

  btnCancelAddApp.addEventListener('click', hideAddAppForm);
  btnCancelAddApp2.addEventListener('click', hideAddAppForm);

  inputNewAppTopic.addEventListener('input', () => {
    // Auto-replace spaces and illegal characters with hyphens
    inputNewAppTopic.value = inputNewAppTopic.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
  });

  btnGenRandomTopic.addEventListener('click', () => {
    inputNewAppTopic.value = 'app-' + Math.random().toString(36).substring(2, 9);
  });

  formAddApp.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = inputNewAppName.value.trim();
    const topic = inputNewAppTopic.value.trim();
    if (!topic) return;

    const res = await window.notifyPushApi.addApp({ name, topic });
    if (res && res.success) {
      currentConfig.apps = res.apps;
      renderApps(res.apps);
      hideAddAppForm();
      if (res.app) {
        openQrModalForApp(res.app);
      }
    }
  });

  // Global Settings Form
  inputServer.value = currentConfig.serverUrl || 'https://ntfy.sh';
  inputToken.value = currentConfig.token || '';
  checkSound.checked = currentConfig.sound !== false;

  const checkAutoStart = document.getElementById('checkAutoStart');
  if (checkAutoStart && window.notifyPushApi.getAutoStart) {
    const isAuto = await window.notifyPushApi.getAutoStart();
    checkAutoStart.checked = isAuto;
    checkAutoStart.addEventListener('change', async () => {
      await window.notifyPushApi.setAutoStart(checkAutoStart.checked);
    });
  }

  btnToggleConfig.addEventListener('click', () => {
    configForm.classList.toggle('collapsed');
    btnToggleConfig.textContent = configForm.classList.contains('collapsed') ? 'Server Settings' : 'Close';
  });

  configForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    currentConfig.serverUrl = inputServer.value.trim() || 'https://ntfy.sh';
    currentConfig.token = inputToken.value.trim();
    currentConfig.sound = checkSound.checked;

    await window.notifyPushApi.saveConfig(currentConfig);
    configForm.classList.add('collapsed');
    btnToggleConfig.textContent = 'Server Settings';
    alert('Server settings saved successfully!');
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

      const displaySource = item.appName ? `${item.appName} (#${item.topic})` : (item.topic ? `#${item.topic}` : '');
      const topicBadgeHtml = displaySource ? `
        <span class="notif-topic">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 3px;">
            <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"></path>
            <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"></path>
            <circle cx="12" cy="12" r="2"></circle>
            <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"></path>
            <path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"></path>
          </svg>${escapeHtml(displaySource)}
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
    playAlertChime(newNotif.priority, newNotif.tags);
    filterAndRender();
  });

  // 6. Search / Filter
  function filterAndRender() {
    const query = inputSearch.value.trim().toLowerCase();
    let filtered = allNotifications;

    if (selectedAppFilter !== 'all') {
      filtered = filtered.filter(n => 
        (n.appName && n.appName.toLowerCase() === selectedAppFilter.toLowerCase()) ||
        (n.topic && n.topic.toLowerCase() === selectedAppFilter.toLowerCase())
      );
    }

    if (query) {
      filtered = filtered.filter(n =>
        (n.title && n.title.toLowerCase().includes(query)) ||
        (n.message && n.message.toLowerCase().includes(query)) ||
        (n.tags && n.tags.some(t => t.toLowerCase().includes(query))) ||
        (n.topic && n.topic.toLowerCase().includes(query)) ||
        (n.appName && n.appName.toLowerCase().includes(query))
      );
    }
    renderFeed(filtered);
    updateFilterChipsUI();
  }

  function updateFilterChipsUI() {
    const chipsContainer = document.getElementById('historyFilterChips');
    if (!chipsContainer) return;

    // Collect configured apps + unique apps in notifications
    const apps = currentConfig.apps || [];
    const appCounts = {};
    allNotifications.forEach(n => {
      const name = n.appName || n.topic || 'General';
      appCounts[name] = (appCounts[name] || 0) + 1;
    });

    chipsContainer.innerHTML = '';

    // 'All Apps' chip
    const allChip = document.createElement('button');
    allChip.className = `filter-chip ${selectedAppFilter === 'all' ? 'active' : ''}`;
    allChip.innerHTML = `All Apps <span class="filter-chip-count">${allNotifications.length}</span>`;
    allChip.addEventListener('click', () => {
      selectedAppFilter = 'all';
      filterAndRender();
    });
    chipsContainer.appendChild(allChip);

    // Dynamic chips for each configured app
    apps.forEach(app => {
      const count = appCounts[app.name] || 0;
      const chip = document.createElement('button');
      chip.className = `filter-chip ${selectedAppFilter === app.name ? 'active' : ''}`;
      chip.innerHTML = `${escapeHtml(app.name)} <span class="filter-chip-count">${count}</span>`;
      chip.addEventListener('click', () => {
        selectedAppFilter = selectedAppFilter === app.name ? 'all' : app.name;
        filterAndRender();
      });
      chipsContainer.appendChild(chip);
    });
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
  function updateSnippetPreview() {
    const selectedAppId = selectSnippetApp.value;
    const targetApp = currentConfig.apps?.find(a => a.id === selectedAppId) || currentConfig.apps?.[0];
    const activeServer = (targetApp?.serverUrl || currentConfig.serverUrl || 'https://ntfy.sh').trim();
    const activeTopic = (targetApp?.topic || 'my-website').trim();
    const activeToken = (targetApp?.token || currentConfig.token || '').trim();
    const appName = targetApp?.name || 'Website';

    const code = `&lt;!-- 1. Include NotifyPush Client --&gt;
&lt;script src="https://cdn.jsdelivr.net/gh/SudhirDevOps1/notify-push@main/web/notifypush.js"&gt;&lt;/script&gt;
&lt;script&gt;
  // 2. Initialize for: ${escapeHtml(appName)}
  const notify = new NotifyPush({
    serverUrl: '${activeServer}',
    topic: '${activeTopic}'${activeToken ? `,\n    token: '${activeToken}'` : ''}
  });

  // 3. Send alerts anytime!
  notify.send({
    title: 'New Lead / Order Received! 🚀',
    message: 'A user submitted the contact form on ${escapeHtml(appName)}.',
    priority: 'high',
    tags: ['globe', 'cart']
  });
&lt;/script&gt;`;
    snippetPreview.innerHTML = code;
  }

  selectSnippetApp.addEventListener('change', updateSnippetPreview);

  btnWebSnippet.addEventListener('click', () => {
    updateSnippetPreview();
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

  // 9. QR Code Modal Logic
  const modalQrCode = document.getElementById('modalQrCode');
  const qrModalAppName = document.getElementById('qrModalAppName');
  const qrModalAppTopic = document.getElementById('qrModalAppTopic');
  const qrImagePreview = document.getElementById('qrImagePreview');
  const qrLoadingSpinner = document.getElementById('qrLoadingSpinner');
  const qrUrlInput = document.getElementById('qrUrlInput');
  const btnCopyQrUrl = document.getElementById('btnCopyQrUrl');
  const btnDownloadQr = document.getElementById('btnDownloadQr');
  const btnCloseQrModal = document.getElementById('btnCloseQrModal');
  const btnCloseQrModalBottom = document.getElementById('btnCloseQrModalBottom');

  let currentQrDataUrl = null;
  let currentQrTargetApp = null;

  async function openQrModalForApp(app) {
    if (!app) return;
    currentQrTargetApp = app;
    qrModalAppName.textContent = app.name || 'Web App';
    qrModalAppTopic.textContent = '#' + app.topic;

    const server = (app.serverUrl || currentConfig.serverUrl || 'https://ntfy.sh').trim();
    const payload = `${server}/${app.topic}?name=${encodeURIComponent(app.name || 'App')}`;
    qrUrlInput.value = payload;

    qrImagePreview.style.display = 'none';
    qrLoadingSpinner.textContent = 'Generating QR Code...';
    qrLoadingSpinner.style.display = 'block';
    modalQrCode.classList.add('open', 'active');

    try {
      const dataUrl = await window.notifyPushApi.generateQrCode(payload);
      if (dataUrl) {
        currentQrDataUrl = dataUrl;
        qrImagePreview.src = dataUrl;
        qrLoadingSpinner.style.display = 'none';
        qrImagePreview.style.display = 'block';
      } else {
        qrLoadingSpinner.textContent = 'Failed to generate QR Code';
      }
    } catch (err) {
      console.error('QR generation error:', err);
      qrLoadingSpinner.textContent = 'Error generating QR Code';
    }
  }

  function closeQrModal() {
    modalQrCode.classList.remove('open', 'active');
  }

  btnCloseQrModal.addEventListener('click', closeQrModal);
  btnCloseQrModalBottom.addEventListener('click', closeQrModal);
  modalQrCode.addEventListener('click', (e) => {
    if (e.target === modalQrCode) closeQrModal();
  });

  btnCopyQrUrl.addEventListener('click', () => {
    navigator.clipboard.writeText(qrUrlInput.value);
    btnCopyQrUrl.textContent = '✅ Copied!';
    setTimeout(() => { btnCopyQrUrl.textContent = '📋 Copy Link'; }, 1800);
  });

  btnDownloadQr.addEventListener('click', () => {
    if (!currentQrDataUrl) return;
    const a = document.createElement('a');
    a.href = currentQrDataUrl;
    const cleanName = (currentQrTargetApp?.name || 'app').toLowerCase().replace(/[^a-z0-9]/g, '-');
    a.download = `notifypush-${cleanName}-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });
});