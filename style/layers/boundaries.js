import { HALO_COLOR } from "../constants.js";

const boundaries_admin_2 = {
  "id": "boundaries_admin_2",
  "type": "line",
  "source": "sourdough",
  "source-layer": "boundaries",
  "filter": [
    "all",
    ["==", ["geometry-type"], "LineString"],
    ["==", ["get", "boundary"], "administrative"],
    ["==", ["get", "admin_level"], 2],
    ["!=", ["get", "maritime"], "yes"],
  ],
  "paint": {
    "line-color": "rgba(0, 0, 0, 0.2)",
    "line-width": 0.75,
  },
};

const boundaries_admin_2_maritime = {
  "id": "boundaries_admin_2_maritime",
  "type": "line",
  "source": "sourdough",
  "source-layer": "boundaries",
  "minzoom": 6,
  "filter": [
    "all",
    ["==", ["geometry-type"], "LineString"],
    ["==", ["get", "boundary"], "administrative"],
    ["==", ["get", "admin_level"], 2],
    ["==", ["get", "maritime"], "yes"],
  ],
  "paint": {
    "line-color": "rgba(122, 153, 174, 0.4)",
    "line-dasharray": [10, 10],
    "line-width": 0.75,
  },
};

const boundaries_admin_4 = {
  "id": "boundaries_admin_4",
  "type": "line",
  "source": "sourdough",
  "source-layer": "boundaries",
  "filter": [
    "all",
    ["==", ["geometry-type"], "LineString"],
    ["==", ["get", "boundary"], "administrative"],
    ["==", ["get", "admin_level"], 4],
    ["!=", ["get", "maritime"], "yes"],
  ],
  "paint": {
    "line-color": "rgba(0, 0, 0, 0.3)",
    "line-width": 0.5,
  },
};

const boundaries_admin_6 = {
  "id": "boundaries_admin_6",
  "type": "line",
  "source": "sourdough",
  "source-layer": "boundaries",
  "filter": [
    "all",
    ["==", ["geometry-type"], "LineString"],
    ["==", ["get", "boundary"], "administrative"],
    ["==", ["get", "admin_level"], 6],
  ],
  "paint": {
    "line-color": "rgba(0, 0, 0, 0.3)",
    "line-width": 0.5,
    "line-dasharray": [6, 6],
  },
};

const boundaries_aboriginal_lands = {
  "id": "boundaries_aboriginal_lands",
  "type": "fill",
  "source": "sourdough",
  "source-layer": "boundaries",
  "filter": ["==", ["get", "boundary"], "aboriginal_lands"],
  "paint": {
    "fill-color": "rgba(238, 200, 250, 0.2)",
  },
};

const boundaries_aboriginal_lands_outline = {
  "id": "boundaries_aboriginal_lands_outline",
  "type": "line",
  "source": "sourdough",
  "source-layer": "boundaries",
  "filter": ["==", ["get", "boundary"], "aboriginal_lands"],
  "paint": {
    "line-color": "rgba(225, 200, 240, 1.0)",
  },
};

const boundaries_aboriginal_lands_label = {
  "id": "boundaries_aboriginal_lands_label",
  "type": "symbol",
  "source": "sourdough",
  "source-layer": "boundaries",
  "minzoom": 6,
  "filter": [
    "all",
    ["==", ["geometry-type"], "Point"],
    ["==", ["get", "boundary"], "aboriginal_lands"],
  ],
  "layout": {
    "text-field": ["get", "name"],
    "text-optional": true,
    "text-size": 11,
    "text-line-height": 1.1,
    "text-font": ["Noto Sans Bold"],
    "text-padding": 5,
    "text-justify": "auto",
  },
  "paint": {
    "text-color": "#703791",
    "text-halo-color": HALO_COLOR,
    "text-halo-width": 1,
    "text-halo-blur": 1,
  },
};

export const BOUNDARIES = [
  boundaries_admin_6,
  boundaries_admin_4,
  boundaries_admin_2,
  boundaries_admin_2_maritime,
  boundaries_aboriginal_lands,
  boundaries_aboriginal_lands_outline,
  boundaries_aboriginal_lands_label,
];
