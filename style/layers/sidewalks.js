const sidewalks = {
  "id": "sidewalks",
  "type": "line",
  "source": "sourdough",
  "source-layer": "highways",
  "minzoom": 15,
  "filter": [
    "all",
    ["==", ["get", "highway"], "footway"],
    ["in", ["get", "footway"], ["literal", ["sidewalk", "crossing"]]],
    ["==", ["geometry-type"], "LineString"],
  ],
  "paint": {
    "line-color": "#ffffff",
    "line-width": ["interpolate", ["exponential", 2], ["zoom"], 14, 0.75, 18, 6],
  },
};

const footways = {
  "id": "footways",
  "type": "line",
  "source": "sourdough",
  "source-layer": "highways",
  "minzoom": 13,
  "filter": [
    "any",
    [
      "all",
      ["in", ["get", "highway"], ["literal", ["footway", "cycleway"]]],
      ["!", ["in", ["get", "footway"], ["literal", ["sidewalk", "crossing"]]]],
      ["!=", ["get", "surface"], "unpaved"],
      ["==", ["geometry-type"], "LineString"],
    ],
    [
      "all",
      ["==", ["get", "highway"], "path"],
      ["==", ["get", "surface"], "paved"],
      ["==", ["geometry-type"], "LineString"],
    ],
  ],
  "paint": {
    "line-color": "#ffffff",
    "line-width": ["interpolate", ["exponential", 2], ["zoom"], 14, 0.75, 18, 6],
  },
};

const steps = {
  "id": "steps",
  "type": "line",
  "source": "sourdough",
  "source-layer": "highways",
  "minzoom": 13,
  "filter": [
    "all",
    ["==", ["get", "highway"], "steps"],
    ["!=", ["get", "surface"], "unpaved"],
    ["==", ["geometry-type"], "LineString"],
  ],
  "paint": {
    "line-color": "#ffffff",
    "line-dasharray": ["step", ["zoom"], ["literal", [1, 0]], 16, ["literal", [0.5, 0.2]]],
    "line-width": ["interpolate", ["exponential", 2], ["zoom"], 14, 0.75, 18, 6],
  },
};

export const SIDEWALKS = [sidewalks, footways, steps];
