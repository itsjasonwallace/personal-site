// Elements marked data-reveal="load" animate from CSS on page load and must
// not be observed, or they would be held hidden until they scroll into view.
const revealEls = document.querySelectorAll<HTMLElement>(
  '[data-reveal]:not([data-reveal="load"])'
);
if (revealEls.length && "IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        const delay = Number(el.dataset.revealDelay ?? 0);
        window.setTimeout(() => {
          el.dataset.revealed = "true";
        }, delay);
        io.unobserve(el);
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  revealEls.forEach((el) => io.observe(el));
}
