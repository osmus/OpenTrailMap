const road_types = [
  "motorway",
  "motorway_link",
  "trunk",
  "trunk_link",
  "primary",
  "primary_link",
  "secondary",
  "secondary_link",
  "tertiary",
  "tertiary_link",
  "residential",
  "unclassified",
  "track",
  "service",
  "pedestrian",
  "living_street",
];

const isRoad = ["in", ["get", "highway"], ["literal", road_types]];

const width_factor = [
  "match",
  ["get", "highway"],
  "motorway",
  2.0,
  "motorway_link",
  1.0,
  "trunk",
  1.75,
  "trunk_link",
  0.875,
  "primary",
  1.5,
  "primary_link",
  0.75,
  "secondary",
  1.25,
  "secondary_link",
  0.625,
  "tertiary",
  1.0,
  "tertiary_link",
  0.5,
  ["residential", "unclassified"],
  0.8,
  ["pedestrian", "living_street"],
  0.7,
  "track",
  0.6,
  "service",
  0.4,
  1,
];

const roads = {
  "id": "roads",
  "type": "line",
  "source": "sourdough",
  "source-layer": "highways",
  "filter": ["all", isRoad, ["==", ["geometry-type"], "LineString"]],
  "paint": {
    "line-color": "#ffffff",
    "line-width": [
      "let",
      "factor",
      width_factor,
      [
        "interpolate",
        ["linear"],
        ["zoom"],
        8,
        ["*", 0.5, ["var", "factor"]],
        14,
        ["*", 2.0, ["var", "factor"]],
        18,
        ["*", 16.0, ["var", "factor"]],
      ],
    ],
  },
};

const road_labels = {
  "id": "road_labels",
  "type": "symbol",
  "source": "sourdough",
  "source-layer": "highways",
  "minzoom": 13,
  "filter": ["all", isRoad, ["==", ["geometry-type"], "LineString"], ["has", "name"]],
  "layout": {
    "symbol-placement": "line",
    "text-field": ["get", "name"],
    "text-font": ["Noto Sans Condensed Regular"],
    "text-size": ["interpolate", ["linear"], ["zoom"], 13, 9, 18, 14],
    "text-letter-spacing": 0.05,
    "text-rotation-alignment": "map",
    "symbol-spacing": 300,
    "text-max-angle": 30,
  },
  "paint": {
    "text-color": "#666",
    "text-halo-color": "#fff",
    "text-halo-width": 2,
  },
};

const oneway_arrows = {
  "id": "road_oneway_arrows",
  "type": "symbol",
  "source": "sourdough",
  "source-layer": "highways",
  "minzoom": 15,
  "filter": [
    "all",
    isRoad,
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
    "icon-size": ["interpolate", ["linear"], ["zoom"], 15, 0.2, 22, 0.6],
    "icon-rotation-alignment": "map",
    "icon-overlap": "always",
    "icon-padding": 2,
  },
  "paint": {
    "icon-color": "#aaaaaa",
  },
};

export const ROADS = [roads];

export const ROAD_LABELS = [oneway_arrows, road_labels];
