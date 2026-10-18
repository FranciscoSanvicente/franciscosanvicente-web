import type { APIRoute } from 'astro';

/* Perfil público de una persona que quiere ser encontrada y citada: se permite todo a buscadores y
   a asistentes de IA. Los bots de IA se nombran aunque `*` ya los cubra, para dejar la intención por
   escrito. OJO: un bot con grupo propio IGNORA el grupo `*`; cualquier regla nueva va en los dos.
   /og-card NO se bloquea aquí: bloqueada, Google no leería su noindex (meta + X-Robots-Tag en
   public/_headers). Content-Signal es la convención de Cloudflare (search / ai-input / ai-train).
   Se genera en el build para que la línea Sitemap use la URL canónica. El Content-Type real lo
   fija public/_headers: en un build estático, las cabeceras de este Response no llegan a Cloudflare. */
const BOTS_IA = [
  // OpenAI: entrenamiento, índice de ChatGPT search y visitas pedidas por un usuario.
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  // Google: AI Overviews usa Googlebot (cubierto por `*`); Google-Extended es el permiso para Gemini.
  'Google-Extended',
  // Anthropic.
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  // Perplexity.
  'PerplexityBot',
  'Perplexity-User',
  // Apple (Applebot-Extended: Apple Intelligence), Common Crawl, Meta, Amazon, DuckDuckGo, Mistral.
  'Applebot',
  'Applebot-Extended',
  'CCBot',
  'meta-externalagent',
  'Amazonbot',
  'DuckAssistBot',
  'MistralAI-User',
];

const REGLAS = ['Content-Signal: search=yes, ai-input=yes, ai-train=yes', 'Allow: /'];

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('sitemap-index.xml', site).href;
  const cuerpo = [
    'User-agent: *',
    ...REGLAS,
    '',
    ...BOTS_IA.map((bot) => `User-agent: ${bot}`),
    ...REGLAS,
    '',
    `Sitemap: ${sitemap}`,
    '',
  ].join('\n');
  return new Response(cuerpo, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
