/* Datos estructurados de la home: ProfilePage (la página) → Person (Francisco) → Organization
   (Sumari), más el WebSite. Todo sale de perfil.ts, igual que el HTML y llms.txt.

   - ProfilePage es el tipo que Google recomienda para páginas de perfil de una persona.
   - El @id de Sumari es el MISMO que publica sumariapp.com (`/#organization`): así los buscadores
     unen las dos webs en una sola entidad, con Francisco como fundador.
   - La foto (`image`) entra sola cuando `perfil.foto` tenga una ruta; la tarjeta OG no es un
     retrato y no se usa como foto de la persona. */
import { perfil, redes, stack, sumari } from './perfil';

interface Pagina {
  site: URL;
  canonical: string;
  title: string;
  description: string;
  imagen: string;
}

export function grafoPerfil({ site, canonical, title, description, imagen }: Pagina) {
  const personaId = `${site.href}#persona`;
  const webId = `${site.href}#web`;
  const sumariId = `${new URL(sumari.url).origin}/#organization`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': `${canonical}#pagina`,
        url: canonical,
        name: title,
        description,
        inLanguage: 'es',
        isPartOf: { '@id': webId },
        mainEntity: { '@id': personaId },
        primaryImageOfPage: { '@type': 'ImageObject', url: imagen, width: 1200, height: 630 },
        dateModified: perfil.actualizado,
      },
      {
        '@type': 'Person',
        '@id': personaId,
        name: perfil.nombre,
        givenName: perfil.nombrePila,
        familyName: perfil.apellidos,
        ...(perfil.alias.length ? { alternateName: [...perfil.alias] } : {}),
        url: site.href,
        ...(perfil.foto ? { image: new URL(perfil.foto, site).href } : {}),
        jobTitle: perfil.rol,
        description: perfil.bioLarga,
        email: `mailto:${perfil.correo}`,
        nationality: { '@type': 'Country', name: perfil.pais },
        homeLocation: {
          '@type': 'Place',
          name: `${perfil.ciudad}, ${perfil.pais}`,
          address: {
            '@type': 'PostalAddress',
            addressLocality: perfil.ciudad,
            addressRegion: perfil.region,
            addressCountry: perfil.paisCodigo,
          },
        },
        worksFor: { '@id': sumariId },
        knowsAbout: [...perfil.temas, ...stack.flatMap((g) => g.tecnologias)],
        sameAs: redes.map((r) => r.url),
      },
      {
        '@type': 'Organization',
        '@id': sumariId,
        name: sumari.nombre,
        url: sumari.url,
        description: sumari.descripcion,
        founder: { '@id': personaId },
        foundingDate: sumari.fundacion,
        sameAs: [sumari.playStore],
      },
      {
        '@type': 'WebSite',
        '@id': webId,
        url: site.href,
        name: perfil.nombre,
        inLanguage: 'es',
        publisher: { '@id': personaId },
        about: { '@id': personaId },
      },
    ],
  };
}
