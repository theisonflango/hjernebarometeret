// Node >= 22.13. Run with node --test tests/f01-salg.mjs (no network or credentials).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

const source = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const reports = ['adhd', 'autisme', 'iq', 'stress', 'karriere', 'ocd', 'personlighed', 'eq'];

test('køb, kredit og kupon stopper før login, formular, lagring og netværk', async () => {
  const attempts = [];
  const notices = [];
  const forbidden = new Proxy({}, {
    get(_target, key) { attempts.push(String(key)); throw Error('Uventet kald: ' + String(key)); }
  });
  const browser = {
    alert: message => notices.push(message),
    document: { readyState: 'complete' },
    localStorage: forbidden,
    HB_AUTH: forbidden,
    fetch: (...args) => { attempts.push('fetch'); throw Error(String(args[0])); }
  };
  browser.window = browser;
  vm.createContext(browser);
  vm.runInContext(source('site/shared/payment.js'), browser);
  vm.runInContext(source('site/shared/coupon.js'), browser);
  for (const report of [...reports, undefined, 'virksomhed']) {
    for (const product of ['single', 'pack4', 'unlimited']) {
      await browser.HB_PAY.checkout(product, report, { fixture: true });
      assert.match(notices.at(-1), /på pause/);
    }
    assert.equal(await browser.HB_PAY.useCredit(report), false);
    browser.HB_PAY.renderCreditOption(report);
  }
  browser.HB_COUPON.injectMenuItem();
  browser.HB_COUPON.showRedeemModal();
  assert.match(notices.at(-1), /kuponer er på pause/);
  assert.deepEqual(attempts, []);
});

test('en eksisterende købsreference giver stadig adgangskontrol i betalingsmodulet', async () => {
  const storage = new Map();
  const changes = [];
  let accessQueries = 0;
  const browser = {
    URLSearchParams,
    localStorage: { getItem: key => storage.get(key), setItem: (key, v) => storage.set(key, v) },
    location: { search: '?payment=success&token=fiktiv-reference', pathname: '/rapporter/iq.html' },
    history: { replaceState: (...args) => changes.push(args[2]) },
    HB_AUTH: {
      isAdmin: () => false,
      supabase: {
        from(table) {
          if (table === 'event_log') return { insert: () => Promise.resolve() };
          assert.equal(table, 'report_access');
          accessQueries++;
          const predicates = {};
          return {
            select() { return this; },
            eq(key, value) { predicates[key] = value; return this; },
            maybeSingle() {
              return { data: predicates.anonymous_token === 'fiktiv-reference' &&
                predicates.test_type === 'iq' ? { id: 1 } : null };
            }
          };
        }
      }
    }
  };
  browser.window = browser;
  vm.runInNewContext(source('site/shared/payment.js'), browser);
  assert.equal(browser.HB_PAY.handleReturn().success, true);
  assert.equal(storage.get('hb_report_token_iq'), 'fiktiv-reference');
  assert.deepEqual(changes, ['/rapporter/iq.html']);
  assert.equal(await browser.HB_PAY.hasAccess('iq'), true);
  assert.equal(await browser.HB_PAY.hasAccess('stress'), false);
  assert.equal(accessQueries, 1);
});

for (const [slug, expectedError] of [
  ['hjernebarometeret-create-checkout', 'REPORT_SALES_PAUSED'],
  ['hjernebarometeret-redeem-coupon', 'COUPONS_PAUSED']
]) {
  test(slug + ' svarer på OPTIONS og afviser POST før persondata eller leverandørkald', async () => {
    const attempts = [];
    let handler;
    // Replace only the remote imports. The actual handler and its initialization run.
    const js = stripTypeScriptTypes(source('supabase/functions/' + slug + '/index.ts')
      .replace(/^import [^\n]+;\n/gm, ''));
    const blocked = label => { attempts.push(label); throw Error(label); };
    const client = new Proxy({}, { get: (_target, name) => blocked(String(name)) });
    class Stripe {
      static createFetchHttpClient() { return {}; }
      constructor() { return client; }
    }
    vm.runInNewContext(js, {
      Deno: { env: { get: () => 'fixture' }, serve: callback => { handler = callback; } },
      Stripe, createClient: () => client, Response, fetch: () => blocked('fetch')
    });
    const preflight = await handler({ method: 'OPTIONS' });
    assert.equal(preflight.status, 200);
    assert.match(preflight.headers.get('Access-Control-Allow-Methods'), /POST/);
    const result = await handler({
      method: 'POST',
      get headers() { return blocked('headers'); },
      json: () => blocked('body')
    });
    assert.equal(result.status, 409);
    assert.equal((await result.json()).error, expectedError);
    assert.deepEqual(attempts, []);
  });
}
