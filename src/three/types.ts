/* Contrato entre el cargador (src/scripts/stack-loader.ts) y la escena (src/three/stack.ts).
   El cargador decide CUÁNDO y CUÁNTO se mueve; la escena solo sabe CÓMO pintarlo.
   Los valores visuales están en docs/design/handoff.md §5. */

export type StackTheme = 'dark' | 'light';

export interface StackSceneOptions {
  theme: StackTheme;
}

export interface StackScene {
  /** Separación extra entre placas: 0 = asentadas, 1 = abiertas (0.6 unidades extra en el hero). */
  setOpen(t: number): void;
  /** Progreso de la placa `i` (1 = base … 4 = superior) hacia su asiento: 0 = arriba, 1 = asentada. */
  setPlate(i: 1 | 2 | 3 | 4, t: number): void;
  /** Cámara: 0 = isométrica, 1 = frontal (de frente se leen los chevrons de Sumari). */
  setFront(t: number): void;
  /** Velocidad de giro en `rotation.y`, en rad/s (0.12 en el hero, 0 quieta). */
  setSpin(radPerSecond: number): void;
  /** false = solo emite la placa superior; true = emiten las cuatro (desde el hito 3). */
  setEmissive(all: boolean): void;
  /** Cambio de tema del sistema mientras la escena está viva. */
  setTheme(theme: StackTheme): void;
  /** Recalcula tamaño y DPR a partir del canvas. */
  resize(): void;
  start(): void;
  stop(): void;
  dispose(): void;
  /** Duración del último frame en ms; el cargador la usa para el corte por rendimiento. */
  readonly lastFrameMs: number;
}

export type CreateStackScene = (canvas: HTMLCanvasElement, options: StackSceneOptions) => StackScene;
