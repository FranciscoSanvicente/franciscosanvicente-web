/* Datos de Francisco en un solo lugar. Los leen las secciones, el JSON-LD y la imagen OG, así un
   cambio (una red nueva, un hito) se hace aquí y aparece en todo el sitio.
   Todo es público: va en el HTML. */

export const perfil = {
  nombre: 'Francisco Sanvicente',
  /** Partes del nombre para `profile:first_name/last_name` y la tarjeta OG (no se parte `nombre`). */
  nombrePila: 'Francisco',
  apellidos: 'Sanvicente',
  rol: 'Fundador de Sumari',
  /** Línea del hero, debajo del nombre. */
  lede: 'Fundador de Sumari. Construyo finanzas para quien vive en varias monedas.',
  bioCorta:
    'Desarrollador full stack y fundador de Sumari, la app de finanzas personales para quien maneja su dinero en varias monedas. Puerto Ordaz, Venezuela.',
  bioLarga:
    'Francisco Sanvicente es un desarrollador de software venezolano, de Puerto Ordaz, con seis años construyendo productos web y móviles. Ha trabajado como full stack en equipos de producto, encargándose tanto de la interfaz como del backend que la sostiene. En 2026 fundó Sumari, una app de finanzas personales que reúne bolívares, dólares, USDT y euros en un solo total a la tasa del día, hecha para la forma en que la gente en Venezuela maneja de verdad su dinero.',
  ciudad: 'Puerto Ordaz',
  region: 'Bolívar',
  pais: 'Venezuela',
  paisCodigo: 'VE',
  correo: 'franciscosanvicente1@gmail.com',
  /** Temas del `knowsAbout` del JSON-LD: solo lo que Francisco hace de verdad. */
  temas: ['Desarrollo web', 'Desarrollo de aplicaciones móviles', 'Finanzas personales'],
  /** Foto de retrato desde la raíz pública (ej. '/foto.jpg'). Vacía hasta que Francisco la entregue. */
  foto: '',
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
  { nombre: 'Instagram', url: '' },
  { nombre: 'TikTok', url: '' },
  { nombre: 'YouTube', url: '' },
];

export const redes: Red[] = REDES.filter((r) => r.url.trim() !== '');

export interface Hito {
  /** 1 = base de la pila … 4 = placa superior. Coincide con `data-hito` y con la escena 3D. */
  n: 1 | 2 | 3 | 4;
  anio: string;
  titulo: string;
  detalle?: string;
}

export const hitos: Hito[] = [
  { n: 1, anio: '2020', titulo: 'Empieza a programar', detalle: 'Primeras aplicaciones web y proyectos personales.' },
  {
    n: 2,
    anio: '2020–2026',
    titulo: 'Desarrollador full stack',
    detalle:
      'Seis años en equipos de producto, construyendo aplicaciones web y móviles de punta a punta. Proyectos de clientes y empleadores, bajo confidencialidad.',
  },
  {
    n: 3,
    anio: '2026',
    titulo: 'Funda Sumari',
    detalle: 'Finanzas personales para quien maneja su dinero en bolívares, dólares, USDT y euros.',
  },
  { n: 4, anio: '2026', titulo: 'Lanza Sumari en Google Play', detalle: 'Disponible en Android; la versión para iPhone, próximamente.' },
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
