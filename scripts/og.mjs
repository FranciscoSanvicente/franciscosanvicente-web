/* Genera la imagen Open Graph fotografiando /og-card a 1200×630 (mismo patrón que
   finance-app/web/scripts/og.mjs). Es la web real (mismos tokens y fuentes), no un placeholder.
   Regenérala cuando cambie el nombre, el rol o la ciudad en perfil.ts:

     pnpm build && pnpm preview      # en otra terminal (o `pnpm dev`)
     pnpm og

   Ajusta OG_BASE si el servidor no está en 4321. Usa Edge o Chrome del sistema para no descargar el
   Chromium de Playwright. La captura se paletiza con sharp para que pese poco (< 200 KB). */
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir, stat } from 'node:fs/promises';

const BASE = process.env.OG_BASE || 'http://localhost:4321';
// Al regenerar con cambios visibles, sube la versión aquí y en Base.astro (las redes cachean por URL).
const SHOTS = [['/og-card', 'public/og/francisco-sanvicente-v2.png']];

await mkdir('public/og', { recursive: true });

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

try {
  // La tarjeta es oscura: los tokens siguen al sistema, así que se fuerza el tema oscuro.
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
    colorScheme: 'dark',
  });
  for (const [route, out] of SHOTS) {
    const res = await page.goto(BASE + route, { waitUntil: 'networkidle' });
    if (!res?.ok()) throw new Error(`${BASE + route} respondió ${res?.status()}`);
    // Oculta la barra de desarrollo de Astro, que si no se cuela en la captura con `pnpm dev`.
    await page.addStyleTag({ content: 'astro-dev-toolbar{display:none!important}' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    const png = await page.screenshot({ type: 'png' });
    await sharp(png).png({ palette: true, colors: 128, compressionLevel: 9, effort: 10 }).toFile(out);
    const { size } = await stat(out);
    console.log(`✓ ${out} (${Math.round(size / 1024)} KB)`);
  }
} finally {
  await browser.close();
}
