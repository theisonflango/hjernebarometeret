/* Hjernebarometeret — Shared Payment Module
   Requires: auth.js loaded before this script.
   Exposes window.HB_PAY for Stripe Checkout integration.
*/
(function(){
  var CHECKOUT_URL = 'https://pmbbachqedomvixvvfpj.supabase.co/functions/v1/hjernebarometeret-create-checkout';

  var FILE_MAP = {
    iq: 'iq-test.html',
    adhd: 'adhd-screening.html',
    autisme: 'autisme-test.html',
    personlighed: 'personlighedstest.html',
    stress: 'stress-udbraendthed-test.html'
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

      // Check remaining pack4 credits
      if (HB_AUTH.credits > 0) return true;
    }

    return false;
  }

  // ── Wait for access with retry (webhook race condition) ──
  async function waitForAccess(testType, maxRetries) {
    var retries = maxRetries || 8;
    for (var i = 0; i < retries; i++) {
      if (await hasAccess(testType)) return true;
      await new Promise(function(r){ setTimeout(r, 2000); });
    }
    return false;
  }

  // ── Save test results to localStorage before redirect ──
  function saveResults(testType, data) {
    try {
      localStorage.setItem('hb_results_' + testType, JSON.stringify(data));
    } catch(e) {}
  }

  function loadResults(testType) {
    try {
      var saved = localStorage.getItem('hb_results_' + testType);
      return saved ? JSON.parse(saved) : null;
    } catch(e) { return null; }
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
      success_url: window.location.origin + '/' + (testType ? FILE_MAP[testType] : 'rapporter.html'),
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
    return null;
  }

  // ── Use a credit (for pack4 users) ──
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

  // ── Public API ──
  window.HB_PAY = {
    hasAccess: hasAccess,
    waitForAccess: waitForAccess,
    checkout: checkout,
    handleReturn: handleReturn,
    saveResults: saveResults,
    loadResults: loadResults,
    useCredit: useCredit
  };
})();
