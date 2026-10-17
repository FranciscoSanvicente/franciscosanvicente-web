# Plan — web personal de Francisco Sanvicente

**Objetivo:** que al buscar "Francisco Sanvicente" en Google aparezca esta web junto a sus redes.
Lector secundario: inversores, prensa y colaboradores que quieren entender quién es y qué construye.

**Decisiones tomadas (2026-10-17):**

- **Stack:** Astro estático + three.js vanilla, desplegado en Cloudflare Pages sin adapter.
- **Concepto:** "construir por capas". El nombre domina la primera lectura; el 3D lo acompaña.
- **3D:** una pila de 3–4 placas de grafito con canto ámbar que, de frente, dibuja los chevrons de
  Sumari. Se carga después del texto y solo en equipos capaces; en móvil, con movimiento reducido o
  sin WebGL se ve una imagen fija.
- **Sistema visual:** tokens y familias de Sumari (Bricolage Grotesque, Manrope, Space Grotesk).
  El ámbar solo marca lo que es Sumari; mint y coral no se usan.
- **Idioma:** solo español.
- **Fuera:** preloader, scroll secuestrado, cursor propio, sonido, SPA.

**Presupuestos:** LCP ≤ 2 s en 4G con móvil de gama media · CLS < 0,05 · JS inicial ≤ 25 KB gz
(sin three.js) · three.js ≤ 160 KB gz · escena ≤ 1 MB · imagen fija ≤ 80 KB.

## Fases

Las magnitudes son de nivel proyecto (aproximadas, sin desglose en horas).

### Fase 0 — base · pequeña
- [x] Repositorio git y remoto privado `franciscosanvicente-web`.
- [x] Proyecto Astro 7 con `@astrojs/sitemap`; la URL del sitio sale de `SITE_URL`.
- [x] Tokens de color de Sumari (oscuro y claro, siguen al sistema) y fuentes autoalojadas.
- [x] Página mínima, `robots.txt` con línea Sitemap y build verificado.
- [x] Despliegue preparado: `_headers`, `.node-version` y guía en el README.
- [ ] Conectar el repo en Cloudflare Pages (lo hace Francisco desde su panel).

### Fase 1 — contenido y SEO, sin 3D · mediana · publicable al terminar
- [ ] Secciones en HTML: hero, qué construyo, trayectoria, cómo pienso, contacto.
- [ ] Title, meta description, canonical, Open Graph y Twitter card.
- [ ] JSON-LD `Person` (nombre, cargo, Sumari como organización, Puerto Ordaz, correo, `sameAs`).
- [ ] robots, sitemap, 404 e imagen OG generada en el build.
- [ ] Publicación en `.pages.dev`.

### Fase 2 — la pila 3D · grande
- [ ] Geometría procedural en three.js (glTF solo si el acabado lo exige).
- [ ] Detección de capacidad, carga diferida y corte si el render se atasca.
- [ ] Giro lento en el hero; en "Trayectoria", pila fija y placas que encajan con el scroll nativo.
- [ ] Imagen fija generada desde la escena.

### Fase 3 — verificación · pequeña
- [ ] Capturas móvil y escritorio, ambos temas, con una pasada de corrección.
- [ ] axe, Lighthouse contra presupuestos y prueba de resultados enriquecidos.

### Fase 4 — lanzamiento · pequeña
- [ ] Comprar `franciscosanvicente.com` en Cloudflare y conectarlo a Pages.
- [ ] Redirigir `.pages.dev` al dominio.
- [ ] Verificar el dominio en Search Console y enviar el sitemap.
- [ ] Enlace a la web en la bio de cada red.

## Pendiente de Francisco

- Foto (no bloquea la fase 1).
- Usuario de redes: `@fransanvicente`; alternativas `@sanvicentefco`, `@fsanvicentedev`.
- Trayectoria: cómo empezó en 2020 y si la fundación de Sumari es julio de 2026.

## Textos aprobados como borrador

**Bio corta:** Desarrollador full stack y fundador de Sumari, la app de finanzas personales para
quien maneja su dinero en varias monedas. Puerto Ordaz, Venezuela.

**Bio larga:** Francisco Sanvicente es un desarrollador de software venezolano, de Puerto Ordaz, con
seis años construyendo productos web y móviles. Ha trabajado como full stack en equipos de producto,
encargándose tanto de la interfaz como del backend que la sostiene. En 2026 fundó Sumari, una app de
finanzas personales que reúne bolívares, dólares, USDT y euros en un solo total a la tasa del día,
hecha para la forma en que la gente en Venezuela maneja de verdad su dinero.

**Trayectoria:**
1. 2020 — Empieza a programar.
2. 2020–2026 — Desarrollador full stack en equipos de producto (proyectos bajo confidencialidad).
3. 2026 — Funda Sumari.
4. Próximamente — Lanzamiento de Sumari en Google Play y App Store.
