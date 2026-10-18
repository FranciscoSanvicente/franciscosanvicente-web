/* Contrato entre el cargador (src/scripts/stack-loader.ts) y la escena (src/three/stack.ts).
   El cargador decide CUÁNDO y en QUÉ POSE está la pila (docs/design/handoff.md, v2 §3); la escena
   solo sabe pintarla. La pila vive en un canvas fijo a pantalla completa detrás del contenido. */

export type StackTheme = 'dark' | 'light';
export type StackQuality = 'high' | 'low';

type Cuatro = [number, number, number, number];

/** Pose completa de la pila. Placas e índices: 0 = base, 1 = chevron inferior, 2 = medio, 3 = superior. */
export interface StackPose {
  /** Centro de la pila en fracción del canvas: x desde la izquierda, y desde arriba. */
  x: number;
  y: number;
  /** Alto aparente de la pila (abierta) en fracción del alto del canvas. */
  h: number;
  /** Cámara en grados: isométrica = (−35.264, 45); frontal = (0, 0). */
  rotX: number;
  rotY: number;
  /** Separación vertical extra entre placas: 0 asentada, 1 abierta, > 1 despiece. */
  open: number;
  /** 0 = apiladas; 1 = en fila horizontal, una al lado de otra (las cuatro monedas). */
  spreadX: number;
  /** Progreso de cada placa hacia su asiento: 0 = levantada, 1 = asentada (crudo, sin easing). */
  plates: Cuatro;
  /** Emisión ámbar del canto de cada placa, 0–1 (el ámbar es solo de Sumari). */
  emit: Cuatro;
  /** Canto en tinta de cada placa, 0–1 (resalta la capa del servicio activo). */
  ink: Cuatro;
}

export interface StackSceneOptions {
  theme: StackTheme;
  quality: StackQuality;
}

export interface StackScene {
  setPose(pose: StackPose): void;
  /** Velocidad de giro de la pila en rad/s; en 0 el giro acumulado vuelve al 0 más cercano. */
  setSpin(radPerSecond: number): void;
  setTheme(theme: StackTheme): void;
  /** 'low': DPR 1 (modo bajo tras frames lentos). */
  setQuality(quality: StackQuality): void;
  /** Recalcula tamaño y DPR a partir del canvas. */
  resize(): void;
  start(): void;
  stop(): void;
  dispose(): void;
  /** Duración del último frame en ms; 0 parada o en reposo. */
  readonly lastFrameMs: number;
}

export type CreateStackScene = (canvas: HTMLCanvasElement, options: StackSceneOptions) => StackScene;
