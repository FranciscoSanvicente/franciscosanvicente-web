# Handoff de diseño — página de inicio

Fuente única de verdad visual para quien maquete cualquier sección. Lo redactó `ux-architect`
(modo handoff) el 2026-10-17 sobre la dirección aprobada en [docs/plan.md](../plan.md).

**Regla para quien implementa:** no se definen tamaños, colores ni espaciados propios. Las
primitivas compartidas viven en `src/styles/global.css` (`.container`, `.section-head`, `.eyebrow`,
escala `.t-*`, `.reveal`, tokens `--s-*`). Cada componente solo compone con ellas y con estilos de
alcance propio para su layout.

Decisiones confirmadas por el coordinador: dos columnas desde 1024 px; la emisión ámbar se extiende
a las cuatro placas en el hito 3; "Cómo pienso" se redacta como borrador a partir de los principios
documentados de Sumari y queda marcado para revisión de Francisco (en el PR, no en la página).

## 1. Retícula

- `--container: 1320px`; `--gutter: clamp(1.25rem, 4vw, 3rem)`.
- `.container { max-width: calc(var(--container) + 2 * var(--gutter)); padding-inline: var(--gutter); margin-inline: auto }`.
- Columnas: <768 → 4 col, separación 16 px · 768–1023 → 8 col, 20 px · ≥1024 → 12 col, 24 px.
- El `.stage` pasa a dos columnas desde **64rem (1024 px)**. Desde 1280 solo escala.

**`.stage`** (`src/components/Stage.astro`) envuelve Hero, Sumari y Trayectoria:

```html
<div class="stage container">
  <div class="stage__flow"><slot /></div>      <!-- Hero, Sumari, Trayectoria -->
  <div class="stage__media" aria-hidden="true">
    <div class="stage__frame">
      <picture class="stage__poster">…</picture>
      <canvas class="stage__canvas" hidden></canvas>
    </div>
  </div>
</div>
```

- ≥64rem: `.stage { display: grid; grid-template-columns: repeat(12, 1fr); column-gap: 24px }`;
  `.stage__flow { grid-column: 1 / span 6; grid-row: 1 }`; `.stage__media { grid-column: 8 / -1; grid-row: 1 }`
  (la columna 7 es aire a propósito); `.stage__frame { position: sticky; top: 0; height: 100svh; display: grid; place-items: center }`;
  póster y canvas comparten `grid-area: 1 / 1`, `aspect-ratio: 1`, `width: min(100%, 78svh)`.
- El sticky es CSS puro: sin JS el póster queda fijo igual. Sumari convive con la pila ya quieta.
- <64rem: `.stage__media { display: none }`. El Hero pinta su propio `<picture>` del póster debajo
  de las redes, `width: min(72vw, 360px)`, alineado a la izquierda. En Trayectoria no hay 3D: lo
  sustituyen los glifos (§4).

## 2. Tipografía

| Clase | Fuente / tamaño | Peso · tracking · interlínea | Notas |
|---|---|---|---|
| `.t-name` (H1) | Bricolage `clamp(3rem, 1.6rem + 6.2vw, 7.5rem)` | 600 · −0.045em · 0.92 | `font-optical-sizing: auto`; dos líneas en todo ancho |
| `.t-h2` | Bricolage `clamp(2rem, 1.35rem + 2.8vw, 3.5rem)` | 600 · −0.03em · 1.02 | |
| `.t-h3` | Bricolage `clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem)` | 600 · −0.015em · 1.15 | |
| `.t-statement` | Bricolage `clamp(1.375rem, 1.1rem + 1.1vw, 2rem)` | 500 · −0.02em · 1.2 | Principios |
| `.eyebrow` | Space Grotesk 0.8125rem | 500 · 0.02em | `tabular-nums`, `--ink4`, **sin mayúsculas** |
| `.t-body` | Manrope `clamp(1rem, 0.96rem + 0.2vw, 1.0625rem)` | 450 · 1.6 | `max-width: 62ch`, `--ink2` |
| `.t-lede` | Manrope `clamp(1.1875rem, 1.05rem + 0.6vw, 1.5rem)` | 500 · −0.01em · 1.4 | `max-width: 32ch` |
| `.t-figure` | Space Grotesk `clamp(1.5rem, 1.2rem + 1.2vw, 2.25rem)` | 500 · −0.02em · 1 | `tabular-nums` (años) |
| `.t-meta` | Manrope 0.875rem | 500 | `--ink3` |

La suma de Sumari usa `.t-figure` con tope de 2.5rem.

## 3. Espaciado y encabezado de sección

- Escala: `--s-1: 4px` `--s-2: 8px` `--s-3: 12px` `--s-4: 16px` `--s-5: 24px` `--s-6: 32px`
  `--s-7: 48px` `--s-8: 64px` `--s-9: 96px` `--s-10: 128px`.
- Entre secciones: `--section-y: clamp(5rem, 3rem + 8vw, 10rem)` como `padding-block`.
- `.section-head`: `.eyebrow` con **"capa 01"…"capa 05"** (Sumari, Trayectoria, Con qué
  construyo, Principios, Contacto) → `--s-3` → H2 → `--s-7` hasta el contenido. El eyebrow numera capas, no repite el H2.
  El Hero no lleva eyebrow.

## 4. Secciones

**Header** (`<header>`, no sticky, `padding-block: var(--s-5)`): izquierda "Puerto Ordaz, VE" en
`.eyebrow` (no es enlace; oculto en móvil). Derecha `<nav aria-label="Secciones">` con Sumari ·
Trayectoria · Contacto en mono 0.8125rem, `--ink3`, hover `--ink`, área táctil ≥ 44 px.

**Hero** (`<section aria-labelledby="nombre">`): ≥64rem `min-height: 100svh; display: grid;
align-content: end; padding-bottom: var(--s-9)`; <64rem `padding-top: var(--s-9)`. H1 `#nombre` →
`--s-5` → lede en `--ink2`, sin ámbar → `--s-7` → `<Redes />`. Redes: solo las que tienen URL;
nombre + "↗" (`aria-hidden`); misma pestaña. Sin foto todavía: no se reserva hueco.

**Sumari** (`id="sumari"`): la **única superficie con relleno** de la página: `--surf`, borde 1 px
`--border`, `border-radius: 20px`, `padding: var(--s-7)` (`--s-6` en móvil),
`border-top: 2px solid var(--amber)` (el canto de la placa). Contenido: (1) texto sobre Sumari;
(2) `<p class="sumari__sum">` con `<abbr title="bolívares">Bs</abbr> + $ + USDT + € = <span>total del día</span>`,
operadores en `--ink4`, "total del día" en `--amberText`; (3) enlace "sumariapp.com ↗" en
`--amberText`, subrayado `--amber`, 600; (4) `.t-meta` "En desarrollo · Google Play y App Store, próximamente".

**Trayectoria** (`id="trayectoria"`): `<ol class="hitos">` con 4 `<li class="hito" data-hito="1..4">`:
glifo, año `.t-figure`, `.t-h3`, `.t-body` opcional en `--ink3`. ≥64rem: `.hito { min-height: 72svh }`
y `padding-bottom: 40svh` al final de la sección para que la cámara termine con el sticky visible.
Glifo: SVG inline 28 px con la geometría del favicon, `aria-hidden`; capas rellenas = número del
hito, en `--ink3`; desde el hito 3 la capa superior en `--amberText`. Con JS, `data-active` en el
hito con progreso ≥ 0.5: su título a `--ink`, el resto `--ink3`. Sin JS todos en `--ink`. Sin línea
vertical con puntos.

**Principios** (fuera del stage, retícula de 12): cabecera en columnas 1–4, `position: sticky;
top: var(--s-9)` desde 64rem; lista en columnas 6–12. Cada ítem: `border-top: 1px solid var(--border)`,
`padding-block: var(--s-6)`, índice `.eyebrow` "3.1", `.t-statement` en `--ink`, 1–2 líneas
`.t-body` en `--ink3`.

**Contacto**: correo en Bricolage `clamp(1.25rem, 0.6rem + 2.8vw, 3rem)`, `<wbr>` tras la @,
`overflow-wrap: anywhere` (a 375 no cabe). Botón "Copiar" solo con JS (`html.js`), `aria-live="polite"`
que anuncia "Copiado". Luego `<Redes />`. "Descargar bio" solo si el archivo existe (hoy no existe:
no se pinta).

**Footer** (`<footer>`, `border-top: 1px solid var(--border)`, `padding-block: var(--s-6)`):
`.t-meta` `--ink4` "© 2026 Francisco Sanvicente · Puerto Ordaz, Venezuela".

**Accesibilidad:** landmarks banner, nav, `main#contenido`, contentinfo; cada sección con
`aria-labelledby` a su H2; `.stage__flow` antes que `.stage__media` en el DOM. Orden de foco: salto
al contenido → nav → redes del hero → sumariapp.com → correo → copiar → redes → bio. Contraste
razonado: `--ink4`/`--bg` ≈ 6:1 en ambos temas; `--amberText`/`--surf` en claro ≈ 5,6:1.

## 5. La pila 3D

- **Geometría** (unidad = ancho del chevron = 1, del favicon): chevron extruido, semiángulo
  **24.4°**, grosor 0.205, fondo 0.7; paso vertical asentado 0.386; base = placa plana de ancho
  1.18, 0.364 bajo el último chevron. Hito 1 = base, 2 = chevron inferior, 3 = medio, 4 = superior.
- **Materiales:** grafito `MeshStandardMaterial({ color: #23262b, roughness: 0.62, metalness: 0.35 })`;
  canto frontal `color`/`emissive` `#e7b857`, `emissiveIntensity` 1.4 (oscuro) / 0.9 (claro); canto
  apagado `#8a9099`, `roughness: 0.4`, sin emisión. En el hero solo emite la placa superior; en el
  hito 3 la emisión se extiende a las cuatro en 400 ms.
- **Luz:** `HemisphereLight(#f8f9fb, #0b0c0e, 0.6)`; `DirectionalLight(#fff4e0, 2.2)` en (−3, 5, 4);
  contraluz `(#cfd8e3, 0.8)` en (2, 1, −4). Sin sombras, sin bloom, `ACESFilmicToneMapping`.
  `alpha: true`, fondo transparente, DPR `min(devicePixelRatio, 2)`.
- **Cámara:** `OrthographicCamera` isométrica real `rotation.x = −35.264°`, `rotation.y = 45°`;
  frontal = 0° / 0°.
- **Hero:** pila abierta (separación extra 0.6 entre placas), giro en `rotation.y` a 0.12 rad/s
  (~52 s por vuelta). Al entrar `#sumari` el giro se amortigua a 0 en 600 ms (`easeOutCubic`), por
  tiempo, no por scroll.
- **Trayectoria:** un solo listener de scroll pasivo + rAF. `pᵢ = clamp((0.6·vh − rect.top) / rect.height, 0, 1)`
  por hito. La placa i baja a su asiento con `easeOutBack(pᵢ / 0.6, 1.3)`, solo en Y. En el 30 %
  final del hito 4 la cámara pasa de isométrica a frontal (`easeInOutCubic`): ahí se leen los
  chevrons. Todo reversible al subir.
- **Póster:** encuadre isométrico con separación al 50 %, solo la placa superior emitiendo;
  cuadrado 960×960, AVIF con alfa + WebP de respaldo, `width`/`height` declarados, ≤ 80 KB.

## 6. Movimiento

- `.reveal` solo con `html.js`: opacidad 0→1 y `translateY(12px)`→0, 560 ms
  `cubic-bezier(0.22, 1, 0.36, 1)`, desfase 60 ms hasta 4 elementos, IntersectionObserver con umbral
  0.15, una sola vez. **El H1 nunca se revela** (es el LCP).
- Enlaces: subrayado `--border2` → `currentColor` en 160 ms `ease-out`; "↗" `translate(2px, −2px)`.
- Hito activo: color en 240 ms. Entrada del canvas: opacidad en 600 ms, luego se oculta el póster.
- `prefers-reduced-motion`: sin revelados, sin WebGL (siempre póster), sin desplazamiento de la
  flecha; solo cambios de color.

## 7. Anti-genérico

1. **Presupuesto de ámbar cerrado:** solo borde superior del bloque Sumari, su enlace, "total del
   día", capa superior de los glifos desde el hito 3 y cantos 3D. Ningún otro ámbar, degradado,
   resplandor o sombra.
2. **Toda geometría decorativa sale del favicon** (24.4°, proporción del trazo, cuatro capas). Sin
   librerías de iconos, sin tres tarjetas en fila, sin línea de tiempo con puntos, sin hero centrado.
3. **La jerarquía la llevan el tipo y el espacio, no las cajas.** Una sola superficie con relleno
   (Sumari); el resto se separa con espacio y reglas de 1 px. Sin píldoras, sin eyebrows en
   mayúsculas espaciadas, sin cifras ni testimonios inventados.

---

Sello: handoff · sin `crew.json` ni `docs/design/` previos: sin memoria, baseline, registro,
captura ni checks declarados; la dirección descansa en el brief · contraste, valores 3D y clamps a
375/768/1280 razonados, no medidos.
