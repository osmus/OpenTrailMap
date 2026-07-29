import { GLACIER_FILL_COLOR, GLACIER_LINE_COLOR } from "../constants.js";

const glacier_fill = {
  "id": "glacier_fill",
  "type": "fill",
  "source": "sourdough",
  "source-layer": "natural",
  "filter": ["all", ["==", ["geometry-type"], "Polygon"], ["==", ["get", "natural"], "glacier"]],
  "paint": {
    "fill-color": GLACIER_FILL_COLOR,
    "fill-opacity": 0.5,
  },
};

const glacier_outline = {
  "id": "glacier_outline",
  "type": "line",
  "source": "sourdough",
  "source-layer": "natural",
  "filter": glacier_fill.filter,
  "paint": { "line-color": GLACIER_LINE_COLOR },
};

export const GLACIERS = [glacier_fill, glacier_outline];
