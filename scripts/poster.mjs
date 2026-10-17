/* Póster de la pila (docs/design/handoff.md §5) generado desde la escena 3D real:

     pnpm poster

   Autónomo y reproducible: arranca el dev server de Astro en un puerto libre, abre con Playwright
   (Edge o Chrome del sistema, como scripts/shot.mjs) una página mínima servida por el propio script
   en ese origen —así Vite compila src/three/stack.ts igual que en el sitio— y pinta el encuadre del
   póster: isométrica, separación al 50 %, todas las placas asentadas, solo la superior emitiendo,
   tema oscuro, fondo transparente. Captura el canvas a 1920 px (DPR 2), lo reduce a 960×960 con
   sharp y escribe public/poster/pila.avif (con alfa) y pila.webp, cada uno ≤ 80 KB.
   Regenéralo cada vez que cambie algo visual de src/three/. */
import { dev } from 'astro';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const LADO = 960;
const LIMITE = 80 * 1024;

const PAGINA = `<!doctype html>
<meta charset="utf-8">
<style>html,body{margin:0;background:transparent}canvas{display:block;width:${LADO}px;height:${LADO}px}</style>
<canvas id="pila"></canvas>
<script type="module">
  import { createStackScene } from '/src/three/stack.ts';
  const s = createStackScene(document.getElementById('pila'), { theme: 'dark' });
  s.setSpin(0);
  s.setFront(0);
  s.setOpen(0.5);
  s.setEmissive(false);
  for (const i of [1, 2, 3, 4]) s.setPlate(i, 1);
  s.start();
  requestAnimationFrame(() => requestAnimationFrame(() => (window.__listo = true)));
</script>`;

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

/** Comprime bajando calidad hasta caber en el presupuesto; solo escribe si cabe. */
async function escribir(png, formato, archivo) {
  for (let q = formato === 'avif' ? 80 : 92; q >= 30; q -= 6) {
    const img = sharp(png);
    const buf = await (formato === 'avif'
      ? img.avif({ quality: q, effort: 9 })
      : img.webp({ quality: q, alphaQuality: 90, effort: 6 })
    ).toBuffer();
    if (buf.length <= LIMITE) {
      await writeFile(archivo, buf);
      return { q, size: buf.length };
    }
  }
  throw new Error(`${archivo} no cabe en ${LIMITE} bytes; no se ha tocado`);
}

// Caché de Vite propia: si hay un `pnpm dev` abierto, no le invalida sus dependencias optimizadas.
const server = await dev({
  root: ROOT,
  logLevel: 'error',
  server: { port: 4390 },
  vite: { cacheDir: 'node_modules/.vite-poster' },
});
const origen = `http://localhost:${server.address.port}`;
const errores = [];
let browser;
try {
  browser = await launch();
  const page = await browser.newPage({ viewport: { width: LADO, height: LADO }, deviceScaleFactor: 2 });
  page.on('console', (m) => m.type() === 'error' && errores.push(m.text()));
  page.on('pageerror', (e) => errores.push(e.message));
  await page.route(`${origen}/__poster`, (route) => route.fulfill({ contentType: 'text/html', body: PAGINA }));
  // Primera visita: Vite puede optimizar three y recargar; la segunda ya es estable.
  await page.goto(`${origen}/__poster`, { waitUntil: 'networkidle' });
  await page.goto(`${origen}/__poster`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__listo === true, null, { timeout: 30_000 });
  const png = await page.locator('#pila').screenshot({ omitBackground: true });
  const reducido = await sharp(png).resize(LADO, LADO, { kernel: 'lanczos3' }).png().toBuffer();

  await mkdir(`${ROOT}public/poster`, { recursive: true });
  for (const formato of ['avif', 'webp']) {
    const archivo = `${ROOT}public/poster/pila.${formato}`;
    const { q, size } = await escribir(reducido, formato, archivo);
    console.log(`✓ public/poster/pila.${formato} · ${LADO}×${LADO} · calidad ${q} · ${(size / 1024).toFixed(1)} KB`);
  }
} finally {
  await browser?.close();
  await server.stop();
}
if (errores.length) {
  console.error(`Errores de consola:\n  ${errores.join('\n  ')}`);
  process.exitCode = 1;
}
