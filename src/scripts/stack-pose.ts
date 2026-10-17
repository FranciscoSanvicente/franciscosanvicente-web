/* Partes puras del cargador 3D (src/scripts/stack-loader.ts): el gate de capacidad estática y la
   coreografía que traduce la posición del scroll a estado de la escena. Sin efectos: se pueden
   razonar (y probar) sin canvas.

   Encadenado del scroll (docs/design/handoff.md §5, decisión de la unidad 7):
   - Hero y Sumari: pila abierta (open 1), placas asentadas, solo emite la superior. El giro lo
     amortigua el cargador POR TIEMPO; aquí solo se decide su objetivo (0.12 en el hero, 0 fuera).
   - Aproximación (el hito 1 sube desde el borde inferior hasta la línea del 60 %): la pila se
     cierra (open 1→0) y las cuatro placas se levantan (plate 1→0). Al tocar la línea todo está
     arriba, que es justo donde arranca la fórmula de cada hito: no hay saltos.
   - Trayectoria: cada placa baja con su hito, plate = pᵢ/0.6. La base llega con el hito 1; la 2–4
     esperan arriba hasta que su hito toca la línea. Emisión total desde p₃ ≥ 0.5 y cámara frontal
     en el 30 % final del hito 4. Todo sale de la posición del scroll: subir lo deshace. */

export const SPIN = 0.12;

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

type Nav = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };

/** Lo que no cambia en la visita: ahorro de datos, memoria, núcleos y WebGL2 (en ese orden, del
    más barato al más caro; el contexto de prueba se libera enseguida). El cargador lo llama solo
    cuando la columna del 3D ya está en pantalla: en móvil no se crea ningún contexto. */
export function capable(): boolean {
  const nav = navigator as Nav;
  if (nav.connection?.saveData) return false;
  if ((nav.deviceMemory ?? 8) < 4 || (nav.hardwareConcurrency ?? 4) < 4) return false;
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export interface Pose {
  spin: number;
  open: number;
  /** Progreso crudo de las placas 1…4 (la escena aplica su easing). */
  plates: [number, number, number, number];
  emissive: boolean;
  front: number;
}

type Box = Pick<DOMRect, 'top' | 'height'>;

/** Estado de la escena para un viewport de alto `vh`, con el borde superior de #sumari en
    `sumariTop` (null si no existe) y las cajas de los cuatro hitos (null si falta la trayectoria). */
export function pose(vh: number, sumariTop: number | null, hitos: Box[] | null): Pose {
  // Sumari "entra" cuando asoma un 10 % del viewport; por debajo de eso estamos en el hero.
  const spin = sumariTop === null || sumariTop > 0.9 * vh ? SPIN : 0;
  if (!hitos) {
    return { spin, open: 1, plates: [1, 1, 1, 1], emissive: false, front: 0 };
  }
  const line = 0.6 * vh;
  const p = hitos.map((r) => clamp01((line - r.top) / Math.max(1, r.height)));
  // 0 con el hito 1 en el borde inferior, 1 al tocar la línea del 60 %.
  const approach = clamp01((vh - hitos[0]!.top) / (vh - line));
  const plate = (k: number) => (p[0]! > 0 ? clamp01(p[k]! / 0.6) : 1 - approach);
  return {
    spin,
    open: 1 - approach,
    plates: [plate(0), plate(1), plate(2), plate(3)],
    emissive: p[2]! >= 0.5,
    front: easeInOutCubic(clamp01((p[3]! - 0.7) / 0.3)),
  };
}
