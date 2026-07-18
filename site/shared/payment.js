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
    karriere: '/tests/karriere.html',
    ocd: '/tests/ocd.html'
  };

  // Report pages (redirected to after successful payment)
  var REPORT_MAP = {
    personlighed: '/rapporter/personlighed.html',
    adhd: '/rapporter/adhd.html',
    stress: '/rapporter/stress.html',
    iq: '/rapporter/iq.html',
    autisme: '/rapporter/autisme.html',
    eq: '/rapporter/eq.html',
    karriere: '/rapporter/karriere.html',
    ocd: '/rapporter/ocd.html'
  };

  // ── Funnel event logging ──
  // Writes directly to event_log so it works on every page payment.js loads on
  // (report pages, test pages, pricing) without depending on analytics.js.
  // Uses the same hb_anon_token as analytics.js so events link to one identity.
  function _logEvent(eventType, testType, data) {
    try {
      var sb = window.HB_AUTH && HB_AUTH.supabase;
      if (!sb) return;
      var identity = {};
      if (HB_AUTH.user) {
        identity.user_id = HB_AUTH.user.id;
      } else {
        var tok = localStorage.getItem('hb_anon_token');
        if (!tok) {
          tok = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'anon-' + Date.now() + '-' + Math.random().toString(36).slice(2);
          localStorage.setItem('hb_anon_token', tok);
        }
        identity.anonymous_token = tok;
      }
      // .then() is required: supabase-js query builders are lazy and only send
      // the request when awaited or .then()'d. Fire-and-forget, swallow errors.
      sb.from('event_log').insert(Object.assign({
        event_type: eventType, test_type: testType || null, event_data: data || null, created_at: new Date().toISOString()
      }, identity)).then(function(){}, function(){});
    } catch (e) { /* never block the flow on analytics */ }
  }

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

  // ── Right-of-withdrawal consent (fortrydelsesret) ──
  // Shows a required, unticked consent before every purchase. Wording is
  // product-aware (single report vs. credit-pack vs. subscription). Resolves
  // true when the user affirmatively consents, false if they cancel. The
  // authoritative consent timestamp is set server-side (create-checkout).
  function _showWithdrawalConsent(productType) {
    return new Promise(function(resolve){
      var prev = document.activeElement;
      var existing = document.getElementById('hb-consent-overlay');
      if (existing) existing.remove();

      var texts = {
        single: {
          intro: 'Rapporten er digitalt indhold og gøres tilgængelig med det samme efter betaling.',
          consent: 'Jeg samtykker til, at rapporten leveres straks, og jeg accepterer, at min <strong>fortrydelsesret bortfalder</strong>, når leveringen begynder.'
        },
        pack4: {
          intro: 'Dine 4 rapport-credits gøres tilgængelige på din konto med det samme efter betaling.',
          consent: 'Jeg samtykker til, at jeg får adgang til mine rapport-credits <strong>straks</strong> efter betaling.'
        },
        unlimited: {
          intro: 'Dit abonnement og din adgang til alle rapporter starter med det samme efter betaling.',
          consent: 'Jeg samtykker til, at mit abonnement starter <strong>straks</strong>. Jeg kan til enhver tid opsige fremadrettet (se handelsbetingelserne).'
        }
      };
      var tx = texts[productType] || texts.single;

      var ov = document.createElement('div');
      ov.id = 'hb-consent-overlay';
      ov.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(28,27,26,.55);display:flex;align-items:center;justify-content:center;padding:20px;';
      ov.innerHTML =
        '<div role="dialog" aria-modal="true" aria-labelledby="hb-consent-h" aria-describedby="hb-consent-desc" style="background:#fff;max-width:440px;width:100%;border-radius:16px;padding:26px 24px;box-shadow:0 20px 60px rgba(0,0,0,.3);font-family:Figtree,system-ui,sans-serif;">' +
          '<h3 id="hb-consent-h" style="font-family:\'Source Serif 4\',Georgia,serif;font-size:20px;font-weight:600;margin:0 0 8px;color:#1c1b1a;letter-spacing:-.02em;">Bekræft dit køb</h3>' +
          '<p id="hb-consent-desc" style="font-size:14px;color:#5a5650;line-height:1.7;margin:0 0 16px;">' + tx.intro + '</p>' +
          '<label for="hb-consent-cb" style="display:flex;gap:11px;align-items:flex-start;font-size:13.5px;color:#1c1b1a;line-height:1.6;cursor:pointer;background:#f5f2ee;border-radius:10px;padding:14px 16px;">' +
            '<input type="checkbox" id="hb-consent-cb" style="margin-top:2px;width:18px;height:18px;flex:none;accent-color:#2c5f4b;cursor:pointer;">' +
            '<span>' + tx.consent + '</span>' +
          '</label>' +
          '<p style="font-size:11.5px;color:#8a857e;margin:10px 2px 18px;">Se <a href="/handelsbetingelser.html#fortrydelse" target="_blank" rel="noopener" style="color:#2c5f4b;">fortrydelsesret</a> i handelsbetingelserne.</p>' +
          '<div style="display:flex;gap:10px;justify-content:flex-end;">' +
            '<button type="button" id="hb-consent-cancel" style="background:none;border:1.5px solid #d5d0c9;color:#5a5650;padding:11px 20px;border-radius:10px;font-size:14px;font-weight:500;cursor:pointer;font-family:inherit;">Annuller</button>' +
            '<button type="button" id="hb-consent-go" disabled style="background:#1c1b1a;border:none;color:#fff;padding:11px 22px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;opacity:.4;">Fortsæt til betaling</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(ov);
      var cb = ov.querySelector('#hb-consent-cb');
      var go = ov.querySelector('#hb-consent-go');
      var cancel = ov.querySelector('#hb-consent-cancel');

      function done(val){
        ov.remove();
        document.removeEventListener('keydown', onKey, true);
        try { if (prev && prev.focus) prev.focus(); } catch(e){}
        resolve(val);
      }
      function onKey(e){
        if (e.key === 'Escape') { done(false); return; }
        if (e.key === 'Tab') {
          var items = [cb, cancel, go].filter(function(el){ return !el.disabled; });
          var first = items[0], last = items[items.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
      cb.addEventListener('change', function(){ go.disabled = !cb.checked; go.style.opacity = cb.checked ? '1' : '.4'; });
      go.addEventListener('click', function(){ if (cb.checked) done(true); });
      cancel.addEventListener('click', function(){ done(false); });
      ov.addEventListener('click', function(e){ if (e.target === ov) done(false); });
      document.addEventListener('keydown', onKey, true);
      setTimeout(function(){ try { cb.focus(); } catch(e){} }, 50);
    });
  }

  // ── Initiate Stripe Checkout ──
  async function checkout(productType, testType, testData) {
    _logEvent('checkout_clicked', testType || null, { product_type: productType });
    // Require login for pack4 and unlimited
    if ((productType === 'pack4' || productType === 'unlimited') && (!window.HB_AUTH || !HB_AUTH.user)) {
      if (window.HB_AUTH) HB_AUTH.showLogin();
      return;
    }

    // Capture the initiating button now, before the consent modal steals focus.
    var btn = (document.activeElement && document.activeElement.tagName === 'BUTTON') ? document.activeElement : null;
    var originalText = btn ? btn.textContent : '';

    // Right of withdrawal: require express consent to immediate delivery of digital
    // content before every purchase. The server stamps the authoritative timestamp.
    var consented = await _showWithdrawalConsent(productType);
    if (!consented) {
      if (btn) { btn.textContent = originalText; btn.disabled = false; }
      return;
    }

    // Save results before redirect
    if (testType && testData) {
      saveResults(testType, testData);
    }

    var body = {
      product_type: productType,
      test_type: testType || null,
      withdrawal_consent: true,
      success_url: window.location.origin + (testType ? (REPORT_MAP[testType] || FILE_MAP[testType]) : '/rapporter.html'),
      cancel_url: window.location.href
    };

    if (window.HB_AUTH && HB_AUTH.user) {
      body.user_id = HB_AUTH.user.id;
      body.user_email = HB_AUTH.user.email;
    }

    // Show loading state on the initiating button (captured above)
    if (btn) {
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
      _logEvent('checkout_redirect', testType || null, { product_type: productType });
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
      _logEvent('payment_returned', testType || null, null);
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
    if (path.includes('ocd')) return 'ocd';
    return null;
  }

  // ── Use a credit to unlock a report ──
  // Atomic + server-authoritative: the spend_credit RPC checks credits > 0,
  // decrements, and grants report_access in one transaction. Clients can no
  // longer write report_credits or report_access directly.
  async function useCredit(testType) {
    if (!window.HB_AUTH || !HB_AUTH.user) return false;
    try {
      var { data, error } = await HB_AUTH.supabase.rpc('spend_credit', { p_test_type: testType });
      if (error) { console.warn('spend_credit error:', error.message); return false; }
      if (data && data.success) {
        if (HB_AUTH.refreshCredits) { try { await HB_AUTH.refreshCredits(); } catch (e) {} }
        _logEvent('credit_used', testType, null);
        return true;
      }
      return false; // NO_CREDITS / UNAUTHORIZED / MISSING_TEST_TYPE
    } catch (e) {
      console.warn('spend_credit exception:', e);
      return false;
    }
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
