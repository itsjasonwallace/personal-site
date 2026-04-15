import { animate } from "motion";

const prefersReduced = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

// Scroll-reveal via IntersectionObserver.
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

// Pointer-tracking gradient orb.
const orb = document.getElementById("gradient-orb");
if (orb && !prefersReduced) {
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let rafId: number | null = null;

  const onMove = (e: PointerEvent) => {
    const nx = e.clientX / window.innerWidth - 0.5;
    const ny = e.clientY / window.innerHeight - 0.5;
    targetX = nx * 80;
    targetY = ny * 80;
    if (rafId === null) rafId = requestAnimationFrame(tick);
  };

  const tick = () => {
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;
    orb.style.transform = `translate3d(${currentX.toFixed(
      2
    )}px, ${currentY.toFixed(2)}px, 0)`;
    if (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
    }
  };

  window.addEventListener("pointermove", onMove, { passive: true });

  // Subtle idle breathing.
  animate(
    orb,
    { opacity: [0.45, 0.65, 0.45] },
    { duration: 8, repeat: Infinity, easing: "ease-in-out" }
  );
}
