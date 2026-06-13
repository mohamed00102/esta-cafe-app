/* ═══════════════════════════════════════════
   ريستا كافيه — الإعدادات (Settings)
   ═══════════════════════════════════════════ */

const SettingsPage = (() => {
  let activeTab = 'general';

  function render() {
    const settings = Store.getSettings();
    const devices = Store.getAll('devices');
    const employees = Store.getAll('employees');

    let html = Components.renderTopbar('⚙️', 'الإعدادات');

    const role = localStorage.getItem('resta_auth_role');
    const tabs = [
      { id: 'general', label: 'عام', icon: '⚙️' },
      { id: 'devices', label: 'الأجهزة', icon: '🎮', count: devices.length },
      { id: 'employees', label: 'الموظفين', icon: '👥' },
      { id: 'backup', label: 'النسخ الاحتياطي', icon: '💾' },
    ];
    
    if (role === 'admin') {
      tabs.push({ id: 'builder', label: 'برمج معانا', icon: '🛠️' });
    }

    html += Components.renderTabs(tabs, activeTab, (tab) => { 
      if (tab === 'builder' && activeTab !== 'builder') {
        verifyBuilderAccess();
      } else {
        activeTab = tab; 
        App.refresh(); 
      }
    });

    switch (activeTab) {
      case 'general': html += renderGeneral(settings); break;
      case 'devices': html += renderDevices(devices, settings); break;
      case 'employees': html += renderEmployees(employees); break;
      case 'backup': html += renderBackup(); break;
      case 'builder': html += renderBuilder(settings); break;
    }
    return html;
  }

  function renderGeneral(settings) {
    return `<div class="grid-2">
      <div class="section-card">
        <div class="section-header"><div class="section-title">🏪 معلومات الكافيه</div></div>
        <div style="padding:16px;">
          <div class="form-group"><label class="form-label">اسم الكافيه</label><input type="text" id="set-name" class="form-input" value="${settings.cafeName}"></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">وقت الفتح</label><input type="time" id="set-open" class="form-input" value="${settings.openTime}"></div>
            <div class="form-group"><label class="form-label">وقت الإغلاق</label><input type="time" id="set-close" class="form-input" value="${settings.closeTime}"></div>
          </div>
          <div class="form-group"><label class="form-label">العملة</label><input type="text" id="set-currency" class="form-input" value="${settings.currency}"></div>
          <button class="btn btn-primary" onclick="SettingsPage.saveGeneral()">💾 حفظ</button>
        </div>
      </div>

      <div class="section-card">
        <div class="section-header"><div class="section-title">⭐ برنامج الولاء</div></div>
        <div style="padding:16px;">
          <div class="form-group"><label class="form-label">نقاط لكل ساعة لعب</label><input type="number" id="set-pph" class="form-input" value="${settings.loyaltyPointsPerHour}" inputmode="numeric"></div>
          <div class="form-group"><label class="form-label">نقاط لكل طلب بار</label><input type="number" id="set-ppb" class="form-input" value="${settings.loyaltyPointsPerPurchase}" inputmode="numeric"></div>
          <div class="form-group"><label class="form-label">نقاط الجلسة المجانية</label><input type="number" id="set-fsp" class="form-input" value="${settings.freeSessionPoints}" inputmode="numeric"></div>
          <button class="btn btn-primary" onclick="SettingsPage.saveLoyalty()">💾 حفظ</button>
        </div>
      </div>

      <div class="section-card">
        <div class="section-header"><div class="section-title">🔔 حدود التنبيهات</div></div>
        <div style="padding:16px;">
          <div class="form-group"><label class="form-label">تنبيه مخزون منخفض (%)</label><input type="number" id="set-invlow" class="form-input" value="${settings.alertThresholds.inventoryLow}" inputmode="numeric"></div>
          <div class="form-group"><label class="form-label">مخزون حرج (%)</label><input type="number" id="set-invcrit" class="form-input" value="${settings.alertThresholds.inventoryCritical}" inputmode="numeric"></div>
          <div class="form-group"><label class="form-label">تنبيه جلسة طويلة (دقيقة)</label><input type="number" id="set-sesswarn" class="form-input" value="${settings.alertThresholds.sessionWarning}" inputmode="numeric"></div>
          <button class="btn btn-primary" onclick="SettingsPage.saveAlerts()">💾 حفظ</button>
        </div>
      </div>

      <div class="section-card">
        <div class="section-header"><div class="section-title">📸 إنستجرام</div></div>
        <div style="padding:16px;">
          <div class="form-group"><label class="form-label">اسم الصفحة</label><input type="text" id="set-igname" class="form-input" value="${settings.instagram?.pageName || 'resta.cafe'}"></div>
          <button class="btn btn-primary" onclick="SettingsPage.saveInstagram()">💾 حفظ</button>
        </div>
      </div>
    </div>`;
  }

  function renderDevices(devices, settings) {
    let html = `<div style="margin-bottom:16px;">
      <button class="btn btn-primary" onclick="SettingsPage.addDeviceModal()">+ إضافة جهاز</button>
    </div>`;

    html += '<div class="section-card"><div class="table-wrap"><table><thead><tr>';
    html += '<th></th><th>الاسم</th><th>النوع</th><th>سعر الساعة</th><th>نصف ساعة</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>';

    devices.forEach(d => {
      html += `<tr>
        <td style="font-size:20px;">${d.icon}</td>
        <td style="font-weight:600;">${d.name}</td>
        <td>${Utils.deviceTypeLabel(d.type)}</td>
        <td class="mono" style="color:var(--cyan);font-weight:700;">${d.hourlyRate} ${settings.currency}</td>
        <td class="mono">${d.halfHourRate} ${settings.currency}</td>
        <td><span class="badge ${d.status === 'active' ? 'badge-active' : 'badge-idle'}">${d.status === 'active' ? 'مشغول' : 'متاح'}</span></td>
        <td>
          <button class="btn btn-sm btn-ghost" onclick="SettingsPage.editDevice('${d.id}')">✏️</button>
          <button class="btn btn-sm btn-ghost" style="color:var(--red);" onclick="SettingsPage.deleteDevice('${d.id}')">🗑️</button>
        </td>
      </tr>`;
    });

    html += '</tbody></table></div></div>';
    return html;
  }

  function renderEmployees(employees) {
    let html = `<div style="margin-bottom:16px;">
      <button class="btn btn-primary" onclick="SettingsPage.addEmployeeModal()">+ إضافة موظف</button>
    </div>`;

    html += '<div class="grid-3" style="gap:12px;">';
    employees.forEach(emp => {
      html += `<div class="section-card" style="padding:16px;text-align:center;">
        <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,var(--cyan),var(--purple));display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;color:#000;margin:0 auto 8px;">
          ${emp.name.charAt(0)}
        </div>
        <div style="font-size:14px;font-weight:700;">${emp.name}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:2px;">${emp.role === 'admin' ? '👔 مدير' : '🧑‍💼 موظف'}</div>
        <div style="font-size:11px;color:var(--muted);margin-top:4px;">${emp.phone || ''}</div>
        <div style="display:flex;gap:6px;margin-top:10px;justify-content:center;">
          <button class="btn btn-sm btn-ghost" onclick="SettingsPage.editEmployee('${emp.id}')">✏️</button>
          <button class="btn btn-sm btn-ghost" style="color:var(--red);" onclick="SettingsPage.deleteEmployee('${emp.id}')">🗑️</button>
        </div>
      </div>`;
    });
    html += '</div>';
    return html;
  }

  function renderBackup() {
    return `<div class="grid-2">
      <div class="section-card">
        <div class="section-header"><div class="section-title">📤 تصدير البيانات</div></div>
        <div style="padding:16px;">
          <p style="font-size:13px;color:var(--muted);margin-bottom:12px;">تصدير كل بيانات التطبيق كملف JSON يمكن استيراده لاحقاً</p>
          <button class="btn btn-primary btn-block" onclick="SettingsPage.exportData()">📤 تصدير النسخة الاحتياطية</button>
        </div>
      </div>
      <div class="section-card">
        <div class="section-header"><div class="section-title">📥 استيراد البيانات</div></div>
        <div style="padding:16px;">
          <p style="font-size:13px;color:var(--muted);margin-bottom:12px;">استيراد نسخة احتياطية سابقة — سيتم استبدال كل البيانات الحالية</p>
          <input type="file" id="import-file" accept=".json" style="display:none;" onchange="SettingsPage.importData(event)">
          <button class="btn btn-warning btn-block" onclick="document.getElementById('import-file').click()">📥 استيراد من ملف</button>
        </div>
      </div>
      <div class="section-card" style="border-color:rgba(255,23,68,.3);">
        <div class="section-header"><div class="section-title" style="color:var(--red);">⚠️ إعادة ضبط</div></div>
        <div style="padding:16px;">
          <p style="font-size:13px;color:var(--muted);margin-bottom:12px;">مسح كل البيانات والعودة للإعدادات الافتراضية — لا يمكن التراجع!</p>
          <button class="btn btn-danger btn-block" onclick="SettingsPage.resetData()">🗑️ مسح كل البيانات</button>
        </div>
      </div>
    </div>`;
  }

  function verifyBuilderAccess() {
    const body = `
      <div style="text-align:center; margin-bottom:20px;">
        <div style="font-size:40px; margin-bottom:10px;">🔒</div>
        <p>هذا القسم حساس. يرجى إدخال كلمة مرور المدير للتأكيد</p>
      </div>
      <div class="form-group">
        <input type="password" id="builder-password" class="form-input" placeholder="كلمة المرور..." style="text-align:center; font-size:24px; letter-spacing:4px;" inputmode="numeric">
      </div>
    `;
    const footer = `
      <button class="btn btn-primary" onclick="SettingsPage.confirmBuilderAccess()">دخول للبرمجة</button>
      <button class="btn btn-ghost" onclick="Components.closeModal()">إلغاء</button>
    `;
    Components.showModal('تأكيد الصلاحيات', body, footer, { icon: '🛡️' });
  }

  function confirmBuilderAccess() {
    const passInput = document.getElementById('builder-password');
    if (passInput && passInput.value === '010011') {
      Components.closeModal();
      activeTab = 'builder';
      App.refresh();
    } else {
      Components.showToast('❌', 'خطأ', 'كلمة المرور غير صحيحة');
      if (passInput) {
         passInput.value = '';
         passInput.focus();
      }
    }
  }

  function renderBuilder(settings) {
    const builder = settings.builder || {
      themeColor: '#00e5ff',
      hideWheel: false,
      disableDrinks: false,
      welcomeMessage: 'مرحباً بك في ريستا كافيه!'
    };

    return `<div class="grid-2">
      <div class="section-card">
        <div class="section-header"><div class="section-title">🎨 ألوان وشكل التطبيق</div></div>
        <div style="padding:16px;">
          <div class="form-group">
            <label class="form-label">اللون الأساسي للتطبيق</label>
            <input type="color" id="build-color" class="form-input" value="${builder.themeColor}" style="height:50px;padding:0;">
          </div>
          <div class="form-group">
            <label class="form-label">الرسالة الترحيبية للعملاء</label>
            <input type="text" id="build-welcome" class="form-input" value="${builder.welcomeMessage}">
          </div>
          <button class="btn btn-primary" onclick="SettingsPage.saveBuilder()">💾 تطبيق التعديلات (تظهر فوراً للعملاء)</button>
        </div>
      </div>
      
      <div class="section-card">
        <div class="section-header"><div class="section-title">⚙️ تفعيل وتعطيل الميزات</div></div>
        <div style="padding:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid var(--border); padding-bottom:12px;">
            <div>
              <div style="font-weight:700;">إخفاء عجلة الحظ 🎡</div>
              <div style="font-size:11px;color:var(--muted);">لن تظهر للعميل في صفحته</div>
            </div>
            <label class="switch">
              <input type="checkbox" id="build-hide-wheel" ${builder.hideWheel ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid var(--border); padding-bottom:12px;">
            <div>
              <div style="font-weight:700;">تعطيل طلب المشروبات ☕</div>
              <div style="font-size:11px;color:var(--muted);">إخفاء المنيو ومنع الطلب من الموبايل</div>
            </div>
            <label class="switch">
              <input type="checkbox" id="build-disable-drinks" ${builder.disableDrinks ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
          </div>
          
          <button class="btn btn-primary" onclick="SettingsPage.saveBuilder()">💾 تطبيق التعديلات</button>
        </div>
      </div>
    </div>
    
    <style>
      .switch { position: relative; display: inline-block; width: 40px; height: 20px; }
      .switch input { opacity: 0; width: 0; height: 0; }
      .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--surface); transition: .4s; border-radius: 20px; border: 1px solid var(--border); }
      .slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 2px; bottom: 2px; background-color: var(--muted); transition: .4s; border-radius: 50%; }
      input:checked + .slider { background-color: var(--cyan); border-color: var(--cyan); }
      input:checked + .slider:before { transform: translateX(20px); background-color: #fff; }
    </style>
    `;
  }

  // ── Save Functions ──
  function saveGeneral() {
    Store.updateSettings({
      cafeName: Utils.$('#set-name')?.value || 'ريستا كافيه',
      openTime: Utils.$('#set-open')?.value || '12:00',
      closeTime: Utils.$('#set-close')?.value || '02:00',
      currency: Utils.$('#set-currency')?.value || 'ج',
    });
    Components.showToast('✅', 'تم الحفظ', 'إعدادات الكافيه');
  }

  function saveLoyalty() {
    Store.updateSettings({
      loyaltyPointsPerHour: parseInt(Utils.$('#set-pph')?.value) || 10,
      loyaltyPointsPerPurchase: parseInt(Utils.$('#set-ppb')?.value) || 5,
      freeSessionPoints: parseInt(Utils.$('#set-fsp')?.value) || 100,
    });
    Components.showToast('✅', 'تم الحفظ', 'إعدادات الولاء');
  }

  function saveAlerts() {
    Store.updateSettings({
      alertThresholds: {
        inventoryLow: parseInt(Utils.$('#set-invlow')?.value) || 25,
        inventoryCritical: parseInt(Utils.$('#set-invcrit')?.value) || 10,
        sessionWarning: parseInt(Utils.$('#set-sesswarn')?.value) || 120,
      }
    });
    Components.showToast('✅', 'تم الحفظ', 'إعدادات التنبيهات');
  }

  function saveInstagram() {
    Store.updateSettings({
      instagram: { pageName: Utils.$('#set-igname')?.value || 'resta.cafe' }
    });
    Components.showToast('✅', 'تم الحفظ', 'إعدادات إنستجرام');
  }

  function saveBuilder() {
    const builder = {
      themeColor: Utils.$('#build-color')?.value || '#00e5ff',
      hideWheel: Utils.$('#build-hide-wheel')?.checked || false,
      disableDrinks: Utils.$('#build-disable-drinks')?.checked || false,
      welcomeMessage: Utils.$('#build-welcome')?.value || 'مرحباً بك في ريستا كافيه!'
    };
    
    Store.updateSettings({ builder });
    
    // Apply theme color immediately locally
    document.documentElement.style.setProperty('--cyan', builder.themeColor);
    
    Components.showToast('✅', 'تم الحفظ', 'تم تطبيق التعديلات عند جميع العملاء');
    App.refresh();
  }

  // ── Device CRUD ──
  function addDeviceModal() {
    const body = `
      <div class="form-row">
        <div class="form-group"><label class="form-label">الاسم</label><input type="text" id="dev-name" class="form-input" placeholder="مثال: PlayStation 5"></div>
        <div class="form-group"><label class="form-label">الأيقونة</label><input type="text" id="dev-icon" class="form-input" value="🕹️" maxlength="4"></div>
      </div>
      <div class="form-group">
        <label class="form-label">النوع</label>
        <select id="dev-type" class="form-select">
          <option value="ps">بلايستيشن</option>
          <option value="billiard">بلياردو</option>
          <option value="pingpong">بينج بونج</option>
          <option value="pc">كمبيوتر</option>
          <option value="other">أخرى</option>
        </select>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">سعر الساعة</label><input type="number" id="dev-hour" class="form-input" value="30" inputmode="numeric"></div>
        <div class="form-group"><label class="form-label">سعر نصف ساعة</label><input type="number" id="dev-half" class="form-input" value="20" inputmode="numeric"></div>
      </div>
    `;
    const footer = `
      <button class="btn btn-primary" onclick="SettingsPage.saveDevice()">حفظ</button>
      <button class="btn btn-ghost" onclick="Components.closeModal()">إلغاء</button>
    `;
    Components.showModal('إضافة جهاز', body, footer, { icon: '🎮' });
  }

  function saveDevice(editId) {
    const name = Utils.$('#dev-name')?.value?.trim();
    const icon = Utils.$('#dev-icon')?.value || '🕹️';
    const type = Utils.$('#dev-type')?.value || 'ps';
    const hourlyRate = parseInt(Utils.$('#dev-hour')?.value) || 30;
    const halfHourRate = parseInt(Utils.$('#dev-half')?.value) || 20;
    if (!name) { Components.showToast('⚠️', 'خطأ', 'اكتب اسم الجهاز'); return; }
    if (editId) {
      Store.updateDevice(editId, { name, icon, type, hourlyRate, halfHourRate });
    } else {
      Store.addDevice({ name, icon, type, hourlyRate, halfHourRate });
    }
    Components.closeModal();
    Components.showToast('✅', 'تم الحفظ', name);
    App.refresh();
  }

  function editDevice(id) {
    const d = Store.getById('devices', id);
    if (!d) return;
    addDeviceModal();
    setTimeout(() => {
      Utils.$('#dev-name').value = d.name;
      Utils.$('#dev-icon').value = d.icon;
      Utils.$('#dev-type').value = d.type;
      Utils.$('#dev-hour').value = d.hourlyRate;
      Utils.$('#dev-half').value = d.halfHourRate;
      const btn = document.querySelector('.modal-footer .btn-primary');
      if (btn) btn.setAttribute('onclick', `SettingsPage.saveDevice('${id}')`);
    }, 100);
  }

  function deleteDevice(id) {
    const d = Store.getById('devices', id);
    Components.confirmDelete(d?.name || '', () => { Store.removeDevice(id); App.refresh(); });
  }

  // ── Employee CRUD ──
  function addEmployeeModal() {
    const body = `
      <div class="form-group"><label class="form-label">الاسم</label><input type="text" id="emp-name" class="form-input" placeholder="اسم الموظف"></div>
      <div class="form-group"><label class="form-label">الهاتف</label><input type="tel" id="emp-phone" class="form-input" placeholder="01xxxxxxxxx" inputmode="tel"></div>
      <div class="form-group"><label class="form-label">الدور</label>
        <select id="emp-role" class="form-select"><option value="staff">🧑‍💼 موظف</option><option value="admin">👔 مدير</option></select>
      </div>
    `;
    const footer = `
      <button class="btn btn-primary" onclick="SettingsPage.saveEmployee()">حفظ</button>
      <button class="btn btn-ghost" onclick="Components.closeModal()">إلغاء</button>
    `;
    Components.showModal('إضافة موظف', body, footer, { icon: '👥' });
  }

  function saveEmployee(editId) {
    const name = Utils.$('#emp-name')?.value?.trim();
    const phone = Utils.$('#emp-phone')?.value?.trim();
    const role = Utils.$('#emp-role')?.value || 'staff';
    if (!name) { Components.showToast('⚠️', 'خطأ', 'اكتب اسم الموظف'); return; }
    if (editId) {
      Store.update('employees', editId, { name, phone, role });
    } else {
      Store.add('employees', { name, phone, role, active: true });
    }
    Components.closeModal();
    Components.showToast('✅', 'تم الحفظ', name);
    App.refresh();
  }

  function editEmployee(id) {
    const e = Store.getById('employees', id);
    if (!e) return;
    addEmployeeModal();
    setTimeout(() => {
      Utils.$('#emp-name').value = e.name;
      Utils.$('#emp-phone').value = e.phone || '';
      Utils.$('#emp-role').value = e.role;
      const btn = document.querySelector('.modal-footer .btn-primary');
      if (btn) btn.setAttribute('onclick', `SettingsPage.saveEmployee('${id}')`);
    }, 100);
  }

  function deleteEmployee(id) {
    const e = Store.getById('employees', id);
    Components.confirmDelete(e?.name || '', () => { Store.removeItem('employees', id); App.refresh(); });
  }

  // ── Backup ──
  function exportData() {
    const data = Store.exportAll();
    Utils.downloadFile(data, `resta-cafe-backup-${Utils.todayStr()}.json`, 'application/json');
    Components.showToast('📤', 'تم التصدير', 'النسخة الاحتياطية جاهزة');
  }

  function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      Components.confirmModal('استيراد بيانات', 'سيتم استبدال كل البيانات الحالية. هل أنت متأكد؟', () => {
        if (Store.importAll(e.target.result)) {
          Components.showToast('📥', 'تم الاستيراد', 'البيانات تم تحديثها');
          App.refresh();
        } else {
          Components.showToast('❌', 'خطأ', 'الملف غير صالح');
        }
      }, { icon: '📥', confirmText: 'استيراد' });
    };
    reader.readAsText(file);
  }

  function resetData() {
    Components.confirmModal('إعادة ضبط', '⚠️ سيتم مسح كل البيانات نهائياً! هل أنت متأكد تماماً؟', () => {
      Store.resetAll();
      Components.showToast('🗑️', 'تم المسح', 'كل البيانات تم إعادة ضبطها');
      App.refresh();
    }, { danger: true, confirmText: 'مسح نهائي', icon: '⚠️' });
  }

  function afterRender() {}

  return {
    render, afterRender,
    saveGeneral, saveLoyalty, saveAlerts, saveInstagram, saveBuilder,
    verifyBuilderAccess, confirmBuilderAccess,
    addDeviceModal, saveDevice, editDevice, deleteDevice,
    addEmployeeModal, saveEmployee, editEmployee, deleteEmployee,
    exportData, importData, resetData,
  };
})();

App.registerPage('settings', SettingsPage);
