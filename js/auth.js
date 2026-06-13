/* ═══════════════════════════════════════════
   ريستا كافيه — نظام تسجيل الدخول الموحد (Auth)
   ═══════════════════════════════════════════ */

const Auth = (() => {
  function renderLoginScreen() {
    const pageEl = document.getElementById('page-content');
    
    // Hide navigation elements
    document.querySelector('.sidebar').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
    document.querySelector('.more-menu').style.display = 'none';
    document.querySelector('.main').style.margin = '0';
    document.querySelector('.main').style.padding = '0';
    
    // Auth UI Template
    pageEl.innerHTML = `
      <div class="auth-wrapper" style="min-height:100vh; display:flex; align-items:center; justify-content:center; background:var(--bg); padding:20px; text-align:center;">
        <div class="auth-card" style="width:100%; max-width:400px; background:var(--card); border:1px solid var(--border); border-radius:24px; padding:40px 20px; box-shadow:0 20px 40px rgba(0,0,0,0.5);">
          
          <img src="app-logo.svg" alt="Rista Cafe" style="width:100px; height:100px; margin-bottom:20px; filter:drop-shadow(0 0 10px var(--cyan));">
          <h1 style="margin-bottom:10px; font-weight:900; font-size:28px; letter-spacing:2px; color:var(--text);">Rista Cafe</h1>
          <p style="color:var(--muted); margin-bottom:40px; font-size:14px;">نظام إدارة كافيه الألعاب الأول</p>

          <div style="display:flex; flex-direction:column; gap:16px;">
            <!-- Manager Button -->
            <button class="btn btn-primary btn-block" style="padding:16px; font-size:18px; border-radius:16px; background:linear-gradient(45deg, var(--cyan), #0088ff); color:#fff; border:none; box-shadow:var(--cyan-glow);" onclick="Auth.promptLogin('admin')">
              👨‍💼 دخول المدير
            </button>

            <!-- Worker Button -->
            <button class="btn btn-block" style="padding:16px; font-size:18px; border-radius:16px; background:var(--surface); border:1px solid var(--border); color:var(--text); box-shadow:0 4px 10px rgba(0,0,0,0.3);" onclick="Auth.promptLogin('staff')">
              👨‍🍳 دخول العامل
            </button>

            <div style="margin:20px 0; border-top:1px solid var(--border); position:relative;">
              <span style="position:absolute; top:-10px; left:50%; transform:translateX(-50%); background:var(--card); padding:0 10px; color:var(--muted); font-size:12px;">أو</span>
            </div>

            <!-- Guest / Customer Button -->
            <button class="btn btn-block" style="padding:20px; font-size:20px; border-radius:16px; background:linear-gradient(45deg, var(--purple), #ff0055); color:#fff; border:none; box-shadow:var(--red-glow); font-weight:bold;" onclick="Auth.loginGuest()">
              📱 دخول العملاء (Guest)
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function promptLogin(role) {
    const roleName = role === 'admin' ? 'المدير' : 'العامل';
    const correctPass = role === 'admin' ? '010011' : '11223300';
    
    const body = `
      <div style="text-align:center; margin-bottom:20px;">
        <div style="font-size:40px; margin-bottom:10px;">🔒</div>
        <p>يرجى إدخال كلمة المرور الخاصة بـ <b>${roleName}</b></p>
      </div>
      <div class="form-group">
        <input type="password" id="auth-password" class="form-input" placeholder="كلمة المرور..." style="text-align:center; font-size:24px; letter-spacing:4px;" inputmode="numeric">
      </div>
    `;
    const footer = `
      <button class="btn btn-primary" onclick="Auth.verifyLogin('${role}', '${correctPass}')">دخول</button>
      <button class="btn btn-ghost" onclick="Components.closeModal()">إلغاء</button>
    `;
    Components.showModal(`تسجيل دخول - ${roleName}`, body, footer, { icon: '🔑' });
  }

  function verifyLogin(role, correctPass) {
    const passInput = document.getElementById('auth-password');
    if (!passInput) return;

    if (passInput.value === correctPass) {
      Components.closeModal();
      localStorage.setItem('resta_auth_role', role);
      
      // Update store settings for name
      const settings = Store.getSettings();
      settings.currentUser.role = role;
      settings.currentUser.name = role === 'admin' ? 'الاستاذ محمد' : 'Resta (عامل)';
      Store.setSettings(settings);

      // Reload app completely to boot into dashboard
      window.location.hash = 'dashboard';
      window.location.reload();
    } else {
      Components.showToast('❌', 'خطأ', 'كلمة المرور غير صحيحة');
      passInput.value = '';
      passInput.focus();
    }
  }

  function loginGuest() {
    // Guest doesn't need localStorage role, they just get redirected to #client
    window.location.hash = 'client';
    window.location.reload();
  }

  function logout() {
    localStorage.removeItem('resta_auth_role');
    window.location.hash = '';
    window.location.reload();
  }

  function getRole() {
    return localStorage.getItem('resta_auth_role');
  }

  return { renderLoginScreen, promptLogin, verifyLogin, loginGuest, logout, getRole };
})();
