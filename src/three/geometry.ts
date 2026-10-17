/* Medidas, encuadre y geometría procedural de la pila (docs/design/handoff.md §5). Unidad = ancho
   del chevron = 1, medido del logo de Sumari (trazo de 44 → 1). Sin glTF: todo sale de un Shape. */
import { ExtrudeGeometry, Shape } from 'three';

const SEMIANGULO = (24.4 * Math.PI) / 180;
const GROSOR = 0.205; // trazo perpendicular al brazo, como el stroke del logo
const FONDO = 0.7;
const PASO = 0.386;
const BASE_ANCHO = 1.18;
const BASE_HUECO = 0.364;
const SUBIDA = 0.5 * Math.tan(SEMIANGULO); // altura del vértice sobre los extremos
const BANDA = GROSOR / Math.cos(SEMIANGULO); // alto vertical del brazo con ese trazo

/** Separación extra entre placas con setOpen(1). */
export const ABIERTA = 0.6;
/** Altura sobre su asiento de una placa con setPlate(i, 0). El rebote de easeOutBack(·, 1.3) es un
    6 % (0.07): no llega a la placa de abajo (hueco ≥ 0.15). */
export const ELEVACION = 1.2;

/** Asiento de cada placa (base, inferior, medio, superior): eje del trazo en los extremos. */
export const ASIENTOS = [0, BASE_HUECO, BASE_HUECO + PASO, BASE_HUECO + 2 * PASO];
const ABAJO = -GROSOR / 2;
const arriba = (open: number) => ASIENTOS[3] + 3 * ABIERTA * open + BANDA / 2 + SUBIDA;
/** Centro vertical de la pila asentada con esa apertura (las placas elevadas no cuentan). */
export const centro = (open: number) => (ABAJO + arriba(open)) / 2;

/** Cámara isométrica real: atan(1/√2) = 35.264° de picado, 45° de guiñada. */
export const ISO_X = -Math.atan(1 / Math.SQRT2);
export const ISO_Y = Math.PI / 4;

/** Semialto del encuadre (lado corto del canvas): cabe la pila abierta en isométrica y de frente,
    en cualquier ángulo de giro (radio del cilindro que barre la base), con un 15 % de margen. */
const RADIO = Math.hypot(BASE_ANCHO / 2, FONDO / 2);
const ALTO = arriba(1) - ABAJO;
export const VISTA =
  1.15 *Math.max((ALTO * Math.cos(ISO_X) + 2 * RADIO * Math.sin(-ISO_X)) / 2, ALTO / 2, RADIO);

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const easeOutBack = (t: number, s: number) => 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2;
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

/* Extruye la silueta en Z (centrada) y separa las tapas: ExtrudeGeometry mete las dos en el grupo 0
   (primero la trasera, z = 0; luego la frontal). Material 0 = grafito, 1 = canto frontal. */
function extruir(shape: Shape) {
  const geo = new ExtrudeGeometry(shape, { depth: FONDO, bevelEnabled: false, steps: 1 });
  geo.translate(0, 0, -FONDO / 2);
  const [tapas, lados] = geo.groups;
  const mitad = tapas.count / 2;
  geo.clearGroups();
  geo.addGroup(tapas.start, mitad, 0);
  geo.addGroup(tapas.start + mitad, mitad, 1);
  geo.addGroup(lados.start, lados.count, 0);
  return geo;
}

/** Chevron: trazo en V invertida de ancho 1, extremos cortados en vertical. */
export function chevronGeometry() {
  const h = BANDA / 2;
  const s = new Shape();
  s.moveTo(-0.5, -h);
  s.lineTo(0, SUBIDA - h);
  s.lineTo(0.5, -h);
  s.lineTo(0.5, h);
  s.lineTo(0, SUBIDA + h);
  s.lineTo(-0.5, h);
  s.closePath();
  return extruir(s);
}

/** Base: placa plana de ancho 1.18 con el mismo trazo. */
export function baseGeometry() {
  const w = BASE_ANCHO / 2;
  const h = GROSOR / 2;
  const s = new Shape();
  s.moveTo(-w, -h);
  s.lineTo(w, -h);
  s.lineTo(w, h);
  s.lineTo(-w, h);
  s.closePath();
  return extruir(s);
}
