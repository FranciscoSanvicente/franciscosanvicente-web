/* Versiones web de las fotos de Francisco, desde los originales en fotos-originales/ (fuera del
   repo: pueden llevar EXIF con ubicación; sharp no copia los metadatos a las salidas).

     pnpm fotos

   - vertical-6.jpg (4:5) → retrato visible junto a la bio: AVIF + WebP a 480 y 800 px de ancho,
     recortando solo la franja de abajo donde asoma la piel del brazo, manteniendo el 4:5.
   - cuadrada-4.jpg (1:1) → foto oficial de 1200×1200 en JPG: la que lee Google en el JSON-LD
     (`perfil.foto`) y la misma que conviene usar de avatar en GitHub, LinkedIn e Instagram. */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

await mkdir('public/foto', { recursive: true });

// Sobre el original de 1600×2000: fuera los últimos 120 px (la piel del brazo asoma desde ~1900) y
// 48 px por lado para conservar el 4:5. El encuadre es el mismo de la foto.
const RECORTE = { left: 48, top: 0, width: 1504, height: 1880 };

for (const ancho of [480, 800]) {
  const base = sharp('fotos-originales/vertical-6.jpg')
    .extract(RECORTE)
    .resize(ancho, Math.round((ancho * 5) / 4));
  await base.clone().avif({ quality: 60, effort: 9 }).toFile(`public/foto/retrato-${ancho}.avif`);
  await base.clone().webp({ quality: 80, effort: 6 }).toFile(`public/foto/retrato-${ancho}.webp`);
  console.log(`✓ public/foto/retrato-${ancho}.{avif,webp}`);
}

await sharp('fotos-originales/cuadrada-4.jpg')
  .resize(1200, 1200)
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile('public/foto/francisco-sanvicente.jpg');
console.log('✓ public/foto/francisco-sanvicente.jpg');
