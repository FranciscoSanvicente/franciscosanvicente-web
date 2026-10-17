/* Póster provisional de la pila (960×960, AVIF + WebP) dibujado desde la geometría del favicon.
   Lo reemplaza el póster real que genera scripts/poster.mjs desde la escena 3D. */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="960" height="960">
  <g fill="none" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M24 84 H76" stroke="#4f535a"/>
    <path d="M28 68 L50 58 L72 68" stroke="#6b7078"/>
    <path d="M28 51 L50 41 L72 51" stroke="#9aa0a6"/>
    <path d="M28 34 L50 24 L72 34" stroke="#e7b857"/>
  </g>
</svg>`;

await mkdir('public/poster', { recursive: true });
const base = sharp(Buffer.from(svg));
await base.clone().avif({ quality: 60 }).toFile('public/poster/pila.avif');
await base.clone().webp({ quality: 80 }).toFile('public/poster/pila.webp');
console.log('✓ public/poster/pila.{avif,webp}');
