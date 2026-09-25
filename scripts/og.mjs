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

// A light studio ground rather than the earlier near-black: the navy jacket
// vanished into a dark fill at feed thumbnail size. The portrait lives in
// assets/, outside public/, so it is a build input and never ships to visitors.
const OG_W = 1200;
const OG_H = 630;

// Source crop, in the portrait's own pixels. The left edge sits in pure
// backdrop on every row (the jacket starts further right), and the right edge
// clears the ear, so the shoulder exits at the frame edge like a normal crop.
const CROP = { left: 200, top: 0, width: 1180, height: 1615 };
const PANEL_W = Math.round((CROP.width * OG_H) / CROP.height);
const FILL_W = OG_W - PANEL_W;

// The backdrop is a vignette, so no flat fill can meet it without a seam.
// Stretching a thin column of the backdrop sideways continues its exact
// top-to-bottom gradient across the text side instead.
const portrait = sharp(asset("Self_Sept2026.jpg"));
const [panel, fill] = await Promise.all([
  portrait.clone().extract(CROP).resize(PANEL_W, OG_H).toBuffer(),
  portrait
    .clone()
    .extract({ ...CROP, width: 4 })
    .resize(FILL_W, OG_H, { fit: "fill" })
    .toBuffer(),
]);

// The stretched backdrop is mid-gray, too dark behind body-size ink. A paper
// wash lifts the text side and fades out before the photo. The fade follows a
// smoothstep, because a linear ramp's abrupt end reads as a faint vertical
// line where it meets the photo.
const WASH_FROM = FILL_W - 420;
const WASH_MAX = 0.9;
const washStops = [`rgba(251,250,246,${WASH_MAX}) 0px`];
for (let i = 0; i <= 10; i++) {
  const t = i / 10;
  const a = WASH_MAX * (1 - t * t * (3 - 2 * t));
  washStops.push(`rgba(251,250,246,${a.toFixed(3)}) ${Math.round(WASH_FROM + t * 420)}px`);
}

const textTree = h(
  "div",
  {
    display: "flex",
    width: OG_W,
    height: OG_H,
    color: INK,
    fontFamily: "Inter",
    backgroundImage: `linear-gradient(90deg, ${washStops.join(", ")})`,
  },
  h(
    "div",
    {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      width: FILL_W,
      paddingLeft: 80,
    },
    h("div", { display: "flex", width: 56, height: 5, background: ACCENT, marginBottom: 28 }),
    h(
      "div",
      { display: "flex", fontWeight: 700, fontSize: 70, lineHeight: 1.08, letterSpacing: -2.2 },
      "Jason Wallace"
    ),
    h(
      "div",
      { display: "flex", fontWeight: 700, fontSize: 70, lineHeight: 1.08, letterSpacing: -2.2 },
      "Engineering Leader"
    ),
    h(
      "div",
      { display: "flex", fontWeight: 400, fontSize: 27, color: INK_SOFT, marginTop: 22 },
      "Engineering · Architecture · Leadership · AI"
    )
  )
);

const textSvg = await satori(textTree, { width: OG_W, height: OG_H, fonts });
// Lossless, but worth the encoder effort on a photo-heavy frame.
await sharp({
  create: { width: OG_W, height: OG_H, channels: 3, background: PAPER },
})
  .composite([
    { input: fill, left: 0, top: 0 },
    { input: panel, left: FILL_W, top: 0 },
    { input: Buffer.from(textSvg), left: 0, top: 0 },
  ])
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
