/* ═══════════════════════════════════════════
   ريستا كافيه — بوابة العميل (Client Portal)
   Self-Service, Wallet, Wheel, Ads
   ═══════════════════════════════════════════ */

const ClientPage = (() => {
  let activeCustomer = null;
  let activeTab = 'home';
  let cart = [];

  // ── INIT & RENDER ──
  function render() {
    // Check authentication
    const cid = localStorage.getItem('resta_client_id');
    if (cid) activeCustomer = Store.getById('customers', cid);

    if (!activeCustomer) {
      return renderLogin();
    }

    return renderPortal();
  }

  function renderLogin() {
    const settings = Store.getSettings();
    const builder = settings.builder || {
      themeColor: '#00e5ff',
      hideWheel: false,
      disableDrinks: false,
      welcomeMessage: 'مرحباً بك في ريستا كافيه'
    };

    return `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;background:var(--bg);">
        <div class="section-card" style="width:100%;max-width:400px;padding:30px 20px;text-align:center;">
          <div style="font-size:48px;margin-bottom:12px;">🎮</div>
          <h2 style="margin-bottom:8px;">${builder.welcomeMessage}</h2>
          <p style="color:var(--muted);font-size:13px;margin-bottom:24px;">سجل دخولك لطلب مشروباتك وحجز الأجهزة!</p>
          
          <div class="form-group" style="text-align:right;">
            <label class="form-label">رقم الهاتف</label>
            <input type="tel" id="client-phone" class="form-input" placeholder="01xxxxxxxxx" inputmode="tel" style="text-align:left;direction:ltr;">
          </div>
          
          <div class="form-group" style="text-align:right;">
            <label class="form-label">الاسم (للمستخدمين الجدد)</label>
            <input type="text" id="client-name" class="form-input" placeholder="الاسم الكريم">
          </div>

          <button class="btn btn-primary btn-block btn-lg mt-12" onclick="ClientPage.login()">تسجيل الدخول</button>
        </div>
      </div>
    `;
  }

  function login() {
    const phone = Utils.$('#client-phone')?.value?.trim();
    const name = Utils.$('#client-name')?.value?.trim();

    if (!phone) {
      Components.showToast('⚠️', 'خطأ', 'الرجاء إدخال رقم الهاتف');
      return;
    }

    let customers = Store.getAll('customers');
    let customer = customers.find(c => c.phone === phone);

    if (!customer) {
      if (!name) {
        Components.showToast('⚠️', 'خطأ', 'أنت مستخدم جديد، الرجاء إدخال اسمك');
        return;
      }
      customer = Store.addCustomer({ name, phone });
    }

    localStorage.setItem('resta_client_id', customer.id);
    activeCustomer = customer;
    App.refresh();
  }

  function logout() {
    localStorage.removeItem('resta_client_id');
    activeCustomer = null;
    App.refresh();
  }

  // ── MAIN PORTAL ──
  function renderPortal() {
    const settings = Store.getSettings();
    const builder = settings.builder || { hideWheel: false, disableDrinks: false, welcomeMessage: 'مرحباً بك' };
    const c = Store.getById('customers', activeCustomer.id); // fresh data
    if(c) activeCustomer = c;
    
    // Check if customer has an active session
    const activeSessions = Store.getActiveSessions();
    const mySession = activeSessions.find(s => s.customerId === activeCustomer.id);

    let html = `
      <div style="padding-bottom:80px;">
        <div style="background:var(--surface);padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:100;">
          <div>
            <div style="font-weight:700;font-size:16px;">مرحباً، ${activeCustomer.name.split(' ')[0]} 👋</div>
            <div style="font-size:12px;color:var(--muted);"><span style="color:var(--gold);">⭐ ${activeCustomer.points || 0} نقطة</span> • <span style="color:var(--cyan);">💳 محفظة: ${activeCustomer.walletBalance || 0} ${settings.currency}</span></div>
          </div>
          <button class="btn btn-sm btn-ghost" onclick="ClientPage.logout()">خروج 🚪</button>
        </div>
    `;

    html += `
      <div style="padding:16px;">
    `;

    // Active Session
    if (mySession) {
      const elapsed = Utils.getElapsedSeconds(mySession.startTime, mySession.pausedTime || 0);
      const cost = Store.getSessionCost(mySession.id);
      
      const sessionOrders = Store.query('orders', o => o.sessionId === mySession.id && o.status !== 'cancelled');
      let ordersHtml = '';
      if (sessionOrders.length > 0) {
        ordersHtml = `<div style="margin-top:16px; border-top:1px solid var(--border); padding-top:12px;">
          <div style="font-size:12px;color:var(--muted);margin-bottom:8px;">طلبات هذه الجلسة:</div>`;
        sessionOrders.forEach(o => {
          o.items.forEach(item => {
             ordersHtml += `
               <div style="display:flex; justify-content:space-between; font-size:13px; padding:4px 0;">
                 <span>${item.qty}x ${item.name}</span>
                 <span class="mono">${item.qty * item.price} ${settings.currency}</span>
               </div>
             `;
          });
        });
        ordersHtml += `</div>`;
      }

      html += `
        <div class="section-card" style="border-color:var(--cyan);background:rgba(0,229,255,.05);margin-bottom:20px;">
          <div style="padding:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <div style="font-size:12px;color:var(--muted);">جلستك الحالية</div>
                <div style="font-size:16px;font-weight:700;">${mySession.deviceName}</div>
                <div style="font-size:11px;color:var(--muted);margin-top:4px;">بدأت: ${Utils.formatTimeOnly(mySession.startTime)}</div>
              </div>
              <div style="text-align:left;">
                <div class="mono" style="font-size:24px;font-weight:700;color:var(--cyan);">${Utils.formatTime(elapsed)}</div>
                <div style="font-size:12px;color:var(--gold);">الإجمالي: ${cost} ${settings.currency}</div>
              </div>
            </div>
            ${mySession.status === 'paused' ? '<div style="margin-top:8px;font-size:12px;color:var(--gold);">⏸ الجلسة متوقفة مؤقتاً</div>' : ''}
            
            ${ordersHtml}

            <!-- Quick Actions within Session -->
            <div class="grid-3" style="gap:10px;margin-top:20px;">
              <div class="section-card" style="padding:10px;text-align:center;cursor:pointer;background:var(--surface);" onclick="ClientPage.requestHelp('waiter')">
                <div style="font-size:24px;margin-bottom:4px;">🛎️</div>
                <div style="font-size:11px;font-weight:700;">نداء الزاهي</div>
              </div>
              <div class="section-card" style="padding:10px;text-align:center;cursor:pointer;background:var(--surface);" onclick="ClientPage.requestHelp('controller')">
                <div style="font-size:24px;margin-bottom:4px;">🎮</div>
                <div style="font-size:11px;font-weight:700;">تغيير ذراع</div>
              </div>
              ${!builder.disableDrinks ? `
              <div class="section-card" style="padding:10px;text-align:center;cursor:pointer;background:var(--surface);" onclick="ClientPage.switchTab('menu')">
                <div style="font-size:24px;margin-bottom:4px;">☕</div>
                <div style="font-size:11px;font-weight:700;">طلب مشروب</div>
              </div>` : ''}
            </div>

          </div>
        </div>
      `;
    }

    // Tabs Content
    if (activeTab === 'home') html += renderHome(mySession);
    else if (activeTab === 'menu') html += renderMenu(mySession);
    else if (activeTab === 'devices') html += renderDevices(mySession);
    else if (activeTab === 'ads') html += renderAds();

    html += `</div></div>`; // End main padding

    // Client Bottom Nav
    html += `
      <nav class="bottom-nav" style="display:flex;">
        <div class="bnav-item ${activeTab==='home'?'active':''}" onclick="ClientPage.switchTab('home')">
          <span class="bnav-icon">🏠</span><span class="bnav-label">الرئيسية</span>
        </div>
        ${!builder.disableDrinks ? `
        <div class="bnav-item ${activeTab==='menu'?'active':''}" onclick="ClientPage.switchTab('menu')">
          <span class="bnav-icon">☕</span><span class="bnav-label">المنيو</span>
        </div>` : ''}
        <div class="bnav-item ${activeTab==='devices'?'active':''}" onclick="ClientPage.switchTab('devices')">
          <span class="bnav-icon">🎮</span><span class="bnav-label">حجز</span>
        </div>
        <div class="bnav-item ${activeTab==='ads'?'active':''}" onclick="ClientPage.switchTab('ads')">
          <span class="bnav-icon">🏆</span><span class="bnav-label">الأبطال</span>
        </div>
      </nav>
    `;

    return html;
  }

  function switchTab(tab) {
    activeTab = tab;
    App.refresh();
  }

  function renderHome(mySession) {
    const settings = Store.getSettings();
    const builder = settings.builder || {};
    let html = '';
    
    // Spin the Wheel Promo
    if (!builder.hideWheel) {
      const today = new Date().toDateString();
      const canSpin = activeCustomer.lastSpinDate !== today;

      html += `
        <div class="section-card" style="margin-bottom:20px;text-align:center;padding:20px;">
          <div style="font-size:48px;margin-bottom:12px;">🎡</div>
          <h3 style="margin-bottom:8px;">عجلة الحظ اليومية</h3>
          <p style="font-size:12px;color:var(--muted);margin-bottom:16px;">
            ${canSpin ? 'العب العجلة يومياً عند زيارتك للكافيه لربح مشروبات أو نقاط مجانية!' : 'لقد لعبت اليوم، عد غداً لفرصة جديدة!'}
          </p>
          <button class="btn btn-primary btn-lg" ${!canSpin ? 'disabled' : ''} onclick="ClientPage.openWheel()">
            ${canSpin ? 'العب الآن 🎁' : 'تم اللعب اليوم ✅'}
          </button>
        </div>
      `;
    }

    // Wallet Section
    html += `
      <div class="section-card" style="margin-bottom:20px;">
        <div class="section-header"><div class="section-title">💳 محفظة كاش</div></div>
        <div style="padding:16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <div style="font-size:13px;">الرصيد الحالي</div>
            <div class="mono" style="font-size:22px;font-weight:700;color:var(--green);">${activeCustomer.walletBalance || 0} ${Store.getSettings().currency}</div>
          </div>
          <p style="font-size:11px;color:var(--muted);line-height:1.5;">يمكنك استخدام رصيد المحفظة لحجز الأجهزة ودفع طلبات البار. اطلب من الكاشير شحن محفظتك نقداً.</p>
        </div>
      </div>
    `;

    return html;
  }

  function renderMenu(mySession) {
    const products = Store.getAll('products');
    let html = `<h3 class="mb-12">☕ منيو البار</h3>`;
    
    html += '<div class="grid-2" style="gap:10px;">';
    products.forEach(p => {
      const inCart = cart.find(c => c.productId === p.id);
      const qty = inCart ? inCart.qty : 0;
      
      // Select neon glow color based on category
      const glowColor = p.category === 'hot' ? 'var(--red-glow)' : p.category === 'cold' ? 'var(--cyan-glow)' : 'var(--gold-glow)';
      
      html += `
        <div class="section-card" style="padding:12px;text-align:center;box-shadow:${glowColor};border:1px solid rgba(255,255,255,0.1);">
          <div style="font-size:32px;margin-bottom:6px;filter:drop-shadow(0 0 8px rgba(255,255,255,0.6));">${p.icon}</div>
          <div style="font-size:13px;font-weight:700;">${p.name}</div>
          <div class="mono" style="font-size:15px;color:var(--cyan);font-weight:700;margin:6px 0;">${p.price} ${Store.getSettings().currency}</div>
          ${qty > 0 ? `
            <div style="display:flex;align-items:center;justify-content:center;gap:8px;">
              <button class="btn btn-sm btn-ghost" style="padding:0;width:24px;height:24px;" onclick="ClientPage.updateCart('${p.id}', -1)">-</button>
              <span class="mono" style="font-weight:700;">${qty}</span>
              <button class="btn btn-sm btn-primary" style="padding:0;width:24px;height:24px;" onclick="ClientPage.updateCart('${p.id}', 1)">+</button>
            </div>
          ` : `
            <button class="btn btn-sm btn-ghost" style="width:100%;" onclick="ClientPage.updateCart('${p.id}', 1)">+ إضافة</button>
          `}
        </div>
      `;
    });
    html += '</div>';

    // Floating Cart summary if items exist
    const total = cart.reduce((s, c) => s + (c.price * c.qty), 0);
    if (total > 0) {
      html += `
        <div style="position:fixed;bottom:70px;left:16px;right:16px;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px 16px;box-shadow:0 -5px 20px rgba(0,0,0,.5);display:flex;justify-content:space-between;align-items:center;z-index:100;">
          <div>
            <div style="font-size:12px;color:var(--muted);">الإجمالي</div>
            <div class="mono" style="font-size:18px;font-weight:700;color:var(--cyan);">${total} ${Store.getSettings().currency}</div>
          </div>
          <button class="btn btn-success" onclick="ClientPage.checkoutModal()">💳 إتمام الطلب</button>
        </div>
      `;
    }

    return html;
  }

  function updateCart(productId, change) {
    const p = Store.getById('products', productId);
    if (!p) return;
    const existing = cart.find(c => c.productId === productId);
    if (existing) {
      existing.qty += change;
      if (existing.qty <= 0) cart = cart.filter(c => c.productId !== productId);
    } else if (change > 0) {
      cart.push({ productId, name: p.name, icon: p.icon, price: p.price, qty: 1 });
    }
    App.refresh();
  }

  function checkoutModal() {
    const total = cart.reduce((s, c) => s + (c.price * c.qty), 0);
    const balance = activeCustomer.walletBalance || 0;
    const mySession = Store.getActiveSessions().find(s => s.customerId === activeCustomer.id);
    
    let paymentHtml = '';
    if (mySession) {
      paymentHtml = `
        <div style="background:rgba(0,229,255,.05);border:1px solid var(--cyan);padding:12px;border-radius:8px;text-align:center;">
          <div style="font-size:20px;margin-bottom:4px;">🎮</div>
          <div style="font-size:13px;font-weight:700;color:var(--cyan);">إضافة على حساب الجلسة</div>
          <div style="font-size:11px;color:var(--muted);margin-top:4px;">سيتم إضافة التكلفة (${total} ${Store.getSettings().currency}) لحساب جلستك.</div>
          <input type="hidden" id="checkout-method" value="session">
        </div>
      `;
    } else {
      paymentHtml = `
        <div class="form-group">
          <label class="form-label">طريقة الدفع</label>
          <select id="checkout-method" class="form-select">
            <option value="wallet">💳 خصم من المحفظة (الرصيد: ${balance})</option>
            <option value="cash">💵 الدفع نقداً للكاشير</option>
          </select>
        </div>
      `;
    }

    let body = `
      <div style="margin-bottom:16px;">
        ${cart.map(c => `
          <div style="display:flex;justify-content:space-between;font-size:13px;padding:4px 0;">
            <span>${c.icon} ${c.name} × ${c.qty}</span>
            <span class="mono">${c.price * c.qty}</span>
          </div>
        `).join('')}
        <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:700;padding-top:8px;border-top:1px solid var(--border);margin-top:8px;">
          <span>الإجمالي</span><span class="mono" style="color:var(--cyan);">${total} ${Store.getSettings().currency}</span>
        </div>
      </div>
      
      ${paymentHtml}
    `;

    const footer = `
      <button class="btn btn-success" onclick="ClientPage.submitOrder()">إرسال الطلب للبار</button>
      <button class="btn btn-ghost" onclick="Components.closeModal()">إلغاء</button>
    `;

    Components.showModal('تأكيد الطلب', body, footer, { icon: '🛒' });
  }

  function submitOrder() {
    const method = Utils.$('#checkout-method')?.value || 'cash';
    const total = cart.reduce((s, c) => s + (c.price * c.qty), 0);
    
    if (method === 'wallet') {
      if ((activeCustomer.walletBalance || 0) < total) {
        Components.showToast('⚠️', 'رصيد غير كافٍ', 'يرجى شحن المحفظة أو الدفع كاش');
        return;
      }
      Store.payWithWallet(activeCustomer.id, total, 'طلب مشروبات من الموبايل');
    }

    const mySession = Store.getActiveSessions().find(s => s.customerId === activeCustomer.id);
    Store.createOrder(cart, mySession?.id, activeCustomer.id, mySession?.deviceId);
    
    cart = [];
    Components.closeModal();
    Components.showToast('✅', 'تم الطلب', 'جاري تحضير طلبك...');
    App.refresh();
  }

  function renderDevices(mySession) {
    const devices = Store.getAll('devices');
    const settings = Store.getSettings();
    let html = `<h3 class="mb-12">🎮 الأجهزة المتاحة للحجز واللعب</h3>`;
    html += '<div class="grid-2" style="gap:10px;">';
    
    devices.forEach(d => {
      const isAvailable = d.status === 'idle';
      html += `
        <div class="section-card" style="padding:16px;text-align:center;">
          <div style="font-size:32px;margin-bottom:8px;opacity:${isAvailable?1:0.5};">${d.icon}</div>
          <div style="font-size:13px;font-weight:700;">${d.name}</div>
          <div style="font-size:11px;color:var(--muted);margin:6px 0;">${d.hourlyRate} ${settings.currency}/ساعة</div>
          
          ${isAvailable ? `<div style="font-size:11px;color:var(--green);font-weight:700;">متاح الآن</div>` : `<div style="font-size:11px;color:var(--red);font-weight:700;">مشغول حالياً</div>`}
          
          <div style="display:flex;gap:6px;margin-top:12px;">
            <button class="btn btn-sm btn-ghost" style="flex:1;font-size:11px;padding:0;" onclick="ClientPage.preBookDeviceModal('${d.id}')">📅 حجز لـ وقت آخر</button>
            ${isAvailable && !mySession ? `<button class="btn btn-sm btn-primary" style="flex:1;font-size:11px;padding:0;" onclick="ClientPage.bookDeviceModal('${d.id}')">▶️ العب الآن</button>` : ''}
          </div>
        </div>
      `;
    });
    html += '</div>';
    return html;
  }

  function bookDeviceModal(deviceId) {
    const d = Store.getById('devices', deviceId);
    const balance = activeCustomer.walletBalance || 0;
    
    const body = `
      <div style="text-align:center;margin-bottom:16px;">
        <div style="font-size:24px;">${d.icon}</div>
        <div style="font-weight:700;">${d.name}</div>
        <div style="font-size:12px;color:var(--muted);">${d.hourlyRate} ${Store.getSettings().currency}/ساعة</div>
      </div>
      <div class="form-group">
        <label class="form-label">المدة المطلوبة</label>
        <select id="book-dur" class="form-select" onchange="document.getElementById('book-cost').innerText = this.value * ${d.hourlyRate}">
          <option value="1">ساعة واحدة</option>
          <option value="2">ساعتان</option>
          <option value="3">3 ساعات</option>
        </select>
      </div>
      <div style="background:var(--surface);padding:10px;border-radius:8px;font-size:13px;margin-bottom:12px;display:flex;justify-content:space-between;">
        <span>التكلفة:</span>
        <span class="mono" style="color:var(--cyan);font-weight:700;"><span id="book-cost">${d.hourlyRate}</span> ${Store.getSettings().currency}</span>
      </div>
      <div style="font-size:12px;color:var(--muted);">رصيد محفظتك: ${balance}</div>
    `;

    const footer = `
      <button class="btn btn-primary" onclick="ClientPage.confirmBooking('${deviceId}')">تأكيد الدفع واللعب</button>
      <button class="btn btn-ghost" onclick="Components.closeModal()">إلغاء</button>
    `;

    Components.showModal('حجز الجهاز', body, footer, { icon: '🎮' });
  }

  function confirmBooking(deviceId) {
    const d = Store.getById('devices', deviceId);
    const durHours = parseInt(Utils.$('#book-dur')?.value) || 1;
    const cost = durHours * d.hourlyRate;

    if ((activeCustomer.walletBalance || 0) < cost) {
      Components.showToast('⚠️', 'رصيد المحفظة لا يكفي', 'يرجى شحن المحفظة أولاً من الكاشير');
      return;
    }

    // Pay from wallet
    Store.payWithWallet(activeCustomer.id, cost, `حجز جهاز ${d.name} مقدماً`);
    
    // Start session
    Store.startSession(deviceId, activeCustomer.name, activeCustomer.id);
    
    Components.closeModal();
    Components.showToast('✅', 'تم الحجز بنجاح', 'تفضل بالجلوس، وقتك بدأ!');
    switchTab('home');
  }

  function preBookDeviceModal(deviceId) {
    const d = Store.getById('devices', deviceId);
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    
    const body = `
      <div style="text-align:center;margin-bottom:16px;">
        <div style="font-size:24px;">${d.icon}</div>
        <div style="font-weight:700;">حجز مسبق: ${d.name}</div>
        <div style="font-size:12px;color:var(--muted);">${d.hourlyRate} ${Store.getSettings().currency}/ساعة</div>
      </div>
      <div class="form-group">
        <label class="form-label">تاريخ الحجز</label>
        <input type="date" id="client-book-date" class="form-input" value="${dateStr}">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">وقت الحضور</label>
          <input type="time" id="client-book-time" class="form-input" value="18:00">
        </div>
        <div class="form-group">
          <label class="form-label">المدة المطلوبة</label>
          <select id="client-book-dur" class="form-select">
            <option value="1">1 ساعة</option>
            <option value="2">2 ساعة</option>
            <option value="3">3 ساعات</option>
            <option value="4">4 ساعات</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">ملاحظات (اختياري)</label>
        <input type="text" id="client-book-notes" class="form-input" placeholder="مثال: ذراع إضافي">
      </div>
      <div style="font-size:11px;color:var(--muted);text-align:center;">سيتم إرسال الطلب للإدارة للموافقة وسيصلك إشعار.</div>
    `;

    const footer = `
      <button class="btn btn-primary" onclick="ClientPage.submitPreBooking('${deviceId}')">تأكيد طلب الحجز</button>
      <button class="btn btn-ghost" onclick="Components.closeModal()">إلغاء</button>
    `;

    Components.showModal('حجز مسبق لـ وقت آخر', body, footer, { icon: '📅' });
  }

  function submitPreBooking(deviceId) {
    const d = Store.getById('devices', deviceId);
    const date = Utils.$('#client-book-date')?.value;
    const time = Utils.$('#client-book-time')?.value;
    const duration = parseInt(Utils.$('#client-book-dur')?.value) || 1;
    const notes = Utils.$('#client-book-notes')?.value || '';

    if (!date || !time) {
      Components.showToast('⚠️', 'خطأ', 'يرجى إدخال التاريخ والوقت');
      return;
    }

    Store.addReservation({
      customerId: activeCustomer.id,
      customerName: activeCustomer.name,
      phone: activeCustomer.phone || '',
      deviceId: d.id,
      deviceName: d.name,
      date,
      startTime: time,
      duration,
      notes,
      source: 'client_portal'
    });

    Components.closeModal();
    Components.showToast('✅', 'تم الإرسال', 'تم إرسال طلب الحجز للإدارة بنجاح.');
    switchTab('home');
  }

  // ── ADS & WALL OF FAME ──
  function renderAds() {
    let html = `<h3 class="mb-12">🏆 حائط الشرف والإعلانات</h3>`;
    
    // Fake ads for demo
    const ads = [
      { id: 1, type: 'champion', title: 'بطل بطولة FIFA 26', img: '🏆', desc: 'تهانينا للاعب كريم أشرف!' },
      { id: 2, type: 'promo', title: 'عرض الويك إند', img: '🔥', desc: 'العب 3 ساعات واحصل على ساعة مجاناً!' },
    ];

    html += '<div style="display:flex;flex-direction:column;gap:12px;margin-bottom:20px;">';
    ads.forEach(ad => {
      html += `
        <div class="section-card" style="padding:20px;text-align:center;background:linear-gradient(135deg, rgba(0,229,255,0.1), transparent);">
          <div style="font-size:48px;margin-bottom:12px;">${ad.img}</div>
          <div style="font-size:16px;font-weight:700;margin-bottom:6px;">${ad.title}</div>
          <div style="font-size:13px;color:var(--muted);">${ad.desc}</div>
        </div>
      `;
    });
    html += '</div>';

    html += `
      <div class="section-card" style="padding:16px;text-align:center;">
        <div style="font-size:24px;margin-bottom:8px;">📢</div>
        <div style="font-size:14px;font-weight:700;">هل ترغب بنشر إعلانك هنا؟</div>
        <div style="font-size:11px;color:var(--muted);margin:8px 0;">يمكنك نشر صورة أو إعلان خاص بك ليراه جميع رواد الكافيه. التكلفة: 50 جنيه/يوم.</div>
        <button class="btn btn-sm btn-ghost" onclick="ClientPage.requestAdModal()">طلب نشر إعلان</button>
      </div>
    `;

    return html;
  }

  function requestAdModal() {
    const body = `
      <div class="form-group"><label class="form-label">عنوان الإعلان</label><input type="text" class="form-input" placeholder="عنوان"></div>
      <div class="form-group"><label class="form-label">نص الإعلان</label><textarea class="form-textarea" rows="3" placeholder="محتوى الإعلان"></textarea></div>
      <div style="font-size:11px;color:var(--muted);">سيتم إرسال الطلب للمدير للموافقة، وسيتم خصم 50 ج من محفظتك في حال الموافقة.</div>
    `;
    Components.showModal('طلب نشر إعلان', body, `<button class="btn btn-primary" onclick="Components.closeModal();Components.showToast('✅','تم الإرسال','الطلب قيد المراجعة لدى الإدارة');">إرسال الطلب</button>`, { icon: '📢' });
  }

  // ── WHEEL ──
  function openWheel() {
    const mySession = Store.getActiveSessions().find(s => s.customerId === activeCustomer.id);
    if (!mySession) {
      Components.showToast('⚠️', 'غير متاح', 'عجلة الحظ متاحة فقط للعملاء المتواجدين في جلسة لعب حالياً.');
      return;
    }

    const prizes = Store.AI_CalculateWheelPrizes(activeCustomer.id);
    
    // Basic wheel UI
    const body = `
      <div style="text-align:center;padding:20px 0;">
        <div id="wheel-circle" style="width:200px;height:200px;border-radius:50%;background:conic-gradient(var(--cyan) 0deg 120deg, var(--purple) 120deg 240deg, var(--gold) 240deg 360deg);margin:0 auto 20px;position:relative;transition:transform 3s cubic-bezier(0.2, 0.8, 0.2, 1);display:flex;align-items:center;justify-content:center;box-shadow:0 0 30px rgba(0,229,255,0.3);">
          <div style="width:20px;height:20px;background:var(--surface);border-radius:50%;position:absolute;z-index:2;"></div>
          <div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-top:15px solid var(--text);z-index:3;"></div>
        </div>
        <div id="wheel-result" style="font-size:16px;font-weight:700;height:24px;">اضغط لبدء الدوران!</div>
      </div>
    `;

    Components.showModal('عجلة الحظ', body, `<button class="btn btn-primary btn-block" id="spin-btn" onclick="ClientPage.spinWheel()">لف العجلة 🎡</button>`, { icon: '🎡' });
  }

  function spinWheel() {
    const btn = document.getElementById('spin-btn');
    if(btn) btn.disabled = true;

    const wheel = document.getElementById('wheel-circle');
    const resultDiv = document.getElementById('wheel-result');
    if (!wheel || !resultDiv) return;

    // AI selects prize based on probabilities
    const prizes = Store.AI_CalculateWheelPrizes(activeCustomer.id);
    let random = Math.random() * 100;
    let sum = 0;
    let selectedPrize = prizes[0];
    for(let p of prizes) {
      sum += p.probability;
      if (random <= sum) { selectedPrize = p; break; }
    }

    // Spin animation
    const spins = 5;
    const degree = (spins * 360) + Math.floor(Math.random() * 360);
    wheel.style.transform = `rotate(${degree}deg)`;

    setTimeout(() => {
      resultDiv.innerHTML = `🎉 مبروك! ربحت: <span style="color:var(--green)">${selectedPrize.name}</span>`;
      
      // Mark as spun today
      Store.update('customers', activeCustomer.id, { lastSpinDate: new Date().toDateString() });
      
      // Apply prize
      if (selectedPrize.type === 'points') {
        Store.update('customers', activeCustomer.id, { points: (activeCustomer.points || 0) + selectedPrize.value });
      } else {
        // Send notification to admin for product/time
        Store.requestHelp(activeCustomer.id, `won_${selectedPrize.type}_${selectedPrize.value}`);
      }

      setTimeout(() => { Components.closeModal(); App.refresh(); }, 3000);
    }, 3000);
  }

  // ── HELP REQUESTS ──
  function requestHelp(type) {
    const mySession = Store.getActiveSessions().find(s => s.customerId === activeCustomer.id);
    Store.requestHelp(activeCustomer.id, type, mySession?.deviceId);
    
    const labels = { 'waiter': 'النداء للنادل', 'controller': 'طلب تغيير ذراع' };
    Components.showToast('🔔', 'تم الإرسال', `${labels[type]} تم بنجاح، سيأتيك الموظف فوراً.`);
  }

  return { 
    render, login, logout, switchTab, 
    updateCart, checkoutModal, submitOrder,
    bookDeviceModal, confirmBooking,
    requestAdModal,
    openWheel, spinWheel,
    requestHelp,
    preBookDeviceModal, submitPreBooking
  };
})();

// Note: This won't automatically register in app.js if app.js doesn't know about it. 
// We will edit app.js to register ClientPage.
