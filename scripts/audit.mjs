/* Auditoría de la home contra los presupuestos de docs/plan.md (fase 3): LCP, CLS, peso del JS y de
   la escena, y accesibilidad con axe.

     pnpm build && pnpm preview --port 4321     # en segundo plano
     node scripts/audit.mjs http://localhost:4321/

   Emula un móvil de gama media (375×812, CPU ×4, «4G lento»: 1,6 Mbps, 150 ms de RTT) y un
   escritorio (1280×800, sin estrangular la CPU, misma red). Usa Edge o Chrome del sistema. Las
   cifras son de laboratorio, en esta máquina: orientan, no sustituyen a los datos de campo. */
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const url = process.argv[2] ?? 'http://localhost:4321/';
const RED = { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 };
const PERFILES = [
  { nombre: 'móvil', viewport: { width: 375, height: 812 }, isMobile: true, cpu: 4 },
  { nombre: 'escritorio', viewport: { width: 1280, height: 800 }, isMobile: false, cpu: 1 },
];
const PRESUPUESTO = { lcpMs: 2000, cls: 0.05, jsInicialKB: 25, escenaKB: 1024 };

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

const browser = await launch();
let fallos = 0;
const marcar = (ok, texto) => {
  if (!ok) fallos++;
  console.log(`  ${ok ? '✓' : '✗'} ${texto}`);
};

for (const perfil of PERFILES) {
  const context = await browser.newContext({ viewport: perfil.viewport, isMobile: perfil.isMobile, hasTouch: perfil.isMobile });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', RED);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: perfil.cpu });

  // Bytes transferidos por tipo, para separar el JS inicial del chunk de la escena (three.js).
  const bytes = new Map();
  cdp.on('Network.loadingFinished', (e) => bytes.set(e.requestId, { ...bytes.get(e.requestId), size: e.encodedDataLength }));
  cdp.on('Network.responseReceived', (e) => bytes.set(e.requestId, { ...bytes.get(e.requestId), url: e.response.url, type: e.type }));

  await page.addInitScript(() => {
    window.__lcp = { t: 0, el: '' };
    window.__cls = 0;
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        window.__lcp = { t: e.startTime, el: e.element ? e.element.tagName + (e.element.className ? '.' + String(e.element.className).split(' ')[0] : '') : e.url };
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });

  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(5000); // deja pasar el idle, la carga diferida de la escena y el fundido
  // Un poco de scroll para que el CLS cubra también la entrada de las secciones.
  await page.evaluate(async () => {
    for (let y = 0; y < 2400; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 150));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(800);
  const { lcp, cls } = await page.evaluate(() => ({ lcp: window.__lcp, cls: window.__cls }));

  const recursos = [...bytes.values()].filter((r) => r.url && r.size);
  const js = recursos.filter((r) => r.type === 'Script');
  const escena = js.filter((r) => /three|stack/i.test(r.url) && !/stack-loader|Escenario/i.test(r.url));
  const kb = (lista) => lista.reduce((s, r) => s + r.size, 0) / 1024;
  const jsInicial = kb(js) - kb(escena);
  const total = kb(recursos);

  console.log(`\n${perfil.nombre} (${perfil.viewport.width}×${perfil.viewport.height}, CPU ×${perfil.cpu}, 4G lento)`);
  marcar(lcp.t <= PRESUPUESTO.lcpMs, `LCP ${Math.round(lcp.t)} ms (${lcp.el}) · presupuesto ${PRESUPUESTO.lcpMs} ms`);
  marcar(cls < PRESUPUESTO.cls, `CLS ${cls.toFixed(3)} · presupuesto < ${PRESUPUESTO.cls}`);
  marcar(jsInicial <= PRESUPUESTO.jsInicialKB, `JS inicial ${jsInicial.toFixed(1)} KB transferidos · presupuesto ${PRESUPUESTO.jsInicialKB} KB`);
  const escenaKB = kb(escena);
  console.log(`  · escena 3D ${escena.length ? escenaKB.toFixed(1) + ' KB transferidos' : 'no se descargó'} · total página ${total.toFixed(0)} KB`);
  if (escena.length) marcar(escenaKB <= PRESUPUESTO.escenaKB, `escena ≤ ${PRESUPUESTO.escenaKB} KB`);

  // Accesibilidad: WCAG 2.2 A/AA en los dos temas (el contraste cambia con cada uno).
  for (const tema of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: tema });
    await page.waitForTimeout(300);
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    marcar(axe.violations.length === 0, `axe (${tema === 'light' ? 'claro' : 'oscuro'}): ${axe.violations.length} violaciones WCAG A/AA`);
    for (const v of axe.violations) {
      console.log(`    - ${v.id} (${v.impact}): ${v.help} · ${v.nodes.length} nodo(s): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
    }
  }
  await context.close();
}

await browser.close();
console.log(fallos ? `\n✗ ${fallos} comprobación(es) fuera de presupuesto` : '\n✓ todo dentro de presupuesto');
process.exitCode = fallos ? 1 : 0;
