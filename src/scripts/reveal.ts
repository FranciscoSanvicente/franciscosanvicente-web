/* Revelado al entrar (docs/design/handoff.md §6). Marca `.is-in` una sola vez cuando el elemento
   entra en pantalla. Con movimiento reducido el CSS ya deja todo visible, así que no se observa. */

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const items = document.querySelectorAll<HTMLElement>('.reveal');

if (reduced || !('IntersectionObserver' in window)) {
  items.forEach((el) => el.classList.add('is-in'));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    },
    { threshold: 0.15 },
  );
  items.forEach((el) => io.observe(el));
}
