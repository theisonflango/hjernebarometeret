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
        result = await sb.auth.signUp({ email: email, password: pw });
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

      // Success — if signup, create profile
      if (_isSignup && result.data.user) {
        await sb.from('user_profiles').insert({
          id: result.data.user.id,
          email: email,
          plan: 'free',
          report_credits: 0
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

  async function _loadProfile(user) {
    _user = user;
    if (!user) { _plan = 'free'; return; }

    var { data } = await sb.from('user_profiles').select('plan, report_credits, display_name').eq('id', user.id).single();
    if (data) {
      _plan = data.plan || 'free';
    } else {
      _plan = 'free';
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

  // ── Init: check existing session ──
  async function _init() {
    try {
      var { data: { session } } = await sb.auth.getSession();
      if (session && session.user) {
        await _loadProfile(session.user);
      }
    } catch (e) {
      // No session
    }
    _ready = true;
    _updateNav();
    _callbacks.forEach(function(cb) { try { cb(); } catch(e) {} });
    _callbacks = [];
  }

  // Listen for auth state changes
  sb.auth.onAuthStateChange(function(event, session) {
    if (event === 'SIGNED_OUT') {
      _user = null;
      _plan = 'free';
      _updateNav();
    }
  });

  // ── Public API ──
  window.HB_AUTH = {
    get user() { return _user; },
    get plan() { return _plan; },
    isAdmin: function() { return _plan === 'admin' || _plan === 'unlimited'; },
    hasPlan: function() { return _plan !== 'free'; },
    isReady: function() { return _ready; },
    onReady: function(cb) { if (_ready) cb(); else _callbacks.push(cb); },
    showLogin: showLogin,
    hideLogin: hideLogin,
    logout: logout,
    showUserMenu: showUserMenu,
    supabase: sb,
    _handleLogin: _handleLogin,
    _toggleSignup: _toggleSignup
  };

  // Run init
  _init();
})();
