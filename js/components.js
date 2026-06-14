/* ═══════════════════════════════════════════
   ريستا كافيه — مكونات مشتركة (Components)
   Toast, Modal, Sidebar, Bottom Nav
   ═══════════════════════════════════════════ */

const Components = (() => {
  // ── TOAST ──
  function showToast(icon, title, sub, duration = 3000) {
    const container = Utils.$('#toast-container');
    if (!container) return;
    const toast = Utils.createElement('div', 'toast', `
      <div class="toast-icon">${icon}</div>
      <div class="toast-text">
        <div class="toast-title">${title}</div>
        <div class="toast-sub">${sub || ''}</div>
      </div>
    `);
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('leaving');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // ── MODAL ──
  let activeModal = null;

  function showModal(title, bodyHTML, footerHTML = '', options = {}) {
    closeModal();
    const overlay = Utils.createElement('div', 'modal-overlay active');
    const icon = options.icon || '';
    overlay.innerHTML = `
      <div class="modal" style="${options.maxWidth ? 'max-width:' + options.maxWidth : ''}">
        <div class="modal-header">
          <div class="modal-title">${icon ? '<span>' + icon + '</span>' : ''}${title}</div>
          <div class="modal-close" onclick="Components.closeModal()">✕</div>
        </div>
        <div class="modal-body">${bodyHTML}</div>
        ${footerHTML ? `<div class="modal-footer">${footerHTML}</div>` : ''}
      </div>
    `;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
    document.body.appendChild(overlay);
    activeModal = overlay;

    // Focus first input
    setTimeout(() => {
      const firstInput = overlay.querySelector('input, select, textarea');
      if (firstInput) firstInput.focus();
    }, 100);

    return overlay;
  }

  function closeModal() {
    if (activeModal) {
      activeModal.classList.remove('active');
      setTimeout(() => {
        if (activeModal) activeModal.remove();
        activeModal = null;
      }, 250);
    }
    // Close any stale overlays
    Utils.$$('.modal-overlay').forEach(o => o.remove());
  }

  function confirmModal(title, message, onConfirm, options = {}) {
    const body = `<p style="color:var(--text-sec);font-size:14px;line-height:1.7;">${message}</p>`;
    const footer = `
      <button class="btn ${options.danger ? 'btn-danger' : 'btn-primary'}" onclick="(${onConfirm.toString()})();Components.closeModal();">
        ${options.confirmText || 'تأكيد'}
      </button>
      <button class="btn btn-ghost" onclick="Components.closeModal()">إلغاء</button>
    `;
    showModal(title, body, footer, { icon: options.icon || '⚠️' });
  }

  // ── SIDEBAR RENDERING ──
  function renderSidebar() {
    const pages = [
      { id: 'dashboard', icon: '📊', label: 'لوحة التحكم' },
      { id: 'sessions', icon: '🎮', label: 'الجلسات' },
      { id: 'bar', icon: '☕', label: 'البار' },
      { id: 'reservations', icon: '📅', label: 'الحجوزات' },
      { id: 'tournaments', icon: '🏆', label: 'البطولات' },
      { id: 'customers', icon: '👥', label: 'العملاء' },
    ];
    
    // Add restricted pages if admin
    const role = localStorage.getItem('resta_auth_role');
    if (role === 'admin') {
      pages.push(
        { id: 'inventory', icon: '📦', label: 'المخزون' },
        { id: 'accounting', icon: '🧾', label: 'المحاسبة' },
        { id: 'settings', icon: '⚙️', label: 'الإعدادات' }
      );
    }

    pages.push({ divider: true });
    pages.push({ id: 'logout', icon: '🚪', label: 'تسجيل الخروج', action: 'Auth.logout()' });

    const sidebar = Utils.$('.sidebar');
    if (!sidebar) return;

    let html = '<div class="logo-mark" onclick="App.navigate(\'dashboard\')">ر</div>';
    pages.forEach(p => {
      if (p.divider) {
        html += '<div class="nav-divider"></div>';
      } else {
        const badgeCount = getPageBadge(p.id);
        const clickAction = p.action ? p.action : `App.navigate('${p.id}')`;
        html += `
          <div class="nav-item ${App.currentPage === p.id ? 'active' : ''}" onclick="${clickAction}">
            <span class="nav-icon">${p.icon}</span>
            <span class="nav-label">${p.label}</span>
            ${badgeCount > 0 ? `<span class="nav-badge">${badgeCount}</span>` : ''}
          </div>`;
      }
    });
    sidebar.innerHTML = html;
  }

  // ── BOTTOM NAV (Mobile) ──
  function renderBottomNav() {
    const mainItems = [
      { id: 'dashboard', icon: '⬡', label: 'الرئيسية' },
      { id: 'sessions', icon: '🎮', label: 'الجلسات' },
      { id: 'bar', icon: '☕', label: 'البار' },
      { id: 'accounting', icon: '🧾', label: 'المحاسبة' },
      { id: 'more', icon: '☰', label: 'المزيد' },
    ];

    const nav = Utils.$('.bottom-nav');
    if (!nav) return;

    let html = '';
    mainItems.forEach(item => {
      const isActive = item.id === 'more' ? false : App.currentPage === item.id;
      const badge = item.id !== 'more' ? getPageBadge(item.id) : 0;
      html += `
        <div class="bnav-item ${isActive ? 'active' : ''}"
             onclick="${item.id === 'more' ? 'Components.toggleMoreMenu()' : `App.navigate('${item.id}')`}">
          <span class="bnav-icon">${item.icon}</span>
          <span class="bnav-label">${item.label}</span>
          ${badge > 0 ? `<span class="bnav-badge">${badge}</span>` : ''}
        </div>`;
    });
    nav.innerHTML = html;
  }

  // ── MORE MENU ──
  let moreMenuOpen = false;

  function toggleMoreMenu() {
    moreMenuOpen = !moreMenuOpen;
    const menu = Utils.$('.more-menu');
    if (menu) {
      if (moreMenuOpen) {
        menu.classList.add('active');
      } else {
        menu.classList.remove('active');
      }
    }
  }

  function closeMoreMenu() {
    moreMenuOpen = false;
    const menu = Utils.$('.more-menu');
    if (menu) menu.classList.remove('active');
  }

  function renderMoreMenu() {
    const items = [
      { id: 'reservations', icon: '📅', label: 'الحجوزات' },
      { id: 'inventory', icon: '📦', label: 'المخزون' },
      { id: 'customers', icon: '👥', label: 'العملاء' },
      { id: 'tournaments', icon: '🏆', label: 'البطولات' },
      { id: 'instagram', icon: '📸', label: 'مولّد بوستات إنستجرام' },
      { id: 'settings', icon: '⚙️', label: 'الإعدادات' },
      { id: 'logout', icon: '🚪', label: 'تسجيل الخروج', action: 'Auth.logout()' },
    ];

    const menu = Utils.$('.more-menu');
    if (!menu) return;

    let html = '';
    items.forEach(item => {
      const clickAction = item.action ? item.action : `App.navigate('${item.id}');Components.closeMoreMenu();`;
      html += `
        <div class="more-menu-item" onclick="${clickAction}">
          <span class="more-menu-icon">${item.icon}</span>
          ${item.label}
        </div>`;
    });
    menu.innerHTML = html;
  }

  // ── PAGE BADGES ──
  function getPageBadge(pageId) {
    switch (pageId) {
      case 'bar':
        return Store.query('orders', o => o.status === 'new' || o.status === 'preparing').length;
      case 'sessions':
        return Store.getActiveSessions().length;
      case 'dashboard':
        return Store.getAlerts().length;
      default:
        return 0;
    }
  }

  // ── TOPBAR ──
  function renderTopbar(title, highlight) {
    const settings = Store.getSettings();
    const alerts = Store.getAlerts();
    const now = new Date();
    const dateStr = now.toLocaleDateString('ar-EG', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    return `
      <div class="topbar">
        <div class="topbar-right">
          <div class="page-title">${title} <span>${highlight || ''}</span></div>
          <div class="live-badge"><div class="live-dot"></div> مباشر</div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="font-size:12px;color:var(--muted);text-align:left;">
            <div style="color:var(--text);font-weight:700;">${settings.currentUser.name}</div>
            <div>${dateStr}</div>
          </div>
          <div class="topbar-btn" onclick="Components.showNotifications()">
            🔔${alerts.length > 0 ? '<div class="notif-dot"></div>' : ''}
          </div>
          <div class="avatar">${settings.currentUser.avatar}</div>
        </div>
      </div>`;
  }

  // ── NOTIFICATIONS PANEL ──
  function showNotifications() {
    const alerts = Store.getAlerts();
    let html = '';
    if (alerts.length === 0) {
      html = '<div class="empty-state"><div class="empty-icon">✅</div><div class="empty-title">لا توجد تنبيهات</div><div class="empty-desc">كل شيء يعمل بشكل طبيعي</div></div>';
    } else {
      alerts.forEach(a => {
        html += `
          <div class="alert-item animate-slide">
            <div class="alert-icon ${a.color}">${a.icon}</div>
            <div class="alert-content">
              <div class="alert-title">${a.title}</div>
              <div class="alert-desc">${a.desc}</div>
            </div>
          </div>`;
      });
    }
    showModal('التنبيهات', `<div style="max-height:400px;overflow-y:auto;">${html}</div>`, '', { icon: '🔔' });
  }

  // ── SEARCH BAR ──
  function renderSearchBar(placeholder, onInput) {
    const id = 'search-' + Date.now();
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', Utils.debounce((e) => onInput(e.target.value), 300));
    }, 50);
    return `<input type="search" id="${id}" class="form-input" placeholder="${placeholder}" style="max-width:300px;">`;
  }

  // ── TAB BAR ──
  function renderTabs(tabs, activeTab, onChange) {
    const id = 'tabs-' + Date.now();
    setTimeout(() => {
      const container = document.getElementById(id);
      if (container) {
        container.querySelectorAll('.tab').forEach(tab => {
          tab.addEventListener('click', () => onChange(tab.dataset.tab));
        });
      }
    }, 50);

    let html = `<div class="tabs" id="${id}">`;
    tabs.forEach(t => {
      html += `<div class="tab ${t.id === activeTab ? 'active' : ''}" data-tab="${t.id}">
        ${t.icon ? t.icon + ' ' : ''}${t.label}
        ${t.count !== undefined ? `<span class="badge badge-info" style="font-size:10px;padding:1px 6px;">${t.count}</span>` : ''}
      </div>`;
    });
    html += '</div>';
    return html;
  }

  // ── EMPTY STATE ──
  function renderEmpty(icon, title, desc, actionLabel, actionFn) {
    return `
      <div class="empty-state">
        <div class="empty-icon">${icon}</div>
        <div class="empty-title">${title}</div>
        <div class="empty-desc">${desc}</div>
        ${actionLabel ? `<button class="btn btn-primary" onclick="${actionFn}">${actionLabel}</button>` : ''}
      </div>`;
  }

  // ── CONFIRM DELETE ──
  function confirmDelete(itemName, onConfirm) {
    confirmModal(
      'تأكيد الحذف',
      `هل أنت متأكد من حذف <strong>${itemName}</strong>؟<br>لا يمكن التراجع عن هذا الإجراء.`,
      onConfirm,
      { danger: true, confirmText: 'حذف', icon: '🗑️' }
    );
  }

  return {
    showToast, showModal, closeModal, confirmModal, confirmDelete,
    renderSidebar, renderBottomNav, renderMoreMenu,
    toggleMoreMenu, closeMoreMenu,
    renderTopbar, showNotifications,
    renderSearchBar, renderTabs, renderEmpty,
  };
})();
