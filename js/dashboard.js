/* ═══════════════════════════════════════════
   ريستا كافيه — لوحة التحكم (Dashboard)
   ═══════════════════════════════════════════ */

const DashboardPage = (() => {
  function render() {
    const stats = Store.getDashboardStats();
    const devices = Store.getAll('devices');
    const activeSessions = Store.getActiveSessions();
    const settings = Store.getSettings();
    const weeklyRev = Store.getWeeklyRevenue();
    const weekTotal = weeklyRev.reduce((s, d) => s + d.total, 0);
    const lastWeekTotal = Math.round(weekTotal * 0.85); // approximate

    // Build device-session map
    const sessionMap = {};
    activeSessions.forEach(s => { sessionMap[s.deviceId] = s; });

    let html = Components.renderTopbar('لوحة', 'التحكم');

    // Ticker
    html += renderTicker(activeSessions, stats);

    // KPI Row
    html += `<div class="kpi-row">
      <div class="kpi-card cyan" onclick="App.navigate('accounting')">
        <div class="kpi-label">💰 إيرادات اليوم</div>
        <div class="kpi-value" id="kpi-revenue">${Utils.formatNumber(stats.revenue)}</div>
        <div class="kpi-sub">${settings.currency} <span class="kpi-change up">↑ ${stats.sessionRev > 0 ? Math.round((stats.barRev / Math.max(1, stats.sessionRev)) * 100) : 0}% بار</span></div>
      </div>
      <div class="kpi-card gold" onclick="App.navigate('sessions')">
        <div class="kpi-label">🎮 الجلسات النشطة</div>
        <div class="kpi-value">${stats.activeSessions}</div>
        <div class="kpi-sub">من ${stats.totalDevices} أجهزة</div>
      </div>
      <div class="kpi-card green" onclick="App.navigate('bar')">
        <div class="kpi-label">☕ طلبات البار</div>
        <div class="kpi-value">${stats.todayOrders}</div>
        <div class="kpi-sub">طلب اليوم <span class="kpi-change ${stats.pendingOrders > 0 ? 'down' : 'up'}">${stats.pendingOrders > 0 ? '⏳ ' + stats.pendingOrders + ' معلق' : '✅ مكتمل'}</span></div>
      </div>
      <div class="kpi-card red" onclick="Components.showNotifications()">
        <div class="kpi-label">⚠️ تنبيهات الذكاء</div>
        <div class="kpi-value" id="alerts-count">${stats.alertCount}</div>
        <div class="kpi-sub">تنبيه نشط</div>
      </div>
    </div>`;

    // Main Grid: Stations + Alerts
    html += '<div class="grid-main">';

    // ── Stations Grid ──
    html += `<div class="section-card">
      <div class="section-header">
        <div class="section-title"><span class="icon">🎮</span> حالة الأجهزة</div>
        <div class="section-action" onclick="App.navigate('sessions')">+ جلسة جديدة</div>
      </div>
      <div class="stations-body">`;

    devices.forEach(dev => {
      const session = sessionMap[dev.id];
      const isActive = !!session && session.status === 'active';
      const isPaused = !!session && session.status === 'paused';
      const stClass = isActive ? 'active' : isPaused ? 'idle' : 'idle';
      const badgeClass = isActive ? 'badge-active' : isPaused ? 'badge-idle' : 'badge-idle';
      const badgeLabel = isActive ? 'نشط' : isPaused ? 'متوقف' : 'انتظار';

      if (session) {
        const elapsed = Utils.getElapsedSeconds(session.startTime, session.pausedTime || 0);
        const cost = Store.getSessionCost(session.id);
        const maxMins = 180;
        const pct = Math.min(100, Math.round((elapsed / 60 / maxMins) * 100));

        html += `
          <div class="station-item ${stClass}" onclick="App.navigate('sessions')">
            <div class="station-top">
              <div class="station-name">${dev.icon} ${dev.name}</div>
              <div class="station-badge ${badgeClass}">${badgeLabel}</div>
            </div>
            <div class="station-timer" id="timer-${session.id}" ${isPaused ? 'style="color:var(--gold)"' : ''}>${Utils.formatTime(elapsed)}</div>
            <div class="station-player">👤 ${session.playerName}</div>
            <div class="station-revenue">💰 <span id="cost-${session.id}">${cost}</span> ${settings.currency} محتسبة</div>
            <div class="station-progress"><div class="station-bar ${isActive ? 'bar-active' : 'bar-idle'}" style="width:${pct}%"></div></div>
          </div>`;
      } else {
        html += `
          <div class="station-item" onclick="SessionsPage.quickStart('${dev.id}')">
            <div class="station-top">
              <div class="station-name">${dev.icon} ${dev.name}</div>
              <div class="station-badge badge-idle">انتظار</div>
            </div>
            <div class="station-timer" style="color:var(--gold)">--:--:--</div>
            <div class="station-player" style="color:var(--gold)">⚡ جاهز للاستخدام</div>
            <div class="station-revenue" style="color:var(--muted)">اضغط لبدء جلسة</div>
            <div class="station-progress"><div class="station-bar bar-idle" style="width:0%"></div></div>
          </div>`;
      }
    });

    html += `</div></div>`;

    // ── Alerts Feed ──
    html += `<div class="section-card">
      <div class="section-header">
        <div class="section-title"><span class="icon">🤖</span> تنبيهات الذكاء الاصطناعي</div>
        <div class="section-action" onclick="DashboardPage.simulateAlert()">+ محاكاة</div>
      </div>
      <div class="alerts-body" id="alerts-feed" style="max-height:400px;overflow-y:auto;">`;

    if (stats.alerts.length === 0) {
      html += Components.renderEmpty('✅', 'لا توجد تنبيهات', 'كل شيء يعمل بشكل طبيعي');
    } else {
      stats.alerts.forEach((alert, i) => {
        html += `
          <div class="alert-item animate-slide" style="animation-delay:${i * 0.05}s">
            <div class="alert-icon ${alert.color}">${alert.icon}</div>
            <div class="alert-content">
              <div class="alert-title">${alert.title}</div>
              <div class="alert-desc">${alert.desc}</div>
              <div class="alert-time">${alert.source}</div>
            </div>
            ${alert.source === 'help_requests' ? `<button class="btn btn-sm btn-ghost" onclick="Store.update('helpRequests', '${alert.requestId}', {status: 'done'}); App.refresh()">✅ تم</button>` : ''}
          </div>`;
      });
    }

    html += `</div></div></div>`;

    // ── Bottom Grid: Chart + Inventory + Accounting ──
    html += '<div class="grid-3">';

    // Revenue Chart
    const chartData = weeklyRev.map(d => d.total);
    html += `<div class="section-card">
      <div class="section-header">
        <div class="section-title"><span class="icon">📈</span> الإيرادات — آخر 7 أيام</div>
        <div class="section-action" onclick="App.navigate('accounting')">تفاصيل</div>
      </div>
      <div class="chart-body" style="padding:16px;">
        ${Utils.createSparkline(chartData, 320, 100, '#00e5ff')}
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-top:8px;">
          ${weeklyRev.map(d => `<span>${d.dayName}</span>`).join('')}
        </div>
        <div style="margin-top:12px;display:flex;gap:10px;">
          <div style="flex:1;background:var(--surface);border-radius:10px;padding:10px;text-align:center;">
            <div style="font-size:10px;color:var(--muted);">هذا الأسبوع</div>
            <div class="mono" style="font-size:18px;font-weight:700;color:var(--cyan);">${Utils.formatNumber(weekTotal)} ${settings.currency}</div>
          </div>
          <div style="flex:1;background:var(--surface);border-radius:10px;padding:10px;text-align:center;">
            <div style="font-size:10px;color:var(--muted);">نمو</div>
            <div class="mono" style="font-size:18px;font-weight:700;color:var(--green);">+${weekTotal > 0 ? Math.round(((weekTotal - lastWeekTotal) / Math.max(1, lastWeekTotal)) * 100) : 0}%</div>
          </div>
        </div>
      </div>
    </div>`;

    // Quick Inventory
    const inv = Store.getInventory();
    const products = Store.getAll('products');
    html += `<div class="section-card">
      <div class="section-header">
        <div class="section-title"><span class="icon">📦</span> مخزون البار</div>
        <div class="section-action" onclick="App.navigate('inventory')">التفاصيل</div>
      </div>
      <div style="padding:10px 14px;">`;

    inv.slice(0, 6).forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return;
      const p = Utils.pct(item.quantity, item.maxCapacity);
      html += `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);">
          <div style="font-size:18px;">${product.icon}</div>
          <div style="flex:1;">
            <div style="font-size:12px;font-weight:600;">${product.name}</div>
            <div style="height:3px;background:var(--border);border-radius:2px;margin-top:4px;">
              <div style="height:100%;border-radius:2px;width:${p}%;background:${Utils.pctColor(p)};transition:.5s;"></div>
            </div>
          </div>
          <div style="font-size:12px;font-weight:700;color:${Utils.pctColor(p)};">${p}%</div>
        </div>`;
    });

    html += `</div></div>`;

    // Quick Accounting
    const rev = Store.getTodayRevenue();
    html += `<div class="section-card">
      <div class="section-header">
        <div class="section-title"><span class="icon">🧾</span> المحاسبة التلقائية</div>
        <div class="section-action" onclick="App.navigate('accounting')">دفتر اليومية</div>
      </div>
      <div style="padding:14px;">
        <div style="padding:8px 0 12px;border-bottom:1px solid var(--border);margin-bottom:4px;">
          <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">رصيد اليوم</div>
          <div class="mono" style="font-size:26px;font-weight:700;color:var(--cyan);">${Utils.formatNumber(rev.total)} ${settings.currency}</div>
          <div style="font-size:11px;color:var(--green);">صافي: ${Utils.formatNumber(rev.net)} ${settings.currency}</div>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:13px;">
          <div><div style="font-weight:600;">جلسات الألعاب</div><div style="font-size:11px;color:var(--muted);">${activeSessions.length} جلسة</div></div>
          <div class="mono" style="color:var(--green);font-weight:700;font-size:15px;">+ ${Utils.formatNumber(rev.sessionRev)} ${settings.currency}</div>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:13px;">
          <div><div style="font-weight:600;">مبيعات البار</div><div style="font-size:11px;color:var(--muted);">${stats.todayOrders} طلب</div></div>
          <div class="mono" style="color:var(--green);font-weight:700;font-size:15px;">+ ${Utils.formatNumber(rev.barRev)} ${settings.currency}</div>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;">
          <div><div style="font-weight:600;">المصروفات</div></div>
          <div class="mono" style="color:var(--red);font-weight:700;font-size:15px;">- ${Utils.formatNumber(rev.expenses)} ${settings.currency}</div>
        </div>
      </div>
    </div>`;

    html += '</div>';

    return html;
  }

  function renderTicker(sessions, stats) {
    const settings = Store.getSettings();
    let items = [];

    sessions.forEach(s => {
      const elapsed = Utils.getElapsedSeconds(s.startTime, s.pausedTime || 0);
      const color = s.status === 'active' ? 'var(--green)' : 'var(--gold)';
      items.push(`<div class="ticker-item"><div class="dot" style="background:${color}"></div>${s.deviceName} — ${s.playerName} <span>${Utils.formatTime(elapsed)}</span></div>`);
    });

    items.push(`<div class="ticker-item"><div class="dot" style="background:var(--cyan)"></div>إيرادات اليوم <span>${Utils.formatNumber(stats.revenue)} ${settings.currency}</span></div>`);

    const pendingOrders = Store.query('orders', o => o.status === 'new');
    pendingOrders.forEach(o => {
      const itemNames = o.items.map(i => i.name + ' × ' + i.qty).join(', ');
      items.push(`<div class="ticker-item"><div class="dot" style="background:var(--purple)"></div>طلب جديد — ${itemNames}</div>`);
    });

    const lowInv = Store.getLowInventory();
    lowInv.forEach(li => {
      items.push(`<div class="ticker-item"><div class="dot" style="background:var(--red)"></div>تنبيه مخزون — ${li.product?.name} (${li.pct}%)</div>`);
    });

    if (items.length === 0) {
      items.push(`<div class="ticker-item"><div class="dot" style="background:var(--green)"></div>كل الأنظمة تعمل بشكل طبيعي ✅</div>`);
    }

    // Duplicate for seamless loop
    const allItems = items.join('') + items.join('');

    return `<div class="ticker-wrap"><div class="ticker-inner">${allItems}</div></div>`;
  }

  // ── Simulate AI Alert ──
  const fakeAlerts = [
    { icon: '🛎️', color: 'ai-cyan', title: 'طلب نادل — طاولة البلياردو', desc: 'الزبون يطلب المساعدة' },
    { icon: '🔄', color: 'ai-purple', title: 'طلب تبديل كنترولر', desc: 'PS4 — الزبون يطلب تبديل' },
    { icon: '☕', color: 'ai-green', title: 'طلب مشروب جديد', desc: 'كابتشينو × 2 + عصير مانجو' },
    { icon: '🚨', color: 'ai-red', title: 'محاولة دخول مشبوهة', desc: 'IP غير معتاد — يرجى المراجعة' },
    { icon: '⏰', color: 'ai-gold', title: 'جلسة طويلة — تجاوزت 3 ساعات', desc: 'يرجى التحقق من الزبون' },
  ];
  let fakeIdx = 0;

  function simulateAlert() {
    const a = fakeAlerts[fakeIdx++ % fakeAlerts.length];
    Components.showToast(a.icon, 'تنبيه جديد', a.title);
    const feed = Utils.$('#alerts-feed');
    if (feed) {
      const item = Utils.createElement('div', 'alert-item animate-slide', `
        <div class="alert-icon ${a.color}">${a.icon}</div>
        <div class="alert-content">
          <div class="alert-title">${a.title}</div>
          <div class="alert-desc">${a.desc}</div>
          <div class="alert-time">الآن</div>
        </div>
      `);
      feed.insertBefore(item, feed.firstChild);
    }
  }

  function afterRender() {
    // Nothing special needed
  }

  return { render, afterRender, simulateAlert };
})();

App.registerPage('dashboard', DashboardPage);
