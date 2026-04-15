type Pref = "system" | "light" | "dark";

const root = document.documentElement;
const media = window.matchMedia("(prefers-color-scheme: dark)");

function read(): Pref {
  const v = localStorage.getItem("theme");
  return v === "light" || v === "dark" || v === "system" ? v : "system";
}

function apply(pref: Pref) {
  const effective = pref === "system" ? (media.matches ? "dark" : "light") : pref;
  root.classList.toggle("dark", effective === "dark");
  root.dataset.themePref = pref;
  root.dataset.theme = effective;
  document
    .querySelectorAll<HTMLElement>("[data-theme-toggle]")
    .forEach((el) => {
      el.dataset.pref = pref;
      el.setAttribute(
        "aria-label",
        `Theme: ${pref}. Click to change.`
      );
    });
}

function cycle(p: Pref): Pref {
  return p === "system" ? "light" : p === "light" ? "dark" : "system";
}

// Re-apply when system preference changes (only relevant if pref is "system").
media.addEventListener("change", () => {
  if (read() === "system") apply("system");
});

// Wire up any theme toggle buttons.
document.querySelectorAll<HTMLElement>("[data-theme-toggle]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const next = cycle(read());
    localStorage.setItem("theme", next);
    apply(next);
  });
});

// Initial sync (pre-paint script already set classes; this ensures toggle labels).
apply(read());
