/* Escena 3D de la pila a pantalla completa (docs/design/handoff.md, v2 §3). Implementa ./types: el
   cargador manda una pose por frame de scroll; aquí solo se pinta. Las placas: 0 = base, 1 = chevron
   inferior, 2 = medio, 3 = superior; medidas en ./geometry.

   - La cámara ortográfica mira de frente y cubre el canvas con 1 unidad = alto del canvas; la pose
     coloca la pila en pantalla (x, y, h) y la «cámara» de la pose se aplica como rotación del objeto
     (equivalente en ortográfica). Así la luz queda fija respecto a quien mira en todas las poses.
   - Placas y cámara siguen al scroll sin suavizado (lo hace el cargador); la emisión y la tinta sí
     se interpolan por tiempo (400 ms), porque en la pose llegan como escalones.
   - Giro: se acumula con setSpin(r); con r = 0 el ángulo vuelve al 0 más cercano, así una pose es la
     misma a la ida y a la vuelta.
   - Con nada que animar el bucle duerme; cualquier setter lo despierta. `lastFrameMs` vale 0 parada,
     en reposo y hasta el segundo frame tras despertar.
   - `dispose()` pierde el contexto WebGL a propósito: el canvas no sirve para otra escena. */
import { ACESFilmicToneMapping, Group, Mesh, OrthographicCamera, Scene, WebGLRenderer } from 'three';
import { ABIERTA, ALTO_REF, ASIENTOS, ELEVACION, FILA, baseGeometry, centro } from './geometry';
import { chevronGeometry, clamp01, easeInOutCubic, easeOutBack } from './geometry';
import { canto, encender, esTema, grafito as crearGrafito, iluminar } from './look';
import { acercar, lerp, volverACero } from './motion';
import type { CreateStackScene, StackPose, StackQuality, StackScene, StackTheme } from './types';

const LUZ_MS = 400;
const VUELTA_MS = 600;
const GRADO = Math.PI / 180;

export const createStackScene: CreateStackScene = (canvas, { theme: temaInicial, quality: calidadInicial }) => {
  const movil = canvas.clientWidth < 1024;
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: !movil, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.6; // anula el ×1/0.6 que three aplica antes de ACES: ACES tal cual

  const scene = new Scene();
  iluminar(scene);
  const camera = new OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -20, 20);

  const grafito = crearGrafito();
  const cantos = ASIENTOS.map(canto);
  const geoBase = baseGeometry();
  const geoChevron = chevronGeometry();
  const placas = cantos.map((m, k) => new Mesh(k === 0 ? geoBase : geoChevron, [grafito, m]));
  // vista (posición en pantalla, «cámara», escala) → giro (spin) → pila (centrada en su origen).
  const pila = new Group();
  pila.add(...placas);
  const giro = new Group();
  giro.add(pila);
  const vista = new Group();
  vista.rotation.order = 'XYZ';
  vista.add(giro);
  scene.add(vista);

  let tema: StackTheme = esTema(temaInicial) ? temaInicial : 'dark';
  let calidad: StackQuality = calidadInicial;
  let pose: StackPose | null = null;
  const luz = { emit: [0, 0, 0, 0], ink: [0, 0, 0, 0] };
  let velocidad = 0; // rad/s
  let angulo = 0;

  let sucio = true;
  let activa = false;
  let raf = 0;
  let quietos = 0;
  let previo = 0;
  let ultimo = 0;
  let liberada = false;

  function dibujar() {
    const p = pose;
    if (!p) return;
    const aspecto = (canvas.clientWidth || 1) / (canvas.clientHeight || 1);
    camera.left = -aspecto / 2;
    camera.right = aspecto / 2;
    camera.updateProjectionMatrix();

    const sx = clamp01(p.spreadX);
    vista.position.set((p.x - 0.5) * aspecto, 0.5 - p.y, 0);
    vista.rotation.set(-p.rotX * GRADO, -p.rotY * GRADO, 0);
    vista.scale.setScalar(p.h / ALTO_REF);
    giro.rotation.y = angulo;
    pila.position.y = -lerp(centro(p.open), 0.1, sx);
    placas.forEach((placa, k) => {
      const caida = ELEVACION * (1 - easeOutBack(clamp01(p.plates[k]), 1.3));
      const apilada = ASIENTOS[k] + k * ABIERTA * p.open + caida;
      placa.position.set((k - 1.5) * FILA * sx, lerp(apilada, caida, sx), 0);
      encender(cantos[k], easeInOutCubic(luz.emit[k]), tema, easeInOutCubic(luz.ink[k]));
    });
    renderer.render(scene, camera);
    sucio = false;
  }

  function frame(ahora: number) {
    raf = 0;
    if (previo) ultimo = ahora - previo;
    const dt = previo ? Math.min(ahora - previo, 100) : 0;
    previo = ahora;

    const antes = angulo;
    angulo = velocidad !== 0 ? angulo + (velocidad * dt) / 1000 : volverACero(angulo, dt, VUELTA_MS);
    if (angulo !== antes) sucio = true;
    if (pose && acercar(luz.emit, pose.emit, dt, LUZ_MS)) sucio = true;
    if (pose && acercar(luz.ink, pose.ink, dt, LUZ_MS)) sucio = true;

    quietos = sucio ? 0 : quietos + 1;
    if (sucio) dibujar();
    if (quietos < 2) raf = requestAnimationFrame(frame);
    else previo = ultimo = 0; // en reposo no hay frame lento que medir
  }

  function despertar() {
    sucio = true;
    if (activa && !raf) raf = requestAnimationFrame(frame);
  }

  const alVolver = () => {
    if (!document.hidden) previo = 0;
  };
  document.addEventListener('visibilitychange', alVolver);

  const escena: StackScene = {
    setPose(p) {
      // Primera pose: la luz empieza ya donde debe, sin fundido desde apagado.
      if (!pose) {
        luz.emit = [...p.emit];
        luz.ink = [...p.ink];
      }
      pose = p;
      despertar();
    },
    setSpin(r) {
      if (!Number.isFinite(r)) return;
      velocidad = r;
      despertar();
    },
    setTheme(t) {
      if (!esTema(t)) return;
      tema = t;
      despertar();
    },
    setQuality(q) {
      calidad = q;
      escena.resize();
    },
    resize() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (liberada || !w || !h) return;
      const tope = calidad === 'low' ? 1 : movil ? 1.5 : 2;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, tope));
      renderer.setSize(w, h, false);
      dibujar(); // setSize borra el lienzo: se redibuja ya para no dejar un frame vacío
    },
    start() {
      if (liberada || activa) return;
      activa = true;
      previo = 0;
      quietos = 0;
      despertar();
    },
    stop() {
      activa = false;
      cancelAnimationFrame(raf);
      raf = previo = ultimo = 0; // parada no mide: el cargador no debe leer un valor viejo
    },
    dispose() {
      if (liberada) return;
      escena.stop();
      liberada = true;
      document.removeEventListener('visibilitychange', alVolver);
      geoBase.dispose();
      geoChevron.dispose();
      grafito.dispose();
      cantos.forEach((m) => m.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
    },
    get lastFrameMs() {
      return ultimo;
    },
  };
  return escena;
};
