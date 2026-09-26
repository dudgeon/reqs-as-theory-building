#!/usr/bin/env node
// Headless frame renderer.
//   node video/render.js --stills 3.2,9.8      -> build/stills/*.jpg (for review)
//   node video/render.js --frames              -> build/frames/f_00000.jpg ... (full video)
//   node video/render.js --sfx                 -> build/sfx.json (sound-effect cue list)
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

let playwright;
try { playwright = require('playwright'); } catch (e) {
  playwright = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
}

const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'build');
const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i < 0 ? dflt : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.png': 'image/png', '.wav': 'audio/wav', '.json': 'application/json' };
function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(rsp);
    });
    srv.listen(0, '127.0.0.1', () => res(srv));
  });
}

async function openPage(browser, port) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => { console.error('page error:', e.message); process.exitCode = 1; });
  page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
  await page.goto(`http://127.0.0.1:${port}/video/index.html?render=1`);
  await page.evaluate(() => window.ready);
  return page;
}

async function shot(page, t, file) {
  await page.evaluate(tt => window.renderFrame(tt), t);
  await page.screenshot({ path: file, type: 'jpeg', quality: 93, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
}

(async () => {
  const srv = await serve();
  const port = srv.address().port;
  const browser = await playwright.chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text'] });
  try {
    if (opt('--sfx')) {
      const page = await openPage(browser, port);
      const ev = await page.evaluate(() => window.collectSfx());
      fs.writeFileSync(path.join(BUILD, 'sfx.json'), JSON.stringify(ev, null, 1));
      console.log(`${ev.length} sfx events -> build/sfx.json`);
    }
    if (opt('--stills')) {
      const times = String(opt('--stills')).split(',').map(Number);
      const dir = path.join(BUILD, 'stills');
      fs.mkdirSync(dir, { recursive: true });
      const page = await openPage(browser, port);
      for (const t of times) {
        const f = path.join(dir, `t_${t.toFixed(2).padStart(6, '0')}.jpg`);
        await shot(page, t, f);
        console.log(f);
      }
    }
    if (opt('--frames')) {
      const tl = JSON.parse(fs.readFileSync(path.join(BUILD, 'timeline.json'), 'utf8'));
      const fps = tl.fps, n = Math.ceil(tl.duration * fps);
      const dir = path.join(BUILD, 'frames');
      fs.rmSync(dir, { recursive: true, force: true });
      fs.mkdirSync(dir, { recursive: true });
      const workers = +opt('--workers', 4);
      let next = 0, done = 0;
      const t0 = Date.now();
      await Promise.all(Array.from({ length: workers }, async () => {
        const page = await openPage(browser, port);
        while (next < n) {
          const i = next++;
          await shot(page, i / fps, path.join(dir, `f_${String(i).padStart(5, '0')}.jpg`));
          if (++done % 150 === 0) console.log(`  ${done}/${n} frames (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
        }
      }));
      console.log(`${n} frames -> build/frames (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    }
  } finally {
    await browser.close();
    srv.close();
  }
})();
