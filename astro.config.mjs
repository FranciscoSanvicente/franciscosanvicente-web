// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// URL pública del sitio: de aquí salen la canónica, las URLs absolutas de Open Graph y el sitemap.
// Mientras no exista el dominio, Cloudflare Pages define SITE_URL con la dirección .pages.dev
// para que la canónica no apunte a un dominio que todavía no resuelve.
const site = process.env.SITE_URL ?? 'https://franciscosanvicente.com';

export default defineConfig({
  site,
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  build: {
    // Carpeta estable para los assets con hash; `public/_headers` les da caché inmutable.
    assets: 'assets',
  },
});
