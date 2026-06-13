/* ═══════════════════════════════════════════
   ريستا كافيه — العملاء وبرنامج الولاء (Customers)
   ═══════════════════════════════════════════ */

const CustomersPage = (() => {
  let activeTab = 'list';
  let searchQuery = '';

  function render() {
    const customers = Store.getAll('customers');
    const settings = Store.getSettings();
    const totalDebt = customers.reduce((s, c) => s + (c.debt || 0), 0);
    const totalPoints = customers.reduce((s, c) => s + (c.points || 0), 0);

    let html = Components.renderTopbar('إدارة', 'العملاء');

    html += `<div class="kpi-row">
      <div class="kpi-card cyan"><div class="kpi-label">👥 عدد العملاء</div><div class="kpi-value">${customers.length}</div><div class="kpi-sub">عميل مسجل</div></div>
      <div class="kpi-card gold"><div class="kpi-label">⭐ نقاط الولاء</div><div class="kpi-value">${Utils.formatNumber(totalPoints)}</div><div class="kpi-sub">إجمالي النقاط</div></div>
      <div class="kpi-card red"><div class="kpi-label">💳 الديون</div><div class="kpi-value">${Utils.formatNumber(totalDebt)}</div><div class="kpi-sub">${settings.currency} مستحقة</div></div>
      <div class="kpi-card green"><div class="kpi-label">📈 إجمالي الإنفاق</div><div class="kpi-value">${Utils.formatNumber(customers.reduce((s, c) => s + (c.totalSpent || 0), 0))}</div><div class="kpi-sub">${settings.currency}</div></div>
    </div>`;

    html += `<div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">
      <button class="btn btn-primary" onclick="CustomersPage.addCustomerModal()">+ عميل جديد</button>
      ${Components.renderSearchBar('ابحث باسم أو رقم الهاتف...', (q) => { searchQuery = q; App.refresh(); })}
    </div>`;

    html += Components.renderTabs([
      { id: 'list', label: 'العملاء', icon: '👥' },
      { id: 'loyalty', label: 'الولاء', icon: '⭐' },
      { id: 'debts', label: 'الديون', icon: '💳', count: customers.filter(c => c.debt > 0).length },
    ], activeTab, (tab) => { activeTab = tab; App.refresh(); });

    switch (activeTab) {
      case 'list': html += renderList(customers, settings); break;
      case 'loyalty': html += renderLoyalty(customers, settings); break;
      case 'debts': html += renderDebts(customers, settings); break;
    }
    return html;
  }

  function renderList(customers, settings) {
    const filtered = Utils.searchFilter(customers, searchQuery, ['name', 'phone']);

    if (filtered.length === 0) {
      return Components.renderEmpty('👥', 'لا يوجد عملاء', 'أضف عميل جديد');
    }

    let html = '<div class="section-card"><div class="table-wrap"><table><thead><tr>';
    html += '<th>الاسم</th><th>الهاتف</th><th>الزيارات</th><th>الإنفاق</th><th>النقاط</th><th>المحفظة</th><th>الدين</th><th>إجراءات</th></tr></thead><tbody>';

    filtered.forEach(c => {
      html += `<tr>
        <td style="font-weight:700;">${c.name}</td>
        <td class="mono" style="font-size:12px;">${c.phone || '-'}</td>
        <td class="mono">${c.visits || 0}</td>
        <td class="mono" style="color:var(--cyan);font-weight:700;">${Utils.formatNumber(c.totalSpent || 0)}</td>
        <td><span class="badge badge-idle">⭐ ${c.points || 0}</span></td>
        <td class="mono" style="color:var(--green);font-weight:700;">${c.walletBalance || 0}</td>
        <td class="mono" style="color:${c.debt > 0 ? 'var(--red)' : 'var(--muted)'}; font-weight:700;">${c.debt > 0 ? c.debt + ' ' + settings.currency : '-'}</td>
        <td style="display:flex;gap:4px;">
          <button class="btn btn-sm btn-ghost" onclick="CustomersPage.chargeWalletModal('${c.id}')" title="شحن المحفظة">💵</button>
          <button class="btn btn-sm btn-ghost" onclick="CustomersPage.editCustomer('${c.id}')" title="تعديل">✏️</button>
          ${c.debt > 0 ? `<button class="btn btn-sm btn-approve" onclick="CustomersPage.payDebtModal('${c.id}')" title="تسديد دين">💳</button>` : ''}
          ${localStorage.getItem('resta_auth_role') === 'admin' ? `<button class="btn btn-sm btn-ghost" style="color:var(--red);" onclick="CustomersPage.deleteCustomer('${c.id}')" title="حذف">🗑️</button>` : ''}
        </td>
      </tr>`;
    });

    html += '</tbody></table></div></div>';
    return html;
  }

  function renderLoyalty(customers, settings) {
    const sorted = [...customers].sort((a, b) => (b.points || 0) - (a.points || 0));

    let html = `<div style="background:var(--card);border:1px solid var(--border);border-radius:16px;padding:20px;margin-bottom:16px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <span style="font-size:28px;">⭐</span>
        <div>
          <div style="font-size:16px;font-weight:700;">برنامج الولاء</div>
          <div style="font-size:12px;color:var(--muted);">${settings.loyaltyPointsPerHour} نقطة/ساعة لعب • ${settings.loyaltyPointsPerPurchase} نقاط/طلب بار • ${settings.freeSessionPoints} نقطة = جلسة مجانية</div>
        </div>
      </div>
    </div>`;

    html += '<div class="grid-3" style="gap:12px;">';
    sorted.slice(0, 12).forEach((c, i) => {
      const rankEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '⭐';
      html += `<div class="section-card" style="text-align:center;padding:16px;">
        <div style="font-size:24px;">${rankEmoji}</div>
        <div style="font-size:14px;font-weight:700;margin:6px 0;">${c.name}</div>
        <div class="mono" style="font-size:22px;font-weight:700;color:var(--gold);">${c.points || 0}</div>
        <div style="font-size:11px;color:var(--muted);">${c.visits || 0} زيارة</div>
        ${(c.points || 0) >= settings.freeSessionPoints ?
          `<button class="btn btn-sm btn-success mt-8" onclick="CustomersPage.redeemPoints('${c.id}')">🎁 استبدال جلسة</button>` : ''}
      </div>`;
    });
    html += '</div>';
    return html;
  }

  function renderDebts(customers, settings) {
    const debtors = customers.filter(c => c.debt > 0).sort((a, b) => b.debt - a.debt);
    if (debtors.length === 0) {
      return Components.renderEmpty('✅', 'لا توجد ديون', 'كل العملاء سددوا مستحقاتهم');
    }

    let html = '<div class="grid-2" style="gap:12px;">';
    debtors.forEach(c => {
      html += `<div class="section-card" style="border-color:rgba(255,23,68,.3);">
        <div style="padding:16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="font-size:15px;font-weight:700;">${c.name}</div>
            <div class="mono" style="font-size:22px;font-weight:700;color:var(--red);">${c.debt} ${settings.currency}</div>
          </div>
          <div style="font-size:12px;color:var(--muted);margin-top:4px;">${c.phone || ''}</div>
          <button class="btn btn-sm btn-success btn-block mt-12" onclick="CustomersPage.payDebtModal('${c.id}')">💳 تسديد الدين</button>
        </div>
      </div>`;
    });
    html += '</div>';
    return html;
  }

  // ── Modals ──
  function addCustomerModal() {
    const body = `
      <div class="form-group"><label class="form-label">الاسم</label><input type="text" id="cust-name" class="form-input" placeholder="اسم العميل"></div>
      <div class="form-group"><label class="form-label">رقم الهاتف</label><input type="tel" id="cust-phone" class="form-input" placeholder="01xxxxxxxxx" inputmode="tel"></div>
    `;
    const footer = `
      <button class="btn btn-primary" onclick="CustomersPage.saveCustomer()">حفظ</button>
      <button class="btn btn-ghost" onclick="Components.closeModal()">إلغاء</button>
    `;
    Components.showModal('عميل جديد', body, footer, { icon: '👥' });
  }

  function saveCustomer(editId) {
    const name = Utils.$('#cust-name')?.value?.trim();
    const phone = Utils.$('#cust-phone')?.value?.trim();
    if (!name) { Components.showToast('⚠️', 'خطأ', 'اكتب اسم العميل'); return; }
    if (editId) {
      Store.update('customers', editId, { name, phone });
    } else {
      Store.addCustomer({ name, phone });
    }
    Components.closeModal();
    Components.showToast('✅', 'تم الحفظ', name);
    App.refresh();
  }

  function editCustomer(id) {
    const c = Store.getById('customers', id);
    if (!c) return;
    addCustomerModal();
    setTimeout(() => {
      Utils.$('#cust-name').value = c.name;
      Utils.$('#cust-phone').value = c.phone || '';
      const btn = document.querySelector('.modal-footer .btn-primary');
      if (btn) btn.setAttribute('onclick', `CustomersPage.saveCustomer('${id}')`);
    }, 100);
  }

  function deleteCustomer(id) {
    const c = Store.getById('customers', id);
    Components.confirmDelete(c?.name || '', () => { Store.removeItem('customers', id); App.refresh(); });
  }

  function chargeWalletModal(id) {
    const c = Store.getById('customers', id);
    if (!c) return;
    const body = `
      <div style="text-align:center;margin-bottom:16px;">
        <div style="font-size:16px;font-weight:700;">${c.name}</div>
        <div class="mono" style="font-size:28px;font-weight:700;color:var(--green);margin-top:8px;">${c.walletBalance || 0} ${Store.getSettings().currency}</div>
        <div style="font-size:12px;color:var(--muted);">الرصيد الحالي بالمحفظة</div>
      </div>
      <div class="form-group"><label class="form-label">مبلغ الشحن</label><input type="number" id="wallet-amount" class="form-input" placeholder="0" inputmode="numeric"></div>
    `;
    const footer = `
      <button class="btn btn-success" onclick="CustomersPage.confirmChargeWallet('${id}')">💵 إيداع</button>
      <button class="btn btn-ghost" onclick="Components.closeModal()">إلغاء</button>
    `;
    Components.showModal('شحن محفظة كاش', body, footer, { icon: '💳' });
  }

  function confirmChargeWallet(id) {
    const amount = parseInt(Utils.$('#wallet-amount')?.value) || 0;
    if (amount <= 0) return;
    Store.chargeWallet(id, amount);
    Components.closeModal();
    Components.showToast('💳', 'تم شحن المحفظة', `${amount} ${Store.getSettings().currency}`);
    App.refresh();
  }

  function payDebtModal(id) {
    const c = Store.getById('customers', id);
    if (!c) return;
    const body = `
      <div style="text-align:center;margin-bottom:16px;">
        <div style="font-size:16px;font-weight:700;">${c.name}</div>
        <div class="mono" style="font-size:28px;font-weight:700;color:var(--red);margin-top:8px;">${c.debt} ${Store.getSettings().currency}</div>
        <div style="font-size:12px;color:var(--muted);">الدين المستحق</div>
      </div>
      <div class="form-group"><label class="form-label">المبلغ المسدد</label><input type="number" id="debt-amount" class="form-input" value="${c.debt}" inputmode="numeric"></div>
    `;
    const footer = `
      <button class="btn btn-success" onclick="CustomersPage.confirmPayDebt('${id}')">💵 تسديد</button>
      <button class="btn btn-ghost" onclick="Components.closeModal()">إلغاء</button>
    `;
    Components.showModal('تسديد دين', body, footer, { icon: '💳' });
  }

  function confirmPayDebt(id) {
    const amount = parseInt(Utils.$('#debt-amount')?.value) || 0;
    if (amount <= 0) return;
    Store.payDebt(id, amount);
    Components.closeModal();
    Components.showToast('💳', 'تم التسديد', `${amount} ${Store.getSettings().currency}`);
    App.refresh();
  }

  function redeemPoints(id) {
    const settings = Store.getSettings();
    Components.confirmModal('استبدال نقاط', `سيتم خصم ${settings.freeSessionPoints} نقطة مقابل جلسة مجانية`, () => {
      if (Store.redeemPoints(id, settings.freeSessionPoints)) {
        Components.showToast('🎁', 'تم الاستبدال', 'جلسة مجانية — أبلغ الزبون');
        App.refresh();
      }
    }, { icon: '🎁', confirmText: 'استبدال' });
  }

  function afterRender() {}

  return { render, afterRender, addCustomerModal, saveCustomer, editCustomer, deleteCustomer, payDebtModal, confirmPayDebt, redeemPoints, chargeWalletModal, confirmChargeWallet };
})();

App.registerPage('customers', CustomersPage);
