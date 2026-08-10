const contours = {
  "id": "contours",
  "type": "line",
  "source": "contours",
  "source-layer": "contours",
  "paint": {
    "line-color": "#000000",
    "line-opacity": ["case", ["==", ["get", "idx"], true], 0.2, 0.1],
    "line-width": 0.5,
  },
  "filter": ["!=", ["get", "ele"], 0],
};

const labels = {
  "id": "contours-labels",
  "type": "symbol",
  "source": "contours",
  "source-layer": "contours",
  "minzoom": 12,
  "filter": ["all", ["==", ["get", "idx"], true], ["!=", ["get", "ele"], 0]],
  "layout": {
    "text-field": ["concat", ["to-string", ["get", "ele"]], " ft"],
    "text-font": ["Noto Sans Regular"],
    "text-size": 8,
    "symbol-placement": "line",
    "symbol-spacing": ["interpolate", ["linear"], ["zoom"], 12, 150, 16, 600],
  },
  "paint": {
    "text-color": "#666",
    "text-halo-color": "hsla(0, 0%, 100%, 0.5)",
    "text-halo-width": 1.5,
    "text-halo-blur": 1,
  },
};

export const CONTOURS = [contours, labels];
