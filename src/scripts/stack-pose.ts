/* Partes puras del cargador 3D (./stack-loader): el gate de capacidad y el interpolador que traduce
   la posición del scroll a la pose de la pila (docs/design/handoff.md, v2 §3). Sin efectos: lee
   medidas ya cacheadas, nunca el DOM.

   - Sección actual: la última cuyo borde superior ya pasó la línea del 40 %. Entre dos secciones,
     la pose se mezcla mientras la siguiente sube del borde inferior (100 %) a esa línea, con
     easeInOutCubic. Cada sección modula su pose con su propio progreso (./waypoints → ajustar).
   - Retrato: la pila actúa a opacidad 1 dentro de las ventanas (`.escena` y la mitad superior del
     hero) y baja a 0.14 mientras pasa el texto, para que nunca compita con la lectura. */
import type { StackPose } from '../three/types';
import { GIRO, ORDEN, PAISAJE, RETRATO, ajustar, type Clave, type Contexto } from './waypoints';

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const ALFA_LECTURA = 0.1;

type Nav = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };

/** Lo que el script en línea del <head> no puede saber sin crear un contexto: WebGL2. El resto
    (ahorro de datos, memoria, núcleos, movimiento reducido) ya decidió `html.lite` antes de pintar. */
export function capable(): boolean {
  const nav = navigator as Nav;
  if (nav.connection?.saveData) return false;
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export interface Caja {
  top: number;
  height: number;
}

/** Medidas en coordenadas del documento (top = distancia al inicio de la página). */
export interface Medidas {
  secciones: (Caja & { clave: Clave })[];
  hitos: Caja[];
  servicios: Caja[];
  ventanas: Caja[];
}

export interface Estado {
  pose: StackPose;
  spin: number;
  alpha: number;
}

function mezclar(a: StackPose, b: StackPose, t: number): StackPose {
  const m = (x: number[], y: number[]) => x.map((v, k) => lerp(v, y[k]!, t)) as StackPose['plates'];
  return {
    x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), h: lerp(a.h, b.h, t),
    rotX: lerp(a.rotX, b.rotX, t), rotY: lerp(a.rotY, b.rotY, t),
    open: lerp(a.open, b.open, t), spreadX: lerp(a.spreadX, b.spreadX, t),
    plates: m(a.plates, b.plates), emit: m(a.emit, b.emit), ink: m(a.ink, b.ink),
  };
}

/** Estado de la pila con el documento desplazado `y` px, un viewport de alto `vh` y un canvas de
    alto `ch` (100lvh). */
export function estado(y: number, vh: number, ch: number, m: Medidas, retrato: boolean): Estado {
  const rel = (c: Caja) => c.top - y;
  const progreso = (c: Caja, linea: number) => clamp01((linea - rel(c)) / Math.max(1, c.height));

  const servicio = m.servicios.findIndex((c) => rel(c) <= 0.5 * vh && rel(c) + c.height > 0.5 * vh);
  const hitos = m.hitos.map((c) => progreso(c, 0.6 * vh));
  const aproximacion = m.hitos[0] ? clamp01((vh - rel(m.hitos[0])) / (0.4 * vh)) : 1;
  const tabla = retrato ? RETRATO : PAISAJE;
  const poseDe = (i: number) => {
    const sec = m.secciones[i]!;
    const c: Contexto = { s: progreso(sec, 0.5 * vh), servicio, hitos, aproximacion, retrato };
    return ajustar(sec.clave, tabla[sec.clave], c);
  };

  let j = m.secciones.findIndex((c) => rel(c) > 0.4 * vh);
  let b = 0;
  if (j === -1) j = m.secciones.length;
  else if (j > 0) b = easeInOutCubic(clamp01((vh - rel(m.secciones[j]!)) / (0.6 * vh)));
  const i = Math.max(0, j - 1);
  const siguiente = Math.min(j, m.secciones.length - 1);
  const pose = b > 0 ? mezclar(poseDe(i), poseDe(siguiente), b) : poseDe(i);
  const clave = m.secciones[b < 0.5 ? i : siguiente]?.clave ?? ORDEN[0]!;

  let alpha = 1;
  if (retrato) {
    const centro = pose.y * ch;
    const d = Math.min(
      ...m.ventanas.map((c) => Math.max(0, rel(c) - centro, centro - (rel(c) + c.height))),
      Number.POSITIVE_INFINITY,
    );
    const t = clamp01(d / (0.15 * vh));
    alpha = lerp(1, ALFA_LECTURA, t * t * (3 - 2 * t));
  }
  return { pose, spin: GIRO[clave], alpha };
}
