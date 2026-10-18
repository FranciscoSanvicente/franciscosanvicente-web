/* Poses de la pila por sección (docs/design/handoff.md, v2 §3), en paisaje (≥ 64rem) y retrato.
   Cada sección tiene una pose de reposo; Servicios, Sumari y Trayectoria la modulan con su propio
   progreso en `ajustar`. Valores en fracción del canvas (x, y, h) y grados (rotX, rotY).
   Alto real ≈ h · (1 + 0.53 · (open − 1)): el despiece crece, por eso su `h` es menor. */
import type { StackPose } from '../three/types';

export type Clave = 'inicio' | 'servicios' | 'sumari' | 'trayectoria' | 'stack' | 'principios' | 'contacto';
export const ORDEN: Clave[] = ['inicio', 'servicios', 'sumari', 'trayectoria', 'stack', 'principios', 'contacto'];

const ISO = { rotX: -35.264, rotY: 45 };
const FRENTE = { rotX: 0, rotY: 0 };
const TRES_CUARTOS = { rotX: -20, rotY: 30 };
const SUPERIOR: StackPose['emit'] = [0, 0, 0, 1];
const TODAS: StackPose['emit'] = [1, 1, 1, 1];

const pose = (o: Partial<StackPose>): StackPose => ({
  x: 0.78, y: 0.48, h: 0.9, ...ISO, open: 0, spreadX: 0,
  plates: [1, 1, 1, 1], emit: SUPERIOR, ink: [0, 0, 0, 0], ...o,
});

export const PAISAJE: Record<Clave, StackPose> = {
  inicio: pose({ x: 0.78, y: 0.55, h: 0.8, open: 1 }),
  servicios: pose({ x: 0.76, y: 0.5, h: 0.6, ...TRES_CUARTOS, open: 1.6 }),
  sumari: pose({ x: 0.77, y: 0.5, h: 0.62, ...FRENTE }),
  trayectoria: pose({ x: 0.76, y: 0.5, h: 0.7 }),
  stack: pose({ x: 0.84, y: 0.5, h: 0.5, rotX: -20, rotY: 45, open: 2.2 }),
  principios: pose({ x: 0.22, y: 0.7, h: 0.4, rotX: -16, rotY: 72 }),
  contacto: pose({ x: 0.76, y: 0.46, h: 0.64 }),
};

export const RETRATO: Record<Clave, StackPose> = {
  inicio: pose({ x: 0.6, y: 0.37, h: 0.42, open: 1 }),
  servicios: pose({ x: 0.5, y: 0.3, h: 0.36, ...TRES_CUARTOS, open: 1.6 }),
  sumari: pose({ x: 0.5, y: 0.28, h: 0.42, ...FRENTE }),
  trayectoria: pose({ x: 0.5, y: 0.3, h: 0.44 }),
  stack: pose({ x: 0.5, y: 0.3, h: 0.3, rotX: -20, rotY: 45, open: 2.2 }),
  principios: pose({ x: 0.5, y: 0.3, h: 0.34, rotX: -16, rotY: 72 }),
  contacto: pose({ x: 0.5, y: 0.28, h: 0.44 }),
};

/** Giro de cada sección en rad/s (el cargador lo amortigua por tiempo). */
export const GIRO: Record<Clave, number> = {
  inicio: 0.12, servicios: 0, sumari: 0, trayectoria: 0, stack: 0.06, principios: 0, contacto: 0.12,
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export interface Contexto {
  /** Progreso de la sección: 0 con su borde superior en la mitad del viewport, 1 al salir. */
  s: number;
  /** Servicio activo (0 apps, 1 web, 2 backend) o −1. */
  servicio: number;
  /** Progreso de cada hito respecto a la línea del 60 % y aproximación del hito 1 (0…1). */
  hitos: number[];
  aproximacion: number;
  /** Retrato: la coreografía de Sumari ocurre mientras su ventana está a la vista (después la
      tapa la tarjeta, que es opaca). */
  retrato: boolean;
}

/* Servicios = el producto por capas: apps → chevron superior, web → medio, backend y datos →
   inferior + base. La capa del servicio que se está leyendo pasa a tinta. */
const CAPAS_SERVICIO: number[][] = [[3], [2], [0, 1]];

/** Pose de la sección `clave` con su progreso aplicado. Pura: no lee el DOM. */
export function ajustar(clave: Clave, base: StackPose, c: Contexto): StackPose {
  if (clave === 'servicios') {
    const ink: StackPose['ink'] = [0, 0, 0, 0];
    for (const k of CAPAS_SERVICIO[c.servicio] ?? []) ink[k] = 1;
    return { ...base, ink };
  }
  if (clave === 'sumari') {
    // Las cuatro monedas en fila → se deslizan y se apilan → se encienden: el logo de frente.
    // En paisaje sigue a la tarjeta (se enciende con «= total del día» a la vista); en retrato,
    // a la ventana del principio de la sección.
    const [desde, hasta, enciende] = c.retrato ? [0.04, 0.16, 0.18] : [0.35, 0.75, 0.75];
    const junta = clamp01((c.s - desde) / (hasta - desde));
    return {
      ...base,
      spreadX: 1 - junta,
      h: lerp(base.h * 0.5, base.h, junta),
      emit: c.s >= enciende ? TODAS : [0, 0, 0, 0],
    };
  }
  if (clave === 'trayectoria') {
    // Se rebobina al entrar (las placas suben) y vuelve a encajar hito a hito.
    const p = c.hitos;
    const plate = (k: number) => ((p[0] ?? 0) > 0 ? clamp01((p[k] ?? 0) / 0.6) : 1 - c.aproximacion);
    return {
      ...base,
      plates: [plate(0), plate(1), plate(2), plate(3)],
      emit: (p[2] ?? 0) >= 0.5 ? TODAS : SUPERIOR,
    };
  }
  return base;
}
