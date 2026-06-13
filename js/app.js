/* ═══════════════════════════════════════════
   ريستا كافيه — التطبيق الرئيسي (App Router)
   SPA Navigation + Page Lifecycle
   ═══════════════════════════════════════════ */

const App = (() => {
  let currentPage = 'dashboard';
  let timersInterval = null;
  let lastOrdersCount = -1;
  let lastHelpCount = -1;

  // ── Page modules registry ──
  const pages = {};

  function registerPage(id, module) {
    pages[id] = module;
  }

  // ── INITIALIZATION ──
  function init() {
    // Initialize data store
    Store.init();
    applyTheme();

    // Register Client Portal
    registerPage('client', ClientPage);

    // Start auth check
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    
    if (hash === 'client') {
      navigate('client');
    } else if (!Auth.getRole()) {
      Auth.renderLoginScreen();
      return; // Stop initialization of admin layout
    } else {
      // Initial render of admin navs
      Components.renderSidebar();
      Components.renderBottomNav();
      Components.renderMoreMenu();
      navigate(hash);
      startTimers();
      
      const roleName = Auth.getRole() === 'admin' ? 'المدير' : 'العامل';
      Components.showToast('✅', `مرحباً ${roleName}`, 'كل الأنظمة تعمل بنجاح');
    }

    // Listen for hash changes
    window.addEventListener('hashchange', () => {
      const page = window.location.hash.replace('#', '') || 'dashboard';
      if (page !== 'client' && !Auth.getRole()) {
        Auth.renderLoginScreen();
        return;
      }
      if (page !== currentPage) navigate(page);
    });

    // Handle resize for responsive
    window.addEventListener('resize', Utils.debounce(() => {
      Components.renderBottomNav();
    }, 200));
  }

  // ── NAVIGATION ──
  function navigate(pageId) {
    if (!pages[pageId] && pageId !== 'dashboard') {
      // Fallback page
      renderFallbackPage(pageId);
      return;
    }

    currentPage = pageId;
    window.location.hash = pageId;

    // Update Layout based on mode
    const isClient = pageId === 'client';
    
    const sidebar = document.querySelector('.sidebar');
    const bottomNav = document.querySelector('.bottom-nav');
    const mainArea = document.querySelector('.main');
    
    if (sidebar) sidebar.style.display = isClient ? 'none' : '';
    if (bottomNav) bottomNav.style.display = isClient ? 'none' : '';
    if (mainArea) mainArea.style.marginLeft = isClient ? '0' : '';
    
    if (!isClient) {
      Components.renderSidebar();
      Components.renderBottomNav();
    }
    Components.closeMoreMenu();

    // Render page
    const container = Utils.$('#page-content');
    if (!container) return;

    if (pages[pageId] && pages[pageId].render) {
      container.innerHTML = pages[pageId].render();
      if (pages[pageId].afterRender) {
        setTimeout(() => pages[pageId].afterRender(), 50);
      }
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderFallbackPage(pageId) {
    currentPage = pageId;
    window.location.hash = pageId;
    Components.renderSidebar();
    Components.renderBottomNav();

    const container = Utils.$('#page-content');
    if (container) {
      container.innerHTML = Components.renderEmpty(
        '🚧', 'قريباً', 'هذه الصفحة قيد التطوير', 'العودة للرئيسية', "App.navigate('dashboard')"
      );
    }
  }

  // ── LIVE TIMERS ──
  function startTimers() {
    if (timersInterval) clearInterval(timersInterval);

    timersInterval = setInterval(() => {
      // Update active session timers on dashboard
      const activeSessions = Store.getActiveSessions();
      activeSessions.forEach(session => {
        if (session.status !== 'active') return;
        const elapsed = Utils.getElapsedSeconds(session.startTime, session.pausedTime || 0);
        const timerEl = document.getElementById(`timer-${session.id}`);
        if (timerEl) timerEl.textContent = Utils.formatTime(elapsed);

        // Update cost display
        const costEl = document.getElementById(`cost-${session.id}`);
        if (costEl) {
          const cost = Store.getSessionCost(session.id);
          costEl.textContent = `${cost} ${Store.getSettings().currency}`;
        }
      });

      // Update revenue periodically (every 4 ticks)
      if (Date.now() % 4000 < 1100) {
        const revEl = document.getElementById('kpi-revenue');
        if (revEl) {
          const rev = Store.getTodayRevenue();
          revEl.textContent = Utils.formatNumber(rev.total);
        }
      }

      // Check for new notifications for Admin
      if (currentPage !== 'client' && Date.now() % 2000 < 1100) {
        const pendingOrders = Store.query('orders', o => o.status === 'new');
        const pendingHelp = Store.query('helpRequests', r => r.status === 'pending');
        
        if (lastOrdersCount !== -1 && pendingOrders.length > lastOrdersCount) {
          const latestOrder = pendingOrders[0];
          let details = '';
          let sourceName = 'عميل من الموبايل';
          if (latestOrder) {
            details = latestOrder.items.map(i => `${i.qty}x ${i.name}`).join('، ');
            if (latestOrder.deviceId) {
               const d = Store.getById('devices', latestOrder.deviceId);
               if (d) sourceName = `جهاز ${d.name}`;
            }
          }
          
          try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play();
          } catch(e) {}
          
          Components.showToast('☕', `طلب جديد من ${sourceName}`, details || 'عميل قام بطلب مشروبات للتو!');
          if(currentPage === 'dashboard' || currentPage === 'bar') refresh();
        }
        if (lastHelpCount !== -1 && pendingHelp.length > lastHelpCount) {
          const latestHelp = pendingHelp[0];
          let sourceName = 'عميل من الموبايل';
          if (latestHelp && latestHelp.deviceId) {
             const d = Store.getById('devices', latestHelp.deviceId);
             if (d) sourceName = `جهاز ${d.name}`;
          }
          
          try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play();
          } catch(e) {}
          
          Components.showToast('🛎️', 'طلب مساعدة!', `العميل على ${sourceName} يحتاجك (نادل / تغيير دراع)`);
          if(currentPage === 'dashboard') refresh();
        }
        
        lastOrdersCount = pendingOrders.length;
        lastHelpCount = pendingHelp.length;
      }
    }, 1000);
  }

  // ── THEME & REFRESH ──
  function applyTheme() {
    const settings = Store.getSettings();
    if (settings.builder && settings.builder.themeColor) {
      document.documentElement.style.setProperty('--cyan', settings.builder.themeColor);
    }
  }

  function refresh() {
    applyTheme();
    navigate(currentPage);
  }

  return {
    get currentPage() { return currentPage; },
    init, navigate, refresh, registerPage,
  };
})();

// ── Boot when DOM ready ──
document.addEventListener('DOMContentLoaded', App.init);
