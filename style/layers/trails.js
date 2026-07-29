import { HALO_COLOR } from "../constants.js";

const is_trail = [
  "any",
  // paths and bridleways are trails unless they're explicitly tagged as paved
  [
    "all",
    ["in", ["get", "highway"], ["literal", ["path", "bridleway"]]],
    ["!=", ["get", "surface"], "paved"],
  ],
  // footways and cycleways are trails only if they're tagged as unpaved
  [
    "all",
    ["in", ["get", "highway"], ["literal", ["footway", "cycleway"]]],
    ["==", ["get", "surface"], "unpaved"],
  ],
  // all via ferratas are trails
  ["==", ["get", "highway"], "via_ferrata"],
];

const isRestricted = ["in", ["get", "access"], ["literal", ["private", "no", "discouraged"]]];

const trails_official = {
  "id": "trails_official",
  "type": "line",
  "source": "sourdough",
  "source-layer": "highways",
  "minzoom": 11,
  "filter": ["all", is_trail, ["!=", ["get", "informal"], "yes"]],
  "paint": {
    "line-color": [
      "interpolate",
      ["linear"],
      ["zoom"],
      11,
      "#9a908a",
      14,
      ["case", isRestricted, "#c8b8b2", "#6a605a"],
    ],
    "line-dasharray": ["step", ["zoom"], ["literal", [3, 1]], 13, ["literal", [3, 1]]],
    "line-width": ["interpolate", ["exponential", 1.5], ["zoom"], 12, 1, 20, 6],
  },
};

const trails_informal = {
  "id": "trails_informal",
  "type": "line",
  "source": "sourdough",
  "source-layer": "highways",
  "minzoom": 13,
  "filter": ["all", is_trail, ["==", ["get", "informal"], "yes"]],
  "paint": {
    "line-color": ["case", isRestricted, "#c8b8b2", "#8a807a"],
    "line-dasharray": [1, 3],
    "line-width": ["interpolate", ["exponential", 1.5], ["zoom"], 14, 0.8, 20, 4],
  },
};

const trail_labels = {
  "id": "trail_labels",
  "type": "symbol",
  "source": "sourdough",
  "source-layer": "highways",
  "minzoom": 14,
  "filter": ["all", is_trail, ["any", ["has", "name"], isRestricted]],
  "layout": {
    "symbol-placement": "line",
    "text-field": [
      "case",
      ["==", ["get", "access"], "private"],
      ["case", ["has", "name"], ["concat", ["get", "name"], " (private)"], "(private)"],
      ["in", ["get", "access"], ["literal", ["no", "discouraged"]]],
      ["case", ["has", "name"], ["concat", ["get", "name"], " (no access)"], "(no access)"],
      ["get", "name"],
    ],
    "text-font": ["Noto Sans Regular"],
    "text-size": 12,
    "symbol-spacing": 300,
    "text-max-angle": 30,
  },
  "paint": {
    "text-color": "#6a605a",
    "text-halo-color": HALO_COLOR,
    "text-halo-width": 1.5,
    "text-halo-blur": 1,
  },
};

const oneway_arrows = {
  "id": "oneway_arrows",
  "type": "symbol",
  "source": "sourdough",
  "source-layer": "highways",
  "minzoom": 14,
  "filter": [
    "all",
    is_trail,
    ["==", ["geometry-type"], "LineString"],
    ["in", ["get", "oneway"], ["literal", ["yes", "1", "-1"]]],
  ],
  "layout": {
    "symbol-placement": "line",
    "symbol-spacing": ["interpolate", ["linear"], ["zoom"], 15, 100, 18, 200],
    "icon-image": [
      "case",
      ["in", ["get", "oneway"], ["literal", ["yes", "1"]]],
      ["image", "arrow_right"],
      ["image", "arrow_left"],
    ],
    "icon-size": ["interpolate", ["linear"], ["zoom"], 15, 0.3, 22, 0.7],
    "icon-rotation-alignment": "map",
    "icon-overlap": "always",
    "icon-padding": 2,
  },
  "paint": {
    "icon-color": "#6a605a",
    "icon-halo-color": HALO_COLOR,
    "icon-halo-width": 1.5,
    "icon-halo-blur": 1,
  },
};

export const TRAILS = [trails_official, trails_informal];

export const TRAIL_LABELS = [trail_labels, oneway_arrows];
