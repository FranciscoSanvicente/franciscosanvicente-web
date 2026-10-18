/* Medidas del documento que necesita la coreografía de la pila (./stack-pose), en coordenadas del
   documento. Se toman una vez y se cachean: el cargador las invalida con un ResizeObserver, así
   ningún frame de scroll llama a getBoundingClientRect. */
import type { Caja, Medidas } from './stack-pose';
import type { Clave } from './waypoints';

const caja = (el: Element): Caja => {
  const r = el.getBoundingClientRect();
  return { top: r.top + scrollY, height: r.height };
};

export function medir(): Medidas {
  const secciones = [...document.querySelectorAll<HTMLElement>('main [data-clave]')].map((el) => ({
    clave: el.dataset.clave as Clave,
    ...caja(el),
  }));
  // Ventana del hero: desde su borde superior hasta donde empieza el nombre, que es lo que hay
  // que proteger (su posición depende del alto del teléfono y del contenido).
  const hero = document.querySelector('[data-clave="inicio"]');
  const nombre = document.getElementById('nombre');
  const ventanas = [...document.querySelectorAll('.escena')].map(caja);
  if (hero && nombre) {
    const c = caja(hero);
    ventanas.unshift({ top: c.top, height: Math.max(0, caja(nombre).top - c.top - 16) });
  }
  return {
    secciones,
    hitos: [...document.querySelectorAll('#trayectoria [data-hito]')].map(caja),
    servicios: [...document.querySelectorAll('#servicios .servicio')].map(caja),
    ventanas,
  };
}
