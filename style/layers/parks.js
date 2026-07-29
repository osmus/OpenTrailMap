import { HALO_COLOR, NATURAL_COLOR } from "../constants.js";

const isProtectedArea = [
  "in",
  ["get", "boundary"],
  ["literal", ["national_park", "protected_area"]],
];

const isPark = ["in", ["get", "leisure"], ["literal", ["park", "nature_reserve"]]];

// Feature-state-driven opacity: transparent by default, opaque when highlighted.
const highlightFillColor = [
  "case",
  ["boolean", ["feature-state", "hover"], false],
  "#c8da8c",
  ["boolean", ["feature-state", "selected"], false],
  "#B1D06F",
  "#dfeab8",
];
const highlightFillOpacity = [
  "case",
  [
    "any",
    ["boolean", ["feature-state", "hover"], false],
    ["boolean", ["feature-state", "selected"], false],
  ],
  1,
  0,
];
const highlightOutlineColor = [
  "case",
  ["boolean", ["feature-state", "hover"], false],
  "#82a34e",
  ["boolean", ["feature-state", "selected"], false],
  "#738C40",
  "#a8c075",
];
const highlightOutlineWidth = [
  "case",
  [
    "any",
    ["boolean", ["feature-state", "hover"], false],
    ["boolean", ["feature-state", "selected"], false],
  ],
  2,
  0,
];

// Base layers: plain colors, no highlight awareness
const protected_area_fill = {
  "id": "protected_area_fill",
  "type": "fill",
  "source": "sourdough",
  "source-layer": "boundaries",
  "filter": isProtectedArea,
  "paint": { "fill-color": "#dfeab8" },
};

const protected_area_outline = {
  "id": "protected_area_outline",
  "type": "line",
  "source": "sourdough",
  "source-layer": "boundaries",
  "filter": isProtectedArea,
  "paint": { "line-color": "#a8c075" },
};

const park_fill = {
  "id": "parks_fill",
  "type": "fill",
  "source": "sourdough",
  "source-layer": "leisure",
  "filter": isPark,
  "paint": { "fill-color": "#dfeab8" },
};

const park_outline = {
  "id": "parks_outline",
  "type": "line",
  "source": "sourdough",
  "source-layer": "leisure",
  "filter": isPark,
  "paint": { "line-color": "#a8c075" },
};

// Highlight layers: same geometry, rendered above all base park layers.
// Transparent by default; feature-state drives opacity to show highlights.
const protected_area_highlight_fill = {
  "id": "protected_area_highlight_fill",
  "type": "fill",
  "source": "sourdough",
  "source-layer": "boundaries",
  "filter": isProtectedArea,
  "paint": { "fill-color": highlightFillColor, "fill-opacity": highlightFillOpacity },
};

const protected_area_highlight_outline = {
  "id": "protected_area_highlight_outline",
  "type": "line",
  "source": "sourdough",
  "source-layer": "boundaries",
  "filter": isProtectedArea,
  "paint": { "line-color": highlightOutlineColor, "line-width": highlightOutlineWidth },
};

const park_highlight_fill = {
  "id": "parks_highlight_fill",
  "type": "fill",
  "source": "sourdough",
  "source-layer": "leisure",
  "filter": isPark,
  "paint": { "fill-color": highlightFillColor, "fill-opacity": highlightFillOpacity },
};

const park_highlight_outline = {
  "id": "parks_highlight_outline",
  "type": "line",
  "source": "sourdough",
  "source-layer": "leisure",
  "filter": isPark,
  "paint": { "line-color": highlightOutlineColor, "line-width": highlightOutlineWidth },
};

export const PARKS = [protected_area_fill, park_fill, protected_area_outline, park_outline];
export const PARKS_HIGHLIGHTS = [
  protected_area_highlight_fill,
  park_highlight_fill,
  protected_area_highlight_outline,
  park_highlight_outline,
];

const park_label = {
  "id": "parks_labels",
  "type": "symbol",
  "source": "sourdough",
  "source-layer": "leisure",
  "metadata": { "clickable": true },
  "minzoom": 9,
  "filter": [
    "all",
    ["==", ["geometry-type"], "Point"],
    isPark,
    ["has", "name"],
    [">=", ["zoom"], ["+", ["get", "_reczoom"], -1]], // Requires Sourdough >= v0.4.0
  ],
  "layout": {
    "icon-image": [
      "match",
      ["get", "leisure"],
      "nature_reserve",
      ["image", "nature_reserve_rect"],
      ["image", "park_rect"],
    ],
    "icon-size": ["interpolate", ["linear"], ["zoom"], 8, 0.3, 18, 0.6],
    "text-field": ["get", "name"],
    "text-optional": true,
    "text-size": 11,
    "text-line-height": 1.1,
    "text-font": ["Noto Sans Bold"],
    "text-variable-anchor": ["top", "bottom", "left", "right"],
    "text-padding": 5,
    "text-offset": [
      "interpolate",
      ["linear"],
      ["zoom"],
      12,
      ["literal", [0.9, 0.9]],
      22,
      ["literal", [2, 2]],
    ],
    "text-justify": "auto",
  },
  "paint": {
    "icon-color": NATURAL_COLOR,
    "icon-halo-color": HALO_COLOR,
    "icon-halo-width": 1.75,
    "icon-halo-blur": 1,
    "text-color": NATURAL_COLOR,
    "text-halo-color": HALO_COLOR,
    "text-halo-width": 1.5,
    "text-halo-blur": 0.5,
  },
};

// `wildlife_refuge:for` is a semicolon-delimited list of the species a refuge
// protects, e.g. "bison;deer". coalesce guards against the tag being absent,
// since split would otherwise fail on a null input.
function refugeIsFor(species) {
  return ["in", species, ["split", ["coalesce", ["get", "wildlife_refuge:for"], ""], ";"]];
}

const protected_area_label = {
  "id": "protected_area_labels",
  "type": "symbol",
  "source": "sourdough",
  "source-layer": "boundaries",
  "metadata": { "clickable": true },
  "minzoom": 6,
  "filter": [
    "all",
    ["==", ["geometry-type"], "Point"],
    isProtectedArea,
    ["has", "name"],
    [">=", ["zoom"], ["+", ["get", "_reczoom"], -1]], // Requires Sourdough >= v0.4.0
  ],
  "layout": {
    ...park_label.layout,
    "icon-image": [
      "case",
      ["==", ["get", "protected_area"], "game_land"],
      ["image", "game_land_rect"],
      ["==", ["get", "protected_area"], "forest_reserve"],
      ["image", "forest_reserve_rect"],
      ["==", ["get", "protected_area"], "grassland_reserve"],
      ["image", "grassland_reserve_rect"],
      ["==", ["get", "protected_area"], "watershed_reserve"],
      ["image", "watershed_reserve_rect"],
      ["==", ["get", "protected_area"], "wildlife_refuge"],
      [
        "case",
        refugeIsFor("bird"),
        ["image", "bird_refuge_rect"],
        refugeIsFor("bison"),
        ["image", "bison_refuge_rect"],
        ["image", "wildlife_refuge_rect"],
      ],
      ["==", ["get", "protected_area"], "wilderness_preserve"],
      ["image", "wilderness_preserve_rect"],
      ["==", ["get", "leisure"], "nature_reserve"],
      ["image", "nature_reserve_rect"],
      ["==", ["get", "leisure"], "park"],
      ["image", "park_rect"],
      ["image", "protected_area_rect"],
    ],
  },
  "paint": park_label.paint,
};

export const PARKS_LABELS = [park_label, protected_area_label];
