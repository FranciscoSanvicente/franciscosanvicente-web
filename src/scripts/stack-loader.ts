/* Cargador de la pila 3D a pantalla completa (docs/design/handoff.md, v2 §3 y §6). Decide CUÁNDO
   existe la escena y le manda la pose de cada frame de scroll; la coreografía vive en ./stack-pose
   y ./waypoints, la pintura en src/three/stack.ts.

   - `html.lite` (decidido en el <head> antes de pintar: ahorro de datos, movimiento reducido, poca
     memoria o pocos núcleos) → no se descarga three.js y queda el póster.
   - Si no, tras `load` + el primer idle se comprueba WebGL2 y se pide el chunk de la escena. El
     canvas funde sobre el póster fijo; el layout no cambia nunca (las ventanas de retrato ya están).
   - Rendimiento: con frames > 28 ms sostenidos 2 s pasa a calidad baja (DPR 1, sin giro) y lo
     recuerda en la sesión; si aun así > 50 ms, se apaga. Sin reintento.
   - Accesibilidad: la opacidad del escenario sigue al scroll desde el arranque (antes de que exista
     la escena), para que el póster nunca quede a plena opacidad detrás del texto. Si la escena no
     puede existir o se apaga, la página pasa a `html.lite` (póster en el hero, sin ventanas). El
     giro se detiene con `html.pausa` (botón de la cabecera, WCAG 2.2.2). */
import type { StackQuality, StackScene, StackTheme } from '../three/types';
import { medir as medirDom } from './stack-medidas';
import { capable, clamp01, easeOutCubic, estado, type Medidas } from './stack-pose';

const SPIN_MS = 600;
const LENTO_MS = 28;
const MUY_LENTO_MS = 50;
const SOSTENIDO_MS = 2000;
const CLAVE_CALIDAD = 'pila-calidad';

const raiz = document.documentElement;
const wide = matchMedia('(min-width: 64rem)');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const dark = matchMedia('(prefers-color-scheme: dark)');
const canvas = document.querySelector<HTMLCanvasElement>('.escenario__canvas');
const poster = document.querySelector<HTMLElement>('.escenario__poster');

const theme = (): StackTheme => (dark.matches ? 'dark' : 'light');
const leerCalidad = (): StackQuality => {
  try {
    return sessionStorage.getItem(CLAVE_CALIDAD) === 'low' ? 'low' : 'high';
  } catch {
    return 'high';
  }
};

let scene: StackScene | null = null;
let calidad: StackQuality = leerCalidad();
let medidas: Medidas | null = null;
let frame = 0;
let monitor = 0;

/* ---- Giro: por tiempo, del valor actual al objetivo con easeOutCubic. ---- */
let spin = 0;
let spinTarget = Number.NaN;
let spinFrom = 0;
let spinStart = 0;
let spinFrame = 0;

function spinTick(now: number) {
  const t = clamp01((now - spinStart) / SPIN_MS);
  spin = spinFrom + (spinTarget - spinFrom) * easeOutCubic(t);
  scene?.setSpin(spin);
  spinFrame = t < 1 && scene ? requestAnimationFrame(spinTick) : 0;
}

function aimSpin(target: number) {
  if (target === spinTarget) return;
  spinTarget = target;
  spinFrom = spin;
  spinStart = performance.now();
  if (!spinFrame) spinFrame = requestAnimationFrame(spinTick);
}

/* ---- Un frame de scroll: estado → escena y opacidad del canvas. ---- */
function update() {
  frame = 0;
  if (!canvas || raiz.classList.contains('lite')) return;
  medidas ??= medirDom();
  const alto = canvas.parentElement?.clientHeight || innerHeight;
  const e = estado(scrollY, innerHeight, alto, medidas!, !wide.matches);
  canvas.parentElement?.style.setProperty('--alfa', e.alpha.toFixed(3));
  if (!scene) return;
  scene.setPose(e.pose);
  aimSpin(calidad === 'low' || raiz.classList.contains('pausa') ? 0 : e.spin);
}
const schedule = () => {
  if (!frame) frame = requestAnimationFrame(update);
};

/** Sin escena posible: modo ligero, el mismo que decide el <head> (póster en el hero, sin ventanas). */
function sinEscena() {
  raiz.classList.add('lite');
}

/* ---- Rendimiento ---- */
function vigilar() {
  clearInterval(monitor);
  let desde = 0;
  monitor = window.setInterval(() => {
    const ms = scene?.lastFrameMs ?? 0;
    const umbral = calidad === 'low' ? MUY_LENTO_MS : LENTO_MS;
    if (ms <= umbral) return void (desde = 0);
    const now = performance.now();
    desde ||= now;
    if (now - desde < SOSTENIDO_MS) return;
    desde = 0;
    if (calidad === 'low') return apagar();
    calidad = 'low';
    try {
      sessionStorage.setItem(CLAVE_CALIDAD, 'low');
    } catch {
      /* sin almacenamiento: vale para esta página */
    }
    scene?.setQuality('low');
    aimSpin(0);
  }, 250);
}

function apagar() {
  clearInterval(monitor);
  cancelAnimationFrame(frame);
  cancelAnimationFrame(spinFrame);
  frame = spinFrame = 0;
  const s = scene;
  scene = null;
  try {
    s?.dispose();
  } catch {
    /* lo que importa es devolver el póster */
  }
  poster?.classList.remove('is-covered');
  canvas?.classList.remove('is-live');
  if (canvas) canvas.hidden = true;
  sinEscena();
}

function visibilidad() {
  if (!scene) return;
  if (document.visibilityState === 'visible') {
    scene.start();
    vigilar();
  } else {
    scene.stop();
    clearInterval(monitor);
  }
}

async function montar() {
  if (!canvas) return;
  if (!capable()) return sinEscena();
  const { createStackScene } = await import('../three/stack');
  if (reduced.matches) return sinEscena();
  canvas.hidden = false;
  try {
    scene = createStackScene(canvas, { theme: theme(), quality: calidad });
    scene.resize();
    medidas = medirDom();
    update();
    visibilidad();
  } catch {
    return apagar();
  }
  // Ancho u orientación → tamaño del canvas; cualquier reflujo del documento → medidas.
  new ResizeObserver(() => scene?.resize()).observe(canvas);
  reduced.addEventListener('change', () => reduced.matches && apagar());
  dark.addEventListener('change', () => scene?.setTheme(theme()));
  document.addEventListener('visibilitychange', visibilidad);
  addEventListener('pila:pausa', schedule);
  // Dos frames: el canvas ya pintó al menos uno antes de fundirse sobre el póster.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      if (!scene) return;
      canvas.classList.add('is-live');
      poster?.classList.add('is-covered');
    }),
  );
}

if (canvas && !raiz.classList.contains('lite')) {
  // La opacidad sigue al scroll desde ya; la escena llega después.
  new ResizeObserver(() => {
    medidas = null;
    schedule();
  }).observe(document.body);
  addEventListener('scroll', schedule, { passive: true });
  wide.addEventListener('change', schedule);
  schedule();
  const arrancar = () => {
    const idle = (cb: () => void) =>
      'requestIdleCallback' in window ? requestIdleCallback(cb, { timeout: 3000 }) : setTimeout(cb, 1500);
    idle(() => void montar().catch(apagar));
  };
  if (document.readyState === 'complete') arrancar();
  else addEventListener('load', arrancar, { once: true });
}
