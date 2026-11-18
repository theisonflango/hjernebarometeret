// node tests/f01-ruter.cjs (Playwright + Chromium). All requests use local files.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const site = path.join(__dirname, '..', 'site');
const origin = 'https://hjernebarometeret.invalid';
const support = 'mailto:kontakt@hjernebarometeret.dk';
const slugs = ['adhd', 'autisme', 'eq', 'iq', 'karriere', 'ocd', 'personlighed', 'stress'];
const scenarios = [
  { name: 'gæst på mobil', width: 320, js: true },
  { name: 'tidligere anonymt køb på desktop', width: 1280, js: true, buyer: true },
  { name: 'mobil uden JavaScript', width: 320, js: false }
];
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript' };

async function checkScenario(browser, scenario) {
  const context = await browser.newContext({
    viewport: { width: scenario.width, height: 800 },
    javaScriptEnabled: scenario.js,
    serviceWorkers: 'block'
  });
  const unexpected = [];
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    const allowed = /^\/(?:tests|rapporter)\/[a-z]+\.html$|^\/shared\/teststatus\.(?:js|css)$/;
    if (url.origin !== origin || !allowed.test(url.pathname) || route.request().method() !== 'GET') {
      unexpected.push(route.request().method() + ' ' + url.pathname);
      return route.abort();
    }
    await route.fulfill({
      body: await fs.readFile(path.join(site, url.pathname)),
      contentType: mime[path.extname(url.pathname)]
    });
  });

  try {
    const page = await context.newPage();
    page.on('pageerror', err => unexpected.push(err.message));
    for (const folder of ['tests', 'rapporter']) {
      for (const slug of slugs) {
        const address = origin + '/' + folder + '/' + slug + '.html';
        await page.goto(address + '#result');
        const heading = page.getByRole('heading', { level: 1 });
        assert.match(await heading.innerText(), slug === 'eq' ? /endnu ikke åbnet/ : /på pause/);
        assert.equal(await page.locator('button,input,select,form,canvas,[download]').count(), 0);
        assert.equal(await page.getByRole('link', { name: 'kontakt@hjernebarometeret.dk' }).getAttribute('href'), support);
        await page.keyboard.press('Tab');
        assert.equal(await page.evaluate(() => document.activeElement.tagName), 'A');
        assert.equal(await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle), 'solid');
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));

        const key = 'hb_report_token_' + slug;
        if (scenario.buyer) {
          await page.evaluate(k => localStorage.setItem(k, 'tidligere'), key);
          await page.goto(address + '?payment=cancelled&token=annulleret');
          assert.equal(await page.evaluate(k => localStorage.getItem(k), key), 'tidligere');
          assert.equal(page.url(), address);
        }
        const callback = address + '?payment=success&token=fiktiv&session_id=eksempel';
        await page.goto(callback);
        assert.equal(await page.evaluate(k => localStorage.getItem(k), key), scenario.js ? 'fiktiv' : null);
        assert.equal(page.url(), scenario.js ? address : callback);
        await page.reload();
        assert.ok(await heading.isVisible());
      }
    }
    assert.deepEqual(unexpected, []);
    console.log('16 ruter bestået · ' + scenario.name);
  } finally {
    await context.close();
  }
}

async function main() {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE || undefined });
  try {
    for (const scenario of scenarios) await checkScenario(browser, scenario);
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
