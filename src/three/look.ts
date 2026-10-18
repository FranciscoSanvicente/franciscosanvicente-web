/* Luz y materiales de la pila (docs/design/handoff.md §5): grafito, canto ámbar/apagado y tres luces.
   Sin sombras ni bloom; el tone mapping (ACES) lo fija el renderer en ./stack. */
import { Color, DirectionalLight, HemisphereLight, MeshStandardMaterial, type Scene } from 'three';
import type { StackTheme } from './types';

/* El canto encendido tiene que leerse como el ámbar de marca (el mismo de global.css), no como un
   dorado lavado: encendido no recibe luz (su difuso va a negro) y solo emite su color, fuera del tone
   mapping. Así de frente la pila es el logo de Sumari tal cual. En claro va el ámbar de relleno del
   tema claro, que es el que contrasta con el papel. */
const AMBAR: Record<StackTheme, Color> = { dark: new Color(0xe7b857), light: new Color(0xc6851e) };
const APAGADO = new Color(0x8a9099);
const NEGRO = new Color(0x000000);

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
  new MeshStandardMaterial({ color: APAGADO.clone(), emissive: AMBAR.dark.clone(), roughness: 0.4, metalness: 0 });

/** Aplica el nivel de emisión `e` (0 apagado … 1 encendido, ya con easing) al canto. */
export function encender(material: MeshStandardMaterial, e: number, tema: StackTheme) {
  material.color.lerpColors(APAGADO, NEGRO, e);
  material.emissive.copy(AMBAR[tema]);
  material.emissiveIntensity = e;
  // Solo el canto encendido sale del tone mapping; apagado se comporta como el resto de la pila.
  const fuera = e > 0.5;
  if (material.toneMapped === fuera) {
    material.toneMapped = !fuera;
    material.needsUpdate = true;
  }
}
