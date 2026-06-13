/* ═══════════════════════════════════════════
   ريستا كافيه — الحجوزات (Reservations)
   ═══════════════════════════════════════════ */

const ReservationsPage = (() => {
  let activeTab = 'today';

  function render() {
    const settings = Store.getSettings();
    const todayRes = Store.getTodayReservations();
    const allRes = Store.getAll('reservations').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const pending = allRes.filter(r => r.status === 'pending');

    let html = Components.renderTopbar('إدارة', 'الحجوزات');

    html += `<div class="kpi-row">
      <div class="kpi-card cyan"><div class="kpi-label">📅 حجوزات اليوم</div><div class="kpi-value">${todayRes.length}</div><div class="kpi-sub">حجز</div></div>
      <div class="kpi-card gold"><div class="kpi-label">⏳ معلقة</div><div class="kpi-value">${pending.length}</div><div class="kpi-sub">تحتاج تأكيد</div></div>
      <div class="kpi-card green"><div class="kpi-label">✅ مكتملة</div><div class="kpi-value">${allRes.filter(r => r.status === 'completed').length}</div><div class="kpi-sub">إجمالي</div></div>
      <div class="kpi-card purple"><div class="kpi-label">📋 الكل</div><div class="kpi-value">${allRes.length}</div><div class="kpi-sub">حجز</div></div>
    </div>`;

    html += `<div style="margin-bottom:16px;">
      <button class="btn btn-primary" onclick="ReservationsPage.newReservationModal()">+ حجز جديد</button>
    </div>`;

    html += Components.renderTabs([
      { id: 'today', label: 'اليوم', icon: '📅', count: todayRes.length },
      { id: 'all', label: 'الكل', icon: '📋' },
    ], activeTab, (tab) => { activeTab = tab; App.refresh(); });

    const list = activeTab === 'today' ? todayRes : allRes;

    if (list.length === 0) {
      html += Components.renderEmpty('📅', 'لا توجد حجوزات', 'أضف حجز جديد', '+ حجز جديد', 'ReservationsPage.newReservationModal()');
    } else {
      html += '<div class="section-card"><div class="table-wrap"><table><thead><tr>';
      html += '<th>الزبون</th><th>الجهاز</th><th>التاريخ</th><th>الوقت</th><th>المدة</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>';

      list.forEach(r => {
        const statusBadge = {
          pending: 'badge-idle', confirmed: 'badge-info', active: 'badge-active',
          completed: 'badge-offline', cancelled: 'badge-danger'
        };
        html += `<tr>
          <td style="font-weight:600;">${r.customerName}</td>
          <td>${r.deviceName || '-'}</td>
          <td style="font-size:12px;">${Utils.formatDateShort(r.date)}</td>
          <td class="mono">${r.startTime || '-'}</td>
          <td>${r.duration || '-'} دقيقة</td>
          <td><span class="badge ${statusBadge[r.status] || 'badge-info'}">${Utils.reservationStatusLabel(r.status)}</span></td>
          <td style="display:flex;gap:4px;">
            ${r.status === 'pending' ? `
              <button class="btn btn-sm btn-approve" onclick="ReservationsPage.updateRes('${r.id}','confirmed')">تأكيد</button>
              <button class="btn btn-sm btn-reject" onclick="ReservationsPage.updateRes('${r.id}','cancelled')">إلغاء</button>
            ` : ''}
            ${r.status === 'confirmed' ? `
              <button class="btn btn-sm btn-primary" onclick="ReservationsPage.updateRes('${r.id}','active')">بدء</button>
            ` : ''}
            ${r.status === 'active' ? `
              <button class="btn btn-sm btn-success" onclick="ReservationsPage.updateRes('${r.id}','completed')">مكتمل</button>
            ` : ''}
          </td>
        </tr>`;
      });

      html += '</tbody></table></div></div>';
    }
    return html;
  }

  function newReservationModal() {
    const devices = Store.getAll('devices');
    let devOptions = '<option value="">-- اختر الجهاز --</option>';
    devices.forEach(d => { devOptions += `<option value="${d.id}" data-name="${d.name}">${d.icon} ${d.name}</option>`; });

    const body = `
      <div class="form-group"><label class="form-label">اسم الزبون</label><input type="text" id="res-name" class="form-input" placeholder="اسم الزبون"></div>
      <div class="form-group"><label class="form-label">رقم الهاتف</label><input type="tel" id="res-phone" class="form-input" placeholder="01xxxxxxxxx" inputmode="tel"></div>
      <div class="form-group"><label class="form-label">الجهاز</label><select id="res-device" class="form-select">${devOptions}</select></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">التاريخ</label><input type="date" id="res-date" class="form-input" value="${Utils.todayStr()}"></div>
        <div class="form-group"><label class="form-label">الوقت</label><input type="time" id="res-time" class="form-input" value="18:00"></div>
      </div>
      <div class="form-group"><label class="form-label">المدة (دقيقة)</label><input type="number" id="res-dur" class="form-input" value="60" inputmode="numeric"></div>
    `;
    const footer = `
      <button class="btn btn-primary" onclick="ReservationsPage.saveReservation()">حفظ الحجز</button>
      <button class="btn btn-ghost" onclick="Components.closeModal()">إلغاء</button>
    `;
    Components.showModal('حجز جديد', body, footer, { icon: '📅' });
  }

  function saveReservation() {
    const name = Utils.$('#res-name')?.value?.trim();
    const phone = Utils.$('#res-phone')?.value?.trim();
    const deviceSel = Utils.$('#res-device');
    const deviceId = deviceSel?.value;
    const deviceName = deviceSel?.options[deviceSel.selectedIndex]?.text || '';
    const date = Utils.$('#res-date')?.value;
    const startTime = Utils.$('#res-time')?.value;
    const duration = parseInt(Utils.$('#res-dur')?.value) || 60;

    if (!name) { Components.showToast('⚠️', 'خطأ', 'اكتب اسم الزبون'); return; }

    Store.addReservation({ customerName: name, phone, deviceId, deviceName, date, startTime, duration });
    Components.closeModal();
    Components.showToast('📅', 'تم الحجز', `${name} — ${startTime}`);
    App.refresh();
  }

  function updateRes(id, status) {
    Store.update('reservations', id, { status });
    Components.showToast('✅', 'تم التحديث', Utils.reservationStatusLabel(status));
    App.refresh();
  }

  function afterRender() {}

  return { render, afterRender, newReservationModal, saveReservation, updateRes };
})();

App.registerPage('reservations', ReservationsPage);
