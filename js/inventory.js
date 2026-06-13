/* ═══════════════════════════════════════════
   ريستا كافيه — المخزون (Inventory)
   ═══════════════════════════════════════════ */

const InventoryPage = (() => {
  let activeTab = 'stock';

  function render() {
    const inv = Store.getInventory();
    const products = Store.getAll('products');
    const settings = Store.getSettings();
    const low = Store.getLowInventory();

    let html = Components.renderTopbar('إدارة', 'المخزون');

    html += `<div class="kpi-row">
      <div class="kpi-card green"><div class="kpi-label">📦 إجمالي الأصناف</div><div class="kpi-value">${inv.length}</div><div class="kpi-sub">صنف</div></div>
      <div class="kpi-card red"><div class="kpi-label">⚠️ منخفض</div><div class="kpi-value">${low.length}</div><div class="kpi-sub">يحتاج إعادة طلب</div></div>
      <div class="kpi-card cyan"><div class="kpi-label">📊 متوسط المخزون</div><div class="kpi-value">${inv.length > 0 ? Math.round(inv.reduce((s, i) => s + Utils.pct(i.quantity, i.maxCapacity), 0) / inv.length) : 0}%</div><div class="kpi-sub">نسبة الامتلاء</div></div>
      <div class="kpi-card gold"><div class="kpi-label">📋 حركات اليوم</div><div class="kpi-value">${Store.query('stockMovements', m => Utils.isToday(m.createdAt)).length}</div><div class="kpi-sub">حركة</div></div>
    </div>`;

    html += Components.renderTabs([
      { id: 'stock', label: 'المخزون', icon: '📦' },
      { id: 'movements', label: 'الحركات', icon: '🔄' },
      { id: 'reorder', label: 'أوامر الشراء', icon: '🛒', count: low.length },
    ], activeTab, (tab) => { activeTab = tab; App.refresh(); });

    switch (activeTab) {
      case 'stock': html += renderStock(inv, products, settings); break;
      case 'movements': html += renderMovements(settings); break;
      case 'reorder': html += renderReorder(low, settings); break;
    }
    return html;
  }

  function renderStock(inv, products, settings) {
    let html = '<div class="section-card"><div class="table-wrap"><table><thead><tr>';
    html += '<th></th><th>الصنف</th><th>الكمية</th><th>المستوى</th><th>الحد الأدنى</th><th>إجراءات</th></tr></thead><tbody>';

    inv.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return;
      const p = Utils.pct(item.quantity, item.maxCapacity);
      html += `<tr>
        <td style="font-size:20px;">${product.icon}</td>
        <td style="font-weight:600;">${product.name}</td>
        <td class="mono" style="font-weight:700;">${item.quantity} / ${item.maxCapacity}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="flex:1;height:6px;background:var(--border);border-radius:3px;min-width:60px;">
              <div style="height:100%;border-radius:3px;width:${p}%;background:${Utils.pctColor(p)};"></div>
            </div>
            <span style="font-size:12px;font-weight:700;color:${Utils.pctColor(p)};">${p}%</span>
          </div>
        </td>
        <td class="mono">${item.minThreshold}</td>
        <td>
          <button class="btn btn-sm btn-success" onclick="InventoryPage.addStockModal('${item.productId}')">+ إضافة</button>
        </td>
      </tr>`;
    });

    html += '</tbody></table></div></div>';
    return html;
  }

  function renderMovements(settings) {
    const movements = Store.getAll('stockMovements').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const products = Store.getAll('products');

    if (movements.length === 0) {
      return Components.renderEmpty('🔄', 'لا توجد حركات', 'الحركات تُسجل تلقائياً عند البيع أو الإضافة');
    }

    let html = '<div class="section-card"><div class="table-wrap"><table><thead><tr>';
    html += '<th>الوقت</th><th>الصنف</th><th>النوع</th><th>الكمية</th><th>الرصيد</th><th>السبب</th></tr></thead><tbody>';

    movements.slice(0, 50).forEach(m => {
      const product = products.find(p => p.id === m.productId);
      html += `<tr>
        <td style="font-size:12px;color:var(--muted);">${Utils.timeAgo(m.createdAt)}</td>
        <td>${product ? product.icon + ' ' + product.name : m.productId}</td>
        <td><span class="badge ${m.type === 'in' ? 'badge-active' : 'badge-danger'}">${m.type === 'in' ? '📥 وارد' : '📤 صادر'}</span></td>
        <td class="mono" style="font-weight:700;color:${m.type === 'in' ? 'var(--green)' : 'var(--red)'};">${m.type === 'in' ? '+' : '-'}${m.quantity}</td>
        <td class="mono">${m.balanceAfter}</td>
        <td style="font-size:12px;color:var(--muted);">${m.reason || '-'}</td>
      </tr>`;
    });

    html += '</tbody></table></div></div>';
    return html;
  }

  function renderReorder(low, settings) {
    if (low.length === 0) {
      return Components.renderEmpty('✅', 'المخزون كافٍ', 'لا توجد أصناف تحتاج إعادة طلب');
    }

    let html = '<div class="grid-2" style="gap:12px;">';
    low.forEach(item => {
      const needed = item.product ? (item.maxCapacity || 100) - item.quantity : 0;
      html += `<div class="section-card" style="border-color:${item.pct <= 10 ? 'var(--red)' : 'var(--gold)'}40;">
        <div style="padding:16px;text-align:center;">
          <div style="font-size:32px;margin-bottom:8px;">${item.product?.icon || '📦'}</div>
          <div style="font-size:15px;font-weight:700;">${item.product?.name}</div>
          <div style="font-size:24px;font-weight:700;color:${Utils.pctColor(item.pct)};margin:8px 0;" class="mono">${item.pct}%</div>
          <div style="font-size:12px;color:var(--muted);">متبقي: ${item.quantity} • مطلوب: ${needed}</div>
          <button class="btn btn-success btn-sm btn-block mt-12" onclick="InventoryPage.addStockModal('${item.productId}')">
            📦 إضافة مخزون (${needed})
          </button>
        </div>
      </div>`;
    });
    html += '</div>';
    return html;
  }

  function addStockModal(productId) {
    const product = Store.getById('products', productId);
    const inv = Store.getInventoryItem(productId);
    if (!product || !inv) return;

    const needed = inv.maxCapacity - inv.quantity;
    const body = `
      <div style="text-align:center;margin-bottom:16px;">
        <div style="font-size:36px;">${product.icon}</div>
        <div style="font-size:16px;font-weight:700;margin-top:8px;">${product.name}</div>
        <div style="font-size:13px;color:var(--muted);">الرصيد الحالي: ${inv.quantity} / ${inv.maxCapacity}</div>
      </div>
      <div class="form-group">
        <label class="form-label">الكمية المضافة</label>
        <input type="number" id="add-qty" class="form-input" value="${needed}" inputmode="numeric" min="1">
      </div>
      <div class="form-group">
        <label class="form-label">السبب</label>
        <input type="text" id="add-reason" class="form-input" value="إعادة تعبئة المخزون">
      </div>
    `;
    const footer = `
      <button class="btn btn-success" onclick="InventoryPage.confirmAddStock('${productId}')">📦 إضافة</button>
      <button class="btn btn-ghost" onclick="Components.closeModal()">إلغاء</button>
    `;
    Components.showModal('إضافة مخزون', body, footer, { icon: '📦' });
  }

  function confirmAddStock(productId) {
    const qty = parseInt(Utils.$('#add-qty')?.value) || 0;
    const reason = Utils.$('#add-reason')?.value || '';
    if (qty <= 0) return;

    Store.addInventory(productId, qty, reason);
    Components.closeModal();
    Components.showToast('📦', 'تم إضافة المخزون', `+${qty} وحدة`);
    App.refresh();
  }

  function afterRender() {}

  return { render, afterRender, addStockModal, confirmAddStock };
})();

App.registerPage('inventory', InventoryPage);
