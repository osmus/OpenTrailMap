import { writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SPRITE_PATH, style } from "../style/style.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// For the standalone published style, the sprite URL must be absolute.
const output = { ...style, sprite: `https://opentrailmap.us${SPRITE_PATH}` };

writeFileSync(`${__dirname}/../dist/style.json`, JSON.stringify(output, null, 2));
