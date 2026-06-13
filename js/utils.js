/* ═══════════════════════════════════════════
   ريستا كافيه — دوال مساعدة (Utils)
   ═══════════════════════════════════════════ */

const Utils = (() => {
  // ── TIME FORMATTING ──
  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  function pad(n) { return String(Math.floor(n)).padStart(2, '0'); }

  function formatDuration(minutes) {
    if (minutes < 60) return `${minutes} دقيقة`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h} ساعة و ${m} دقيقة` : `${h} ساعة`;
  }

  function getElapsedSeconds(startTimeISO, pausedMs = 0) {
    const now = new Date();
    const start = new Date(startTimeISO);
    return Math.floor((now - start - pausedMs) / 1000);
  }

  function timeAgo(dateISO) {
    const diff = (new Date() - new Date(dateISO)) / 1000;
    if (diff < 60) return 'الآن';
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
    return `منذ ${Math.floor(diff / 86400)} يوم`;
  }

  function formatDate(dateISO) {
    const d = new Date(dateISO);
    return d.toLocaleDateString('ar-EG', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  function formatDateShort(dateISO) {
    const d = new Date(dateISO);
    return d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
  }

  function formatTimeOnly(dateISO) {
    const d = new Date(dateISO);
    return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  }

  function todayStr() {
    return new Date().toISOString().split('T')[0];
  }

  function isToday(dateISO) {
    return new Date(dateISO).toDateString() === new Date().toDateString();
  }

  // ── CURRENCY ──
  function formatCurrency(amount) {
    const settings = Store.getSettings();
    return `${Number(amount).toLocaleString('ar-EG')} ${settings.currency}`;
  }

  function formatNumber(n) {
    return Number(n).toLocaleString('ar-EG');
  }

  // ── DOM HELPERS ──
  function $(selector) { return document.querySelector(selector); }
  function $$(selector) { return document.querySelectorAll(selector); }

  function createElement(tag, className, html) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (html) el.innerHTML = html;
    return el;
  }

  function clearElement(el) {
    if (typeof el === 'string') el = $(el);
    if (el) el.innerHTML = '';
  }

  // ── PERCENTAGE ──
  function pct(value, max) {
    if (!max) return 0;
    return Math.round((value / max) * 100);
  }

  function pctColor(pct) {
    if (pct <= 15) return 'var(--red)';
    if (pct <= 30) return 'var(--gold)';
    return 'var(--green)';
  }

  function pctClass(pct) {
    if (pct <= 15) return 'fill-crit';
    if (pct <= 30) return 'fill-low';
    return 'fill-ok';
  }

  function pctLabel(pct) {
    if (pct <= 10) return 'حرج ⛔';
    if (pct <= 25) return 'منخفض جداً ⚠️';
    if (pct <= 40) return 'منخفض';
    if (pct <= 70) return 'متوسط';
    return 'كافٍ';
  }

  // ── DEVICE TYPE ICONS ──
  function deviceTypeLabel(type) {
    const map = { ps: 'بلايستيشن', billiard: 'بلياردو', pingpong: 'بينج بونج', pc: 'كمبيوتر', other: 'آخر' };
    return map[type] || type;
  }

  // ── STATUS LABELS ──
  function sessionStatusLabel(status) {
    const map = {
      active: 'نشط', paused: 'متوقف مؤقتاً', ended: 'منتهي', idle: 'انتظار'
    };
    return map[status] || status;
  }

  function sessionStatusBadge(status) {
    const map = {
      active: 'badge-active', paused: 'badge-idle', ended: 'badge-offline', idle: 'badge-idle'
    };
    return map[status] || 'badge-info';
  }

  function orderStatusLabel(status) {
    const map = {
      'new': 'جديد', preparing: 'قيد التحضير', ready: 'جاهز', delivered: 'تم التسليم', cancelled: 'ملغي'
    };
    return map[status] || status;
  }

  function orderStatusBadge(status) {
    const map = {
      'new': 'badge-info', preparing: 'badge-idle', ready: 'badge-active',
      delivered: 'badge-offline', cancelled: 'badge-danger'
    };
    return map[status] || 'badge-info';
  }

  function reservationStatusLabel(status) {
    const map = {
      pending: 'معلق', confirmed: 'مؤكد', active: 'نشط', completed: 'مكتمل', cancelled: 'ملغي'
    };
    return map[status] || status;
  }

  function paymentMethodLabel(method) {
    const map = { cash: 'كاش', ewallet: 'محفظة إلكترونية', debt: 'آجل (دين)' };
    return map[method] || method || 'كاش';
  }

  // ── CHARTS (SVG Helper) ──
  function createSparkline(data, width, height, color = 'var(--cyan)') {
    if (!data.length) return '';
    const max = Math.max(...data, 1);
    const step = width / (data.length - 1 || 1);
    const points = data.map((v, i) => `${i * step},${height - (v / max) * height * 0.85 - 5}`).join(' ');
    const areaPath = `M0,${height - (data[0] / max) * height * 0.85 - 5} ` +
      data.map((v, i) => `L${i * step},${height - (v / max) * height * 0.85 - 5}`).join(' ') +
      ` L${width},${height} L0,${height} Z`;

    return `
      <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" style="width:100%;height:${height}px;overflow:visible;">
        <defs>
          <linearGradient id="sg-${color.replace(/[^a-z]/g, '')}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${color}" stop-opacity=".25"/>
            <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <line x1="0" y1="${height * 0.25}" x2="${width}" y2="${height * 0.25}" stroke="rgba(255,255,255,.04)" stroke-width="1"/>
        <line x1="0" y1="${height * 0.5}" x2="${width}" y2="${height * 0.5}" stroke="rgba(255,255,255,.04)" stroke-width="1"/>
        <line x1="0" y1="${height * 0.75}" x2="${width}" y2="${height * 0.75}" stroke="rgba(255,255,255,.04)" stroke-width="1"/>
        <path d="${areaPath}" fill="url(#sg-${color.replace(/[^a-z]/g, '')})" />
        <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="${(data.length - 1) * step}" cy="${height - (data[data.length - 1] / max) * height * 0.85 - 5}" r="4" fill="${color}"/>
      </svg>`;
  }

  // ── DEBOUNCE / THROTTLE ──
  function debounce(fn, ms = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  }

  function throttle(fn, ms = 200) {
    let last = 0;
    return (...args) => {
      const now = Date.now();
      if (now - last >= ms) { last = now; fn(...args); }
    };
  }

  // ── SEARCH ──
  function searchFilter(items, query, fields) {
    if (!query) return items;
    const q = query.toLowerCase().trim();
    return items.filter(item =>
      fields.some(field => {
        const val = item[field];
        return val && String(val).toLowerCase().includes(q);
      })
    );
  }

  // ── CSV EXPORT ──
  function exportCSV(data, filename) {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','));
    const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    downloadFile(csv, filename, 'text/csv;charset=utf-8');
  }

  function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── PRINT ──
  function printElement(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <html dir="rtl"><head><title>طباعة</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet">
      <style>body{font-family:'Cairo',sans-serif;padding:20px;direction:rtl;}table{width:100%;border-collapse:collapse;}th,td{padding:8px;border:1px solid #ddd;text-align:right;}</style>
      </head><body>${el.innerHTML}</body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
  }

  // ── INSTAGRAM POST DATA HELPERS ──
  const instagramTemplates = [
    {
      id: 'promo',
      name: 'عرض خاص',
      emoji: '🔥',
      textTemplate: '🔥 عرض خاص من {cafeName}!\n\nاستمتع بأفضل الأوقات مع أصحابك\n🎮 جلسات بلايستيشن\n🎱 بلياردو\n🏓 بينج بونج\n☕ أشهى المشروبات\n\n📍 زورنا وجرّب بنفسك!\n\n#gaming #ps5 #cafe #fun',
    },
    {
      id: 'tournament',
      name: 'بطولة',
      emoji: '🏆',
      textTemplate: '🏆 بطولة {gameName} في {cafeName}!\n\n📅 التاريخ: {date}\n🎮 اللعبة: {gameName}\n👥 الأماكن محدودة!\n\n💰 جوائز قيّمة للفائزين\n\nسجّل الآن! 🔥\n\n#tournament #esports #gaming',
    },
    {
      id: 'daily',
      name: 'يومي',
      emoji: '☀️',
      textTemplate: '☀️ صباح الخير من {cafeName}!\n\nالأجهزة جاهزة والقهوة ستحلوة ☕\nتعال واستمتع بيومك معانا 🎮\n\n⏰ مفتوح من {openTime} لحد {closeTime}\n\n#goodmorning #gaming #cafe',
    },
    {
      id: 'menu',
      name: 'قائمة المشروبات',
      emoji: '☕',
      textTemplate: '☕ قائمة مشروباتنا الجديدة!\n\n{menuItems}\n\n🎮 اطلب وانت بتلعب!\n📍 {cafeName}\n\n#menu #drinks #cafe',
    },
    {
      id: 'stats',
      name: 'إنجاز',
      emoji: '📊',
      textTemplate: '📊 إنجاز جديد في {cafeName}!\n\n🎮 {sessionsCount}+ جلسة هذا الأسبوع\n☕ {ordersCount}+ طلب مشروبات\n👥 {customersCount}+ زبون سعيد\n\nشكراً لكل زبائننا الأعزاء! ❤️\n\n#milestone #gaming #community',
    },
  ];

  function getInstagramTemplates() { return instagramTemplates; }

  // ── CANVAS IMAGE GENERATION (for Instagram) ──
  function generatePostImage(template, data, callback) {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
    grad.addColorStop(0, data.bgColor1 || '#0d0d0f');
    grad.addColorStop(1, data.bgColor2 || '#1a1a2e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1080);

    // Grid pattern
    ctx.strokeStyle = 'rgba(0,229,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 1080; i += 40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 1080); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(1080, i); ctx.stroke();
    }

    // Glow circles
    const drawGlow = (x, y, r, color) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color.replace(')', ',0.15)').replace('rgb', 'rgba'));
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    };
    drawGlow(200, 200, 300, 'rgb(0,229,255)');
    drawGlow(880, 880, 300, 'rgb(213,0,249)');

    // Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 72px Cairo, sans-serif';
    ctx.fillText(data.title || template.name, 540, 300);

    // Subtitle
    ctx.fillStyle = '#e8e8f0';
    ctx.font = '36px Cairo, sans-serif';
    const lines = (data.subtitle || '').split('\n');
    lines.forEach((line, i) => {
      ctx.fillText(line, 540, 420 + i * 50);
    });

    // Emoji
    ctx.font = '120px serif';
    ctx.fillText(data.emoji || template.emoji, 540, 700);

    // Café name
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 42px Cairo, sans-serif';
    ctx.fillText(data.cafeName || 'ريستا كافيه', 540, 900);

    // Bottom line
    ctx.fillStyle = 'rgba(0,229,255,0.3)';
    ctx.fillRect(340, 940, 400, 2);

    // Watermark
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '20px Cairo, sans-serif';
    ctx.fillText('@' + (data.pageName || 'resta.cafe'), 540, 1020);

    if (callback) callback(canvas);
    return canvas;
  }

  return {
    formatTime, pad, formatDuration, getElapsedSeconds, timeAgo,
    formatDate, formatDateShort, formatTimeOnly, todayStr, isToday,
    formatCurrency, formatNumber,
    $, $$, createElement, clearElement,
    pct, pctColor, pctClass, pctLabel,
    deviceTypeLabel, sessionStatusLabel, sessionStatusBadge,
    orderStatusLabel, orderStatusBadge, reservationStatusLabel, paymentMethodLabel,
    createSparkline,
    debounce, throttle, searchFilter,
    exportCSV, downloadFile, printElement,
    getInstagramTemplates, generatePostImage,
  };
})();
