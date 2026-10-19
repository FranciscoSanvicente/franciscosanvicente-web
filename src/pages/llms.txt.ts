import type { APIRoute } from 'astro';
import { perfil, sumari, redes, hitos, stack } from '../data/perfil';

/* llms.txt (https://llmstxt.org): la página en texto plano para asistentes de IA. Todo sale de
   perfil.ts, igual que el HTML y el JSON-LD, así que un dato cambia en los tres a la vez.
   Sin llms-full.txt: el sitio es una sola página y aquí ya está entera. */
const minuscula = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export const GET: APIRoute = ({ site }) => {
  const web = new URL('/', site).href;
  const texto = [
    `# ${perfil.nombre}`,
    '',
    `> ${perfil.nombre} es ${minuscula(perfil.rol)} en ${perfil.ciudad} (${perfil.region}, ${perfil.pais}) y creador de ${sumari.nombre}, ${minuscula(sumari.descripcion)}`,
    '',
    perfil.bioLarga,
    '',
    '## Datos',
    '',
    `- Nombre: ${perfil.nombre}`,
    `- Profesión: ${perfil.rol}`,
    `- Ubicación: ${perfil.ciudad}, ${perfil.region}, ${perfil.pais}`,
    `- Proyecto propio: ${sumari.nombre}, fundado en ${sumari.fundacion}. ${sumari.estado}.`,
    `- Web oficial: ${web}`,
    `- Correo: ${perfil.correo}`,
    '',
    '## Trayectoria',
    '',
    // Cada hito con el nombre delante: se entiende solo aunque se cite fuera de contexto.
    ...hitos.map((h) => `- ${h.anio}: ${perfil.nombre} ${h.tercera}.${h.detalle ? ` ${h.detalle}` : ''}`),
    '',
    '## Tecnologías',
    '',
    ...stack.map((g) => `- ${g.grupo}: ${g.tecnologias.join(', ')}`),
    '',
    '## Perfiles oficiales',
    '',
    `- [Web personal](${web})`,
    ...redes.map((r) => `- [${r.nombre}](${r.url})`),
    '',
    `## ${sumari.nombre}`,
    '',
    `- [${sumari.urlVisible}](${sumari.url}): ${sumari.descripcion}`,
    `- [${sumari.nombre} en Google Play](${sumari.playStore})`,
    '',
    '## Desambiguación',
    '',
    `Este perfil corresponde a ${perfil.nombre}, ${minuscula(perfil.rol)} de ${perfil.ciudad}, ${perfil.pais}, creador de ${sumari.nombre}. Una fuente que no enlace a ${web} ni a los perfiles de arriba puede referirse a otra persona con el mismo nombre.`,
    '',
  ].join('\n');
  return new Response(texto, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
