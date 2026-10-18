/* PNG de los iconos desde public/favicon.svg (viewBox 100). Regenerar si cambia el favicon:

     pnpm icons */
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

const svg = await readFile('public/favicon.svg', 'utf8');
// iOS recorta sus propias esquinas: el apple-touch-icon va a sangre, sin el rx.
const cuadrado = svg.replace(' rx="22"', '');

const SALIDAS = [
  [svg, 48, 'public/favicon-48.png'],
  [cuadrado, 180, 'public/apple-touch-icon.png'],
  [svg, 192, 'public/icon-192.png'],
  [svg, 512, 'public/icon-512.png'],
];

for (const [fuente, lado, ruta] of SALIDAS) {
  await sharp(Buffer.from(fuente), { density: Math.ceil((72 * lado) / 100) })
    .resize(lado, lado)
    .png()
    .toFile(ruta);
  console.log(`✓ ${ruta} (${lado}×${lado})`);
}
