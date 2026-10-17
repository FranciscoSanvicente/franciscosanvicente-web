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
```

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

## Nota sobre `.npmrc`

Eleva el paquete `cookie` a la raíz de `node_modules`. El prerender de Astro 7 lo importa desde la
raíz del proyecto y, sin esto, Node puede tomar otra copia que haya más arriba en el disco y el
build falla. Detalle en el propio archivo.
