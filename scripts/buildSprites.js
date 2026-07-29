// Builds the OpenTrailMap SDF sprite sheets from style/sprites/icons/.
//
// For each 15x15 icon it emits three composite variants on a 40x40 canvas:
//   <name>          plain icon, translated (5,5) then scaled 2x
//   <name>_rect     roundrect background with the icon cut out via an SVG mask
//   <name>_circle   circle background with the icon cut out via an SVG mask
//
// The cutout uses a luminance mask (white canvas + black icon) rather than
// boolean path exclusion. resvg (which spreet uses to rasterize) supports
// masks, and the SDF is computed from the alpha channel, so masking the icon
// out of the background shape is equivalent to excluding its path.
//
// It also emits legacy-named aliases still referenced by the style
// (oneway-arrow-right/left and a composed oneway-arrows-leftright) and the
// standalone "circle" marker, then runs spreet to produce 1x and 2x sheets.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const spritesDir = path.join(rootDir, "style", "sprites");
const iconsDir = path.join(spritesDir, "icons");
const outDir = path.join(rootDir, "public", "sprites");

// Extract the child markup of an SVG (everything between the root <svg> tags).
function svgInner(file) {
  const text = fs.readFileSync(file, "utf8");
  const match = text.match(/<svg\b[^>]*>([\s\S]*)<\/svg>/i);
  if (!match) throw new Error(`No <svg> element found in ${file}`);
  return match[1].trim();
}

const roundrectInner = svgInner(path.join(spritesDir, "roundrect.svg"));
const circleInner = svgInner(path.join(spritesDir, "circle.svg"));

// The icon is scaled 2x and offset to center it within the 40x40 canvas.
const ICON_TRANSFORM = "translate(5,5) scale(2)";

function plainVariant(iconInner) {
  return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <g transform="${ICON_TRANSFORM}">
    ${iconInner}
  </g>
</svg>
`;
}

// Background shape with the icon masked out. The mask is white (keep) with the
// icon painted black (cut). Icons carry no explicit fill, so fill="black" on
// the wrapper forces the correct luminance for the cutout.
function maskedVariant(bgInner, iconInner) {
  return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <mask id="cut">
    <rect width="40" height="40" fill="white"/>
    <g transform="${ICON_TRANSFORM}" fill="black">
      ${iconInner}
    </g>
  </mask>
  <g mask="url(#cut)">
    ${bgInner}
  </g>
</svg>
`;
}

const buildDir = fs.mkdtempSync(path.join(os.tmpdir(), "otm-sprites-"));

try {
  const icons = fs.readdirSync(iconsDir).filter((f) => f.endsWith(".svg"));
  const iconInner = {};
  for (const file of icons) {
    const name = path.basename(file, ".svg");
    const inner = svgInner(path.join(iconsDir, file));
    iconInner[name] = inner;
    fs.writeFileSync(path.join(buildDir, `${name}.svg`), plainVariant(inner));
    fs.writeFileSync(path.join(buildDir, `${name}_rect.svg`), maskedVariant(roundrectInner, inner));
    fs.writeFileSync(path.join(buildDir, `${name}_circle.svg`), maskedVariant(circleInner, inner));
  }

  // Standalone filled circle used as a fallback POI marker.
  fs.copyFileSync(path.join(spritesDir, "circle.svg"), path.join(buildDir, "circle.svg"));

  // Legacy aliases still referenced by js/styleGenerator.js.
  fs.writeFileSync(
    path.join(buildDir, "oneway-arrow-right.svg"),
    plainVariant(iconInner.arrow_right),
  );
  fs.writeFileSync(
    path.join(buildDir, "oneway-arrow-left.svg"),
    plainVariant(iconInner.arrow_left),
  );
  // HACK: build a bidirectional arrow icon by combining the two direction arrows
  fs.writeFileSync(
    path.join(buildDir, "oneway-arrows-leftright.svg"),
    plainVariant(`${iconInner.arrow_left}\n    ${iconInner.arrow_right}`),
  );

  fs.mkdirSync(outDir, { recursive: true });

  const flags = ["--unique", "--sdf", "--minify-index-file"];
  execFileSync("spreet", [...flags, buildDir, path.join(outDir, "opentrailmap")], {
    stdio: "inherit",
  });
  execFileSync("spreet", [...flags, "--retina", buildDir, path.join(outDir, "opentrailmap@2x")], {
    stdio: "inherit",
  });

  verify();
} finally {
  fs.rmSync(buildDir, { recursive: true, force: true });
}

// Assert that every sprite name referenced by the style exists in the sheet.
function verify() {
  const sheet = JSON.parse(fs.readFileSync(path.join(outDir, "opentrailmap.json"), "utf8"));
  const jsIn = (dir) =>
    fs
      .readdirSync(path.join(rootDir, dir))
      .filter((f) => f.endsWith(".js"))
      .map((f) => path.join(rootDir, dir, f));
  const styleFiles = [...jsIn("js"), ...jsIn(path.join("style", "layers"))];

  const referenced = new Set();
  const patterns = [/\["image",\s*"([^"]+)"\]/g, /"icon-image":\s*"([^"]+)"/g];
  for (const file of styleFiles) {
    const text = fs.readFileSync(file, "utf8");
    for (const re of patterns) {
      for (const m of text.matchAll(re)) referenced.add(m[1]);
    }
  }

  const missing = [...referenced].filter((name) => !(name in sheet)).sort();
  if (missing.length) {
    console.error(`\n${missing.length} referenced sprite(s) missing from the sheet:`);
    for (const name of missing) console.error(`  ${name}`);
    process.exit(1);
  }
  console.log(`\nAll ${referenced.size} referenced sprites are present.`);
}
