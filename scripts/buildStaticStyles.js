import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { generateStyle } from '../js/styleGenerator.js';
import { lensOptionsByMode } from '../js/optionsData.js';

import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const baseStyleJsonString = readFileSync(__dirname + '/../style/basestyle.json');

const outDir = __dirname + '/../dist/styles';

if (!existsSync(outDir)) mkdirSync(outDir);

let total = 0;

for (let mode in lensOptionsByMode) {
  let lenses = lensOptionsByMode[mode].flatMap(function(item) {
    return item.subitems;
  });
  // add item for the "general" lens
  lenses.unshift('');
  for (let i in lenses) {
    let lens = lenses[i];
    let style = generateStyle(baseStyleJsonString, mode, lens);
    let filename = `otm-${mode}`;
    if (lens !== '') filename += `-${lens}`;
    writeFileSync(`${outDir}/${filename}.json`, JSON.stringify(style, null, 2));
    writeFileSync(`${outDir}/${filename}.min.json`, JSON.stringify(style));
    total += 1;
  } 
}

console.log(`Wrote ${total} styles to disk (plus ${total} minified)`);
