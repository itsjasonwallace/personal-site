/**
 * Regenerates the brand assets in public/: the Open Graph share image, the
 * favicon monogram, and the raster icon fallbacks.
 *
 * Run manually with `npm run og` and commit the output. This is deliberately
 * not a build step: the assets change about once a year, and adding a native
 * image pipeline to every Vercel build buys nothing.
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import satori from "satori";
import sharp from "sharp";

const root = new URL("../", import.meta.url);
const pub = (name) => fileURLToPath(new URL(`public/${name}`, root));
const dep = (p) => fileURLToPath(new URL(`node_modules/${p}`, root));
const asset = (name) => fileURLToPath(new URL(`assets/${name}`, root));

// Site tokens, mirroring src/styles/globals.css.
const PAPER = "#fbfaf6";
const INK = "#1a1a1a";
const INK_SOFT = "#4a4a4a";
const ACCENT = "#8b2a1f";
const RULE = "#e6e1d1";

// satori reads TTF/OTF/WOFF, not WOFF2, so these are the static @fontsource
// builds rather than the variable Inter the site loads at runtime.
//
// The name is set in Inter Bold rather than the site's Instrument Serif. A
// share image is read at thumbnail size in a feed, where the serif's thin
// strokes break down; the serif stays for the supporting line.
const [interBold, interRegular, serifItalic, mono] = await Promise.all([
  readFile(dep("@fontsource/inter/files/inter-latin-700-normal.woff")),
  readFile(dep("@fontsource/inter/files/inter-latin-400-normal.woff")),
  readFile(
    dep(
      "@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff"
    )
  ),
  readFile(
    dep("@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff")
  ),
]);

const serif = await readFile(
  dep("@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff")
);

const fonts = [
  { name: "Inter", data: interBold, weight: 700, style: "normal" },
  { name: "Inter", data: interRegular, weight: 400, style: "normal" },
  { name: "Instrument Serif", data: serif, weight: 400, style: "normal" },
  { name: "Instrument Serif", data: serifItalic, weight: 400, style: "italic" },
  { name: "IBM Plex Mono", data: mono, weight: 500, style: "normal" },
];

const h = (type, style, ...children) => ({
  type,
  props: { style, children: children.length === 1 ? children[0] : children },
});

// ---------------------------------------------------------------- OG image

// The banner keeps the original dark treatment: bold sans on near-black, which
// survives the thumbnail scale a feed renders it at. The headshot panel was
// recovered from the original composite and lives in assets/, outside public/,
// so it is a build input and never ships to visitors.
const DARK = "#141518";
const HEADSHOT_W = 355;
const HEADSHOT_H = 630;

// The recovered panel carries the original's vignette, which is a shade lighter
// than the flat fill and leaves a visible vertical seam where the two meet.
// Ramping alpha across the left edge dissolves it. The subject starts well
// right of the ramp, so nothing of him is lost.
const FEATHER = 60;
const mask = Buffer.alloc(HEADSHOT_W * HEADSHOT_H * 4);
for (let y = 0; y < HEADSHOT_H; y++) {
  for (let x = 0; x < HEADSHOT_W; x++) {
    const i = (y * HEADSHOT_W + x) * 4;
    mask[i] = mask[i + 1] = mask[i + 2] = 255;
    mask[i + 3] = x >= FEATHER ? 255 : Math.round((x / FEATHER) * 255);
  }
}

const headshotPng = await sharp(asset("og-headshot.png"))
  .ensureAlpha()
  .composite([
    {
      input: mask,
      raw: { width: HEADSHOT_W, height: HEADSHOT_H, channels: 4 },
      blend: "dest-in",
    },
  ])
  .png()
  .toBuffer();
const headshotUri = `data:image/png;base64,${headshotPng.toString("base64")}`;

const ogTree = h(
  "div",
  {
    display: "flex",
    width: 1200,
    height: 630,
    background: DARK,
    color: "#ffffff",
    fontFamily: "Inter",
  },
  h(
    "div",
    {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      flex: 1,
      paddingLeft: 88,
      paddingRight: 40,
    },
    h(
      "div",
      { display: "flex", fontWeight: 700, fontSize: 76, lineHeight: 1.08, letterSpacing: -2.5 },
      "Jason Wallace"
    ),
    h(
      "div",
      { display: "flex", fontWeight: 700, fontSize: 76, lineHeight: 1.08, letterSpacing: -2.5 },
      "Engineering Leader"
    ),
    h(
      "div",
      {
        display: "flex",
        fontWeight: 400,
        fontSize: 28,
        color: "#c8c8cf",
        marginTop: 20,
      },
      "Engineering · Architecture · Leadership · AI"
    )
  ),
  {
    type: "img",
    props: {
      src: headshotUri,
      width: HEADSHOT_W,
      height: 630,
      style: { objectFit: "cover" },
    },
  }
);

const ogSvg = await satori(ogTree, { width: 1200, height: 630, fonts });
// Lossless, but worth the encoder effort: the defaults leave this photo-heavy
// frame around 500KB, where these settings land near 110KB.
await sharp(Buffer.from(ogSvg))
  .png({ compressionLevel: 9, effort: 10 })
  .toFile(pub("og.png"));

// ------------------------------------------------------------------ Icons

// satori converts glyphs to paths, so the monogram needs no font at render time.
// Reversed out of the accent fill: at 16px a light ground leaves too little
// contrast for the mark to read in a browser tab.
const markTree = h(
  "div",
  {
    display: "flex",
    width: 512,
    height: 512,
    alignItems: "center",
    justifyContent: "center",
    background: ACCENT,
    borderRadius: 112,
  },
  h(
    "div",
    {
      fontFamily: "Instrument Serif",
      fontSize: 300,
      letterSpacing: -10,
      color: PAPER,
      lineHeight: 1,
      paddingBottom: 26,
    },
    "JW"
  )
);

const markSvg = await satori(markTree, { width: 512, height: 512, fonts });
await writeFile(pub("favicon.svg"), markSvg, "utf8");

const markPng = sharp(Buffer.from(markSvg));
await markPng.clone().resize(96, 96).png().toFile(pub("favicon-96.png"));
await markPng.clone().resize(180, 180).png().toFile(pub("apple-touch-icon.png"));

console.log("Wrote og.png, favicon.svg, favicon-96.png, apple-touch-icon.png");
