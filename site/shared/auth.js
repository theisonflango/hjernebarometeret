/* Hjernebarometeret — Shared Auth Module
   Requires: @supabase/supabase-js loaded via CDN before this script.
   Injects login modal, manages session, exposes window.HB_AUTH.
*/
(function(){
  var SUPABASE_URL = 'https://pmbbachqedomvixvvfpj.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtYmJhY2hxZWRvbXZpeHZ2ZnBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MDQ4MDksImV4cCI6MjA4NzI4MDgwOX0.dQ9GDUxyAqttisIPGI5hR20-9JpBKlFG4UvANivu4kM';

  // Init Supabase client with schema
  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    db: { schema: 'hjernebarometeret' }
  });

  var _user = null;
  var _plan = 'free';
  var _credits = 0;
  var _ready = false;
  var _callbacks = [];

  // ── Login Modal HTML ──
  function injectModal() {
    if (document.getElementById('hb-login-modal')) return;
    var div = document.createElement('div');
    div.id = 'hb-login-modal';
    div.className = 'hb-modal-overlay';
    div.innerHTML =
      '<div class="hb-modal">' +
        '<button class="hb-modal-close" onclick="HB_AUTH.hideLogin()" aria-label="Luk">&times;</button>' +
        '<div class="hb-modal-logo">' +
          '<svg width="28" height="28" viewBox="0 0 100 100" fill="none"><path d="M50 5 A45 45 0 0 1 95 50" stroke="#d45454" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M50 5 A45 45 0 0 0 5 50" stroke="#4a8ec2" stroke-width="8" fill="none" stroke-linecap="round"/><circle cx="50" cy="50" r="6" fill="#1c1b1a"/><line x1="50" y1="50" x2="50" y2="18" stroke="#1c1b1a" stroke-width="3" stroke-linecap="round" transform="rotate(-30,50,50)"/></svg>' +
          ' Hjernebarometeret' +
        '</div>' +
        '<h3 class="hb-modal-title">Log ind</h3>' +
        '<p class="hb-modal-sub">Log ind for at se dine resultater og rapporter.</p>' +
        '<button onclick="HB_AUTH._googleLogin()" class="hb-btn-google" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:12px;font-size:14px;font-weight:500;font-family:var(--sans);background:#fff;color:#1c1b1a;border:1.5px solid var(--border);border-radius:10px;cursor:pointer;transition:background .2s,border-color .2s;margin-bottom:16px">' +
          '<svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>' +
          'Forts\u00e6t med Google' +
        '</button>' +
        '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px"><div style="flex:1;height:1px;background:var(--border)"></div><span style="font-size:12px;color:var(--text-4)">eller</span><div style="flex:1;height:1px;background:var(--border)"></div></div>' +
        '<form id="hb-login-form" onsubmit="HB_AUTH._handleLogin(event)">' +
          '<input type="email" id="hb-login-email" class="hb-input" placeholder="Email" required autocomplete="email">' +
          '<input type="password" id="hb-login-pw" class="hb-input" placeholder="Adgangskode" required autocomplete="current-password">' +
          '<div id="hb-login-error" class="hb-error" style="display:none"></div>' +
          '<button type="submit" class="hb-btn-login" id="hb-login-btn">Log ind</button>' +
        '</form>' +
        '<p class="hb-modal-footer">Har du ikke en konto? <a href="#" onclick="HB_AUTH._toggleSignup(event)">Opret konto</a></p>' +
      '</div>';
    document.body.appendChild(div);

    // Close on overlay click
    div.addEventListener('click', function(e) {
      if (e.target === div) HB_AUTH.hideLogin();
    });
    // Close on escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && div.style.display === 'flex') HB_AUTH.hideLogin();
    });
  }

  function showLogin() {
    injectModal();
    var modal = document.getElementById('hb-login-modal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    setTimeout(function(){ document.getElementById('hb-login-email').focus(); }, 100);
  }

  function hideLogin() {
    var modal = document.getElementById('hb-login-modal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  var _isSignup = false;

  async function _googleLogin() {
    try {
      await sb.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.href }
      });
    } catch(e) {
      console.error('Google login error:', e);
    }
  }

  function _toggleSignup(e) {
    e.preventDefault();
    _isSignup = !_isSignup;
    var title = document.querySelector('.hb-modal-title');
    var btn = document.getElementById('hb-login-btn');
    var footer = document.querySelector('.hb-modal-footer');
    if (_isSignup) {
      title.textContent = 'Opret konto';
      btn.textContent = 'Opret konto';
      footer.innerHTML = 'Har du allerede en konto? <a href="#" onclick="HB_AUTH._toggleSignup(event)">Log ind</a>';
    } else {
      title.textContent = 'Log ind';
      btn.textContent = 'Log ind';
      footer.innerHTML = 'Har du ikke en konto? <a href="#" onclick="HB_AUTH._toggleSignup(event)">Opret konto</a>';
    }
    document.getElementById('hb-login-error').style.display = 'none';
  }

  async function _handleLogin(e) {
    e.preventDefault();
    var email = document.getElementById('hb-login-email').value.trim();
    var pw = document.getElementById('hb-login-pw').value;
    var errEl = document.getElementById('hb-login-error');
    var btn = document.getElementById('hb-login-btn');

    btn.disabled = true;
    btn.textContent = _isSignup ? 'Opretter...' : 'Logger ind...';
    errEl.style.display = 'none';

    try {
      var result;
      if (_isSignup) {
        result = await sb.auth.signUp({
          email: email,
          password: pw,
          options: { emailRedirectTo: window.location.origin + '/' }
        });
        if (!result.error && result.data.user && !result.data.session) {
          // Email confirmation required — show message
          errEl.textContent = 'Tjek din email — klik på bekræftelseslinket for at aktivere din konto.';
          errEl.style.display = 'block';
          errEl.style.color = 'var(--accent, #2c5f4b)';
          btn.disabled = false;
          btn.textContent = 'Opret konto';
          return;
        }
      } else {
        result = await sb.auth.signInWithPassword({ email: email, password: pw });
      }

      if (result.error) {
        errEl.textContent = result.error.message === 'Invalid login credentials'
          ? 'Forkert email eller adgangskode.'
          : result.error.message;
        errEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = _isSignup ? 'Opret konto' : 'Log ind';
        return;
      }

      // Success — if signup, create profile with welcome bonus
      if (_isSignup && result.data.user) {
        var welcomeCredits = 0;
        try {
          var { data: cfg } = await sb.from('site_config').select('value').eq('key', 'welcome_credits').maybeSingle();
          if (cfg) welcomeCredits = parseInt(cfg.value) || 0;
        } catch(e) {}
        await sb.from('user_profiles').insert({
          id: result.data.user.id,
          email: email,
          plan: 'free',
          report_credits: welcomeCredits
        });
      }

      // Load profile
      await _loadProfile(result.data.user || result.data.session.user);
      hideLogin();
      _updateNav();

    } catch (err) {
      errEl.textContent = 'Noget gik galt. Prøv igen.';
      errEl.style.display = 'block';
    }

    btn.disabled = false;
    btn.textContent = _isSignup ? 'Opret konto' : 'Log ind';
  }

  function _withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise(function(_, reject) { setTimeout(function() { reject(new Error('timeout')); }, ms); })
    ]);
  }

  async function _loadProfile(user) {
    _user = user;
    if (!user) { _plan = 'free'; _credits = 0; return; }

    try {
      var { data } = await _withTimeout(
        sb.from('user_profiles').select('plan, report_credits, display_name').eq('id', user.id).maybeSingle(),
        8000
      );
      if (data) {
        _plan = data.plan || 'free';
        _credits = data.report_credits || 0;
      } else {
        // Profile doesn't exist yet — create it
        var wcCredits = 0;
        try {
          var { data: wcCfg } = await _withTimeout(
            sb.from('site_config').select('value').eq('key', 'welcome_credits').maybeSingle(),
            5000
          );
          if (wcCfg) wcCredits = parseInt(wcCfg.value) || 0;
        } catch(e) {}
        _plan = 'free';
        _credits = wcCredits;
        try {
          await _withTimeout(
            sb.from('user_profiles').insert({
              id: user.id, email: user.email, plan: 'free', report_credits: wcCredits
            }),
            5000
          );
        } catch(e) { /* Ignore duplicate insert or timeout */ }
      }
    } catch(e) {
      console.warn('HB_AUTH: _loadProfile failed/timeout, using defaults', e.message);
      _plan = 'free';
      _credits = 0;
    }
  }

  function _updateNav() {
    // Update login button in nav
    var loginLinks = document.querySelectorAll('.sn-login');
    loginLinks.forEach(function(el) {
      if (_user) {
        var name = _user.user_metadata?.display_name || _user.email.split('@')[0];
        el.innerHTML =
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ' +
          name;
        el.onclick = null;
        el.href = '#';
        el.onclick = function(e) { e.preventDefault(); HB_AUTH.showUserMenu(el); };
      } else {
        el.innerHTML =
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Log ind';
        el.onclick = function(e) { e.preventDefault(); HB_AUTH.showLogin(); };
        el.href = '#';
      }
    });

    // Dispatch custom event so test pages can react
    window.dispatchEvent(new CustomEvent('hb-auth-change', { detail: { user: _user, plan: _plan } }));
  }

  function showUserMenu(anchor) {
    // Remove existing menu
    var existing = document.getElementById('hb-user-menu');
    if (existing) { existing.remove(); return; }

    var menu = document.createElement('div');
    menu.id = 'hb-user-menu';
    menu.className = 'hb-user-menu';
    menu.innerHTML =
      '<div class="hb-um-email">' + (_user ? _user.email : '') + '</div>' +
      (_plan === 'admin' ? '<div class="hb-um-badge">Admin</div>' : '') +
      (_plan === 'unlimited' ? '<div class="hb-um-badge">Ubegrænset</div>' : '') +
      '<a href="/profil.html" class="hb-um-item">Min profil</a>' +
      '<a href="#" class="hb-um-item" onclick="HB_AUTH.logout();return false">Log ud</a>';

    document.body.appendChild(menu);

    // Position near anchor
    var rect = anchor.getBoundingClientRect();
    menu.style.top = (rect.bottom + 8) + 'px';
    menu.style.right = (window.innerWidth - rect.right) + 'px';

    // Close on outside click
    setTimeout(function() {
      document.addEventListener('click', function handler(e) {
        if (!menu.contains(e.target) && e.target !== anchor) {
          menu.remove();
          document.removeEventListener('click', handler);
        }
      });
    }, 10);
  }

  async function logout() {
    await sb.auth.signOut();
    _user = null;
    _plan = 'free';
    var menu = document.getElementById('hb-user-menu');
    if (menu) menu.remove();
    _updateNav();
  }

  // Refresh credits from DB (called after coupon redemption)
  async function refreshCredits() {
    if (!_user) return 0;
    var { data } = await sb.from('user_profiles').select('report_credits').eq('id', _user.id).single();
    if (data) _credits = data.report_credits || 0;
    return _credits;
  }

  // Listen for credits change (from coupon module)
  window.addEventListener('hb-credits-change', function(e) {
    if (e.detail && typeof e.detail.credits === 'number') {
      _credits = e.detail.credits;
    }
  });

  // ── Init via onAuthStateChange (avoids navigator lock deadlock from separate getSession call) ──
  var _initDone = false;
  function _markReady() {
    if (_initDone) return;
    _initDone = true;
    _ready = true;
    _updateNav();
    _callbacks.forEach(function(cb) { try { cb(); } catch(e) {} });
    _callbacks = [];
  }

  sb.auth.onAuthStateChange(function(event, session) {
    // IMPORTANT: Do NOT await inside this callback — Supabase holds a navigator lock
    // that deadlocks if we make async Supabase calls while it's held.
    if (event === 'INITIAL_SESSION') {
      if (session && session.user) {
        _loadProfile(session.user).then(function() { _markReady(); });
      } else {
        _markReady();
      }
    } else if (event === 'SIGNED_OUT') {
      _user = null;
      _plan = 'free';
      _credits = 0;
      _updateNav();
      window.dispatchEvent(new CustomEvent('hb-auth-change', { detail: { user: null, plan: 'free' } }));
    } else if (event === 'SIGNED_IN' && session && session.user) {
      _loadProfile(session.user).then(function() {
        _updateNav();
        window.dispatchEvent(new CustomEvent('hb-auth-change', { detail: { user: _user, plan: _plan } }));
        if (window.location.hash && window.location.hash.includes('access_token')) {
          window.history.replaceState({}, '', window.location.pathname + window.location.search);
        }
      });
    } else if (event === 'TOKEN_REFRESHED' && session && session.user) {
      if (!_user) {
        _loadProfile(session.user).then(function() { _updateNav(); });
      }
    }
  });

  // Safety: if onAuthStateChange never fires INITIAL_SESSION, force ready after 5s
  setTimeout(function() { _markReady(); }, 5000);

  // ── Public API ──
  window.HB_AUTH = {
    get user() { return _user; },
    get plan() { return _plan; },
    get credits() { return _credits; },
    isAdmin: function() { return _plan === 'admin' || _plan === 'unlimited'; },
    hasPlan: function() { return _plan !== 'free'; },
    isReady: function() { return _ready; },
    onReady: function(cb) {
      if (_ready) { cb(); return; }
      _callbacks.push(cb);
      // Safety timeout — resolve after 8s even if getSession() hangs
      setTimeout(function() {
        if (!_ready) {
          console.warn('HB_AUTH: onReady timeout — forcing ready state');
          _ready = true;
          _callbacks.forEach(function(fn) { try { fn(); } catch(e) {} });
          _callbacks = [];
        }
      }, 8000);
    },
    showLogin: showLogin,
    hideLogin: hideLogin,
    logout: logout,
    showUserMenu: showUserMenu,
    refreshCredits: refreshCredits,
    supabase: sb,
    _handleLogin: _handleLogin,
    _toggleSignup: _toggleSignup,
    _googleLogin: _googleLogin
  };

  // Init happens via onAuthStateChange INITIAL_SESSION callback above
})();
