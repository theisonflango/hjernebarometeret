import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

// Kun de tre faglige udkast og deres lokale visningsfiler.
const files = new Map([
  ['/karriere.html', 'docs/produkt/tests/karriere/udkast.html']
]);
for (const test of ['adhd', 'stress']) {
  for (const type of ['tests', 'rapporter']) {
    files.set('/' + type + '/' + test + '.html', 'paused-site/' + type + '/' + test + '.html');
  }
}
for (const name of ['adhd-result.js', 'stress-result.js', 'profilecard.js', 'styles.css', 'teststatus.css']) {
  files.set('/shared/' + name, 'site/shared/' + name);
}
const home = `<!doctype html><html lang="da"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Faglige udkast · Hjernebarometeret</title><main><h1>Faglige udkast</h1>
<p>Gennemgå siderne med fiktive svar. Luk fanen, når du er færdig.</p>
<ul><li><a href="/tests/adhd.html">Kontrollér ASRS-optællingen</a></li><li><a href="/tests/stress.html">Kontrollér PSS-10-pointene</a></li>
<li><a href="/karriere.html">Mit næste jobspor</a></li></ul></main></html>`;
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'");
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  const path = req.url.split('?')[0];
  if (path === '/' || path === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(home);
    return;
  }
  const file = files.get(path);
  if (!file) {
    res.writeHead(404).end();
    return;
  }
  try {
    const body = await readFile(new URL('../' + file, import.meta.url));
    res.writeHead(200, { 'Content-Type': mime[extname(file)] + '; charset=utf-8' }).end(body);
  } catch (error) {
    console.error(error.message);
    res.writeHead(500).end();
  }
});
server.listen(0, '127.0.0.1', () => {
  console.log('Åbn http://127.0.0.1:' + server.address().port + ' i din browser. Stop med Ctrl+C.');
});
