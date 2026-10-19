# franciscosanvicente-web

Web personal de Francisco Sanvicente, fundador de Sumari. Su trabajo principal es que una
búsqueda de "Francisco Sanvicente" en Google lleve aquí y a sus redes. Por eso todo el texto sale
en HTML generado en el build y el 3D se carga después, como una capa encima.

El plan, las decisiones y los textos están en [docs/plan.md](docs/plan.md).

## Stack

- **Astro 7**, sitio estático. Cero JS por defecto.
- **Fuentes autoalojadas** con Fontsource (Bricolage Grotesque, Manrope, Space Grotesk). Solo se
  descarga el subconjunto latino que usa la página.
- **three.js** para la escena 3D (fase 2).
- **Cloudflare Pages** sirviendo `dist/`.

## Comandos

```bash
pnpm install
pnpm dev       # http://localhost:4321
pnpm build     # genera dist/
pnpm preview   # sirve dist/ para revisar el build
pnpm test      # comprueba dist/: un solo H1, SEO, JSON-LD, noindex, sitemap
pnpm shots     # capturas 375/1280 en oscuro, claro y movimiento reducido (con preview en marcha)
pnpm audit     # LCP, CLS, peso y axe contra los presupuestos (con preview en marcha)
pnpm og        # regenera la imagen OG desde /og-card (versionada en el nombre: ver scripts/og.mjs)
pnpm poster    # regenera el póster de la pila desde la escena 3D
pnpm icons     # regenera los PNG de los íconos desde public/favicon.svg
```

Datos de Francisco (bio, redes, hitos, foto) en un solo archivo: `src/data/perfil.ts`. Para
añadir una red basta con poner su URL ahí; aparece en la página y en el `sameAs` del JSON-LD.
Diseño: [docs/design/handoff.md](docs/design/handoff.md).

## URL del sitio

La canónica, el sitemap, `robots.txt` y las URLs de Open Graph salen de `SITE_URL`. Sin esa
variable se usa `https://franciscosanvicente.com`. Mientras el dominio no exista, en Cloudflare
Pages se define `SITE_URL` con la dirección `.pages.dev` del proyecto.

## Despliegue en Cloudflare Pages

Conexión por Git, desde el panel de Cloudflare: Workers & Pages → Create → Pages → Connect to Git
→ `FranciscoSanvicente/franciscosanvicente-web`.

| Ajuste | Valor |
|---|---|
| Framework preset | Astro |
| Build command | `pnpm build` |
| Build output directory | `dist` |
| Variable de entorno | `SITE_URL` = `https://<proyecto>.pages.dev` (hasta tener el dominio) |

La versión de Node sale de `.node-version` (22). `public/_headers` da caché inmutable a
`/assets/*` y fija cabeceras básicas de seguridad.

## Lanzamiento (fase 4)

Lo hace Francisco desde sus cuentas, en este orden:

1. **Conectar Cloudflare Pages** con la tabla de arriba y `SITE_URL` = la dirección `.pages.dev`
   que asigne Cloudflare. Comprobar que la página carga y que `/robots.txt` apunta a esa dirección.
2. **Comprar `franciscosanvicente.com`** en Cloudflare (Domain Registration) y añadirlo como dominio
   personalizado del proyecto de Pages (Custom domains → Set up a domain).
3. **Cambiar `SITE_URL`** a `https://franciscosanvicente.com` y volver a desplegar: canónica,
   sitemap, Open Graph y JSON-LD pasan al dominio.
4. **Redirigir `.pages.dev` al dominio:** Bulk Redirects con una regla 301 de
   `<proyecto>.pages.dev` a `https://franciscosanvicente.com`, conservando ruta y query.
5. **Search Console:** añadir la propiedad de dominio, verificarla con el registro TXT (Cloudflare
   lo añade solo si se elige), enviar `https://franciscosanvicente.com/sitemap-index.xml` y pedir la
   indexación de la home.
6. **Validar:** la [prueba de resultados enriquecidos](https://search.google.com/test/rich-results)
   con la URL pública (debe detectar `Person`) y el inspector de publicaciones de LinkedIn para ver
   la tarjeta OG.
7. **Bots de IA en Cloudflare:** en la zona del dominio, Security → Bots / AI Crawl Control:
   dejar **desactivados** "Block AI bots" y el "Managed robots.txt" (Cloudflare los activa a veces
   por defecto y se imponen a nuestro `robots.txt`). Comprobar con
   `curl https://franciscosanvicente.com/robots.txt` que sale el nuestro, con GPTBot, ClaudeBot y
   PerplexityBot permitidos. Activar también **Crawler Hints** (IndexNow).
8. **Bing Webmaster Tools:** importar la propiedad desde Search Console. ChatGPT search y Copilot
   se apoyan en el índice de Bing.
9. **Señal recíproca en sumariapp.com:** añadir `founder` con `@id`
   `https://franciscosanvicente.com/#persona` a su Organization y un enlace visible a esta web.
10. **Enlazar desde cada red:** poner `https://franciscosanvicente.com` en la bio de LinkedIn,
   GitHub y las redes nuevas, con el nombre visible "Francisco Sanvicente". Cada red nueva se añade
   también en `src/data/perfil.ts`.

## Nota sobre `.npmrc`

Eleva el paquete `cookie` a la raíz de `node_modules`. El prerender de Astro 7 lo importa desde la
raíz del proyecto y, sin esto, Node puede tomar otra copia que haya más arriba en el disco y el
build falla. Detalle en el propio archivo.
