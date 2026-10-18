/* Comprobaciones sobre el HTML generado (`pnpm build && pnpm test`). Sin dependencias: lee
   dist/ (home, 404, og-card, sitemap) y falla con código 1 si algo de lo que sostiene el SEO de
   persona se rompe. */
import { access, readFile } from 'node:fs/promises';

const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
const fallos = [];
const check = (ok, mensaje) => {
  if (!ok) fallos.push(mensaje);
};

// Texto visible: sin scripts, estilos ni comentarios.
const visible = html
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<[^>]+>/g, ' ');

check(/<html[^>]*\blang="es"/.test(html), 'falta lang="es" en <html>');
const h1s = html.match(/<h1\b[\s\S]*?<\/h1>/gi) ?? [];
check(h1s.length === 1, `debe haber un solo <h1> y hay ${h1s.length}`);
check(/Francisco Sanvicente/.test(h1s[0] ?? ''), 'el <h1> no dice "Francisco Sanvicente"');
check(/<title>[^<]*Francisco Sanvicente[^<]*<\/title>/.test(html), 'el <title> no lleva el nombre');
check(/<meta name="description" content="[^"]*Francisco Sanvicente/.test(html) || /<meta name="description" content="[^"]{50,}"/.test(html), 'falta meta description');
check(/<link rel="canonical" href="https?:\/\/[^"]+"/.test(html), 'falta la URL canónica absoluta');
check(/<main\b[^>]*\bid="contenido"/.test(html), 'falta <main id="contenido">');
for (const id of ['servicios', 'sumari', 'trayectoria', 'stack', 'principios', 'contacto']) {
  check(new RegExp(`\\sid="${id}"`).test(html), `falta la sección #${id}`);
}
for (const n of [1, 2, 3, 4]) {
  check(new RegExp(`data-hito="${n}"`).test(html), `falta el hito data-hito="${n}"`);
}
check(!/href="#"/.test(html), 'hay un enlace vacío href="#"');
check(!/\bTODO\b/.test(visible), 'hay un TODO visible en el texto de la página');

// ── Capa SEO: Open Graph, tarjeta de X, JSON-LD, noindex y sitemap ─────────────────────────────
const meta = (attr, name) =>
  html.match(new RegExp(`<meta ${attr}="${name.replace(/[.:]/g, '\\$&')}" content="([^"]*)"`))?.[1];
for (const p of ['og:title', 'og:description', 'og:url', 'og:image']) {
  check(meta('property', p), `falta <meta property="${p}">`);
}
check(/^https:\/\//.test(meta('property', 'og:image') ?? ''), 'og:image no es una URL absoluta https');
check(meta('name', 'twitter:card') === 'summary_large_image', 'falta twitter:card summary_large_image');

const bloquesLd = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
check(bloquesLd.length === 1, `debe haber un solo bloque JSON-LD y hay ${bloquesLd.length}`);
let grafo = [];
try {
  const ld = JSON.parse(bloquesLd[0]?.[1] ?? '');
  grafo = ld['@graph'] ?? [ld];
} catch (e) {
  check(false, `el JSON-LD no se puede parsear: ${e.message}`);
}
const persona = grafo.find((n) => n['@type'] === 'Person');
check(persona?.name === 'Francisco Sanvicente', 'el JSON-LD no tiene un Person "Francisco Sanvicente"');
check(Array.isArray(persona?.sameAs) && persona.sameAs.length > 0, 'el Person no tiene sameAs');
check((persona?.sameAs ?? []).every((u) => /^https:\/\//.test(u)), 'hay un sameAs que no es https');
check(grafo.some((n) => n['@type'] === 'WebSite'), 'el JSON-LD no tiene un WebSite');

const leer = async (...rutas) => {
  for (const r of rutas) {
    try {
      return await readFile(new URL(`../${r}`, import.meta.url), 'utf8');
    } catch {
      /* probamos la siguiente */
    }
  }
  return null;
};
const noindex = (doc) => /<meta name="robots" content="noindex/.test(doc ?? '');

const ogCard = await leer('dist/og-card/index.html', 'dist/og-card.html');
check(ogCard !== null, 'no se generó la página /og-card');
check(noindex(ogCard), '/og-card no lleva noindex');
const nf = await leer('dist/404.html');
check(nf !== null, 'no se generó dist/404.html');
check(noindex(nf), 'la 404 no lleva noindex');
check(!/application\/ld\+json/.test((ogCard ?? '') + (nf ?? '')), 'og-card o 404 llevan JSON-LD');
const sitemap = await leer('dist/sitemap-0.xml');
check(sitemap !== null, 'no se generó dist/sitemap-0.xml');
check(!/og-card|\/404/.test(sitemap ?? ''),'el sitemap incluye og-card o la 404');
const existe = (r) => access(new URL(`../${r}`, import.meta.url)).then(() => true, () => false);
check(await existe('public/og/default.png'), 'falta public/og/default.png (pnpm og)');

// ── Persona para buscadores e IA: ProfilePage, fundador de Sumari, bio visible, llms.txt, robots ──
const pagina = grafo.find((n) => n['@type'] === 'ProfilePage');
check(pagina?.mainEntity?.['@id'] === persona?.['@id'], 'falta ProfilePage con mainEntity = Person');
check(
  grafo.some((n) => n['@type'] === 'Organization' && n.founder?.['@id'] === persona?.['@id']),
  'Sumari no declara a Francisco como founder',
);
check(/Francisco Sanvicente es /.test(visible), 'la bio larga no está en el HTML');
const llms = await leer('dist/llms.txt');
check(llms?.startsWith('# Francisco Sanvicente') ?? false, 'falta dist/llms.txt');
const robots = await leer('dist/robots.txt');
check(robots !== null && !/^Disallow:\s*\/\s*$/m.test(robots), 'robots.txt bloquea el sitio');
check(/User-agent: GPTBot/.test(robots ?? ''), 'robots.txt no nombra a los bots de IA');

if (fallos.length) {
  console.error(`✗ ${fallos.length} comprobación(es) fallaron:\n  - ${fallos.join('\n  - ')}`);
  process.exit(1);
}
console.log('✓ dist pasa las comprobaciones');
