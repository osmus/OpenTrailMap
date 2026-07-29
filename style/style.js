import { BACKGROUND } from "./layers/background.js";
import { BOUNDARIES } from "./layers/boundaries.js";
import { CONTOURS } from "./layers/contours.js";
import { HILLSHADE } from "./layers/hillshade.js";
import { GLACIERS } from "./layers/natural.js";
import { PARKS, PARKS_HIGHLIGHTS, PARKS_LABELS } from "./layers/parks.js";
import { PLACES } from "./layers/places.js";
import { POIS } from "./layers/pois.js";
import { ROAD_LABELS, ROADS } from "./layers/roads.js";
import { SIDEWALKS } from "./layers/sidewalks.js";
import { STRUCTURES } from "./layers/structures.js";
import { TRAIL_LABELS, TRAILS } from "./layers/trails.js";
import { WATER_LABELS, WATERBODIES, WATERWAYS } from "./layers/water.js";

export const SPRITE_PATH = "/sprites/opentrailmap";

// MapLibre rejects relative sprite URLs, so resolve against the current origin at runtime.
export function spriteUrl() {
  return window.location.origin + SPRITE_PATH;
}

// Marks the position in the layer stack where the trails overlay is inserted by styleGenerator.js
export const QA_INSERTION_POINT = "qa_insertion_point";

const qa_insertion_marker_layer = {
  "id": QA_INSERTION_POINT,
  "type": "background",
  "layout": { "visibility": "none" },
  "paint": { "background-opacity": 0 },
};

export const style = {
  "version": 8,
  "sources": {
    "sourdough": {
      "type": "vector",
      "attribution": '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      "url": "https://tiles.openstreetmap.us/vector/sourdough.json",
    },
    "hillshade": {
      "type": "raster",
      "url": "https://tiles.openstreetmap.us/raster/hillshade.json",
    },
    "contours": {
      "type": "vector",
      "url": "https://tiles.openstreetmap.us/vector/contours-feet.json",
    },
  },
  "sprite": SPRITE_PATH,
  "glyphs": "https://tiles.openstreetmap.us/fonts/{fontstack}/{range}.pbf",
  "layers": [
    BACKGROUND,
    ...PARKS,
    ...PARKS_HIGHLIGHTS,
    ...HILLSHADE,
    ...CONTOURS,
    ...WATERWAYS,
    ...WATERBODIES,
    ...GLACIERS,
    ...STRUCTURES,
    ...TRAILS,
    ...ROADS,
    ...SIDEWALKS,
    ...BOUNDARIES,
    qa_insertion_marker_layer,
    ...WATER_LABELS,
    ...ROAD_LABELS,
    ...TRAIL_LABELS,
    ...POIS,
    ...PARKS_LABELS,
    ...PLACES,
  ],
};
