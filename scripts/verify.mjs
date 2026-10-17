/* Comprobaciones sobre el HTML generado (`pnpm build && pnpm test`). Sin dependencias: lee
   dist/index.html y falla con código 1 si algo de lo que sostiene el SEO de persona se rompe. */
import { readFile } from 'node:fs/promises';

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
for (const id of ['sumari', 'trayectoria', 'principios', 'contacto']) {
  check(new RegExp(`\\sid="${id}"`).test(html), `falta la sección #${id}`);
}
for (const n of [1, 2, 3, 4]) {
  check(new RegExp(`data-hito="${n}"`).test(html), `falta el hito data-hito="${n}"`);
}
check(!/href="#"/.test(html), 'hay un enlace vacío href="#"');
check(!/\bTODO\b/.test(visible), 'hay un TODO visible en el texto de la página');

if (fallos.length) {
  console.error(`✗ ${fallos.length} comprobación(es) fallaron:\n  - ${fallos.join('\n  - ')}`);
  process.exit(1);
}
console.log('✓ dist/index.html pasa las comprobaciones');
