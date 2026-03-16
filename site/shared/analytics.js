/* Hjernebarometeret — Shared Analytics Module
   Requires: auth.js loaded before this script.
   Exposes window.HB_ANALYTICS for test_starts logging, timing, and event tracking.
*/
(function(){
  'use strict';

  // ── Device detection ──
  function detectDevice() {
    var ua = navigator.userAgent || '';
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
    if (/mobile|iphone|ipod|android.*mobile|windows phone/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  // ── Get Supabase client ──
  function getSB() {
    return window.HB_AUTH && HB_AUTH.supabase;
  }

  // ── Get user/anonymous identity ──
  function getIdentity() {
    var identity = {};
    if (window.HB_AUTH && HB_AUTH.user) {
      identity.user_id = HB_AUTH.user.id;
    } else {
      var token = localStorage.getItem('hb_anon_token');
      if (!token) {
        token = crypto.randomUUID ? crypto.randomUUID() : 'anon-' + Date.now() + '-' + Math.random().toString(36).slice(2);
        localStorage.setItem('hb_anon_token', token);
      }
      identity.anonymous_token = token;
    }
    return identity;
  }

  // ── Log test start ──
  // Returns { startId, startedAt } for use in completion update
  async function logTestStart(testType, testVersion) {
    var sb = getSB();
    if (!sb) return null;

    var row = Object.assign({
      test_type: testType,
      test_version: testVersion,
      started_at: new Date().toISOString(),
      completed: false,
      last_item_index: 0,
      user_agent: navigator.userAgent || null,
      referrer: document.referrer || null
    }, getIdentity());

    try {
      var { data, error } = await sb.from('test_starts').insert(row).select('id').single();
      if (error) { console.warn('test_starts insert error:', error); return null; }
      return { startId: data.id, startedAt: row.started_at };
    } catch(e) {
      console.warn('Could not log test start:', e);
      return null;
    }
  }

  // ── Update test start on completion or progress ──
  async function updateTestStart(startId, updates) {
    if (!startId) return;
    var sb = getSB();
    if (!sb) return;

    try {
      await sb.from('test_starts').update(updates).eq('id', startId);
    } catch(e) {
      console.warn('Could not update test_start:', e);
    }
  }

  // ── Log event ──
  async function logEvent(eventType, testType, eventData) {
    var sb = getSB();
    if (!sb) return;

    var row = Object.assign({
      event_type: eventType,
      test_type: testType || null,
      event_data: eventData || null,
      created_at: new Date().toISOString()
    }, getIdentity());

    try {
      await sb.from('event_log').insert(row);
    } catch(e) {
      console.warn('Could not log event:', e);
    }
  }

  // ── Build standardized metadata ──
  function buildMetadata(startedAt, language) {
    var now = new Date().toISOString();
    var durationSeconds = startedAt ? Math.round((Date.now() - new Date(startedAt).getTime()) / 1000) : null;
    return {
      duration_seconds: durationSeconds,
      started_at: startedAt || null,
      completed_at: now,
      device: detectDevice(),
      language: language || 'da',
      variant: null
    };
  }

  // ── Per-item timing helper ──
  // Usage: var timer = HB_ANALYTICS.createItemTimer();
  //        timer.mark('q1'); // call when user answers q1
  //        var ms = timer.getMs('q1'); // get time spent on q1
  //        var allMs = timer.getAllMs(); // get { q1: 4200, q2: 3100, ... }
  function createItemTimer() {
    var lastMark = performance.now();
    var times = {};

    return {
      // Call when moving to next item (records time for current item)
      mark: function(itemId) {
        var now = performance.now();
        times[itemId] = Math.round(now - lastMark);
        lastMark = now;
      },
      // Reset the timer (call when test actually begins, after instructions)
      reset: function() {
        lastMark = performance.now();
        times = {};
      },
      // Get ms for a specific item
      getMs: function(itemId) {
        return times[itemId] || null;
      },
      // Get all recorded times
      getAllMs: function() {
        return Object.assign({}, times);
      }
    };
  }

  // ── Enrich answers array with ms timing ──
  function enrichAnswersWithTiming(answers, timer) {
    if (!timer) return answers;
    var allMs = timer.getAllMs();
    return answers.map(function(a) {
      var id = a.item_id || a.id || a.q;
      var key = id !== undefined ? String(id) : null;
      var copy = Object.assign({}, a);
      if (key !== null && allMs[key] !== undefined) {
        copy.ms = allMs[key];
      } else {
        copy.ms = null;
      }
      // Standardize item_id field
      if (copy.item_id === undefined && (copy.id !== undefined || copy.q !== undefined)) {
        copy.item_id = 'q' + (copy.id !== undefined ? copy.id : copy.q);
      }
      return copy;
    });
  }

  // ── Build standardized demographics ──
  function buildDemographics(birthYear, gender) {
    if (!birthYear) return null;
    var age = new Date().getFullYear() - parseInt(birthYear);
    var ageGroup;
    if (age < 13) ageGroup = 'under-13';
    else if (age <= 15) ageGroup = '13-15';
    else if (age <= 17) ageGroup = '16-17';
    else if (age <= 24) ageGroup = '18-24';
    else if (age <= 34) ageGroup = '25-34';
    else if (age <= 44) ageGroup = '35-44';
    else if (age <= 54) ageGroup = '45-54';
    else if (age <= 64) ageGroup = '55-64';
    else ageGroup = '65+';

    return {
      age_group: ageGroup,
      gender: gender || null
    };
  }

  // ── Public API ──
  window.HB_ANALYTICS = {
    logTestStart: logTestStart,
    updateTestStart: updateTestStart,
    logEvent: logEvent,
    buildMetadata: buildMetadata,
    createItemTimer: createItemTimer,
    enrichAnswersWithTiming: enrichAnswersWithTiming,
    buildDemographics: buildDemographics,
    detectDevice: detectDevice
  };

})();
