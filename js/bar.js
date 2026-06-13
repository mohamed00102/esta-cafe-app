/* ═══════════════════════════════════════════
   ريستا كافيه — إدارة البار (Bar / Orders)
   ═══════════════════════════════════════════ */

const BarPage = (() => {
  let activeTab = 'new-order';
  let cart = [];

  function render() {
    const settings = Store.getSettings();
    const products = Store.getAll('products');
    const todayOrders = Store.query('orders', o => Utils.isToday(o.createdAt));
    const pendingOrders = Store.query('orders', o => o.status === 'new' || o.status === 'preparing');
    const barRev = Store.getTodayRevenue().barRev;

    let html = Components.renderTopbar('إدارة', 'البار');

    // KPIs
    html += `<div class="kpi-row">
      <div class="kpi-card green">
        <div class="kpi-label">💰 مبيعات البار</div>
        <div class="kpi-value">${Utils.formatNumber(barRev)}</div>
        <div class="kpi-sub">${settings.currency} اليوم</div>
      </div>
      <div class="kpi-card gold">
        <div class="kpi-label">📋 طلبات اليوم</div>
        <div class="kpi-value">${todayOrders.length}</div>
        <div class="kpi-sub">طلب</div>
      </div>
      <div class="kpi-card cyan">
        <div class="kpi-label">⏳ قيد التحضير</div>
        <div class="kpi-value">${pendingOrders.length}</div>
        <div class="kpi-sub">طلب معلق</div>
      </div>
      <div class="kpi-card purple">
        <div class="kpi-label">☕ أصناف</div>
        <div class="kpi-value">${products.length}</div>
        <div class="kpi-sub">صنف متاح</div>
      </div>
    </div>`;

    // Tabs
    html += Components.renderTabs([
      { id: 'new-order', label: 'طلب جديد', icon: '➕' },
      { id: 'pending', label: 'المعلقة', icon: '⏳', count: pendingOrders.length },
      { id: 'history', label: 'السجل', icon: '📋' },
      { id: 'menu', label: 'القائمة', icon: '📝' },
    ], activeTab, (tab) => { activeTab = tab; App.refresh(); });

    switch (activeTab) {
      case 'new-order': html += renderNewOrder(); break;
      case 'pending': html += renderPending(); break;
      case 'history': html += renderOrderHistory(); break;
      case 'menu': html += renderMenu(); break;
    }

    return html;
  }

  function renderNewOrder() {
    const products = Store.getAll('products');
    const settings = Store.getSettings();
    const categories = [
      { id: 'all', label: 'الكل', icon: '🍽️' },
      { id: 'hot', label: 'مشروبات ساخنة', icon: '☕' },
      { id: 'cold', label: 'مشروبات باردة', icon: '🥤' },
      { id: 'snack', label: 'وجبات', icon: '🍟' },
    ];
    let selectedCat = 'all';

    let html = '<div class="grid-main" style="grid-template-columns:1fr 300px;">';

    // Products Grid
    html += '<div>';
    html += `<div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;">`;
    categories.forEach(cat => {
      html += `<button class="btn btn-sm ${cat.id === selectedCat ? 'btn-primary' : 'btn-ghost'}"
        onclick="BarPage.filterCategory('${cat.id}')">${cat.icon} ${cat.label}</button>`;
    });
    html += '</div>';

    html += '<div class="grid-3" style="gap:10px;" id="products-grid">';
    products.forEach(p => {
      const inv = Store.getInventoryItem(p.id);
      const stock = inv ? inv.quantity : 0;
      const outOfStock = stock <= 0;
      const cartItem = cart.find(c => c.productId === p.id);
      const qty = cartItem ? cartItem.qty : 0;

      html += `
        <div class="section-card" style="cursor:${outOfStock ? 'not-allowed' : 'pointer'};opacity:${outOfStock ? '.4' : '1'};padding:14px;text-align:center;${qty > 0 ? 'border-color:var(--cyan);' : ''}"
             onclick="${outOfStock ? '' : `BarPage.addToCart('${p.id}')`}">
          <div style="font-size:32px;margin-bottom:6px;">${p.icon}</div>
          <div style="font-size:13px;font-weight:700;">${p.name}</div>
          <div class="mono" style="font-size:16px;color:var(--cyan);font-weight:700;margin-top:4px;">${p.price} ${settings.currency}</div>
          ${outOfStock ? '<div style="font-size:10px;color:var(--red);margin-top:4px;">نفد المخزون</div>' :
          `<div style="font-size:10px;color:var(--muted);margin-top:4px;">متبقي: ${stock}</div>`}
          ${qty > 0 ? `
            <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:8px;">
              <button class="btn btn-sm btn-ghost" style="width:28px;height:28px;padding:0;" onclick="event.stopPropagation();BarPage.removeFromCart('${p.id}')">−</button>
              <span class="mono" style="font-size:16px;font-weight:700;color:var(--cyan);">${qty}</span>
              <button class="btn btn-sm btn-primary" style="width:28px;height:28px;padding:0;" onclick="event.stopPropagation();BarPage.addToCart('${p.id}')">+</button>
            </div>` : ''}
        </div>`;
    });
    html += '</div></div>';

    // Cart Sidebar
    const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
    html += `<div class="section-card" style="position:sticky;top:20px;align-self:start;">
      <div class="section-header">
        <div class="section-title">🛒 السلة</div>
        ${cart.length > 0 ? `<div class="section-action" onclick="BarPage.clearCart()">مسح</div>` : ''}
      </div>
      <div style="padding:12px;">`;

    if (cart.length === 0) {
      html += '<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px;">السلة فارغة<br>اضغط على صنف لإضافته</div>';
    } else {
      cart.forEach(item => {
        html += `
          <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);">
            <span style="font-size:18px;">${item.icon}</span>
            <div style="flex:1;">
              <div style="font-size:12px;font-weight:600;">${item.name}</div>
              <div style="font-size:11px;color:var(--muted);">${item.price} × ${item.qty}</div>
            </div>
            <div class="mono" style="font-size:13px;font-weight:700;color:var(--cyan);">${item.price * item.qty} ${settings.currency}</div>
          </div>`;
      });

      html += `
        <div style="display:flex;justify-content:space-between;padding:12px 0;font-size:15px;font-weight:700;border-top:1px solid var(--border);margin-top:8px;">
          <span>الإجمالي</span>
          <span class="mono" style="color:var(--green);font-size:18px;">${cartTotal} ${settings.currency}</span>
        </div>`;

      // Link to session/device
      const activeSessions = Store.getActiveSessions();
      html += `<div class="form-group mt-8">
        <label class="form-label">ربط بجلسة (اختياري)</label>
        <select id="order-session" class="form-select">
          <option value="">-- بدون ربط --</option>`;
      activeSessions.forEach(s => {
        html += `<option value="${s.id}">${s.deviceName} — ${s.playerName}</option>`;
      });
      html += `</select></div>`;

      html += `<button class="btn btn-success btn-block" onclick="BarPage.submitOrder()">✅ تأكيد الطلب — ${cartTotal} ${settings.currency}</button>`;
    }

    html += '</div></div></div>';
    return html;
  }

  function renderPending() {
    const pending = Store.query('orders', o => o.status === 'new' || o.status === 'preparing' || o.status === 'ready')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const settings = Store.getSettings();

    if (pending.length === 0) {
      return Components.renderEmpty('✅', 'لا توجد طلبات معلقة', 'كل الطلبات تم تسليمها');
    }

    let html = '<div class="grid-2" style="gap:12px;">';
    pending.forEach(order => {
      const statusColors = { 'new': 'var(--cyan)', preparing: 'var(--gold)', ready: 'var(--green)' };
      html += `
        <div class="section-card">
          <div class="section-header">
            <div class="section-title">
              <span class="badge ${Utils.orderStatusBadge(order.status)}">${Utils.orderStatusLabel(order.status)}</span>
              #${order.id.substr(-4)}
            </div>
            <div style="font-size:11px;color:var(--muted);">${Utils.timeAgo(order.createdAt)}</div>
          </div>
          <div style="padding:12px;">
            ${order.items.map(i => `
              <div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:13px;">
                <span>${i.icon}</span>
                <span style="flex:1;">${i.name}</span>
                <span class="mono" style="color:var(--muted);">×${i.qty}</span>
              </div>
            `).join('')}
            <div style="display:flex;justify-content:space-between;padding:8px 0;margin-top:8px;border-top:1px solid var(--border);font-weight:700;">
              <span>الإجمالي</span>
              <span class="mono" style="color:var(--cyan);">${order.total} ${settings.currency}</span>
            </div>
            <div style="display:flex;gap:6px;margin-top:8px;">
              ${order.status === 'new' ? `<button class="btn btn-warning btn-sm" style="flex:1;" onclick="BarPage.updateStatus('${order.id}','preparing')">🔄 بدء التحضير</button>` : ''}
              ${order.status === 'preparing' ? `<button class="btn btn-success btn-sm" style="flex:1;" onclick="BarPage.updateStatus('${order.id}','ready')">✅ جاهز</button>` : ''}
              ${order.status === 'ready' ? `<button class="btn btn-primary btn-sm" style="flex:1;" onclick="BarPage.updateStatus('${order.id}','delivered')">📦 تم التسليم</button>` : ''}
              <button class="btn btn-danger btn-sm" onclick="BarPage.updateStatus('${order.id}','cancelled')">✕</button>
            </div>
          </div>
        </div>`;
    });
    html += '</div>';
    return html;
  }

  function renderOrderHistory() {
    const orders = Store.query('orders', o => o.status === 'delivered' || o.status === 'cancelled')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const settings = Store.getSettings();

    if (orders.length === 0) {
      return Components.renderEmpty('📋', 'لا توجد طلبات سابقة', '');
    }

    let html = '<div class="section-card"><div class="table-wrap"><table><thead><tr>';
    html += '<th>#</th><th>الأصناف</th><th>الإجمالي</th><th>الحالة</th><th>الوقت</th></tr></thead><tbody>';

    orders.slice(0, 50).forEach(o => {
      html += `<tr>
        <td class="mono">${o.id.substr(-4)}</td>
        <td>${o.items.map(i => i.icon + ' ' + i.name + '×' + i.qty).join(', ')}</td>
        <td class="mono" style="color:var(--cyan);font-weight:700;">${o.total} ${settings.currency}</td>
        <td><span class="badge ${Utils.orderStatusBadge(o.status)}">${Utils.orderStatusLabel(o.status)}</span></td>
        <td style="font-size:12px;color:var(--muted);">${Utils.timeAgo(o.createdAt)}</td>
      </tr>`;
    });

    html += '</tbody></table></div></div>';
    return html;
  }

  function renderMenu() {
    const products = Store.getAll('products');
    const settings = Store.getSettings();

    const isAdmin = localStorage.getItem('resta_auth_role') === 'admin';
    let html = '';
    if (isAdmin) {
      html += `<div style="margin-bottom:12px;">
        <button class="btn btn-primary btn-sm" onclick="BarPage.addProductModal()">+ إضافة صنف</button>
      </div>`;
    }

    html += '<div class="section-card"><div class="table-wrap"><table><thead><tr>';
    html += `<th></th><th>الصنف</th><th>السعر</th><th>التكلفة</th><th>الربح</th><th>الفئة</th>${isAdmin ? '<th>إجراءات</th>' : ''}</tr></thead><tbody>`;

    products.forEach(p => {
      const profit = p.price - (p.costPrice || 0);
      html += `<tr>
        <td style="font-size:20px;">${p.icon}</td>
        <td style="font-weight:600;">${p.name}</td>
        <td class="mono" style="color:var(--cyan);font-weight:700;">${p.price} ${settings.currency}</td>
        <td class="mono" style="color:var(--muted);">${p.costPrice || 0} ${settings.currency}</td>
        <td class="mono" style="color:var(--green);font-weight:700;">${profit} ${settings.currency}</td>
        <td>${p.category === 'hot' ? '☕ ساخن' : p.category === 'cold' ? '🥤 بارد' : '🍟 وجبة'}</td>
        ${isAdmin ? `<td>
          <button class="btn btn-sm btn-ghost" onclick="BarPage.editProduct('${p.id}')">✏️</button>
          <button class="btn btn-sm btn-ghost" style="color:var(--red);" onclick="BarPage.deleteProduct('${p.id}')">🗑️</button>
        </td>` : ''}
      </tr>`;
    });

    html += '</tbody></table></div></div>';
    return html;
  }

  // ── Cart Actions ──
  function addToCart(productId) {
    const product = Store.getById('products', productId);
    if (!product) return;
    const existing = cart.find(c => c.productId === productId);
    if (existing) {
      existing.qty++;
    } else {
      cart.push({ productId, name: product.name, icon: product.icon, price: product.price, qty: 1 });
    }
    App.refresh();
  }

  function removeFromCart(productId) {
    const idx = cart.findIndex(c => c.productId === productId);
    if (idx === -1) return;
    cart[idx].qty--;
    if (cart[idx].qty <= 0) cart.splice(idx, 1);
    App.refresh();
  }

  function clearCart() { cart = []; App.refresh(); }

  function submitOrder() {
    if (cart.length === 0) return;
    const sessionId = Utils.$('#order-session')?.value || null;
    const session = sessionId ? Store.getById('sessions', sessionId) : null;

    const order = Store.createOrder(cart, sessionId, session?.customerId, session?.deviceId);
    if (order) {
      cart = [];
      Components.showToast('☕', 'تم إنشاء الطلب', `#${order.id.substr(-4)} — ${order.total} ${Store.getSettings().currency}`);
      App.refresh();
    }
  }

  function updateStatus(orderId, status) {
    Store.updateOrderStatus(orderId, status);
    const labels = { preparing: 'قيد التحضير', ready: 'جاهز', delivered: 'تم التسليم', cancelled: 'ملغي' };
    Components.showToast('📋', labels[status] || status, `طلب #${orderId.substr(-4)}`);
    App.refresh();
  }

  // ── New Order For Session (from sessions page) ──
  function newOrderForSession(sessionId) {
    activeTab = 'new-order';
    App.navigate('bar');
    setTimeout(() => {
      const sel = Utils.$('#order-session');
      if (sel) sel.value = sessionId;
    }, 100);
  }

  // ── Product CRUD ──
  function addProductModal() {
    const body = `
      <div class="form-row">
        <div class="form-group"><label class="form-label">الاسم</label><input type="text" id="prod-name" class="form-input" placeholder="اسم الصنف"></div>
        <div class="form-group"><label class="form-label">الأيقونة</label><input type="text" id="prod-icon" class="form-input" placeholder="☕" maxlength="2"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">سعر البيع</label><input type="number" id="prod-price" class="form-input" placeholder="0" inputmode="numeric"></div>
        <div class="form-group"><label class="form-label">سعر التكلفة</label><input type="number" id="prod-cost" class="form-input" placeholder="0" inputmode="numeric"></div>
      </div>
      <div class="form-group">
        <label class="form-label">الفئة</label>
        <select id="prod-cat" class="form-select">
          <option value="hot">☕ مشروبات ساخنة</option>
          <option value="cold">🥤 مشروبات باردة</option>
          <option value="snack">🍟 وجبات</option>
        </select>
      </div>
    `;
    const footer = `
      <button class="btn btn-primary" onclick="BarPage.saveProduct()">حفظ</button>
      <button class="btn btn-ghost" onclick="Components.closeModal()">إلغاء</button>
    `;
    Components.showModal('إضافة صنف جديد', body, footer, { icon: '➕' });
  }

  function saveProduct(editId) {
    const name = Utils.$('#prod-name')?.value?.trim();
    const icon = Utils.$('#prod-icon')?.value?.trim() || '🍽️';
    const price = parseInt(Utils.$('#prod-price')?.value) || 0;
    const costPrice = parseInt(Utils.$('#prod-cost')?.value) || 0;
    const category = Utils.$('#prod-cat')?.value || 'hot';

    if (!name || !price) {
      Components.showToast('⚠️', 'خطأ', 'اكتب الاسم والسعر');
      return;
    }

    if (editId) {
      Store.update('products', editId, { name, icon, price, costPrice, category });
    } else {
      const p = Store.add('products', { name, icon, price, costPrice, category, unit: 'قطعة' });
      // Add to inventory
      const inv = Store.getInventory();
      inv.push({ productId: p.id, quantity: 50, minThreshold: 15, maxCapacity: 100 });
      Store.set('inventory', inv);
    }

    Components.closeModal();
    Components.showToast('✅', 'تم الحفظ', name);
    App.refresh();
  }

  function editProduct(id) {
    const p = Store.getById('products', id);
    if (!p) return;
    addProductModal();
    setTimeout(() => {
      Utils.$('#prod-name').value = p.name;
      Utils.$('#prod-icon').value = p.icon;
      Utils.$('#prod-price').value = p.price;
      Utils.$('#prod-cost').value = p.costPrice || 0;
      Utils.$('#prod-cat').value = p.category;
      // Replace save button
      const btn = document.querySelector('.modal-footer .btn-primary');
      if (btn) btn.setAttribute('onclick', `BarPage.saveProduct('${id}')`);
    }, 100);
  }

  function deleteProduct(id) {
    const p = Store.getById('products', id);
    Components.confirmDelete(p?.name || '', () => {
      Store.removeItem('products', id);
      App.refresh();
    });
  }

  function filterCategory(cat) {
    // Simple visual filter - re-render with filter
    App.refresh();
  }

  function afterRender() {}

  return {
    render, afterRender,
    addToCart, removeFromCart, clearCart, submitOrder,
    updateStatus, newOrderForSession,
    addProductModal, saveProduct, editProduct, deleteProduct,
    filterCategory,
  };
})();

App.registerPage('bar', BarPage);
