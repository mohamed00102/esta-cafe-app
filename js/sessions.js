/* ═══════════════════════════════════════════
   ريستا كافيه — إدارة الجلسات (Sessions)
   ═══════════════════════════════════════════ */

const SessionsPage = (() => {
  let activeTab = 'active';
  let searchQuery = '';

  function render() {
    const activeSessions = Store.getActiveSessions();
    const devices = Store.getAll('devices');
    const allSessions = Store.getAll('sessions');
    const todaySessions = allSessions.filter(s => Utils.isToday(s.createdAt));
    const settings = Store.getSettings();

    let html = Components.renderTopbar('إدارة', 'الجلسات');

    // KPI Row
    html += `<div class="kpi-row">
      <div class="kpi-card cyan">
        <div class="kpi-label">🎮 جلسات نشطة</div>
        <div class="kpi-value">${activeSessions.length}</div>
        <div class="kpi-sub">من ${devices.length} أجهزة</div>
      </div>
      <div class="kpi-card gold">
        <div class="kpi-label">⏱️ إجمالي الوقت اليوم</div>
        <div class="kpi-value">${calcTotalHours(todaySessions)}</div>
        <div class="kpi-sub">ساعة</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-label">💰 إيرادات الجلسات</div>
        <div class="kpi-value">${Utils.formatNumber(Store.getTodayRevenue().sessionRev)}</div>
        <div class="kpi-sub">${settings.currency}</div>
      </div>
      <div class="kpi-card purple">
        <div class="kpi-label">📊 جلسات اليوم</div>
        <div class="kpi-value">${todaySessions.length}</div>
        <div class="kpi-sub">جلسة</div>
      </div>
    </div>`;

    // Tabs
    html += Components.renderTabs([
      { id: 'active', label: 'الأجهزة', icon: '🎮', count: activeSessions.length },
      { id: 'history', label: 'السجل', icon: '📋' },
    ], activeTab, switchTab);

    if (activeTab === 'active') {
      html += renderDevicesGrid();
    } else {
      html += renderHistory();
    }

    return html;
  }

  function renderDevicesGrid() {
    const devices = Store.getAll('devices');
    const activeSessions = Store.getActiveSessions();
    const sessionMap = {};
    activeSessions.forEach(s => { sessionMap[s.deviceId] = s; });
    const settings = Store.getSettings();

    let html = '<div class="grid-2" style="gap:14px;">';

    devices.forEach(dev => {
      const session = sessionMap[dev.id];
      const isActive = !!session && session.status === 'active';
      const isPaused = !!session && session.status === 'paused';

      if (session) {
        const elapsed = Utils.getElapsedSeconds(session.startTime, session.pausedTime || 0);
        const cost = Store.getSessionCost(session.id);

        html += `
          <div class="section-card" style="cursor:pointer;" onclick="SessionsPage.showSessionDetail('${session.id}')">
            <div class="section-header">
              <div class="section-title">${dev.icon} ${dev.name}</div>
              <div class="badge ${isActive ? 'badge-active' : 'badge-idle'}">${isActive ? 'نشط' : 'متوقف'}</div>
            </div>
            <div style="padding:16px;">
              <div class="mono" style="font-size:36px;font-weight:700;color:${isActive ? 'var(--cyan)' : 'var(--gold)'};text-align:center;margin-bottom:8px;" id="timer-${session.id}">
                ${Utils.formatTime(elapsed)}
              </div>
              <div style="text-align:center;margin-bottom:12px;">
                <div style="font-size:14px;font-weight:600;">👤 ${session.playerName}</div>
                <div style="font-size:13px;color:var(--gold);font-weight:600;margin-top:4px;">
                  💰 <span id="cost-${session.id}">${cost}</span> ${settings.currency}
                </div>
              </div>
              <div style="display:flex;gap:6px;">
                ${isActive ? `
                  <button class="btn btn-warning btn-sm" style="flex:1;" onclick="event.stopPropagation();SessionsPage.pauseSession('${session.id}')">⏸ إيقاف</button>
                ` : `
                  <button class="btn btn-primary btn-sm" style="flex:1;" onclick="event.stopPropagation();SessionsPage.resumeSession('${session.id}')">▶ استئناف</button>
                `}
                <button class="btn btn-danger btn-sm" style="flex:1;" onclick="event.stopPropagation();SessionsPage.endSessionModal('${session.id}')">⏹ إنهاء</button>
              </div>
            </div>
          </div>`;
      } else {
        html += `
          <div class="section-card" style="cursor:pointer;border-style:dashed;opacity:.8;" onclick="SessionsPage.quickStart('${dev.id}')">
            <div class="section-header">
              <div class="section-title">${dev.icon} ${dev.name}</div>
              <div class="badge badge-idle">متاح</div>
            </div>
            <div style="padding:24px;text-align:center;">
              <div style="font-size:36px;margin-bottom:8px;">⚡</div>
              <div style="color:var(--muted);font-size:13px;margin-bottom:12px;">جاهز للاستخدام</div>
              <div style="font-size:12px;color:var(--gold);">${dev.hourlyRate} ${settings.currency}/ساعة</div>
              <button class="btn btn-primary btn-sm mt-12" onclick="event.stopPropagation();SessionsPage.quickStart('${dev.id}')">+ بدء جلسة</button>
            </div>
          </div>`;
      }
    });

    html += '</div>';
    return html;
  }

  function renderHistory() {
    const sessions = Store.getAll('sessions')
      .filter(s => s.status === 'ended')
      .sort((a, b) => new Date(b.endTime) - new Date(a.endTime));
    const settings = Store.getSettings();

    const filtered = Utils.searchFilter(sessions, searchQuery, ['playerName', 'deviceName']);

    let html = `<div style="margin-bottom:12px;">${Components.renderSearchBar('ابحث باسم الزبون أو الجهاز...', (q) => { searchQuery = q; refreshHistory(); })}</div>`;

    if (filtered.length === 0) {
      html += Components.renderEmpty('📋', 'لا توجد جلسات سابقة', 'ابدأ أول جلسة الآن');
      return html;
    }

    html += `<div class="section-card"><div class="table-wrap"><table>
      <thead><tr>
        <th>الجهاز</th><th>الزبون</th><th>المدة</th><th>التكلفة</th><th>الدفع</th><th>التاريخ</th>
      </tr></thead><tbody>`;

    filtered.slice(0, 50).forEach(s => {
      html += `<tr>
        <td>${s.deviceName || s.deviceId}</td>
        <td style="font-weight:600;">${s.playerName}</td>
        <td class="mono">${Utils.formatDuration(s.durationMinutes || 0)}</td>
        <td class="mono" style="color:var(--cyan);font-weight:700;">${Utils.formatNumber(s.totalCost || s.cost || 0)} ${settings.currency}</td>
        <td><span class="badge ${s.paymentMethod === 'debt' ? 'badge-danger' : 'badge-active'}">${Utils.paymentMethodLabel(s.paymentMethod)}</span></td>
        <td style="font-size:12px;color:var(--muted);">${Utils.formatDateShort(s.endTime)} ${Utils.formatTimeOnly(s.endTime)}</td>
      </tr>`;
    });

    html += '</tbody></table></div></div>';
    return html;
  }

  function refreshHistory() {
    const container = Utils.$('#page-content');
    if (container && activeTab === 'history') {
      App.refresh();
    }
  }

  function calcTotalHours(sessions) {
    let total = 0;
    sessions.forEach(s => {
      if (s.durationMinutes) {
        total += s.durationMinutes;
      } else if (s.startTime) {
        total += (new Date() - new Date(s.startTime)) / 60000;
      }
    });
    return (total / 60).toFixed(1);
  }

  function switchTab(tab) {
    activeTab = tab;
    App.refresh();
  }

  // ── Quick Start Session ──
  function quickStart(deviceId) {
    const device = Store.getById('devices', deviceId);
    if (!device) return;
    const customers = Store.getAll('customers');

    let customerOptions = '<option value="">-- بدون تسجيل --</option>';
    customers.forEach(c => {
      customerOptions += `<option value="${c.id}">${c.name} (${c.phone})</option>`;
    });

    const body = `
      <div class="form-group">
        <label class="form-label">الجهاز</label>
        <div style="font-size:16px;font-weight:700;color:var(--cyan);">${device.icon} ${device.name}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:4px;">${device.hourlyRate} ${Store.getSettings().currency}/ساعة</div>
      </div>
      <div class="form-group">
        <label class="form-label">اسم الزبون</label>
        <input type="text" id="session-player" class="form-input" placeholder="اكتب اسم الزبون" required>
      </div>
      <div class="form-group">
        <label class="form-label">أو اختر من العملاء</label>
        <select id="session-customer" class="form-select" onchange="document.getElementById('session-player').value=this.options[this.selectedIndex].text.split('(')[0].trim()">
          ${customerOptions}
        </select>
      </div>
    `;

    const footer = `
      <button class="btn btn-primary" onclick="SessionsPage.confirmStart('${deviceId}')">🎮 بدء الجلسة</button>
      <button class="btn btn-ghost" onclick="Components.closeModal()">إلغاء</button>
    `;

    Components.showModal('بدء جلسة جديدة', body, footer, { icon: '🎮' });
  }

  function confirmStart(deviceId) {
    const playerName = Utils.$('#session-player')?.value?.trim();
    const customerId = Utils.$('#session-customer')?.value || null;
    if (!playerName) {
      Components.showToast('⚠️', 'خطأ', 'اكتب اسم الزبون');
      return;
    }

    const session = Store.startSession(deviceId, playerName, customerId);
    if (session) {
      Components.closeModal();
      Components.showToast('🎮', 'تم بدء الجلسة', `${session.deviceName} — ${playerName}`);
      App.refresh();
    }
  }

  // ── End Session ──
  function endSessionModal(sessionId) {
    const session = Store.getById('sessions', sessionId);
    if (!session) return;
    const cost = Store.getSessionCost(sessionId);
    const sessionOrders = Store.query('orders', o => o.sessionId === sessionId);
    const orderTotal = sessionOrders.reduce((s, o) => s + o.total, 0);
    const totalCost = cost + orderTotal;
    const settings = Store.getSettings();

    const body = `
      <div style="text-align:center;margin-bottom:16px;">
        <div style="font-size:14px;color:var(--muted);">${session.deviceName}</div>
        <div style="font-size:16px;font-weight:700;margin:4px 0;">${session.playerName}</div>
      </div>
      <div style="background:var(--surface);border-radius:12px;padding:16px;margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;">
          <span>تكلفة الجلسة</span>
          <span class="mono" style="color:var(--cyan);font-weight:700;">${cost} ${settings.currency}</span>
        </div>
        ${orderTotal > 0 ? `
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-top:1px solid var(--border);">
          <span>طلبات البار (${sessionOrders.length})</span>
          <span class="mono" style="color:var(--gold);font-weight:700;">${orderTotal} ${settings.currency}</span>
        </div>` : ''}
        <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:15px;font-weight:700;border-top:1px solid var(--border);margin-top:4px;">
          <span>الإجمالي</span>
          <span class="mono" style="color:var(--green);font-size:18px;">${totalCost} ${settings.currency}</span>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">طريقة الدفع</label>
        <select id="payment-method" class="form-select">
          <option value="cash">💵 كاش</option>
          <option value="ewallet">📱 محفظة إلكترونية</option>
          <option value="debt">💳 آجل (دين)</option>
        </select>
      </div>
    `;

    const footer = `
      <button class="btn btn-success" onclick="SessionsPage.confirmEnd('${sessionId}')">✅ إنهاء وتحصيل</button>
      <button class="btn btn-ghost" onclick="Components.closeModal()">إلغاء</button>
    `;

    Components.showModal('إنهاء الجلسة', body, footer, { icon: '🧾' });
  }

  function confirmEnd(sessionId) {
    const method = Utils.$('#payment-method')?.value || 'cash';
    const result = Store.endSession(sessionId, method);
    if (result) {
      Components.closeModal();
      Components.showToast('✅', 'تم إنهاء الجلسة',
        `${result.playerName} — ${Utils.formatNumber(result.totalCost || result.cost)} ${Store.getSettings().currency}`);
      App.refresh();
    }
  }

  // ── Pause/Resume ──
  function pauseSession(sessionId) {
    Store.pauseSession(sessionId);
    Components.showToast('⏸', 'تم الإيقاف المؤقت', 'الجلسة متوقفة');
    App.refresh();
  }

  function resumeSession(sessionId) {
    Store.resumeSession(sessionId);
    Components.showToast('▶', 'تم الاستئناف', 'الجلسة تعمل مرة أخرى');
    App.refresh();
  }

  // ── Session Detail ──
  function showSessionDetail(sessionId) {
    const session = Store.getById('sessions', sessionId);
    if (!session) return;
    const elapsed = Utils.getElapsedSeconds(session.startTime, session.pausedTime || 0);
    const cost = Store.getSessionCost(sessionId);
    const orders = Store.query('orders', o => o.sessionId === sessionId);
    const settings = Store.getSettings();

    let body = `
      <div style="text-align:center;margin-bottom:16px;">
        <div class="mono" style="font-size:42px;font-weight:700;color:var(--cyan);">${Utils.formatTime(elapsed)}</div>
        <div style="font-size:14px;color:var(--muted);margin-top:4px;">بدأت ${Utils.formatTimeOnly(session.startTime)}</div>
      </div>
      <div style="background:var(--surface);border-radius:12px;padding:14px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;">
          <span>👤 الزبون</span><span style="font-weight:600;">${session.playerName}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;">
          <span>💰 التكلفة الحالية</span><span class="mono" style="color:var(--cyan);font-weight:700;">${cost} ${settings.currency}</span>
        </div>
      </div>
    `;

    if (orders.length > 0) {
      body += `<div style="font-size:13px;font-weight:700;margin-bottom:8px;">☕ الطلبات (${orders.length})</div>`;
      orders.forEach(o => {
        body += `<div style="background:var(--surface);border-radius:8px;padding:8px 12px;margin-bottom:6px;font-size:12px;display:flex;justify-content:space-between;">
          <span>${o.items.map(i => i.icon + ' ' + i.name + '×' + i.qty).join(', ')}</span>
          <span class="mono" style="color:var(--gold);font-weight:700;">${o.total} ${settings.currency}</span>
        </div>`;
      });
    }

    body += `<button class="btn btn-primary btn-block mt-12" onclick="Components.closeModal();BarPage.newOrderForSession('${sessionId}')">☕ إضافة طلب بار</button>`;

    Components.showModal(session.deviceName, body, '', { icon: '🎮' });
  }

  function afterRender() {}

  return {
    render, afterRender, quickStart, confirmStart,
    endSessionModal, confirmEnd, pauseSession, resumeSession,
    showSessionDetail,
  };
})();

App.registerPage('sessions', SessionsPage);
