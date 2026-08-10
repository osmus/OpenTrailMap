// Validates the basemap style and every QA overlay permutation against the
// MapLibre style specification. Run with `npm test`.

import { validateStyleMin } from "@maplibre/maplibre-gl-style-spec";
import { lensOptionsByMode } from "../js/optionsData.js";
import { generateStyle } from "../js/styleGenerator.js";
import { style } from "../style/style.js";

let failures = 0;

function check(name, styleObj) {
  const errors = validateStyleMin(styleObj);
  for (const error of errors) {
    console.error(`  ${name}: ${error.message}`);
  }
  failures += errors.length;
}

check("base style", style);

let count = 1;
for (const travelMode of Object.keys(lensOptionsByMode)) {
  const lenses = ["", ...lensOptionsByMode[travelMode].flatMap((group) => group.subitems)];
  for (const lens of lenses) {
    check(`${travelMode}/${lens || "general"}`, generateStyle(style, travelMode, lens));
    count++;
  }
}

if (failures) {
  console.error(`\n${failures} style validation error(s) in ${count} styles`);
  process.exit(1);
}

console.log(`${count} styles are valid`);
