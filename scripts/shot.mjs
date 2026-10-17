/* Capturas de página completa para revisar el render (docs/plan.md, fase 3).

     pnpm build && pnpm preview --port 4321      # en segundo plano
     node scripts/shot.mjs http://localhost:4321/ ruta/de/salida

   Saca 375×812 y 1280×800, en tema oscuro, claro y oscuro con movimiento reducido. Usa Edge o
   Chrome del sistema para no descargar el Chromium de Playwright (mismo patrón que
   finance-app/web/scripts/og.mjs). */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const [url = 'http://localhost:4321/', outDir = 'shots'] = process.argv.slice(2);
await mkdir(outDir, { recursive: true });

async function launch() {
  for (const channel of ['msedge', 'chrome']) {
    try {
      return await chromium.launch({ channel });
    } catch {
      /* probamos el siguiente */
    }
  }
  return chromium.launch();
}

const VIEWPORTS = [
  { name: '375', width: 375, height: 812, isMobile: true },
  { name: '1280', width: 1280, height: 800, isMobile: false },
];
const MODES = [
  { name: 'oscuro', colorScheme: 'dark', reducedMotion: 'no-preference' },
  { name: 'claro', colorScheme: 'light', reducedMotion: 'no-preference' },
  { name: 'reducido', colorScheme: 'dark', reducedMotion: 'reduce' },
];

const browser = await launch();
const errores = [];

for (const vp of VIEWPORTS) {
  for (const mode of MODES) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
      colorScheme: mode.colorScheme,
      reducedMotion: mode.reducedMotion,
    });
    const page = await context.newPage();
    page.on('console', (msg) => msg.type() === 'error' && errores.push(`[${vp.name}/${mode.name}] ${msg.text()}`));
    page.on('pageerror', (err) => errores.push(`[${vp.name}/${mode.name}] ${err.message}`));
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    // Recorre la página para disparar los revelados y la carga diferida, y vuelve arriba.
    await page.evaluate(async () => {
      const paso = window.innerHeight * 0.6;
      for (let y = 0; y < document.documentElement.scrollHeight; y += paso) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 400));
    });
    const file = join(outDir, `${vp.name}-${mode.name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    // Primera pantalla aparte: es lo que se ve sin hacer scroll.
    await page.screenshot({ path: join(outDir, `${vp.name}-${mode.name}-pliegue.png`) });
    console.log('✓', file);
    await context.close();
  }
}

await browser.close();
if (errores.length) {
  console.error(`Errores de consola:\n  ${errores.join('\n  ')}`);
  process.exitCode = 1;
}
