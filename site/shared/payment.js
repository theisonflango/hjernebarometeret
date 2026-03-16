/* Hjernebarometeret — Shared Payment Module
   Requires: auth.js loaded before this script.
   Exposes window.HB_PAY for Stripe Checkout integration.
*/
(function(){
  var CHECKOUT_URL = 'https://pmbbachqedomvixvvfpj.supabase.co/functions/v1/hjernebarometeret-create-checkout';

  var FILE_MAP = {
    iq: '/tests/iq.html',
    adhd: '/tests/adhd.html',
    autisme: '/tests/autisme.html',
    personlighed: '/tests/personlighed.html',
    stress: '/tests/stress.html',
    eq: '/tests/eq.html',
    karriere: '/tests/karriere.html'
  };

  // Report pages (redirected to after successful payment)
  var REPORT_MAP = {
    personlighed: '/rapporter/personlighed.html',
    adhd: '/rapporter/adhd.html',
    stress: '/rapporter/stress.html',
    iq: '/rapporter/iq.html',
    autisme: '/rapporter/autisme.html',
    eq: '/rapporter/eq.html',
    karriere: '/rapporter/karriere.html'
  };

  // ── Check report access ──
  async function hasAccess(testType) {
    // Admin always has access
    if (window.HB_AUTH && HB_AUTH.isAdmin()) return true;

    // Unlimited plan always has access
    if (window.HB_AUTH && HB_AUTH.plan === 'unlimited') return true;

    // Check anonymous token in localStorage
    var token = localStorage.getItem('hb_report_token_' + testType);
    if (token && window.HB_AUTH && HB_AUTH.supabase) {
      var { data } = await HB_AUTH.supabase
        .from('report_access')
        .select('id')
        .eq('anonymous_token', token)
        .eq('test_type', testType)
        .maybeSingle();
      if (data) return true;
    }

    // Check user-linked access
    if (window.HB_AUTH && HB_AUTH.user) {
      var { data } = await HB_AUTH.supabase
        .from('report_access')
        .select('id')
        .eq('user_id', HB_AUTH.user.id)
        .eq('test_type', testType)
        .maybeSingle();
      if (data) return true;

    }

    return false;
  }

  // ── Wait for access with retry (webhook race condition) ──
  async function waitForAccess(testType, maxRetries, onProgress) {
    var retries = maxRetries || 8;
    for (var i = 0; i < retries; i++) {
      try {
        if (await hasAccess(testType)) return true;
      } catch(e) {
        console.warn('waitForAccess check failed:', e);
      }
      if (onProgress) onProgress(i + 1, retries);
      await new Promise(function(r){ setTimeout(r, 2000); });
    }
    return false;
  }

  // ── Save test results to localStorage + database ──
  function saveResults(testType, data) {
    try {
      localStorage.setItem('hb_results_' + testType, JSON.stringify(data));
    } catch(e) {}
    // Also save to database (fire-and-forget)
    _saveResultsToDB(testType, data);
  }

  function loadResults(testType) {
    try {
      var saved = localStorage.getItem('hb_results_' + testType);
      return saved ? JSON.parse(saved) : null;
    } catch(e) { return null; }
  }

  // ── Save results to Supabase database ──
  async function _saveResultsToDB(testType, data) {
    try {
      var sb = window.HB_AUTH && HB_AUTH.supabase;
      if (!sb) return;

      var row = {
        test_type: testType,
        result_data: data,
        score_summary: _makeSummary(testType, data),
        completed_at: new Date().toISOString()
      };

      // Attach birth_year if present in result data
      if (data && data.birth_year) {
        row.birth_year = data.birth_year;
      }

      // Attach user or anonymous token
      if (window.HB_AUTH && HB_AUTH.user) {
        row.user_id = HB_AUTH.user.id;
      } else {
        var token = localStorage.getItem('hb_report_token_' + testType);
        if (!token) {
          token = crypto.randomUUID ? crypto.randomUUID() : 'anon-' + Date.now();
          localStorage.setItem('hb_report_token_' + testType, token);
        }
        row.anonymous_token = token;
      }

      await sb.from('test_results').insert(row);
    } catch(e) {
      console.warn('Could not save results to DB:', e);
    }
  }

  // ── Generate human-readable score summary ──
  function _makeSummary(testType, d) {
    try {
      switch(testType) {
        case 'iq':
          return 'IQ: ' + (d.iq || '?') + ' (' + (d.cls || '?') + '), ' + (d.cor||0) + '/' + (d.tot||40) + ' korrekte';
        case 'adhd':
          return 'ADHD ' + (d.mode||'?') + ': ' + (d.totalPct||0).toFixed(0) + '%, ' + (d.level||'?') + ', ' + (d.profileType||'?');
        case 'autisme':
          return 'AQ: ' + (d.t||0) + '/50, kategori: ' + (d.category||'?');
        case 'personlighed':
          if (d.traitPct) {
            var t = d.traitPct;
            return 'O:' + (t.O||0) + ' C:' + (t.C||0) + ' E:' + (t.E||0) + ' A:' + (t.A||0) + ' N:' + (t.N||0);
          }
          return 'Big Five completed';
        case 'stress':
          return 'PSS: ' + (d.pssTotal||0) + '/40 (' + (d.pssPct||0).toFixed(0) + '%), ' + (d.burnoutProfile||'?');
        case 'eq':
          return 'EQ: ' + (d.total||0) + '/' + (d.max||165) + ' (' + (d.percentile||0) + '%)';
        case 'karriere':
          return 'Holland: ' + (d.hollandCode||'?') + ', primær: ' + (d.primaryType||'?');
        default:
          return testType + ' completed';
      }
    } catch(e) { return testType + ' completed'; }
  }

  // ── Load results from database (for logged-in users) ──
  async function loadResultsFromDB(testType) {
    try {
      var sb = window.HB_AUTH && HB_AUTH.supabase;
      if (!sb || !window.HB_AUTH || !HB_AUTH.user) return null;

      var { data } = await sb
        .from('test_results')
        .select('result_data, completed_at')
        .eq('user_id', HB_AUTH.user.id)
        .eq('test_type', testType)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return data ? data.result_data : null;
    } catch(e) { return null; }
  }

  // ── Get all results history for logged-in user ──
  async function getResultsHistory(testType) {
    try {
      var sb = window.HB_AUTH && HB_AUTH.supabase;
      if (!sb || !window.HB_AUTH || !HB_AUTH.user) return [];

      var query = sb
        .from('test_results')
        .select('test_type, score_summary, completed_at')
        .eq('user_id', HB_AUTH.user.id)
        .order('completed_at', { ascending: false })
        .limit(50);

      if (testType) query = query.eq('test_type', testType);

      var { data } = await query;
      return data || [];
    } catch(e) { return []; }
  }

  // ── Initiate Stripe Checkout ──
  async function checkout(productType, testType, testData) {
    // Require login for pack4 and unlimited
    if ((productType === 'pack4' || productType === 'unlimited') && (!window.HB_AUTH || !HB_AUTH.user)) {
      if (window.HB_AUTH) HB_AUTH.showLogin();
      return;
    }

    // Save results before redirect
    if (testType && testData) {
      saveResults(testType, testData);
    }

    var body = {
      product_type: productType,
      test_type: testType || null,
      success_url: window.location.origin + (testType ? (REPORT_MAP[testType] || FILE_MAP[testType]) : '/rapporter.html'),
      cancel_url: window.location.href
    };

    if (window.HB_AUTH && HB_AUTH.user) {
      body.user_id = HB_AUTH.user.id;
      body.user_email = HB_AUTH.user.email;
    }

    // Show loading state
    var btn = document.activeElement;
    var originalText = '';
    if (btn && btn.tagName === 'BUTTON') {
      originalText = btn.textContent;
      btn.textContent = 'Viderestiller...';
      btn.disabled = true;
    }

    try {
      var resp = await fetch(CHECKOUT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      var result = await resp.json();

      if (!resp.ok) {
        throw new Error(result.error || 'Checkout failed');
      }

      // Save anonymous token
      if (result.anonymous_token && testType) {
        localStorage.setItem('hb_report_token_' + testType, result.anonymous_token);
      }

      // Redirect to Stripe Checkout
      window.location.href = result.checkout_url;

    } catch(err) {
      console.error('Checkout error:', err);
      alert('Der opstod en fejl. Prøv venligst igen.');
      if (btn && originalText) {
        btn.textContent = originalText;
        btn.disabled = false;
      }
    }
  }

  // ── Handle return from Stripe ──
  function handleReturn() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      var token = params.get('token');
      var testType = _guessTestType();
      if (token && testType) {
        localStorage.setItem('hb_report_token_' + testType, token);
      }
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      return { success: true, token: token, testType: testType };
    }
    if (params.get('payment') === 'cancelled') {
      window.history.replaceState({}, '', window.location.pathname);
      return { success: false };
    }
    return null;
  }

  function _guessTestType() {
    var path = window.location.pathname.toLowerCase();
    if (path.includes('iq')) return 'iq';
    if (path.includes('adhd')) return 'adhd';
    if (path.includes('autisme')) return 'autisme';
    if (path.includes('personlighed')) return 'personlighed';
    if (path.includes('stress')) return 'stress';
    if (path.includes('eq')) return 'eq';
    if (path.includes('karriere')) return 'karriere';
    return null;
  }

  // ── Use a credit to unlock a report ──
  async function useCredit(testType) {
    if (!window.HB_AUTH || !HB_AUTH.user) return false;
    if (HB_AUTH.credits <= 0) return false;

    // Decrement credit and grant access
    var { error } = await HB_AUTH.supabase
      .from('user_profiles')
      .update({
        report_credits: HB_AUTH.credits - 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', HB_AUTH.user.id);

    if (!error) {
      // Insert report_access
      await HB_AUTH.supabase
        .from('report_access')
        .insert({
          user_id: HB_AUTH.user.id,
          test_type: testType,
          granted_at: new Date().toISOString()
        });
      return true;
    }
    return false;
  }

  // ── Render "Brug credit" option in paywall ──
  // Call this from report pages after showing #no-access
  function renderCreditOption(testType) {
    if (!window.HB_AUTH || !HB_AUTH.user || HB_AUTH.credits <= 0) return;

    var container = document.getElementById('no-access');
    if (!container) return;

    // Don't add twice
    if (container.querySelector('.credit-option')) return;

    var credits = HB_AUTH.credits;
    var div = document.createElement('div');
    div.className = 'credit-option';
    div.style.cssText = 'margin-top:20px;padding:20px;background:var(--accent-light,#e8f0ec);border-radius:14px;text-align:center;';
    div.innerHTML =
      '<p style="font-size:14px;font-weight:600;color:var(--accent,#2c5f4b);margin-bottom:4px">Du har ' + credits + ' rapport-credit' + (credits !== 1 ? 's' : '') + '</p>' +
      '<p style="font-size:13px;color:var(--text-2,#5a5650);margin-bottom:14px">Brug 1 credit for at l\u00e5se denne rapport op</p>' +
      '<button class="buy-btn credit-use-btn" style="background:var(--accent,#2c5f4b)">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" style="vertical-align:-3px;margin-right:6px"><rect x="2" y="3" width="20" height="18" rx="3"/><path d="M2 8h20"/></svg>' +
        'Brug 1 credit' +
      '</button>';

    // Insert before the "Tilbage" link
    var backLink = container.querySelector('p:last-child');
    if (backLink) {
      container.insertBefore(div, backLink);
    } else {
      container.appendChild(div);
    }

    // Click handler
    div.querySelector('.credit-use-btn').addEventListener('click', async function() {
      var btn = this;
      btn.disabled = true;
      btn.textContent = 'Aktiverer...';
      var ok = await useCredit(testType);
      if (ok) {
        window.location.reload();
      } else {
        btn.textContent = 'Fejl — pr\u00f8v igen';
        btn.disabled = false;
      }
    });
  }

  // ── Migrate anonymous results to logged-in user ──
  async function _migrateAnonymousResults(userId) {
    try {
      var sb = window.HB_AUTH && HB_AUTH.supabase;
      if (!sb || !userId) return 0;

      // Collect all anonymous tokens from localStorage
      var tokens = [];
      var testTypes = ['iq', 'adhd', 'autisme', 'personlighed', 'stress', 'eq', 'karriere'];
      testTypes.forEach(function(tt) {
        var t = localStorage.getItem('hb_report_token_' + tt);
        if (t) tokens.push(t);
      });
      if (tokens.length === 0) return 0;

      // Update test_results: set user_id where anonymous_token matches
      var { data, error } = await sb
        .from('test_results')
        .update({ user_id: userId, anonymous_token: null })
        .is('user_id', null)
        .in('anonymous_token', tokens)
        .select('id');

      // Also migrate report_access
      await sb
        .from('report_access')
        .update({ user_id: userId, anonymous_token: null })
        .is('user_id', null)
        .in('anonymous_token', tokens);

      return (data && data.length) || 0;
    } catch(e) {
      console.warn('Could not migrate anonymous results:', e);
      return 0;
    }
  }

  // ── Render "Gem dit resultat" prompt for anonymous users ──
  function renderSavePrompt(container, testType) {
    // Don't show if already logged in
    if (window.HB_AUTH && HB_AUTH.user) return;

    // Accept string ID or DOM element
    var el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el) return;

    // Don't add twice
    if (el.querySelector('.hb-save-prompt')) return;

    var div = document.createElement('div');
    div.className = 'hb-save-prompt';
    div.style.cssText = 'text-align:center;margin:28px auto;padding:24px 20px;max-width:420px;background:#f8f7f5;border:1.5px solid #e8e5e0;border-radius:16px;';
    div.innerHTML =
      '<div style="font-size:24px;margin-bottom:10px">💾</div>' +
      '<p style="font-size:15px;font-weight:600;color:#1c1b1a;margin:0 0 6px">Gem dit resultat</p>' +
      '<p style="font-size:13px;color:#5a5650;margin:0 0 16px;line-height:1.6">Opret en gratis konto for at gemme dine resultater og se dem igen senere.</p>' +
      '<button class="hb-save-prompt-btn" style="display:inline-flex;align-items:center;gap:8px;padding:12px 28px;background:#2c5f4b;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;font-family:Figtree,system-ui,sans-serif;cursor:pointer;transition:opacity .2s">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="10 17 15 12 10 7"/></svg>' +
        'Log ind / Opret konto' +
      '</button>';

    el.appendChild(div);

    // Hover effect
    var btn = div.querySelector('.hb-save-prompt-btn');
    btn.onmouseenter = function() { btn.style.opacity = '0.85'; };
    btn.onmouseleave = function() { btn.style.opacity = '1'; };

    // Click → open login modal
    btn.addEventListener('click', function() {
      if (window.HB_AUTH) HB_AUTH.showLogin();
    });

    // Listen for login → migrate results + update UI
    function onAuth(e) {
      var user = e.detail && e.detail.user;
      if (user) {
        // Migrate anonymous results
        _migrateAnonymousResults(user.id).then(function(count) {
          if (count > 0) console.log('Migrated ' + count + ' anonymous results to user');
        });
        // Replace prompt with success message
        div.innerHTML =
          '<div style="font-size:24px;margin-bottom:10px">✅</div>' +
          '<p style="font-size:15px;font-weight:600;color:#2c5f4b;margin:0 0 4px">Resultat gemt!</p>' +
          '<p style="font-size:13px;color:#5a5650;margin:0">Dine resultater er nu knyttet til din konto.</p>';
        // Clean up listener
        window.removeEventListener('hb-auth-change', onAuth);
      }
    }
    window.addEventListener('hb-auth-change', onAuth);
  }

  // ── Public API ──
  window.HB_PAY = {
    hasAccess: hasAccess,
    waitForAccess: waitForAccess,
    checkout: checkout,
    handleReturn: handleReturn,
    saveResults: saveResults,
    loadResults: loadResults,
    loadResultsFromDB: loadResultsFromDB,
    getResultsHistory: getResultsHistory,
    useCredit: useCredit,
    renderCreditOption: renderCreditOption,
    renderSavePrompt: renderSavePrompt
  };
})();
