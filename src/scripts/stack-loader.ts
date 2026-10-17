/* Cargador de la pila 3D (docs/design/handoff.md §5 y §6). Decide CUÁNDO existe la escena y en qué
   estado está; la escena (src/three/stack.ts) solo sabe pintarlo y la coreografía vive en
   ./stack-pose. Sin capacidad, sin espacio o con movimiento reducido no se descarga three.js y
   queda el póster: el póster es el estado de reposo y el canvas una mejora que puede desaparecer
   en cualquier momento sin mover el layout. */
import type { StackScene, StackTheme } from '../three/types';
import { SPIN, capable, clamp01, easeOutCubic, pose } from './stack-pose';

const SPIN_MS = 600;
const SLOW_FRAME_MS = 50;
const SLOW_FOR_MS = 2000;

const wide = matchMedia('(min-width: 64rem)');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const dark = matchMedia('(prefers-color-scheme: dark)');

const media = document.querySelector<HTMLElement>('.stage__media');
const canvas = document.querySelector<HTMLCanvasElement>('.stage__canvas');
const poster = document.querySelector<HTMLElement>('.stage__poster');
const flow = document.querySelector<HTMLElement>('.stage__flow');
const sumari = document.getElementById('sumari');
const hitos = [1, 2, 3, 4].map((n) => document.querySelector<HTMLElement>(`#trayectoria [data-hito="${n}"]`));

const theme = (): StackTheme => (dark.matches ? 'dark' : 'light');
/** Lo que puede cambiar en vivo: ancho del viewport y movimiento reducido. */
const allowed = () => wide.matches && !reduced.matches;

let load: Promise<typeof import('../three/stack')> | null = null;
let scene: StackScene | null = null;
let banned = false; // corte por rendimiento o fallo de la escena: no se reintenta en esta visita
let onScreen = false; // la columna sticky del 3D intersecta el viewport
let running = false;
let resizeObs: ResizeObserver | null = null;
let frame = 0;
let monitor = 0;

// Últimos valores enviados, para no repetir llamadas idénticas (p. ej. reiniciar la emisión).
const sent = new Map<string, number | boolean>();
function send<T extends number | boolean>(key: string, value: T, apply: (v: T) => void) {
  if (sent.get(key) === value) return;
  sent.set(key, value);
  apply(value);
}

/* ---- Giro: interpolación POR TIEMPO entre el valor actual y el objetivo, con easeOutCubic. ---- */
let spin = SPIN;
let spinTarget = SPIN;
let spinFrom = SPIN;
let spinStart = 0;
let spinFrame = 0;

function spinTick(now: number) {
  const t = clamp01((now - spinStart) / SPIN_MS);
  spin = spinFrom + (spinTarget - spinFrom) * easeOutCubic(t);
  scene?.setSpin(spin);
  spinFrame = t < 1 && scene ? requestAnimationFrame(spinTick) : 0;
}

function aimSpin(target: number, instant: boolean) {
  if (instant) {
    cancelAnimationFrame(spinFrame);
    spinFrame = 0;
    spin = spinTarget = target;
    scene?.setSpin(spin);
    return;
  }
  if (target === spinTarget) return;
  // Si cambia a mitad de camino, parte del valor actual: se reanuda sin tirones.
  spinTarget = target;
  spinFrom = spin;
  spinStart = performance.now();
  if (!spinFrame) spinFrame = requestAnimationFrame(spinTick);
}

/* ---- Estado según el scroll. Solo lecturas de layout; la escena escribe en su propio canvas. ---- */
function update(instant = false) {
  frame = 0;
  const s = scene;
  if (!s) return;
  const boxes = hitos.every((el) => el) ? hitos.map((el) => el!.getBoundingClientRect()) : null;
  const next = pose(innerHeight, sumari ? sumari.getBoundingClientRect().top : null, boxes);
  aimSpin(next.spin, instant);
  send('open', next.open, (v) => s.setOpen(v));
  next.plates.forEach((v, k) => send(`plate${k + 1}`, v, (x) => s.setPlate((k + 1) as 1 | 2 | 3 | 4, x)));
  send('emissive', next.emissive, (v) => s.setEmissive(v));
  send('front', next.front, (v) => s.setFront(v));
}

const schedule = () => {
  if (scene && !frame) frame = requestAnimationFrame(() => update());
};

/* ---- Render solo con la pestaña visible y la columna en pantalla; mientras corre, el corte por
   rendimiento muestrea lastFrameMs cada 250 ms y se reinicia en cada arranque. ---- */
function sync() {
  const want = !!scene && onScreen && document.visibilityState === 'visible';
  if (!scene || want === running) return;
  running = want;
  clearInterval(monitor);
  if (!want) return scene.stop();
  scene.start();
  let slowSince = 0;
  monitor = window.setInterval(() => {
    if (!scene || scene.lastFrameMs <= SLOW_FRAME_MS) return void (slowSince = 0);
    const now = performance.now();
    slowSince ||= now;
    if (now - slowSince >= SLOW_FOR_MS) fail();
  }, 250);
}

function mount(create: typeof import('../three/stack').createStackScene) {
  if (scene || banned || !canvas || !allowed()) return;
  canvas.hidden = false;
  try {
    scene = create(canvas, { theme: theme() });
    sent.clear();
    scene.resize();
    update(true);
    sync();
  } catch {
    return fail();
  }
  // Canvas → tamaño/DPR. Flujo → un reflujo mueve los hitos sin scroll: también recalcula el estado.
  resizeObs = new ResizeObserver((entries) => {
    if (entries.some((e) => e.target === canvas)) scene?.resize();
    schedule();
  });
  resizeObs.observe(canvas);
  if (flow) resizeObs.observe(flow);
  // Dos frames: el canvas ya está en el layout con opacidad 0 y la escena pintó al menos uno.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      if (!scene) return;
      canvas.classList.add('is-live');
      poster?.classList.add('is-covered');
    }),
  );
}

function unmount() {
  clearInterval(monitor);
  cancelAnimationFrame(frame);
  cancelAnimationFrame(spinFrame);
  frame = spinFrame = 0;
  resizeObs?.disconnect();
  resizeObs = null;
  const s = scene;
  scene = null;
  running = false;
  try {
    s?.stop();
    s?.dispose();
  } catch {
    /* La escena ya falló: lo que importa es devolver el póster. */
  }
  // El póster vuelve al instante: su transición solo existe al cubrirse.
  poster?.classList.remove('is-covered');
  canvas?.classList.remove('is-live');
  if (canvas) canvas.hidden = true;
}

function fail() {
  banned = true;
  unmount();
}

/** Monta si todo lo permite; el chunk de three se pide la primera vez que hace falta. */
function attempt() {
  if (!allowed()) return unmount();
  if (scene || banned) return;
  load ??= import('../three/stack');
  load.then((mod) => mount(mod.createStackScene)).catch(fail);
}

/* ---- Arranque: con movimiento reducido ni se espera. Si no, tras el primer idle Y con la columna en
   pantalla (bajo 64rem es display:none y nunca intersecta), y solo entonces el gate de capacidad. */
if (media && canvas && !reduced.matches) {
  const idle = new Promise<void>((resolve) => {
    if ('requestIdleCallback' in window) requestIdleCallback(() => resolve(), { timeout: 3000 });
    else setTimeout(resolve, 1500);
  });
  let seen: () => void;
  const visible = new Promise<void>((resolve) => (seen = resolve));
  new IntersectionObserver((entries) => {
    onScreen = entries[entries.length - 1]!.isIntersecting;
    if (onScreen) seen();
    sync();
  }).observe(media);
  Promise.all([idle, visible]).then(() => {
    if (!capable()) return;
    attempt();
    wide.addEventListener('change', attempt);
    reduced.addEventListener('change', attempt);
    dark.addEventListener('change', () => scene?.setTheme(theme()));
    // Un solo listener de scroll; resize cubre los cambios de alto y el reflujo de los hitos.
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule, { passive: true });
    document.addEventListener('visibilitychange', sync);
  });
}
