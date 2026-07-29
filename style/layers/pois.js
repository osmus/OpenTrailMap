import { HALO_COLOR, NATURAL_COLOR, TRAIL_COLOR, WATER_COLOR } from "../constants.js";

const FALLBACK_ICON = ["image", "map_pin_with_dot"];

const poi_icon_layout = {
  "icon-size": ["interpolate", ["linear"], ["zoom"], 12, 0.3, 18, 0.6],
};

const poi_text_layout = {
  "text-field": ["get", "name"],
  "text-optional": true,
  "text-size": 11,
  "text-font": ["Noto Sans Bold"],
  "text-variable-anchor": ["left", "right", "top", "bottom"],
  "text-padding": 5,
  "text-radial-offset": 0.75,
  "text-justify": "auto",
};

const poi_text_paint = {
  "text-halo-color": HALO_COLOR,
  "text-halo-width": 2,
  "text-halo-blur": 1,
};

const poi_icon_paint = {
  "icon-halo-color": HALO_COLOR,
  "icon-halo-width": 1.5,
  "icon-halo-blur": 0.4,
};

// Every POI layer is clickable: js/utils.js derives the set of layers the
// inspector can select from this metadata.
const clickable = { "clickable": true };

const amenity_pois = {
  "id": "amenity_pois",
  "type": "symbol",
  "source": "sourdough",
  "source-layer": "amenities",
  "metadata": clickable,
  "minzoom": 12,
  "filter": [
    "all",
    ["==", ["geometry-type"], "Point"],
    ["==", ["get", "amenity"], "ranger_station"],
  ],
  "layout": {
    ...poi_icon_layout,
    ...poi_text_layout,
    "icon-image": ["image", "ranger_station"],
    "text-field": ["step", ["zoom"], "", 14, ["get", "name"]],
  },
  "paint": {
    ...poi_icon_paint,
    ...poi_text_paint,
    "icon-color": TRAIL_COLOR,
  },
};

const tourism_pois = {
  "id": "tourism_pois",
  "type": "symbol",
  "source": "sourdough",
  "source-layer": "tourism",
  "metadata": clickable,
  "minzoom": 12,
  "filter": [
    "all",
    ["==", ["geometry-type"], "Point"],
    [
      "in",
      ["get", "tourism"],
      ["literal", ["camp_site", "caravan_site", "camp_pitch", "wilderness_hut", "viewpoint"]],
    ],
  ],
  "layout": {
    ...poi_icon_layout,
    ...poi_text_layout,
    "icon-image": [
      "match",
      ["get", "tourism"],
      "camp_site",
      ["image", "tent_rect"],
      "caravan_site",
      ["image", "caravan_rect"],
      "camp_pitch",
      ["image", "tent"],
      "wilderness_hut",
      ["image", "lean_to"],
      "viewpoint",
      ["image", "binoculars"],
      FALLBACK_ICON,
    ],
    "symbol-sort-key": [
      "match",
      ["get", "tourism"],
      "camp_site",
      5,
      "caravan_site",
      5,
      "wilderness_hut",
      8,
      "camp_pitch",
      8,
      "viewpoint",
      18,
      10,
    ],
    "text-field": [
      "step",
      ["zoom"],
      "",
      14,
      [
        "case",
        ["==", ["get", "tourism"], "camp_pitch"],
        ["coalesce", ["get", "name"], ["get", "ref"], ""],
        ["get", "name"],
      ],
    ],
  },
  "paint": {
    ...poi_icon_paint,
    ...poi_text_paint,
    "icon-color": TRAIL_COLOR,
    "text-color": TRAIL_COLOR,
  },
};

const highway_pois = {
  "id": "highway_pois",
  "type": "symbol",
  "source": "sourdough",
  "source-layer": "highways",
  "metadata": clickable,
  "minzoom": 12,
  "filter": ["all", ["==", ["geometry-type"], "Point"], ["==", ["get", "highway"], "trailhead"]],
  "layout": {
    ...poi_icon_layout,
    ...poi_text_layout,
    "icon-image": ["image", "hiker_rect"],
    "symbol-sort-key": 7,
    "text-field": ["step", ["zoom"], "", 14, ["get", "name"]],
  },
  "paint": {
    ...poi_icon_paint,
    ...poi_text_paint,
    "icon-color": TRAIL_COLOR,
    "text-color": TRAIL_COLOR,
  },
};

const peak_pois = {
  "id": "peak_pois",
  "type": "symbol",
  "source": "sourdough",
  "source-layer": "natural",
  "metadata": clickable,
  "minzoom": 12,
  "filter": [
    "all",
    ["==", ["geometry-type"], "Point"],
    ["in", ["get", "natural"], ["literal", ["peak", "volcano"]]],
  ],
  "layout": {
    ...poi_icon_layout,
    ...poi_text_layout,
    "icon-image": ["image", "triangle"],
    "icon-size": ["interpolate", ["linear"], ["zoom"], 12, 0.2, 15, 0.4],
    "text-field": [
      "step",
      ["zoom"],
      "",
      13,
      [
        "case",
        ["all", ["has", "name"], ["has", "ele"]],
        [
          "format",
          ["get", "name"],
          {},
          "\n",
          {},
          ["concat", ["number-format", ["round", ["/", ["get", "ele"], 0.3048]], {}], " ft"],
          {},
        ],
        ["has", "name"],
        ["coalesce", ["get", "name"], ""],
        "",
      ],
      14,
      [
        "case",
        ["all", ["has", "name"], ["has", "ele"]],
        [
          "format",
          ["get", "name"],
          {},
          "\n",
          {},
          ["concat", ["number-format", ["round", ["/", ["get", "ele"], 0.3048]], {}], " ft"],
          {},
        ],
        ["has", "ele"],
        ["concat", ["number-format", ["round", ["/", ["get", "ele"], 0.3048]], {}], " ft"],
        ["coalesce", ["get", "name"], ""],
      ],
    ],
  },
  "paint": {
    ...poi_icon_paint,
    ...poi_text_paint,
    "text-color": NATURAL_COLOR,
    "icon-color": NATURAL_COLOR,
    "icon-halo-width": ["step", ["zoom"], 0.5, 13, 1, 14, 1.5],
  },
};

const natural_pois = {
  "id": "natural_pois",
  "type": "symbol",
  "source": "sourdough",
  "source-layer": "natural",
  "metadata": clickable,
  "minzoom": 12,
  "filter": ["all", ["==", ["geometry-type"], "Point"], ["==", ["get", "natural"], "beaver_dam"]],
  "layout": {
    ...poi_icon_layout,
    ...poi_text_layout,
    "icon-image": [
      "match",
      ["get", "natural"],
      "beaver_dam",
      ["image", "beaver_dam"],
      FALLBACK_ICON,
    ],
    "text-field": ["step", ["zoom"], "", 14, ["get", "name"]],
  },
  "paint": {
    ...poi_icon_paint,
    ...poi_text_paint,
    "text-color": NATURAL_COLOR,
    "icon-color": NATURAL_COLOR,
  },
};

const trees = {
  "id": "trees",
  "type": "circle",
  "source": "sourdough",
  "source-layer": "natural",
  "minzoom": 16,
  "filter": ["all", ["==", ["geometry-type"], "Point"], ["==", ["get", "natural"], "tree"]],
  "paint": {
    "circle-radius": ["interpolate", ["exponential", 2], ["zoom"], 16, 2, 22, 128],
    "circle-opacity": ["interpolate", ["linear"], ["zoom"], 16, 0.25, 22, 0.075],
    "circle-color": NATURAL_COLOR,
  },
};

const waterway_pois = {
  "id": "waterway_pois",
  "type": "symbol",
  "source": "sourdough",
  "source-layer": "waterways",
  "metadata": clickable,
  "minzoom": 12,
  "filter": [
    "all",
    ["==", ["geometry-type"], "Point"],
    [
      "any",
      ["in", ["get", "waterway"], ["literal", ["dam", "weir", "waterfall", "access_point"]]],
      ["==", ["get", "lock"], "yes"],
    ],
  ],
  "layout": {
    ...poi_icon_layout,
    ...poi_text_layout,
    "icon-image": [
      "case",
      ["==", ["get", "waterway"], "waterfall"],
      ["image", "waterfall"],
      ["in", ["get", "waterway"], ["literal", ["dam", "weir"]]],
      ["image", "dam"],
      ["==", ["get", "waterway"], "access_point"],
      ["image", "access_point"],
      ["==", ["get", "lock"], "yes"],
      ["image", "lock"],
      FALLBACK_ICON,
    ],
    "text-field": [
      "step",
      ["zoom"],
      "",
      14,
      [
        "let",
        "label",
        [
          "case",
          ["==", ["get", "lock"], "yes"],
          ["coalesce", ["get", "lock_name"], ["get", "lock_ref"], ["get", "name"], ""],
          ["coalesce", ["get", "name"], ["get", "ref"], ""],
        ],
        [
          "case",
          ["has", "height"],
          [
            "format",
            ["var", "label"],
            {},
            ["case", ["!=", ["var", "label"], ""], "\n", ""],
            {},
            ["concat", ["round", ["/", ["to-number", ["get", "height"]], 0.3048]], " ft"],
            { "text-font": ["literal", ["Noto Sans Regular"]] },
          ],
          ["var", "label"],
        ],
      ],
    ],
  },
  "paint": {
    ...poi_icon_paint,
    ...poi_text_paint,
    "icon-color": WATER_COLOR,
    "text-color": WATER_COLOR,
  },
};

const leisure_pois = {
  "id": "leisure_pois",
  "type": "symbol",
  "source": "sourdough",
  "source-layer": "leisure",
  "metadata": clickable,
  "minzoom": 12,
  "filter": ["all", ["==", ["geometry-type"], "Point"], ["==", ["get", "leisure"], "slipway"]],
  "layout": {
    ...poi_icon_layout,
    ...poi_text_layout,
    // slipways are trailer-accessible unless tagged otherwise
    "icon-image": [
      "case",
      ["==", ["get", "trailer"], "no"],
      ["image", "slipway_canoe_rect"],
      ["image", "slipway_canoe_trailer_rect"],
    ],
    "text-field": ["step", ["zoom"], "", 14, ["coalesce", ["get", "name"], ["get", "ref"]]],
  },
  "paint": {
    ...poi_icon_paint,
    ...poi_text_paint,
    "icon-color": WATER_COLOR,
  },
};

const manmade_pois = {
  "id": "manmade_pois",
  "type": "symbol",
  "source": "sourdough",
  "source-layer": "man_made",
  "metadata": clickable,
  "minzoom": 12,
  "filter": [
    "all",
    ["==", ["geometry-type"], "Point"],
    ["in", ["get", "man_made"], ["literal", ["cairn", "monitoring_station"]]],
  ],
  "layout": {
    ...poi_icon_layout,
    ...poi_text_layout,
    "icon-image": [
      "match",
      ["get", "man_made"],
      "cairn",
      ["image", "cairn"],
      "monitoring_station",
      ["image", "streamgage"],
      FALLBACK_ICON,
    ],
    "symbol-sort-key": ["match", ["get", "man_made"], "monitoring_station", 4, "cairn", 20, 10],
    "text-field": ["step", ["zoom"], "", 14, ["get", "name"]],
  },
  "paint": {
    ...poi_icon_paint,
    ...poi_text_paint,
    "icon-color": TRAIL_COLOR,
  },
};

const information_pois = {
  "id": "information_pois",
  "type": "symbol",
  "source": "sourdough",
  "source-layer": "tourism",
  "metadata": clickable,
  "minzoom": 12,
  "filter": [
    "all",
    ["==", ["geometry-type"], "Point"],
    ["==", ["get", "tourism"], "information"],
    ["in", ["get", "information"], ["literal", ["guidepost", "route_marker", "board", "map"]]],
  ],
  "layout": {
    ...poi_icon_layout,
    ...poi_text_layout,
    "icon-image": [
      "match",
      ["get", "information"],
      "board",
      ["image", "information_board"],
      "guidepost",
      ["image", "guidepost"],
      "route_marker",
      ["image", "route_marker"],
      "map",
      ["image", "information_map"],
      FALLBACK_ICON,
    ],
    "symbol-sort-key": ["match", ["get", "information"], "guidepost", 19, "route_marker", 20, 10],
    "text-field": ["step", ["zoom"], "", 15, ["get", "name"]],
  },
  "paint": {
    ...poi_icon_paint,
    ...poi_text_paint,
    "icon-color": TRAIL_COLOR,
  },
};

export const POIS = [
  trees,
  amenity_pois,
  information_pois,
  natural_pois,
  waterway_pois,
  peak_pois,
  leisure_pois,
  manmade_pois,
  tourism_pois,
  highway_pois,
];
