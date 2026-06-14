/* ═══════════════════════════════════════════
   ريستا كافيه — نظام إدارة البيانات (Store)
   LocalStorage CRUD + Default Data
   ═══════════════════════════════════════════ */

const Store = (() => {
  const PREFIX = 'resta_';

  // ── CORE HELPERS ──
  function get(key) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  let isFirebaseInit = false;
  const deviceId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  
  if (typeof firebase !== 'undefined') {
    const firebaseConfig = {
      apiKey: "AIzaSyCjMhh6UQjAnfSCKcWgUO9y77P0OvS1U2U",
      authDomain: "resta-9798c.firebaseapp.com",
      databaseURL: "https://resta-9798c-default-rtdb.europe-west1.firebasedatabase.app",
      projectId: "resta-9798c",
      storageBucket: "resta-9798c.firebasestorage.app",
      messagingSenderId: "458126533760",
      appId: "1:458126533760:web:64f727ea944c96b21eb265",
      measurementId: "G-BC5LCML6YZ"
    };
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();
    
    // Sync data from Firebase to LocalStorage
    db.ref('store').on('child_added', (snapshot) => {
      const key = snapshot.key;
      const data = snapshot.val();
      if (data && data._sender !== deviceId) {
        localStorage.setItem(PREFIX + key, JSON.stringify(data.value));
        if (typeof App !== 'undefined' && App.refresh) App.refresh();
      }
    });
    
    db.ref('store').on('child_changed', (snapshot) => {
      const key = snapshot.key;
      const data = snapshot.val();
      if (data && data._sender !== deviceId) {
        localStorage.setItem(PREFIX + key, JSON.stringify(data.value));
        if (typeof App !== 'undefined' && App.refresh) App.refresh();
      }
    });
    
    isFirebaseInit = true;
  }

  function set(key, data, emit = true) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(data));
      if (emit && isFirebaseInit) {
        firebase.database().ref('store/' + key).set({
          value: data,
          _sender: deviceId,
          _ts: firebase.database.ServerValue.TIMESTAMP
        });
      }
      return true;
    } catch { return false; }
  }

  function remove(key) {
    localStorage.removeItem(PREFIX + key);
  }

  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  // ── DEFAULT DATA ──
  const DEFAULTS = {
    settings: {
      cafeName: 'ريستا كافيه',
      currency: 'ج',
      currencyFull: 'جنيه مصري',
      timezone: 'Africa/Cairo',
      openTime: '12:00',
      closeTime: '02:00',
      alertThresholds: {
        inventoryLow: 25,
        inventoryCritical: 10,
        sessionWarning: 120, // minutes
      },
      roles: {
        admin: { label: 'مدير', permissions: ['all'] },
        staff: { label: 'موظف', permissions: ['sessions', 'bar', 'reservations'] }
      },
      currentUser: { name: 'الاستاذ محمد', role: 'admin', avatar: 'م' },
      loyaltyPointsPerHour: 10,
      loyaltyPointsPerPurchase: 5,
      freeSessionPoints: 100,
      instagram: {
        pageName: 'resta.cafe',
        primaryColor: '#00e5ff',
        secondaryColor: '#d500f9',
      }
    },

    devices: [
      { id: 'ps1', name: 'PlayStation 1', type: 'ps', icon: '🕹️', hourlyRate: 0, halfHourRate: 0, status: 'idle' },
      { id: 'ps2', name: 'PlayStation 2', type: 'ps', icon: '🕹️', hourlyRate: 0, halfHourRate: 0, status: 'idle' },
      { id: 'ps3', name: 'PlayStation 3', type: 'ps', icon: '🕹️', hourlyRate: 0, halfHourRate: 0, status: 'idle' },
      { id: 'ps4', name: 'PlayStation 4', type: 'ps', icon: '🕹️', hourlyRate: 0, halfHourRate: 0, status: 'idle' },
      { id: 'bil1', name: 'بلياردو 1', type: 'billiard', icon: '🎱', hourlyRate: 0, halfHourRate: 0, status: 'idle' },
      { id: 'bil2', name: 'بلياردو 2', type: 'billiard', icon: '🎱', hourlyRate: 0, halfHourRate: 0, status: 'idle' },
      { id: 'pp1', name: 'بينج بونج', type: 'pingpong', icon: '🏓', hourlyRate: 0, halfHourRate: 0, status: 'idle' },
    ],

    products: [
      { id: 'p1', name: 'قهوة عربية', icon: '☕', price: 0, category: 'hot', unit: 'كوب', costPrice: 0 },
      { id: 'p2', name: 'كابتشينو', icon: '🧋', price: 0, category: 'hot', unit: 'كوب', costPrice: 0 },
      { id: 'p3', name: 'شاي كرك', icon: '🍵', price: 0, category: 'hot', unit: 'كوب', costPrice: 0 },
      { id: 'p4', name: 'نسكافيه', icon: '☕', price: 0, category: 'hot', unit: 'كوب', costPrice: 0 },
      { id: 'p5', name: 'شاي أخضر', icon: '🍵', price: 0, category: 'hot', unit: 'كوب', costPrice: 0 },
      { id: 'p6', name: 'عصير برتقال', icon: '🥤', price: 0, category: 'cold', unit: 'كوب', costPrice: 0 },
      { id: 'p7', name: 'عصير مانجو', icon: '🧃', price: 0, category: 'cold', unit: 'كوب', costPrice: 0 },
      { id: 'p8', name: 'عصير فراولة', icon: '🍓', price: 0, category: 'cold', unit: 'كوب', costPrice: 0 },
      { id: 'p9', name: 'موهيتو', icon: '🍹', price: 0, category: 'cold', unit: 'كوب', costPrice: 0 },
      { id: 'p10', name: 'مياه معدنية', icon: '💧', price: 0, category: 'cold', unit: 'زجاجة', costPrice: 0 },
      { id: 'p11', name: 'بيبسي', icon: '🥤', price: 0, category: 'cold', unit: 'علبة', costPrice: 0 },
      { id: 'p12', name: 'شيبس', icon: '🍟', price: 0, category: 'snack', unit: 'كيس', costPrice: 0 },
      { id: 'p13', name: 'ساندوتش', icon: '🥪', price: 0, category: 'snack', unit: 'قطعة', costPrice: 0 },
    ],

    inventory: [],

    sessions: [],
    reservations: [],
    orders: [],
    stockMovements: [],
    journalEntries: [],
    customers: [],
    tournaments: [],
    employees: [],
    tasks: [],
    dailyClosings: [],
    ads: [],
    helpRequests: [],
  };

  // ── INITIALIZATION ──
  function init() {
    if (get('db_version') !== '1.0.1') {
      localStorage.clear();
      set('db_version', '1.0.1', false);
    }

    Object.keys(DEFAULTS).forEach(key => {
      if (get(key) === null) {
        set(key, DEFAULTS[key], false); // false = do not emit to Firebase
      }
    });
  }

  // ── GENERIC COLLECTION CRUD ──
  function getAll(collection) {
    return get(collection) || [];
  }

  function getById(collection, id) {
    const items = getAll(collection);
    return items.find(item => item.id === id) || null;
  }

  function add(collection, item) {
    const items = getAll(collection);
    if (!item.id) item.id = genId();
    if (!item.createdAt) item.createdAt = new Date().toISOString();
    items.push(item);
    set(collection, items);
    return item;
  }

  function update(collection, id, updates) {
    const items = getAll(collection);
    const idx = items.findIndex(item => item.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
    set(collection, items);
    return items[idx];
  }

  function removeItem(collection, id) {
    const items = getAll(collection);
    const filtered = items.filter(item => item.id !== id);
    set(collection, filtered);
    return filtered.length !== items.length;
  }

  function query(collection, filterFn) {
    return getAll(collection).filter(filterFn);
  }

  // ── SETTINGS ──
  function getSettings() {
    return get('settings') || DEFAULTS.settings;
  }

  function updateSettings(updates) {
    const s = getSettings();
    const merged = deepMerge(s, updates);
    set('settings', merged);
    return merged;
  }

  function deepMerge(target, source) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  // ── SESSIONS ──
  function startSession(deviceId, playerName, customerId = null) {
    const device = getById('devices', deviceId);
    if (!device) return null;

    // Update device status
    updateDevice(deviceId, { status: 'active' });

    const session = {
      id: genId(),
      deviceId,
      deviceName: device.name,
      playerName,
      customerId,
      startTime: new Date().toISOString(),
      endTime: null,
      pausedTime: 0,
      cost: 0,
      status: 'active', // active, paused, ended
      orders: [],
      paymentMethod: null,
      createdAt: new Date().toISOString(),
    };

    add('sessions', session);
    return session;
  }

  function endSession(sessionId, paymentMethod = 'cash') {
    const session = getById('sessions', sessionId);
    if (!session) return null;

    const now = new Date();
    const start = new Date(session.startTime);
    const durationMs = now - start - (session.pausedTime || 0);
    const durationHours = durationMs / (1000 * 60 * 60);

    const device = getById('devices', session.deviceId);
    const cost = Math.ceil(durationHours * (device ? device.hourlyRate : 30));

    // Calculate order totals for this session
    const sessionOrders = query('orders', o => o.sessionId === sessionId);
    const orderTotal = sessionOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalCost = cost + orderTotal;

    // Update session
    const updated = update('sessions', sessionId, {
      endTime: now.toISOString(),
      cost,
      totalCost,
      orderTotal,
      status: 'ended',
      paymentMethod,
      durationMinutes: Math.round(durationMs / 60000),
    });

    // Update device status
    updateDevice(session.deviceId, { status: 'idle' });

    // Create journal entry
    addJournalEntry({
      description: `إيراد جلسة — ${session.deviceName} — ${session.playerName}`,
      debit: { account: paymentMethod === 'debt' ? 'receivables' : 'cash', amount: totalCost },
      credit: { account: 'session_revenue', amount: cost },
      creditExtra: orderTotal > 0 ? { account: 'bar_revenue', amount: orderTotal } : null,
      sessionId,
    });

    // Update customer loyalty
    if (session.customerId) {
      const customer = getById('customers', session.customerId);
      if (customer) {
        const settings = getSettings();
        const hours = Math.max(1, Math.round(durationHours));
        const newPoints = hours * settings.loyaltyPointsPerHour;
        update('customers', session.customerId, {
          points: (customer.points || 0) + newPoints,
          totalSpent: (customer.totalSpent || 0) + totalCost,
          visits: (customer.visits || 0) + 1,
          debt: paymentMethod === 'debt' ? (customer.debt || 0) + totalCost : customer.debt,
        });
      }
    }

    return updated;
  }

  function pauseSession(sessionId) {
    return update('sessions', sessionId, { status: 'paused', pauseStart: new Date().toISOString() });
  }

  function resumeSession(sessionId) {
    const session = getById('sessions', sessionId);
    if (!session || !session.pauseStart) return null;
    const pauseDuration = new Date() - new Date(session.pauseStart);
    return update('sessions', sessionId, {
      status: 'active',
      pauseStart: null,
      pausedTime: (session.pausedTime || 0) + pauseDuration,
    });
  }

  function getActiveSessions() {
    return query('sessions', s => s.status === 'active' || s.status === 'paused');
  }

  function getSessionCost(sessionId) {
    const session = getById('sessions', sessionId);
    if (!session) return 0;
    const now = new Date();
    const start = new Date(session.startTime);
    const durationMs = now - start - (session.pausedTime || 0);
    const durationHours = durationMs / (1000 * 60 * 60);
    const device = getById('devices', session.deviceId);
    return Math.ceil(durationHours * (device ? device.hourlyRate : 30));
  }

  // ── DEVICES ──
  function updateDevice(deviceId, updates) {
    const devices = getAll('devices');
    const idx = devices.findIndex(d => d.id === deviceId);
    if (idx === -1) return null;
    devices[idx] = { ...devices[idx], ...updates };
    set('devices', devices);
    return devices[idx];
  }

  function addDevice(device) {
    device.id = device.id || genId();
    device.status = 'idle';
    const devices = getAll('devices');
    devices.push(device);
    set('devices', devices);
    return device;
  }

  function removeDevice(deviceId) {
    const devices = getAll('devices').filter(d => d.id !== deviceId);
    set('devices', devices);
  }

  // ── ORDERS (BAR) ──
  function createOrder(items, sessionId = null, customerId = null, deviceId = null) {
    const total = items.reduce((sum, item) => sum + (item.price * item.qty), 0);

    const order = {
      id: genId(),
      items, // [{productId, name, icon, price, qty}]
      total,
      sessionId,
      customerId,
      deviceId,
      status: 'new', // new, preparing, ready, delivered, cancelled
      createdAt: new Date().toISOString(),
    };

    add('orders', order);

    // Deduct inventory
    items.forEach(item => {
      deductInventory(item.productId, item.qty, `طلب بار #${order.id.substr(-4)}`);
    });

    // If linked to session, add to session orders
    if (sessionId) {
      const session = getById('sessions', sessionId);
      if (session) {
        const orders = session.orders || [];
        orders.push(order.id);
        update('sessions', sessionId, { orders });
      }
    }

    return order;
  }

  function updateOrderStatus(orderId, status) {
    return update('orders', orderId, { status });
  }

  // ── INVENTORY ──
  function getInventory() {
    return get('inventory') || [];
  }

  function getInventoryItem(productId) {
    const inv = getInventory();
    return inv.find(i => i.productId === productId) || null;
  }

  function deductInventory(productId, qty, reason) {
    const inv = getInventory();
    const idx = inv.findIndex(i => i.productId === productId);
    if (idx === -1) return;
    inv[idx].quantity = Math.max(0, inv[idx].quantity - qty);
    inv[idx].lastUpdated = new Date().toISOString();
    set('inventory', inv);

    // Log movement
    add('stockMovements', {
      productId, type: 'out', quantity: qty, reason,
      balanceAfter: inv[idx].quantity,
    });
  }

  function addInventory(productId, qty, reason) {
    const inv = getInventory();
    const idx = inv.findIndex(i => i.productId === productId);
    if (idx === -1) return;
    inv[idx].quantity = Math.min(inv[idx].maxCapacity, inv[idx].quantity + qty);
    inv[idx].lastUpdated = new Date().toISOString();
    set('inventory', inv);

    // Log movement
    add('stockMovements', {
      productId, type: 'in', quantity: qty, reason,
      balanceAfter: inv[idx].quantity,
    });

    // Create expense entry
    const product = getById('products', productId);
    if (product) {
      addJournalEntry({
        description: `مشتريات مخزون — ${product.name} × ${qty}`,
        debit: { account: 'inventory', amount: product.costPrice * qty },
        credit: { account: 'cash', amount: product.costPrice * qty },
      });
    }
  }

  function getLowInventory() {
    const inv = getInventory();
    const products = getAll('products');
    return inv.filter(i => {
      const pct = (i.quantity / i.maxCapacity) * 100;
      return pct <= (getSettings().alertThresholds.inventoryLow || 25);
    }).map(i => {
      const product = products.find(p => p.id === i.productId);
      return { ...i, product, pct: Math.round((i.quantity / i.maxCapacity) * 100) };
    });
  }

  // ── ACCOUNTING ──
  function addJournalEntry(entry) {
    return add('journalEntries', {
      ...entry,
      date: new Date().toISOString(),
    });
  }

  function addExpense(description, amount, category = 'general') {
    return addJournalEntry({
      description,
      debit: { account: `expense_${category}`, amount },
      credit: { account: 'cash', amount },
      category,
    });
  }

  function getTodayRevenue() {
    const today = new Date().toDateString();
    const entries = getAll('journalEntries').filter(e => {
      return new Date(e.date).toDateString() === today;
    });

    let sessionRev = 0, barRev = 0, expenses = 0;
    entries.forEach(e => {
      if (e.credit && e.credit.account === 'session_revenue') sessionRev += e.credit.amount;
      if (e.credit && e.credit.account === 'bar_revenue') barRev += e.credit.amount;
      if (e.creditExtra && e.creditExtra.account === 'bar_revenue') barRev += e.creditExtra.amount;
      if (e.debit && e.debit.account && e.debit.account.startsWith('expense_')) expenses += e.debit.amount;
    });

    return { sessionRev, barRev, expenses, total: sessionRev + barRev, net: sessionRev + barRev - expenses };
  }

  function getRevenueByDateRange(startDate, endDate) {
    const entries = getAll('journalEntries').filter(e => {
      const d = new Date(e.date);
      return d >= startDate && d <= endDate;
    });
    return entries;
  }

  function dailyClose() {
    const today = new Date();
    const revenue = getTodayRevenue();
    const sessions = query('sessions', s => {
      return new Date(s.createdAt).toDateString() === today.toDateString();
    });
    const orders = query('orders', o => {
      return new Date(o.createdAt).toDateString() === today.toDateString();
    });

    const closing = {
      id: genId(),
      date: today.toISOString(),
      dateStr: today.toLocaleDateString('ar-EG'),
      revenue,
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.status === 'active').length,
      totalOrders: orders.length,
      closedBy: getSettings().currentUser.name,
    };

    add('dailyClosings', closing);
    return closing;
  }

  // ── RESERVATIONS ──
  function addReservation(data) {
    return add('reservations', {
      ...data,
      status: 'pending', // pending, confirmed, active, completed, cancelled
    });
  }

  function getTodayReservations() {
    const today = new Date().toDateString();
    return query('reservations', r => {
      return new Date(r.date).toDateString() === today && r.status !== 'cancelled';
    });
  }

  // ── CUSTOMERS ──
  function addCustomer(data) {
    return add('customers', {
      ...data,
      points: 0, totalSpent: 0, visits: 0, debt: 0,
    });
  }

  function payDebt(customerId, amount) {
    const customer = getById('customers', customerId);
    if (!customer) return null;
    const newDebt = Math.max(0, customer.debt - amount);
    update('customers', customerId, { debt: newDebt });

    addJournalEntry({
      description: `تحصيل دين — ${customer.name}`,
      debit: { account: 'cash', amount },
      credit: { account: 'receivables', amount },
    });

    return newDebt;
  }

  function redeemPoints(customerId, points) {
    const customer = getById('customers', customerId);
    if (!customer || customer.points < points) return false;
    update('customers', customerId, { points: customer.points - points });
    return true;
  }

  // ── TOURNAMENTS ──
  function createTournament(data) {
    const players = data.players || [];
    let matches = [];

    if (data.type === 'elimination') {
      matches = generateEliminationBracket(players);
    } else if (data.type === 'roundrobin') {
      matches = generateRoundRobin(players);
    }

    return add('tournaments', {
      ...data,
      players,
      matches,
      status: 'registration', // registration, active, completed
      currentRound: 1,
    });
  }

  function generateEliminationBracket(players) {
    const n = players.length;
    const rounds = Math.ceil(Math.log2(n));
    const matches = [];
    let matchId = 1;

    // First round
    for (let i = 0; i < Math.ceil(n / 2); i++) {
      matches.push({
        id: matchId++,
        round: 1,
        player1: players[i * 2] || null,
        player2: players[i * 2 + 1] || null,
        score1: 0,
        score2: 0,
        winner: players[i * 2 + 1] ? null : players[i * 2],
        status: players[i * 2 + 1] ? 'pending' : 'bye',
      });
    }

    // Subsequent rounds
    for (let r = 2; r <= rounds; r++) {
      const prevRoundMatches = matches.filter(m => m.round === r - 1);
      for (let i = 0; i < Math.ceil(prevRoundMatches.length / 2); i++) {
        matches.push({
          id: matchId++,
          round: r,
          player1: null,
          player2: null,
          score1: 0,
          score2: 0,
          winner: null,
          status: 'waiting',
          feedsFrom: [prevRoundMatches[i * 2]?.id, prevRoundMatches[i * 2 + 1]?.id],
        });
      }
    }

    return matches;
  }

  function generateRoundRobin(players) {
    const matches = [];
    let matchId = 1;
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        matches.push({
          id: matchId++,
          round: 1,
          player1: players[i],
          player2: players[j],
          score1: 0,
          score2: 0,
          winner: null,
          status: 'pending',
        });
      }
    }
    return matches;
  }

  // ── TASKS (Employee) ──
  function addTask(employeeId, description) {
    return add('tasks', {
      employeeId,
      description,
      status: 'pending', // pending, done
      assignedBy: getSettings().currentUser.name,
    });
  }

  // ── ALERTS / AI ALERTS ──
  function getAlerts() {
    const alerts = [];
    const settings = getSettings();

    // Low inventory alerts
    getLowInventory().forEach(item => {
      alerts.push({
        type: item.pct <= settings.alertThresholds.inventoryCritical ? 'critical' : 'warning',
        icon: '📦',
        color: item.pct <= settings.alertThresholds.inventoryCritical ? 'ai-red' : 'ai-gold',
        title: `مخزون ${item.pct <= settings.alertThresholds.inventoryCritical ? 'حرج' : 'منخفض'} — ${item.product?.name}`,
        desc: `متبقي ${item.quantity} ${item.product?.unit} (${item.pct}%)`,
        source: 'inventory',
      });
    });

    // Long sessions
    getActiveSessions().forEach(s => {
      const mins = (new Date() - new Date(s.startTime)) / 60000;
      if (mins > settings.alertThresholds.sessionWarning) {
        alerts.push({
          type: 'info',
          icon: '⏰',
          color: 'ai-cyan',
          title: `جلسة طويلة — ${s.deviceName}`,
          desc: `${s.playerName} — ${Math.round(mins)} دقيقة`,
          source: 'sessions',
          sessionId: s.id,
        });
      }
    });

    // Upcoming reservations
    const now = new Date();
    getTodayReservations().forEach(r => {
      if (r.status === 'confirmed') {
        const [h, m] = (r.startTime || '').split(':').map(Number);
        if (!isNaN(h)) {
          const resTime = new Date(now);
          resTime.setHours(h, m, 0);
          const diff = (resTime - now) / 60000;
          if (diff > 0 && diff <= 30) {
            alerts.push({
              type: 'info',
              icon: '📅',
              color: 'ai-purple',
              title: `حجز قادم — ${r.customerName}`,
              desc: `${r.deviceName || ''} في ${r.startTime}`,
              source: 'reservations',
            });
          }
        }
      }
    });

    // Customer debts
    query('customers', c => c.debt > 0).forEach(c => {
      if (c.debt >= 50) {
        alerts.push({
          type: 'warning',
          icon: '💳',
          color: 'ai-gold',
          title: `دين مرتفع — ${c.name}`,
          desc: `${c.debt} ${settings.currency} مستحقة`,
          source: 'customers',
        });
      }
    });

    // Help Requests (Client Portal)
    query('helpRequests', r => r.status === 'pending').forEach(r => {
      const c = getById('customers', r.customerId);
      const d = r.deviceId ? getById('devices', r.deviceId) : null;
      const deviceStr = d ? ` — ${d.name}` : '';
      const nameStr = c ? c.name : 'عميل مجهول';
      
      let title = '', icon = '', color = '';
      if (r.type === 'waiter') { title = `نداء نادل`; icon = '🛎️'; color = 'ai-cyan'; }
      else if (r.type === 'controller') { title = `تغيير ذراع`; icon = '🎮'; color = 'ai-purple'; }
      else if (r.type.startsWith('won_')) { title = `جائزة عميل (${r.type.split('_')[2]})`; icon = '🎁'; color = 'ai-green'; }
      else { title = `طلب مساعدة`; icon = '❓'; color = 'ai-gold'; }
      
      alerts.push({
        type: 'warning',
        icon, color,
        title: `${title}${deviceStr}`,
        desc: `طلب من ${nameStr}`,
        source: 'help_requests',
        requestId: r.id
      });
    });

    return alerts;
  }

  // ── STATS (Dashboard) ──
  function getDashboardStats() {
    const settings = getSettings();
    const devices = getAll('devices');
    const activeSessions = getActiveSessions();
    const today = new Date().toDateString();
    const todayOrders = query('orders', o => new Date(o.createdAt).toDateString() === today);
    const revenue = getTodayRevenue();
    const alerts = getAlerts();
    const pendingOrders = query('orders', o => o.status === 'new' || o.status === 'preparing');

    return {
      revenue: revenue.total,
      revenueNet: revenue.net,
      sessionRev: revenue.sessionRev,
      barRev: revenue.barRev,
      expenses: revenue.expenses,
      activeSessions: activeSessions.length,
      totalDevices: devices.length,
      todayOrders: todayOrders.length,
      pendingOrders: pendingOrders.length,
      alertCount: alerts.length,
      alerts,
    };
  }

  function getWeeklyRevenue() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toDateString();
      const entries = getAll('journalEntries').filter(e =>
        new Date(e.date).toDateString() === dayStr
      );
      let total = 0;
      entries.forEach(e => {
        if (e.credit && (e.credit.account === 'session_revenue' || e.credit.account === 'bar_revenue')) {
          total += e.credit.amount;
        }
        if (e.creditExtra && e.creditExtra.account === 'bar_revenue') {
          total += e.creditExtra.amount;
        }
      });
      days.push({
        date: d,
        dayName: d.toLocaleDateString('ar-EG', { weekday: 'short' }),
        total,
      });
    }
    return days;
  }

  // ── EXPORT / IMPORT ──
  function exportAll() {
    const data = {};
    Object.keys(DEFAULTS).forEach(key => {
      data[key] = get(key);
    });
    return JSON.stringify(data, null, 2);
  }

  function importAll(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      Object.keys(data).forEach(key => {
        set(key, data[key]);
      });
      return true;
    } catch { return false; }
  }

  function resetAll() {
    Object.keys(DEFAULTS).forEach(key => {
      set(key, DEFAULTS[key]);
    });
  }

  // ── CLIENT PORTAL & WALLET ──
  function chargeWallet(customerId, amount) {
    const customer = getById('customers', customerId);
    if (!customer) return false;
    update('customers', customerId, { walletBalance: (customer.walletBalance || 0) + amount });
    
    addJournalEntry({
      description: `شحن محفظة — ${customer.name}`,
      debit: { account: 'cash', amount },
      credit: { account: 'wallet_liability', amount },
    });
    return true;
  }

  function payWithWallet(customerId, amount, description) {
    const customer = getById('customers', customerId);
    if (!customer || (customer.walletBalance || 0) < amount) return false;
    update('customers', customerId, { walletBalance: customer.walletBalance - amount });
    
    addJournalEntry({
      description: `خصم من المحفظة — ${description} — ${customer.name}`,
      debit: { account: 'wallet_liability', amount },
      credit: { account: 'bar_revenue', amount },
    });
    return true;
  }

  function requestHelp(customerId, type, deviceId = null) {
    return add('helpRequests', {
      customerId,
      type, // 'waiter', 'controller', 'ad_request'
      deviceId,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
  }

  function AI_CalculateWheelPrizes(customerId) {
    const customer = getById('customers', customerId);
    if (!customer) return [];
    
    const spent = customer.totalSpent || 0;
    const isVIP = spent > 1000;
    
    let prizes = [
      { id: 'p1', name: '10 نقاط ولاء', type: 'points', value: 10, probability: 50 },
      { id: 'p2', name: '20 نقطة ولاء', type: 'points', value: 20, probability: 30 },
      { id: 'p3', name: 'خصم 10%', type: 'discount', value: 10, probability: 10 },
    ];
    
    if (isVIP) {
      prizes.push({ id: 'p4', name: 'مشروب ساخن مجاني', type: 'product', value: 'hot', probability: 8 });
      prizes.push({ id: 'p5', name: 'نصف ساعة لعب', type: 'time', value: 30, probability: 2 });
    } else {
      prizes.push({ id: 'p4', name: '5 نقاط ولاء', type: 'points', value: 5, probability: 10 });
    }
    return prizes;
  }

  // ── PUBLIC API ──
  return {
    init, get, set, genId,
    getAll, getById, add, update, removeItem, query,
    getSettings, updateSettings,
    // Sessions
    startSession, endSession, pauseSession, resumeSession,
    getActiveSessions, getSessionCost,
    // Devices
    updateDevice, addDevice, removeDevice,
    // Orders
    createOrder, updateOrderStatus,
    // Inventory
    getInventory, getInventoryItem, deductInventory, addInventory, getLowInventory,
    // Accounting
    addJournalEntry, addExpense, getTodayRevenue, getRevenueByDateRange, dailyClose,
    // Reservations
    addReservation, getTodayReservations,
    // Customers
    addCustomer, payDebt, redeemPoints,
    // Tournaments
    createTournament, generateEliminationBracket, generateRoundRobin,
    // Tasks
    addTask,
    // Alerts
    getAlerts,
    // Dashboard
    getDashboardStats, getWeeklyRevenue,
    // Export/Import
    exportAll, importAll, resetAll,
    // Client Portal
    chargeWallet, payWithWallet, requestHelp, AI_CalculateWheelPrizes,
  };
})();
