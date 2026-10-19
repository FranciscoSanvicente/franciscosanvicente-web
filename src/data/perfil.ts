/* Datos de Francisco en un solo lugar. Los leen las secciones, el JSON-LD y la imagen OG, así un
   cambio (una red nueva, un hito) se hace aquí y aparece en todo el sitio.
   Todo es público: va en el HTML. */

export const perfil = {
  nombre: 'Francisco Sanvicente',
  /** Partes del nombre para `profile:first_name/last_name` y la tarjeta OG (no se parte `nombre`). */
  nombrePila: 'Francisco',
  apellidos: 'Sanvicente',
  rol: 'Ingeniero de software',
  /** Línea del hero, debajo del nombre. */
  lede: 'Ingeniero de software. Construyo apps móviles, web y el backend que las sostiene.',
  /** Bio visible (Trayectoria), en primera persona y con el nombre completo en la primera frase. */
  bio: 'Soy Francisco Sanvicente, ingeniero de software de Puerto Ordaz, Venezuela. Llevo seis años construyendo productos web y móviles: he trabajado como full stack en equipos de producto, encargándome tanto de la interfaz como del backend que la sostiene. En 2026 fundé Sumari, una app de finanzas personales que reúne bolívares, dólares, USDT y euros en un solo total a la tasa del día, hecha para la forma en que la gente en Venezuela maneja de verdad su dinero.',
  /** La misma bio en tercera persona: solo para máquinas (description del JSON-LD y llms.txt), que
      describen a la persona desde fuera. */
  bioLarga:
    'Francisco Sanvicente es un ingeniero de software venezolano, de Puerto Ordaz, con seis años construyendo productos web y móviles. Ha trabajado como full stack en equipos de producto, encargándose tanto de la interfaz como del backend que la sostiene. En 2026 fundó Sumari, una app de finanzas personales que reúne bolívares, dólares, USDT y euros en un solo total a la tasa del día, hecha para la forma en que la gente en Venezuela maneja de verdad su dinero.',
  /** La descripción en tercera persona, para la ficha de la página en el JSON-LD (ProfilePage). */
  descripcionTercera:
    'Francisco Sanvicente es ingeniero de software en Puerto Ordaz, Venezuela, y creador de Sumari. Construye apps móviles, web y backend con React Native y Node.js.',
  /** Meta description y og:description (el texto bajo el enlace en Google y al compartir): primera
      persona, como el resto de la página, con el nombre completo; ≤ 160 caracteres. */
  descripcion:
    'Soy Francisco Sanvicente, ingeniero de software en Puerto Ordaz, Venezuela, y creador de Sumari. Construyo apps móviles, web y backend.',
  /** Otros nombres con los que se le conoce (`alternateName`). Vacío hasta que Francisco lo confirme. */
  alias: [] as string[],
  /** Última revisión del contenido (dateModified del JSON-LD), en ISO 8601 con hora y zona horaria
      de Venezuela (−04:00): Google marca como no válida una fecha sin hora. Actualizar al cambiar textos. */
  actualizado: '2026-10-18T00:00:00-04:00',
  ciudad: 'Puerto Ordaz',
  region: 'Bolívar',
  pais: 'Venezuela',
  paisCodigo: 'VE',
  correo: 'franciscosanvicente1@gmail.com',
  /** Temas del `knowsAbout` del JSON-LD: solo lo que Francisco hace de verdad. */
  temas: ['Desarrollo web', 'Desarrollo de aplicaciones móviles', 'Finanzas personales'],
  /** Foto oficial cuadrada (1200×1200) para el JSON-LD; la misma de los avatares. `pnpm fotos`. */
  foto: '/foto/francisco-sanvicente.jpg',
  /** Retrato vertical 4:5 que se ve junto a la bio: base de /foto/retrato-{480,800}.{avif,webp}. */
  retrato: '/foto/retrato',
} as const;

export const sumari = {
  nombre: 'Sumari',
  url: 'https://sumariapp.com',
  urlVisible: 'sumariapp.com',
  /** Ficha en Google Play (la misma que enlaza la web de Sumari). */
  playStore: 'https://play.google.com/store/apps/details?id=com.sumari.app',
  descripcion:
    'App de finanzas personales que reúne bolívares, dólares, USDT y euros en un solo total a la tasa del día.',
  /** Texto del bloque "Qué construyo", en primera persona. */
  intro:
    'Estoy construyendo Sumari, una app de finanzas personales que reúne bolívares, dólares, USDT y euros en un solo total a la tasa del día. La hago para la forma en que la gente en Venezuela maneja de verdad su dinero.',
  /** Año de fundación (hito 3). */
  fundacion: '2026',
  estado: 'Disponible en Android · App Store, próximamente',
} as const;

export interface Red {
  nombre: string;
  url: string;
}

/* Redes en el orden en que se muestran. Una red sin URL no se pinta en ningún lado (ni en la página
   ni en el `sameAs` del JSON-LD): para añadirla basta con poner su URL aquí. */
const REDES: Red[] = [
  { nombre: 'LinkedIn', url: 'https://www.linkedin.com/in/francisco-sanvicente-147879408/' },
  { nombre: 'GitHub', url: 'https://github.com/FranciscoSanvicente' },
  { nombre: 'X', url: '' },
  { nombre: 'Instagram', url: 'https://www.instagram.com/fsanvicentedev/' },
  { nombre: 'TikTok', url: '' },
  { nombre: 'YouTube', url: '' },
];

export const redes: Red[] = REDES.filter((r) => r.url.trim() !== '');

export interface Hito {
  /** 1 = base de la pila … 4 = placa superior. Coincide con `data-hito` y con la escena 3D. */
  n: 1 | 2 | 3 | 4;
  anio: string;
  /** Como se lee en la página: primera persona. */
  titulo: string;
  /** El mismo hito en tercera persona y sin sujeto, para llms.txt, donde cada frase lleva el nombre
      delante y se entiende sola aunque un asistente la cite fuera de contexto. */
  tercera: string;
  detalle?: string;
}

export const hitos: Hito[] = [
  { n: 1, anio: '2020', titulo: 'Empecé a programar', tercera: 'empezó a programar', detalle: 'Primeras aplicaciones web y proyectos personales.' },
  {
    n: 2,
    anio: '2020–2026',
    titulo: 'Desarrollador full stack',
    tercera: 'trabajó como desarrollador full stack',
    detalle:
      'Seis años en equipos de producto, construyendo aplicaciones web y móviles de punta a punta. Proyectos de clientes y empleadores, bajo confidencialidad.',
  },
  {
    n: 3,
    anio: '2026',
    titulo: 'Fundé Sumari',
    tercera: 'fundó Sumari',
    detalle: 'Finanzas personales para quien maneja su dinero en bolívares, dólares, USDT y euros.',
  },
  { n: 4, anio: '2026', titulo: 'Lancé Sumari en Google Play', tercera: 'lanzó Sumari en Google Play', detalle: 'Disponible en Android; la versión para iPhone, próximamente.' },
];

export interface Grupo {
  grupo: string;
  tecnologias: string[];
}

/* Tecnologías que Francisco domina, por área, en el orden en que se muestran (Móvil va segundo
   porque enlaza con Sumari). Las leen la sección "Con qué construyo" y el `knowsAbout` del JSON-LD.
   Solo lo que él confirmó; sin niveles ni porcentajes. */
export const stack: Grupo[] = [
  { grupo: 'Lenguajes', tecnologias: ['TypeScript', 'JavaScript'] },
  { grupo: 'Móvil', tecnologias: ['React Native', 'Expo'] },
  { grupo: 'Frontend', tecnologias: ['React', 'Next.js', 'Astro'] },
  { grupo: 'Backend', tecnologias: ['Node.js', 'Express', 'NestJS'] },
  { grupo: 'Datos', tecnologias: ['PostgreSQL', 'MongoDB', 'MySQL'] },
  { grupo: 'Nube y despliegue', tecnologias: ['Docker', 'AWS', 'Google Cloud', 'Firebase', 'Supabase'] },
  { grupo: 'Estilos', tecnologias: ['Tailwind CSS', 'Sass'] },
];

export const anioActual = 2026;
