/* Interpolaciones por tiempo de la escena (./stack): lo que no sigue al scroll sino al reloj. */

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Acerca cada valor de `actual` a su `objetivo` a velocidad constante (de 0 a 1 en `ms`).
    Devuelve si algo cambió. */
export function acercar(actual: number[], objetivo: readonly number[], dt: number, ms: number) {
  let cambio = false;
  const paso = dt / ms;
  for (let k = 0; k < actual.length; k++) {
    const d = objetivo[k]! - actual[k]!;
    if (d === 0) continue;
    actual[k] = Math.abs(d) <= paso ? objetivo[k]! : actual[k]! + Math.sign(d) * paso;
    cambio = true;
  }
  return cambio;
}

/** Lleva un ángulo al múltiplo de 2π más cercano, exponencial (~95 % en `ms`). Devuelve el nuevo
    ángulo; cuando llega, lo fija exacto. */
export function volverACero(angulo: number, dt: number, ms: number) {
  const destino = 2 * Math.PI * Math.round(angulo / (2 * Math.PI));
  const d = destino - angulo;
  if (Math.abs(d) <= 1e-4) return destino;
  return angulo + d * (1 - Math.exp((-3 * dt) / ms));
}
