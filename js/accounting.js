/* ═══════════════════════════════════════════
   ريستا كافيه — المحاسبة (Accounting)
   Double-Entry Bookkeeping
   ═══════════════════════════════════════════ */

const AccountingPage = (() => {
  let activeTab = 'summary';

  function render() {
    const settings = Store.getSettings();
    const rev = Store.getTodayRevenue();
    const weeklyRev = Store.getWeeklyRevenue();
    const weekTotal = weeklyRev.reduce((s, d) => s + d.total, 0);
    const entries = Store.getAll('journalEntries')
      .filter(e => Utils.isToday(e.date))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    let html = Components.renderTopbar('المحاسبة', 'التلقائية');

    // KPIs
    html += `<div class="kpi-row">
      <div class="kpi-card cyan">
        <div class="kpi-label">💰 إيرادات اليوم</div>
        <div class="kpi-value">${Utils.formatNumber(rev.total)}</div>
        <div class="kpi-sub">${settings.currency}</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-label">📈 صافي الربح</div>
        <div class="kpi-value">${Utils.formatNumber(rev.net)}</div>
        <div class="kpi-sub">${settings.currency}</div>
      </div>
      <div class="kpi-card red">
        <div class="kpi-label">📉 المصروفات</div>
        <div class="kpi-value">${Utils.formatNumber(rev.expenses)}</div>
        <div class="kpi-sub">${settings.currency}</div>
      </div>
      <div class="kpi-card gold">
        <div class="kpi-label">📅 الأسبوع</div>
        <div class="kpi-value">${Utils.formatNumber(weekTotal)}</div>
        <div class="kpi-sub">${settings.currency}</div>
      </div>
    </div>`;

    // Tabs
    html += Components.renderTabs([
      { id: 'summary', label: 'الملخص', icon: '📊' },
      { id: 'journal', label: 'دفتر اليومية', icon: '📒' },
      { id: 'expenses', label: 'المصروفات', icon: '📉' },
      { id: 'reports', label: 'التقارير', icon: '📋' },
    ], activeTab, (tab) => { activeTab = tab; App.refresh(); });

    switch (activeTab) {
      case 'summary': html += renderSummary(rev, weeklyRev, settings); break;
      case 'journal': html += renderJournal(entries, settings); break;
      case 'expenses': html += renderExpenses(settings); break;
      case 'reports': html += renderReports(settings); break;
    }

    return html;
  }

  function renderSummary(rev, weeklyRev, settings) {
    const chartData = weeklyRev.map(d => d.total);

    let html = '<div class="grid-2">';

    // Revenue Breakdown
    html += `<div class="section-card">
      <div class="section-header">
        <div class="section-title"><span class="icon">💰</span> تفاصيل الإيرادات</div>
      </div>
      <div style="padding:16px;">
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);font-size:14px;">
          <div><div style="font-weight:700;">🎮 جلسات الألعاب</div></div>
          <div class="mono" style="color:var(--green);font-weight:700;font-size:16px;">+ ${Utils.formatNumber(rev.sessionRev)} ${settings.currency}</div>
        </div>
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);font-size:14px;">
          <div><div style="font-weight:700;">☕ مبيعات البار</div></div>
          <div class="mono" style="color:var(--green);font-weight:700;font-size:16px;">+ ${Utils.formatNumber(rev.barRev)} ${settings.currency}</div>
        </div>
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);font-size:14px;">
          <div><div style="font-weight:700;">📉 المصروفات</div></div>
          <div class="mono" style="color:var(--red);font-weight:700;font-size:16px;">- ${Utils.formatNumber(rev.expenses)} ${settings.currency}</div>
        </div>
        <div style="display:flex;justify-content:space-between;padding:12px 0;font-size:16px;font-weight:900;border-top:2px solid var(--border);margin-top:4px;">
          <div>صافي الربح</div>
          <div class="mono" style="color:var(--cyan);font-size:20px;">${Utils.formatNumber(rev.net)} ${settings.currency}</div>
        </div>
      </div>
    </div>`;

    // Weekly Chart
    html += `<div class="section-card">
      <div class="section-header">
        <div class="section-title"><span class="icon">📈</span> الرسم البياني الأسبوعي</div>
      </div>
      <div style="padding:16px;">
        ${Utils.createSparkline(chartData, 320, 120, '#00e5ff')}
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-top:8px;">
          ${weeklyRev.map(d => `<span>${d.dayName}</span>`).join('')}
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          ${weeklyRev.map(d => `
            <div style="flex:1;text-align:center;background:var(--surface);border-radius:8px;padding:6px 4px;">
              <div style="font-size:9px;color:var(--muted);">${d.dayName}</div>
              <div class="mono" style="font-size:12px;font-weight:700;color:${d.total > 0 ? 'var(--cyan)' : 'var(--muted)'};">${d.total}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>`;

    html += '</div>';

    // Daily Close Button
    html += `<div style="margin-top:16px;text-align:center;">
      <button class="btn btn-primary btn-lg" onclick="AccountingPage.dailyClose()">
        🔒 إقفال يومي — إنشاء تقرير اليوم
      </button>
    </div>`;

    return html;
  }

  function renderJournal(entries, settings) {
    let html = `<div style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:13px;color:var(--muted);">${entries.length} قيد اليوم</span>
      <button class="btn btn-sm btn-ghost" onclick="AccountingPage.exportJournal()">📤 تصدير CSV</button>
    </div>`;

    if (entries.length === 0) {
      return html + Components.renderEmpty('📒', 'لا توجد قيود اليوم', 'القيود تتكون تلقائياً عند إنهاء الجلسات والطلبات');
    }

    html += '<div class="section-card"><div class="table-wrap"><table><thead><tr>';
    html += '<th>الوقت</th><th>الوصف</th><th>مدين</th><th>دائن</th><th>المبلغ</th></tr></thead><tbody>';

    entries.forEach(e => {
      html += `<tr>
        <td style="font-size:12px;color:var(--muted);">${Utils.formatTimeOnly(e.date)}</td>
        <td style="font-weight:600;font-size:13px;">${e.description}</td>
        <td style="font-size:12px;">${accountLabel(e.debit?.account)}</td>
        <td style="font-size:12px;">${accountLabel(e.credit?.account)}</td>
        <td class="mono" style="font-weight:700;color:var(--cyan);">${Utils.formatNumber(e.debit?.amount || 0)} ${settings.currency}</td>
      </tr>`;
    });

    html += '</tbody></table></div></div>';
    return html;
  }

  function renderExpenses(settings) {
    let html = `<div style="margin-bottom:16px;">
      <button class="btn btn-primary" onclick="AccountingPage.addExpenseModal()">+ إضافة مصروف</button>
    </div>`;

    const expenses = Store.query('journalEntries', e =>
      e.debit?.account?.startsWith('expense_') || e.category
    ).sort((a, b) => new Date(b.date) - new Date(a.date));

    if (expenses.length === 0) {
      return html + Components.renderEmpty('📉', 'لا توجد مصروفات', 'أضف مصروفات الكافيه (إيجار، كهرباء، رواتب، إلخ)');
    }

    html += '<div class="section-card"><div class="table-wrap"><table><thead><tr>';
    html += '<th>التاريخ</th><th>الوصف</th><th>الفئة</th><th>المبلغ</th></tr></thead><tbody>';

    expenses.forEach(e => {
      const cat = e.category || 'general';
      html += `<tr>
        <td style="font-size:12px;color:var(--muted);">${Utils.formatDateShort(e.date)}</td>
        <td style="font-weight:600;">${e.description}</td>
        <td><span class="badge badge-idle">${expenseCategoryLabel(cat)}</span></td>
        <td class="mono" style="color:var(--red);font-weight:700;">${Utils.formatNumber(e.debit?.amount || e.credit?.amount || 0)} ${settings.currency}</td>
      </tr>`;
    });

    html += '</tbody></table></div></div>';
    return html;
  }

  function renderReports(settings) {
    const closings = Store.getAll('dailyClosings')
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    let html = '<h3 class="mb-12">📋 تقارير الإقفال اليومي</h3>';

    if (closings.length === 0) {
      return html + Components.renderEmpty('📋', 'لا توجد تقارير', 'اضغط "إقفال يومي" لإنشاء تقرير');
    }

    html += '<div class="grid-2" style="gap:12px;">';
    closings.forEach(c => {
      html += `<div class="section-card" style="cursor:pointer;" onclick="AccountingPage.showClosingDetail('${c.id}')">
        <div class="section-header">
          <div class="section-title">📅 ${c.dateStr || Utils.formatDateShort(c.date)}</div>
        </div>
        <div style="padding:14px;">
          <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;">
            <span>الإيرادات</span>
            <span class="mono" style="color:var(--green);font-weight:700;">${Utils.formatNumber(c.revenue?.total || 0)} ${settings.currency}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;">
            <span>المصروفات</span>
            <span class="mono" style="color:var(--red);font-weight:700;">${Utils.formatNumber(c.revenue?.expenses || 0)} ${settings.currency}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:14px;font-weight:700;border-top:1px solid var(--border);margin-top:4px;">
            <span>الصافي</span>
            <span class="mono" style="color:var(--cyan);">${Utils.formatNumber(c.revenue?.net || 0)} ${settings.currency}</span>
          </div>
          <div style="font-size:11px;color:var(--muted);margin-top:6px;">
            ${c.totalSessions} جلسة • ${c.totalOrders} طلب • أقفل: ${c.closedBy}
          </div>
        </div>
      </div>`;
    });
    html += '</div>';
    return html;
  }

  // ── Helpers ──
  function accountLabel(acc) {
    const map = {
      cash: '💵 الصندوق', receivables: '💳 مدينون', inventory: '📦 مخزون',
      session_revenue: '🎮 إيراد جلسات', bar_revenue: '☕ إيراد بار',
      expense_rent: '🏠 إيجار', expense_utilities: '💡 كهرباء/مياه',
      expense_salary: '👥 رواتب', expense_supplies: '🛒 مشتريات',
      expense_maintenance: '🔧 صيانة', expense_general: '📌 عام',
    };
    return map[acc] || acc || '-';
  }

  function expenseCategoryLabel(cat) {
    const map = {
      rent: '🏠 إيجار', utilities: '💡 كهرباء', salary: '👥 رواتب',
      supplies: '🛒 مشتريات', maintenance: '🔧 صيانة', general: '📌 عام',
    };
    return map[cat] || cat;
  }

  // ── Add Expense ──
  function addExpenseModal() {
    const body = `
      <div class="form-group">
        <label class="form-label">الوصف</label>
        <input type="text" id="exp-desc" class="form-input" placeholder="مثال: فاتورة كهرباء شهر يونيو">
      </div>
      <div class="form-group">
        <label class="form-label">المبلغ</label>
        <input type="number" id="exp-amount" class="form-input" placeholder="0" inputmode="numeric">
      </div>
      <div class="form-group">
        <label class="form-label">الفئة</label>
        <select id="exp-cat" class="form-select">
          <option value="rent">🏠 إيجار</option>
          <option value="utilities">💡 كهرباء / مياه</option>
          <option value="salary">👥 رواتب</option>
          <option value="supplies">🛒 مشتريات عامة</option>
          <option value="maintenance">🔧 صيانة</option>
          <option value="general">📌 أخرى</option>
        </select>
      </div>
    `;
    const footer = `
      <button class="btn btn-primary" onclick="AccountingPage.saveExpense()">حفظ المصروف</button>
      <button class="btn btn-ghost" onclick="Components.closeModal()">إلغاء</button>
    `;
    Components.showModal('إضافة مصروف', body, footer, { icon: '📉' });
  }

  function saveExpense() {
    const desc = Utils.$('#exp-desc')?.value?.trim();
    const amount = parseInt(Utils.$('#exp-amount')?.value) || 0;
    const category = Utils.$('#exp-cat')?.value || 'general';
    if (!desc || !amount) {
      Components.showToast('⚠️', 'خطأ', 'اكتب الوصف والمبلغ');
      return;
    }
    Store.addExpense(desc, amount, category);
    Components.closeModal();
    Components.showToast('✅', 'تم تسجيل المصروف', `${desc} — ${amount} ${Store.getSettings().currency}`);
    App.refresh();
  }

  // ── Daily Close ──
  function dailyClose() {
    Components.confirmModal('إقفال يومي', 'سيتم إنشاء تقرير بكل عمليات اليوم. هل تريد المتابعة؟', () => {
      const closing = Store.dailyClose();
      Components.showToast('🔒', 'تم الإقفال', `صافي: ${Utils.formatNumber(closing.revenue.net)} ${Store.getSettings().currency}`);
      activeTab = 'reports';
      App.refresh();
    }, { icon: '🔒', confirmText: 'إقفال اليوم' });
  }

  function showClosingDetail(id) {
    const c = Store.getById('dailyClosings', id);
    if (!c) return;
    const settings = Store.getSettings();
    const body = `
      <div style="text-align:center;margin-bottom:16px;">
        <div style="font-size:14px;color:var(--muted);">تقرير يوم</div>
        <div style="font-size:18px;font-weight:700;">${c.dateStr}</div>
      </div>
      <div style="background:var(--surface);border-radius:12px;padding:14px;margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:14px;">
          <span>🎮 جلسات</span><span class="mono" style="color:var(--green);font-weight:700;">+ ${Utils.formatNumber(c.revenue?.sessionRev || 0)} ${settings.currency}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:14px;">
          <span>☕ بار</span><span class="mono" style="color:var(--green);font-weight:700;">+ ${Utils.formatNumber(c.revenue?.barRev || 0)} ${settings.currency}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:14px;">
          <span>📉 مصروفات</span><span class="mono" style="color:var(--red);font-weight:700;">- ${Utils.formatNumber(c.revenue?.expenses || 0)} ${settings.currency}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:16px;font-weight:900;border-top:1px solid var(--border);">
          <span>صافي</span><span class="mono" style="color:var(--cyan);">${Utils.formatNumber(c.revenue?.net || 0)} ${settings.currency}</span>
        </div>
      </div>
      <div style="font-size:12px;color:var(--muted);text-align:center;">
        ${c.totalSessions} جلسة • ${c.totalOrders} طلب • أقفل بواسطة: ${c.closedBy}
      </div>
    `;
    Components.showModal('تقرير الإقفال', body, '', { icon: '📋' });
  }

  // ── Export ──
  function exportJournal() {
    const entries = Store.getAll('journalEntries');
    const data = entries.map(e => ({
      التاريخ: Utils.formatDateShort(e.date),
      الوقت: Utils.formatTimeOnly(e.date),
      الوصف: e.description,
      'الحساب المدين': e.debit?.account || '',
      'المبلغ المدين': e.debit?.amount || 0,
      'الحساب الدائن': e.credit?.account || '',
      'المبلغ الدائن': e.credit?.amount || 0,
    }));
    Utils.exportCSV(data, `دفتر-اليومية-${Utils.todayStr()}.csv`);
    Components.showToast('📤', 'تم التصدير', 'ملف CSV جاهز للتحميل');
  }

  function afterRender() {}

  return {
    render, afterRender, addExpenseModal, saveExpense,
    dailyClose, showClosingDetail, exportJournal,
  };
})();

App.registerPage('accounting', AccountingPage);
