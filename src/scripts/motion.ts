const revealEls = document.querySelectorAll<HTMLElement>("[data-reveal]");
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
