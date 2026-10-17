/* Escena 3D de la pila (docs/design/handoff.md §5). Implementa el contrato de ./types: el cargador
   decide CUÁNDO y CUÁNTO; aquí solo se pinta. Los setters guardan objetivos y marcan la escena como
   sucia; el bucle de rAF los aplica y solo dibuja cuando algo cambió (o mientras gira).
   Placa 1 = base, 2 = chevron inferior, 3 = medio, 4 = superior; medidas en ./geometry.

   Lo que el contrato deja abierto, decidido así:
   - `setPlate(i, t)` y `setFront(t)` esperan t CRUDO (0…1); el easing (easeOutBack 1.3 en Y,
     easeInOutCubic en cámara) se aplica aquí. Las placas empiezan asentadas (t = 1).
   - De frente, el giro acumulado de la pila vuelve a 0 a la vez que la cámara (por el camino corto),
     para que el logo quede derecho aunque el hero la haya dejado en cualquier ángulo.
   - El encuadre cabe la pila abierta; una placa elevada (t = 0) con la pila abierta puede quedar por
     encima del borde: entra cayendo desde fuera. Con la pila cerrada (open = 0) cabe entera.
   - Con nada que animar el bucle duerme (sin rAF); cualquier setter lo despierta.
   - `lastFrameMs` = intervalo entre dos rAF seguidos con el bucle despierto (incluye lo que tarde la
     GPU). Vale 0 parada (stop), en reposo y hasta el segundo frame tras despertar; no se mide al
     volver de una pestaña oculta. El cargador corta si > 50 ms se sostiene: nada de valores viejos.
   - `dispose()` pierde el contexto WebGL a propósito: el canvas no sirve para otra escena. */
import { ACESFilmicToneMapping, Group, Mesh, Object3D, OrthographicCamera, Scene, WebGLRenderer } from 'three';
import { ABIERTA, ASIENTOS, ELEVACION, ISO_X, ISO_Y, VISTA, baseGeometry, centro } from './geometry';
import { chevronGeometry, clamp01, easeInOutCubic, easeOutBack } from './geometry';
import { canto, encender, esTema, grafito as crearGrafito, iluminar } from './look';
import type { CreateStackScene, StackScene, StackTheme } from './types';

const EMISION_MS = 400;

export const createStackScene: CreateStackScene = (canvas, { theme: temaInicial }) => {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.6; // anula el ×1/0.6 que three aplica antes de ACES: ACES tal cual

  const scene = new Scene();
  iluminar(scene);

  // La cámara cuelga de un pivote en el centro de la pila. Orden YXZ = guiñada global sobre picado
  // local: rotation.x/rotation.y del pivote son los ángulos isométricos tal cual.
  const camera = new OrthographicCamera(-VISTA, VISTA, VISTA, -VISTA, 0.1, 40);
  camera.position.set(0, 0, 10);
  const pivote = new Object3D();
  pivote.rotation.order = 'YXZ';
  pivote.add(camera);
  scene.add(pivote);

  const grafito = crearGrafito();
  const cantos = ASIENTOS.map(canto);
  const geoBase = baseGeometry();
  const geoChevron = chevronGeometry();
  const placas = cantos.map((canto, k) => new Mesh(k === 0 ? geoBase : geoChevron, [grafito, canto]));
  const pila = new Group();
  pila.add(...placas);
  scene.add(pila);

  // Objetivos que fijan los setters; la emisión es lo único que se interpola por tiempo.
  let tema: StackTheme = esTema(temaInicial) ? temaInicial : 'dark';
  let abierta = 0;
  let frente = 0;
  let giro = 0; // rad/s
  let angulo = 0; // acumulado; solo se reduce a [−π, π] en isométrica pura, donde no se nota
  const progreso = [1, 1, 1, 1];
  const emisionObjetivo = [0, 0, 0, 1];
  const emision = [0, 0, 0, 1];

  let sucio = true;
  let activa = false; // entre start() y stop(); el bucle duerme si no hay nada que pintar
  let raf = 0;
  let quietos = 0;
  let previo = 0;
  let ultimo = 0;
  let liberada = false;

  function dibujar() {
    const f = easeInOutCubic(frente);
    pivote.rotation.set(ISO_X * (1 - f), ISO_Y * (1 - f), 0);
    if (frente === 0) angulo -= 2 * Math.PI * Math.round(angulo / (2 * Math.PI));
    pila.rotation.y = angulo * (1 - f); // de frente vuelve a 0 sin saltos aunque siga girando
    pila.position.y = -centro(abierta);
    placas.forEach((placa, k) => {
      placa.position.y = ASIENTOS[k] + k * ABIERTA * abierta + ELEVACION * (1 - easeOutBack(progreso[k], 1.3));
      encender(cantos[k], easeInOutCubic(emision[k]), tema);
    });
    renderer.render(scene, camera);
    sucio = false;
  }

  function frame(ahora: number) {
    raf = 0;
    if (previo) ultimo = ahora - previo;
    const dt = previo ? Math.min(ahora - previo, 100) : 0;
    previo = ahora;

    if (giro !== 0) {
      angulo += (giro * dt) / 1000;
      sucio = true;
    }
    for (let k = 0; k < 4; k++) {
      const d = emisionObjetivo[k] - emision[k];
      if (d === 0) continue;
      const paso = dt / EMISION_MS;
      emision[k] = Math.abs(d) <= paso ? emisionObjetivo[k] : emision[k] + Math.sign(d) * paso;
      sucio = true;
    }
    quietos = sucio ? 0 : quietos + 1;
    if (sucio) dibujar();
    // Tras dos frames sin cambios el bucle duerme; los setters lo despiertan.
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

  /** Guarda un valor finito y despierta el bucle. */
  const fijar = (v: number, guardar: (n: number) => void) => {
    if (!Number.isFinite(v)) return;
    guardar(v);
    despertar();
  };

  const escena: StackScene = {
    setOpen: (t) => fijar(t, (n) => (abierta = clamp01(n))),
    setPlate: (i, t) => {
      if (i >= 1 && i <= 4) fijar(t, (n) => (progreso[i - 1] = clamp01(n)));
    },
    setFront: (t) => fijar(t, (n) => (frente = clamp01(n))),
    setSpin: (r) => fijar(r, (n) => (giro = n)),
    setEmissive(todas) {
      for (let k = 0; k < 3; k++) emisionObjetivo[k] = todas ? 1 : 0;
      despertar();
    },
    setTheme(t) {
      if (!esTema(t)) return;
      tema = t;
      despertar();
    },
    resize() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (liberada || !w || !h) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      // El lado corto manda: la pila cabe entera en cualquier proporción.
      const a = w / h;
      const vx = a >= 1 ? VISTA * a : VISTA;
      const vy = a >= 1 ? VISTA : VISTA / a;
      camera.left = -vx;
      camera.right = vx;
      camera.top = vy;
      camera.bottom = -vy;
      camera.updateProjectionMatrix();
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
      renderer.forceContextLoss(); // suelta el contexto WebGL ya; el canvas no se reutiliza
    },
    get lastFrameMs() {
      return ultimo;
    },
  };

  escena.resize();
  return escena;
};
