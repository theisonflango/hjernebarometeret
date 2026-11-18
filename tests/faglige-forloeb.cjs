// Start den lokale visning med node scripts/vis-udkast.mjs.
// Kør derefter node tests/faglige-forloeb.cjs http://127.0.0.1:PORT.
const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const { chromium } = require('playwright');

const preview = new URL(process.argv[2]);
assert.equal(preview.hostname, '127.0.0.1');
const address = path => new URL(path, preview).href;

async function adhd(page) {
  await page.goto(address('/tests/adhd.html'));
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Indtast prøvesvar' }).click();
  const source = page.getByRole('link', { name: /Åbn dansk ASRS-formular/ });
  assert.equal(await source.getAttribute('target'), '_blank');
  assert.equal(await source.getAttribute('href'), 'https://www.sundhed.dk/content/cms/69/139669_asrs_dansk.pdf#page=2');
  const frequencies = ['Aldrig', 'Sjældent', 'Nogle gange', 'Ofte', 'Meget ofte'];
  const sample = [2, 2, 2, 3, 0, 0];
  for (const [index, answer] of sample.entries()) {
    assert.equal(await page.locator('#question-title').innerText(), 'Overfør svaret ved A' + (index + 1));
    const expected = index < 3 ? [false, false, true, true, true] : [false, false, false, true, true];
    for (const [option, shouldCount] of expected.entries()) {
      const label = frequencies[option] + (shouldCount ? ' Tæller i optællingen' : '');
      const button = page.getByRole('button', { name: label, exact: true });
      assert.equal(await button.isVisible(), true);
      assert.equal(await button.getAttribute('data-counts') === 'true', shouldCount);
    }
    await page.locator('#choices button').nth(answer).click();
    await page.getByRole('button', { name: /Næste|Se resultat/ }).click();
  }
  const result = '4 af 6 svar i screeningsområdet';
  assert.equal(await page.locator('#score').innerText(), result);
  await page.getByRole('button', { name: 'Åbn mit samtaleark' }).click();
  await page.locator('#report').waitFor();
  assert.equal(await page.locator('#score').innerText(), result);
  await page.reload();
  assert.equal(await page.locator('#score').innerText(), result);
}

async function stress(page) {
  await page.goto(address('/tests/stress.html'));
  await page.getByRole('button', { name: 'Indtast fiktive svar' }).click();
  const source = page.getByRole('link', { name: /Åbn det danske kildeskema/ });
  assert.equal(await source.getAttribute('target'), '_blank');
  assert.match(await source.getAttribute('href'), /pss-konsensusversion\.pdf$/);
  for (let i = 0; i < 10; i++) {
    assert.equal(await page.locator('#qText').innerText(), 'Vælg det fiktive svar til punkt ' + (i + 1));
    assert.deepEqual(await page.locator('#likertOptions button').allTextContents(),
      ['Aldrig', 'Næsten aldrig', 'Ind imellem', 'Ret ofte', 'Meget ofte']);
    await page.getByRole('button', { name: 'Ind imellem', exact: true }).click();
    await page.locator('#btnNext').click();
  }
  assert.equal(await page.locator('#resultScore').innerText(), '20 af 40 point');
  await page.getByRole('button', { name: 'Åbn samtalearket' }).click();
  await page.locator('#report').waitFor();
  assert.match(await page.locator('#score').innerText(), /20 af 40/);
  assert.equal(await page.locator('#source-version').innerText(), 'Fiktiv pointkontrol 3 · Kildeskema PSS-10, 16.10.2012');
  await page.reload();
  await page.locator('#report').waitFor();
  assert.equal(await page.locator('#report-title').innerText(), 'Eksempel på et samtaleark');
  const firstAttempt = page.url();
  await page.goto(address('/tests/stress.html'));
  await page.getByRole('button', { name: 'Indtast fiktive svar' }).click();
  await page.goto(firstAttempt);
  await page.locator('#no-access').waitFor();
  assert.equal(await page.locator('#report').isVisible(), false);
}

async function karriere(page) {
  await page.goto(address('/karriere.html'));
  await page.getByRole('button', { name: 'Vælg to jobspor' }).click();
  await page.locator('#spor-A').selectOption('Laborant');
  await page.locator('#spor-B').selectOption('It-supporter');
  await page.locator('#criterion').fill('Kontakt med kunder');
  await page.getByRole('button', { name: 'Lav min plan' }).click();
  await page.locator('#action').fill('Spørg en laborant på torsdag.');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Gem planen som tekst' }).click();
  const sheet = await readFile(await (await download).path(), 'utf8');
  for (const text of ['Laborant', 'It-supporter', 'Kontakt med kunder', 'Spørg en laborant på torsdag.']) {
    assert.ok(sheet.includes(text));
  }
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route(/^https?:/, route => {
      if (new URL(route.request().url()).origin === preview.origin) return route.continue();
      errors.push('Eksternt kald: ' + route.request().method());
      return route.abort();
    });
    for (const check of [adhd, stress, karriere]) {
      await check(page);
      assert.deepEqual(errors, []);
      console.log(check.name + ' gennemført lokalt');
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
