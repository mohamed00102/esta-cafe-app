/* ═══════════════════════════════════════════
   ريستا كافيه — مولّد بوستات إنستجرام
   Canvas API Image Generation
   ═══════════════════════════════════════════ */

const InstagramPage = (() => {
  let selectedTemplate = null;
  let generatedCanvas = null;

  function render() {
    const settings = Store.getSettings();
    const templates = Utils.getInstagramTemplates();

    let html = Components.renderTopbar('مولّد', 'بوستات إنستجرام');

    html += `<div style="background:var(--card);border:1px solid var(--border);border-radius:16px;padding:20px;margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:28px;">📸</span>
        <div>
          <div style="font-size:16px;font-weight:700;">مولّد بوستات إنستجرام</div>
          <div style="font-size:12px;color:var(--muted);">اختر قالب → خصّص المحتوى → حمّل الصورة → انشرها على @${settings.instagram?.pageName || 'resta.cafe'}</div>
        </div>
      </div>
    </div>`;

    html += '<div class="grid-main" style="grid-template-columns:1fr 400px;">';

    // Templates + Form
    html += '<div>';
    html += '<h3 class="mb-12">📋 اختر قالب</h3>';
    html += '<div class="grid-3" style="gap:10px;margin-bottom:20px;">';

    templates.forEach(t => {
      const isSelected = selectedTemplate === t.id;
      html += `<div class="section-card" style="cursor:pointer;padding:16px;text-align:center;${isSelected ? 'border-color:var(--cyan);background:rgba(0,229,255,.05);' : ''}"
               onclick="InstagramPage.selectTemplate('${t.id}')">
        <div style="font-size:32px;margin-bottom:6px;">${t.emoji}</div>
        <div style="font-size:13px;font-weight:700;">${t.name}</div>
      </div>`;
    });
    html += '</div>';

    // Customization Form
    if (selectedTemplate) {
      const tmpl = templates.find(t => t.id === selectedTemplate);
      html += `<div class="section-card">
        <div class="section-header">
          <div class="section-title">✏️ تخصيص البوست</div>
        </div>
        <div style="padding:16px;">
          <div class="form-group">
            <label class="form-label">العنوان الرئيسي</label>
            <input type="text" id="ig-title" class="form-input" value="${tmpl.name}" placeholder="العنوان">
          </div>
          <div class="form-group">
            <label class="form-label">النص الفرعي</label>
            <textarea id="ig-subtitle" class="form-textarea" rows="3" placeholder="نص وصفي">${getSubtitle(tmpl)}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">الإيموجي الرئيسي</label>
            <input type="text" id="ig-emoji" class="form-input" value="${tmpl.emoji}" maxlength="4">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">لون الخلفية 1</label>
              <input type="color" id="ig-bg1" class="form-input" value="#0d0d0f" style="height:44px;cursor:pointer;">
            </div>
            <div class="form-group">
              <label class="form-label">لون الخلفية 2</label>
              <input type="color" id="ig-bg2" class="form-input" value="#1a1a2e" style="height:44px;cursor:pointer;">
            </div>
          </div>
          <button class="btn btn-primary btn-block" onclick="InstagramPage.generatePost()">🎨 توليد الصورة</button>
        </div>
      </div>`;

      // Caption
      html += `<div class="section-card mt-16">
        <div class="section-header"><div class="section-title">📝 النص المقترح (Caption)</div></div>
        <div style="padding:16px;">
          <textarea id="ig-caption" class="form-textarea" rows="8" style="font-size:13px;">${generateCaption(tmpl, settings)}</textarea>
          <button class="btn btn-sm btn-ghost mt-8" onclick="InstagramPage.copyCaption()">📋 نسخ النص</button>
        </div>
      </div>`;
    }

    html += '</div>';

    // Preview
    html += `<div>
      <h3 class="mb-12">👁️ المعاينة</h3>
      <div class="section-card" style="position:sticky;top:20px;">
        <div style="padding:16px;">
          <div id="ig-preview" style="width:100%;aspect-ratio:1;background:var(--surface);border-radius:12px;display:flex;align-items:center;justify-content:center;overflow:hidden;">
            ${generatedCanvas ?
              `<canvas id="ig-canvas" style="width:100%;height:100%;object-fit:contain;"></canvas>` :
              `<div style="text-align:center;color:var(--muted);"><div style="font-size:48px;margin-bottom:12px;">📸</div><div style="font-size:14px;">اختر قالب ثم اضغط "توليد"</div></div>`
            }
          </div>
          ${generatedCanvas ? `
            <div style="display:flex;gap:8px;margin-top:12px;">
              <button class="btn btn-success btn-block" onclick="InstagramPage.downloadPost()">📥 تحميل الصورة (1080×1080)</button>
            </div>
          ` : ''}
        </div>
      </div>
    </div>`;

    html += '</div>';
    return html;
  }

  function getSubtitle(tmpl) {
    const settings = Store.getSettings();
    switch (tmpl.id) {
      case 'promo': return 'أفضل مكان للعب والاستمتاع\nمع أصحابك';
      case 'tournament': return 'سجّل الآن واربح\nجوائز قيّمة';
      case 'daily': return 'الأجهزة جاهزة\nوالقهوة ستحلوة';
      case 'menu': return 'مشروبات طازجة\nوأجواء مميزة';
      case 'stats': return 'شكراً لكل زبائننا\nالأعزاء';
      default: return '';
    }
  }

  function generateCaption(tmpl, settings) {
    let text = tmpl.textTemplate;
    text = text.replace(/{cafeName}/g, settings.cafeName);
    text = text.replace(/{openTime}/g, settings.openTime || '12:00');
    text = text.replace(/{closeTime}/g, settings.closeTime || '02:00');

    // Fill dynamic data
    const stats = Store.getDashboardStats();
    text = text.replace(/{sessionsCount}/g, Store.getAll('sessions').length.toString());
    text = text.replace(/{ordersCount}/g, Store.getAll('orders').length.toString());
    text = text.replace(/{customersCount}/g, Store.getAll('customers').length.toString());

    // Menu items
    const products = Store.getAll('products').slice(0, 6);
    const menuItems = products.map(p => `${p.icon} ${p.name} — ${p.price} ${settings.currency}`).join('\n');
    text = text.replace(/{menuItems}/g, menuItems);

    text = text.replace(/{gameName}/g, 'FIFA 26');
    text = text.replace(/{date}/g, new Date().toLocaleDateString('ar-EG'));

    return text;
  }

  function selectTemplate(id) {
    selectedTemplate = id;
    generatedCanvas = null;
    App.refresh();
  }

  function generatePost() {
    const tmpl = Utils.getInstagramTemplates().find(t => t.id === selectedTemplate);
    if (!tmpl) return;

    const settings = Store.getSettings();
    const data = {
      title: Utils.$('#ig-title')?.value || tmpl.name,
      subtitle: Utils.$('#ig-subtitle')?.value || '',
      emoji: Utils.$('#ig-emoji')?.value || tmpl.emoji,
      bgColor1: Utils.$('#ig-bg1')?.value || '#0d0d0f',
      bgColor2: Utils.$('#ig-bg2')?.value || '#1a1a2e',
      cafeName: settings.cafeName,
      pageName: settings.instagram?.pageName || 'resta.cafe',
    };

    Utils.generatePostImage(tmpl, data, (canvas) => {
      generatedCanvas = canvas;
      // Re-render and place canvas
      App.refresh();
      setTimeout(() => {
        const preview = document.getElementById('ig-preview');
        if (preview && generatedCanvas) {
          preview.innerHTML = '';
          const displayCanvas = document.createElement('canvas');
          displayCanvas.width = 1080;
          displayCanvas.height = 1080;
          displayCanvas.style.width = '100%';
          displayCanvas.style.height = '100%';
          displayCanvas.style.objectFit = 'contain';
          displayCanvas.style.borderRadius = '12px';
          const ctx = displayCanvas.getContext('2d');
          ctx.drawImage(generatedCanvas, 0, 0);
          preview.appendChild(displayCanvas);
        }
      }, 100);
    });
  }

  function downloadPost() {
    if (!generatedCanvas) return;
    const link = document.createElement('a');
    link.download = `resta-cafe-post-${Date.now()}.png`;
    link.href = generatedCanvas.toDataURL('image/png');
    link.click();
    Components.showToast('📥', 'تم التحميل', 'الصورة جاهزة للنشر على إنستجرام');
  }

  function copyCaption() {
    const text = Utils.$('#ig-caption')?.value;
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        Components.showToast('📋', 'تم النسخ', 'النص جاهز للصق في إنستجرام');
      }).catch(() => {
        // Fallback
        Utils.$('#ig-caption').select();
        document.execCommand('copy');
        Components.showToast('📋', 'تم النسخ', 'النص جاهز');
      });
    }
  }

  function afterRender() {
    // Re-render canvas if exists
    if (generatedCanvas) {
      setTimeout(() => {
        const preview = document.getElementById('ig-preview');
        if (preview) {
          preview.innerHTML = '';
          const displayCanvas = document.createElement('canvas');
          displayCanvas.width = 1080;
          displayCanvas.height = 1080;
          displayCanvas.style.width = '100%';
          displayCanvas.style.height = '100%';
          displayCanvas.style.objectFit = 'contain';
          displayCanvas.style.borderRadius = '12px';
          const ctx = displayCanvas.getContext('2d');
          ctx.drawImage(generatedCanvas, 0, 0);
          preview.appendChild(displayCanvas);
        }
      }, 50);
    }
  }

  return { render, afterRender, selectTemplate, generatePost, downloadPost, copyCaption };
})();

App.registerPage('instagram', InstagramPage);
