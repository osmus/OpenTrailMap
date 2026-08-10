import { WATER_FILL_COLOR, WATER_LABEL_COLOR, WATER_LINE_COLOR } from "../constants.js";

const streams = {
  "id": "water_stream",
  "type": "line",
  "source": "sourdough",
  "source-layer": "waterways",
  "minzoom": 12,
  "filter": ["all", ["==", ["geometry-type"], "LineString"], ["==", ["get", "waterway"], "stream"]],
  "paint": {
    "line-color": WATER_LINE_COLOR,
    "line-width": ["interpolate", ["exponential", 1.5], ["zoom"], 12, 0, 12.5, 1, 18, 5],
  },
};

const canals = {
  "id": "water_canal",
  "type": "line",
  "source": "sourdough",
  "source-layer": "waterways",
  "minzoom": 10,
  "filter": ["all", ["==", ["geometry-type"], "LineString"], ["==", ["get", "waterway"], "canal"]],
  "paint": {
    "line-color": WATER_LINE_COLOR,
    "line-width": ["interpolate", ["exponential", 1.5], ["zoom"], 10, 0, 10.5, 1, 18, 14],
  },
};

const rivers = {
  "id": "water_river",
  "type": "line",
  "source": "sourdough",
  "source-layer": "waterways",
  "minzoom": 8,
  "filter": ["all", ["==", ["geometry-type"], "LineString"], ["==", ["get", "waterway"], "river"]],
  "paint": {
    "line-color": WATER_LINE_COLOR,
    "line-width": ["interpolate", ["exponential", 1.5], ["zoom"], 8, 0, 8.5, 1, 18, 20],
  },
};

const waterway_labels = {
  "id": "waterway_labels",
  "type": "symbol",
  "source": "sourdough",
  "source-layer": "waterways",
  "minzoom": 12,
  "filter": [
    "all",
    ["==", ["geometry-type"], "LineString"],
    ["in", ["get", "waterway"], ["literal", ["river", "stream", "canal"]]],
    ["has", "name"],
  ],
  "layout": {
    "symbol-placement": "line",
    "text-field": ["get", "name"],
    "text-font": ["Noto Sans Regular"],
    "text-size": ["match", ["get", "waterway"], "river", 14, 11],
    "symbol-spacing": 400,
    "text-max-angle": 30,
  },
  "paint": {
    "text-color": WATER_LABEL_COLOR,
    "text-halo-color": WATER_FILL_COLOR,
    "text-halo-width": 1.5,
    "text-halo-blur": 1,
  },
};

export const WATERWAYS = [streams, canals, rivers];

const water = {
  "id": "water",
  "type": "fill",
  "source": "sourdough",
  "source-layer": "water",
  "filter": ["==", ["geometry-type"], "Polygon"],
  "paint": { "fill-color": WATER_FILL_COLOR },
};

const water_outline = {
  "id": "water_outline",
  "type": "line",
  "source": "sourdough",
  "source-layer": "water",
  "filter": ["==", ["geometry-type"], "Polygon"],
  "paint": {
    "line-color": WATER_LINE_COLOR,
    "line-width": 0.75,
  },
};

const water_labels = {
  "id": "water_labels",
  "type": "symbol",
  "source": "sourdough",
  "source-layer": "water",
  "minzoom": 10,
  "filter": [
    "all",
    ["==", ["geometry-type"], "Point"],
    ["has", "name"],
    [">=", ["zoom"], ["get", "_reczoom"]], // Requires Sourdough >= v0.4.0
  ],
  "layout": {
    "text-field": ["get", "name"],
    "text-font": ["Noto Sans Regular"],
    "text-size": 14,
    "text-max-width": 8,
    "text-padding": 5,
  },
  "paint": {
    "text-color": WATER_LABEL_COLOR,
    "text-halo-color": WATER_FILL_COLOR,
    "text-halo-width": 1.5,
    "text-halo-blur": 1,
  },
};

export const WATERBODIES = [water, water_outline];

export const WATER_LABELS = [waterway_labels, water_labels];
