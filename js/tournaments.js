/* ═══════════════════════════════════════════
   ريستا كافيه — البطولات (Tournaments)
   ═══════════════════════════════════════════ */

const TournamentsPage = (() => {
  let activeTab = 'active';

  function render() {
    const tournaments = Store.getAll('tournaments');
    const active = tournaments.filter(t => t.status === 'active' || t.status === 'registration');
    const completed = tournaments.filter(t => t.status === 'completed');

    let html = Components.renderTopbar('إدارة', 'البطولات');

    html += `<div class="kpi-row" style="grid-template-columns:repeat(3,1fr);">
      <div class="kpi-card purple"><div class="kpi-label">🏆 بطولات نشطة</div><div class="kpi-value">${active.length}</div><div class="kpi-sub">بطولة</div></div>
      <div class="kpi-card green"><div class="kpi-label">✅ مكتملة</div><div class="kpi-value">${completed.length}</div><div class="kpi-sub">بطولة</div></div>
      <div class="kpi-card cyan"><div class="kpi-label">👥 لاعبون</div><div class="kpi-value">${tournaments.reduce((s, t) => s + (t.players?.length || 0), 0)}</div><div class="kpi-sub">إجمالي</div></div>
    </div>`;

    html += `<div style="margin-bottom:16px;">
      <button class="btn btn-primary" onclick="TournamentsPage.newTournament()">🏆 بطولة جديدة</button>
    </div>`;

    if (tournaments.length === 0) {
      html += Components.renderEmpty('🏆', 'لا توجد بطولات', 'أنشئ أول بطولة الآن', '+ بطولة جديدة', 'TournamentsPage.newTournament()');
    } else {
      html += '<div class="grid-2" style="gap:14px;">';
      tournaments.forEach(t => {
        const statusBadge = t.status === 'registration' ? 'badge-idle' : t.status === 'active' ? 'badge-active' : 'badge-offline';
        const statusLabel = t.status === 'registration' ? 'تسجيل' : t.status === 'active' ? 'جارية' : 'مكتملة';

        html += `<div class="section-card" style="cursor:pointer;" onclick="TournamentsPage.showTournament('${t.id}')">
          <div class="section-header">
            <div class="section-title">🏆 ${t.name}</div>
            <span class="badge ${statusBadge}">${statusLabel}</span>
          </div>
          <div style="padding:14px;">
            <div style="display:flex;gap:16px;font-size:13px;color:var(--muted);margin-bottom:8px;">
              <span>🎮 ${t.game || '-'}</span>
              <span>👥 ${t.players?.length || 0} لاعب</span>
              <span>📋 ${t.type === 'elimination' ? 'إقصائي' : 'دائري'}</span>
            </div>
            <div style="font-size:12px;color:var(--muted);">الجولة ${t.currentRound || 1} • ${t.matches?.filter(m => m.winner).length || 0}/${t.matches?.length || 0} مباراة</div>
          </div>
        </div>`;
      });
      html += '</div>';
    }
    return html;
  }

  function newTournament() {
    const body = `
      <div class="form-group"><label class="form-label">اسم البطولة</label><input type="text" id="t-name" class="form-input" placeholder="مثال: بطولة FIFA 2026"></div>
      <div class="form-group"><label class="form-label">اللعبة</label><input type="text" id="t-game" class="form-input" placeholder="مثال: FIFA 26"></div>
      <div class="form-group">
        <label class="form-label">نوع البراكيت</label>
        <select id="t-type" class="form-select">
          <option value="elimination">إقصائي (Single Elimination)</option>
          <option value="roundrobin">دائري (Round Robin)</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">أسماء اللاعبين (واحد بكل سطر)</label>
        <textarea id="t-players" class="form-textarea" rows="6" placeholder="علي رضا\nمحمد سامي\nكريم أشرف\nيوسف أحمد"></textarea>
      </div>
    `;
    const footer = `
      <button class="btn btn-primary" onclick="TournamentsPage.saveTournament()">🏆 إنشاء</button>
      <button class="btn btn-ghost" onclick="Components.closeModal()">إلغاء</button>
    `;
    Components.showModal('بطولة جديدة', body, footer, { icon: '🏆' });
  }

  function saveTournament() {
    const name = Utils.$('#t-name')?.value?.trim();
    const game = Utils.$('#t-game')?.value?.trim();
    const type = Utils.$('#t-type')?.value;
    const playersRaw = Utils.$('#t-players')?.value?.trim();
    if (!name || !playersRaw) {
      Components.showToast('⚠️', 'خطأ', 'اكتب اسم البطولة وأسماء اللاعبين');
      return;
    }
    const players = playersRaw.split('\n').map(p => p.trim()).filter(Boolean);
    if (players.length < 2) {
      Components.showToast('⚠️', 'خطأ', 'يجب إضافة لاعبين على الأقل');
      return;
    }

    Store.createTournament({ name, game, type, players });
    Components.closeModal();
    Components.showToast('🏆', 'تم الإنشاء', `${name} — ${players.length} لاعب`);
    App.refresh();
  }

  function showTournament(id) {
    const t = Store.getById('tournaments', id);
    if (!t) return;

    let body = `<div style="margin-bottom:12px;text-align:center;">
      <div style="font-size:12px;color:var(--muted);">${t.game} • ${t.type === 'elimination' ? 'إقصائي' : 'دائري'} • ${t.players.length} لاعب</div>
    </div>`;

    // Render matches
    if (t.type === 'elimination') {
      body += renderEliminationBracket(t);
    } else {
      body += renderRoundRobinTable(t);
    }

    const footer = t.status !== 'completed' ? `
      <button class="btn btn-primary" onclick="Components.closeModal();TournamentsPage.enterResults('${id}')">📝 تسجيل نتائج</button>
      <button class="btn btn-success" onclick="TournamentsPage.completeTournament('${id}');Components.closeModal();">✅ إنهاء البطولة</button>
    ` : '';

    Components.showModal(t.name, body, footer, { icon: '🏆', maxWidth: '600px' });
  }

  function renderEliminationBracket(t) {
    const rounds = {};
    t.matches.forEach(m => {
      if (!rounds[m.round]) rounds[m.round] = [];
      rounds[m.round].push(m);
    });

    let html = '<div style="display:flex;gap:16px;overflow-x:auto;padding:8px 0;">';

    Object.keys(rounds).sort((a, b) => a - b).forEach(round => {
      html += `<div style="min-width:160px;">
        <div style="text-align:center;font-size:12px;font-weight:700;color:var(--cyan);margin-bottom:12px;">الجولة ${round}</div>`;

      rounds[round].forEach(m => {
        html += `<div style="background:var(--surface);border:1px solid ${m.winner ? 'var(--green)' : 'var(--border)'};border-radius:10px;padding:8px 12px;margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;${m.winner === m.player1 ? 'font-weight:700;color:var(--green);' : ''}">
            <span>${m.player1 || 'TBD'}</span>
            <span class="mono">${m.score1 || 0}</span>
          </div>
          <div style="height:1px;background:var(--border);margin:2px 0;"></div>
          <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:12px;${m.winner === m.player2 ? 'font-weight:700;color:var(--green);' : ''}">
            <span>${m.player2 || 'TBD'}</span>
            <span class="mono">${m.score2 || 0}</span>
          </div>
        </div>`;
      });

      html += '</div>';
    });

    html += '</div>';
    return html;
  }

  function renderRoundRobinTable(t) {
    let html = '<div class="table-wrap"><table><thead><tr><th>المباراة</th><th>اللاعب 1</th><th>النتيجة</th><th>اللاعب 2</th><th>الفائز</th></tr></thead><tbody>';
    t.matches.forEach(m => {
      html += `<tr>
        <td class="mono">#${m.id}</td>
        <td style="font-weight:${m.winner === m.player1 ? '700' : '400'};color:${m.winner === m.player1 ? 'var(--green)' : 'inherit'};">${m.player1}</td>
        <td class="mono" style="text-align:center;">${m.score1} - ${m.score2}</td>
        <td style="font-weight:${m.winner === m.player2 ? '700' : '400'};color:${m.winner === m.player2 ? 'var(--green)' : 'inherit'};">${m.player2}</td>
        <td>${m.winner ? `🏆 ${m.winner}` : '<span class="badge badge-idle">لم تلعب</span>'}</td>
      </tr>`;
    });
    html += '</tbody></table></div>';
    return html;
  }

  function enterResults(id) {
    const t = Store.getById('tournaments', id);
    if (!t) return;
    const pending = t.matches.filter(m => !m.winner && m.player1 && m.player2);
    if (pending.length === 0) {
      Components.showToast('✅', 'لا توجد مباريات', 'كل المباريات اكتملت');
      return;
    }
    const m = pending[0];
    const body = `
      <div style="text-align:center;margin-bottom:16px;">
        <div style="font-size:13px;color:var(--muted);">المباراة #${m.id}</div>
        <div style="display:flex;justify-content:center;align-items:center;gap:16px;margin-top:12px;">
          <div style="text-align:center;"><div style="font-size:15px;font-weight:700;">${m.player1}</div></div>
          <div style="font-size:20px;color:var(--muted);">VS</div>
          <div style="text-align:center;"><div style="font-size:15px;font-weight:700;">${m.player2}</div></div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">نتيجة ${m.player1}</label><input type="number" id="s1" class="form-input" value="0" inputmode="numeric"></div>
        <div class="form-group"><label class="form-label">نتيجة ${m.player2}</label><input type="number" id="s2" class="form-input" value="0" inputmode="numeric"></div>
      </div>
    `;
    const footer = `
      <button class="btn btn-primary" onclick="TournamentsPage.saveResult('${id}',${m.id})">حفظ النتيجة</button>
      <button class="btn btn-ghost" onclick="Components.closeModal()">إلغاء</button>
    `;
    Components.showModal('تسجيل نتيجة', body, footer, { icon: '📝' });
  }

  function saveResult(tournamentId, matchId) {
    const s1 = parseInt(Utils.$('#s1')?.value) || 0;
    const s2 = parseInt(Utils.$('#s2')?.value) || 0;
    const t = Store.getById('tournaments', tournamentId);
    if (!t) return;

    const match = t.matches.find(m => m.id === matchId);
    if (!match) return;
    match.score1 = s1;
    match.score2 = s2;
    match.winner = s1 > s2 ? match.player1 : s2 > s1 ? match.player2 : match.player1; // tie goes to player1
    match.status = 'completed';

    // For elimination: advance winner to next round
    if (t.type === 'elimination') {
      const nextMatch = t.matches.find(m => m.feedsFrom && m.feedsFrom.includes(matchId));
      if (nextMatch) {
        if (!nextMatch.player1) nextMatch.player1 = match.winner;
        else if (!nextMatch.player2) nextMatch.player2 = match.winner;
        nextMatch.status = nextMatch.player1 && nextMatch.player2 ? 'pending' : 'waiting';
      }
    }

    Store.update('tournaments', tournamentId, { matches: t.matches, status: 'active' });
    Components.closeModal();
    Components.showToast('📝', 'تم تسجيل النتيجة', `${match.winner} فاز!`);
    App.refresh();
  }

  function completeTournament(id) {
    Store.update('tournaments', id, { status: 'completed' });
    Components.showToast('🏆', 'انتهت البطولة', 'تم تسجيل النتائج');
    App.refresh();
  }

  function afterRender() {}

  return { render, afterRender, newTournament, saveTournament, showTournament, enterResults, saveResult, completeTournament };
})();

App.registerPage('tournaments', TournamentsPage);
