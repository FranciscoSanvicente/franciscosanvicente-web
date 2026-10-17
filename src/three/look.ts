/* Luz y materiales de la pila (docs/design/handoff.md §5): grafito, canto ámbar/apagado y tres luces.
   Sin sombras ni bloom; el tone mapping (ACES) lo fija el renderer en ./stack. */
import { Color, DirectionalLight, HemisphereLight, MeshStandardMaterial, type Scene } from 'three';
import type { StackTheme } from './types';

const AMBAR = new Color(0xe7b857);
const APAGADO = new Color(0x8a9099);
const INTENSIDAD: Record<StackTheme, number> = { dark: 1.4, light: 0.9 };

export const esTema = (t: unknown): t is StackTheme => t === 'dark' || t === 'light';

/** Intensidades del handoff en unidades «legacy» (una luz de 1 de frente devuelve el albedo): desde
    r155 three es físico y divide por π, y con los valores tal cual el grafito se perdía contra el
    fondo oscuro. Visto en render; por eso se multiplican por π. */
export function iluminar(scene: Scene) {
  const clave = new DirectionalLight(0xfff4e0, 2.2 * Math.PI);
  clave.position.set(-3, 5, 4);
  const contra = new DirectionalLight(0xcfd8e3, 0.8 * Math.PI);
  contra.position.set(2, 1, -4);
  scene.add(new HemisphereLight(0xf8f9fb, 0x0b0c0e, 0.6 * Math.PI), clave, contra);
}

export const grafito = () => new MeshStandardMaterial({ color: 0x23262b, roughness: 0.62, metalness: 0.35 });

/** Canto frontal: apagado (#8a9099, sin emisión) o ámbar emitiendo; uno por placa. */
export const canto = () =>
  new MeshStandardMaterial({ color: APAGADO.clone(), emissive: AMBAR, roughness: 0.4, metalness: 0 });

/** Aplica el nivel de emisión `e` (0 apagado … 1 encendido, ya con easing) al canto. */
export function encender(material: MeshStandardMaterial, e: number, tema: StackTheme) {
  material.color.lerpColors(APAGADO, AMBAR, e);
  material.emissiveIntensity = INTENSIDAD[tema] * e;
}
