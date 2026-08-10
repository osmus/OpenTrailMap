const pier_lines = {
  "id": "pier_lines",
  "type": "line",
  "source": "sourdough",
  "source-layer": "man_made",
  "filter": ["all", ["==", ["get", "man_made"], "pier"], ["==", ["geometry-type"], "LineString"]],
  "paint": {
    "line-color": "#e7e6e5",
    "line-width": ["interpolate", ["linear"], ["zoom"], 12, 1, 16, 3],
  },
};

const pier_areas = {
  "id": "pier_areas",
  "type": "fill",
  "source": "sourdough",
  "source-layer": "man_made",
  "filter": ["all", ["==", ["get", "man_made"], "pier"], ["==", ["geometry-type"], "Polygon"]],
  "paint": {
    "fill-color": "#e7e6e5",
  },
};

const buildings = {
  "id": "buildings",
  "type": "fill",
  "source": "sourdough",
  "source-layer": "buildings",
  "paint": {
    "fill-color": "#e6ddcd",
  },
};

export const STRUCTURES = [pier_lines, pier_areas, buildings];
