const poiLabelZoom = 14;
const thisYear = new Date().getFullYear();
const colors = {
  trail: "#4f2e28",
  noaccessTrail: "#cc9e7e",//"#A2D61D",
  natural: "#005908",
  specified: "#007f79",
  unspecified: "#8e00cc",
  disallowedWater: "#a6b2c4",
  water: "#003b93",
  label: "#333",
  labelHalo: "rgba(255, 255, 255, 1)",
  selection: "yellow",
};
const checkDateColors = [
  "interpolate", ["linear"], [
    "to-number",
    ["slice", ["get", "check_date"], 0, 4],
    ["slice", ["get", "survey:date"], 0, 4],
  ],
  2010, '#e7e1ef',
  2014, '#d4b9da',
  2016, '#c994c7',
  2018, '#df65b0',
  2020, '#e7298a',
  2021, '#ce1256',
  2022, '#980043',
  thisYear, '#67001f',
];
const editedDateColors = [
  "interpolate", ["linear"], [
    // convert unix timestamp to year
    "floor", ["+", ["/", ["get", "OSM_TIMESTAMP"], 31536000], 1970],
  ],
  2004, '#e7e1ef',
  2008, '#d4b9da',
  2012, '#c994c7',
  2016, '#df65b0',
  2018, '#e7298a',
  2020, '#ce1256',
  2022, '#980043',
  thisYear, '#380010',
];
const impliedYesExpressions = {
  atv: [],
  bicycle: [
    [
      "in", "highway",
      "cycleway",
      "service",
      "unclassified",
      "residential",
      "tertiary",
      "secondary",
      "primary",
      "tertiary_link",
      "secondary_link",
      "primary_link"
    ],
  ],
  foot: [
    [
      "in", "highway",
      "path",
      "footway",
      "steps",
      "service",
      "unclassified",
      "residential",
      "tertiary",
      "secondary",
      "primary",
      "tertiary_link",
      "secondary_link",
      "primary_link"
    ],
  ],
  horse: [
    ["==", "highway", "bridleway"]
  ],
  wheelchair: [],
  canoe: [],
  portage: [],
  snowmobile: [],
};

const impliedNoExpressions = {
  atv: [
    [
      "any",
      ["in", "highway", "footway", "steps"],
      ["in", "vehicle", "no", "private", "discouraged"],
      ["in", "motor_vehicle", "no", "private", "discouraged"],
      ["!has", "highway"],
    ]
  ],
  snowmobile: [
    [
      "any",
      ["in", "highway", "footway", "steps"],
      ["in", "vehicle", "no", "private", "discouraged"],
      ["in", "motor_vehicle", "no", "private", "discouraged"],
      ["!has", "highway"],
    ]
  ],
  bicycle: [
    [
      "any",
      [
        "all",
        ["==", "highway", "steps"],
        ["!=", "ramp:bicycle", "yes"],
      ],
      ["in", "vehicle", "no", "private", "discouraged"],
      ["!has", "highway"],
    ]
  ],
  foot: [
    ["!has", "highway"],
  ],
  canoe: [
    ["!has", "canoe"],
  ],
  portage: [
    ["!has", "portage"],
  ],
  horse: [
    [
      "any",
      ["==", "highway", "steps"],
      ["!has", "highway"],
    ],
  ],
  wheelchair: [
    [
      "any",
      ["==", "highway", "steps"],
      [
        "all",
        ["has", "sac_scale"],
        ["!=", "sac_scale", "hiking"],
      ],
      [
        "all",
        ["has", "smoothness"],
        ["!in", "smoothness", "excellent", "very_good", "good", "intermediate"],
      ],
      ["!has", "highway"],
    ]
  ],
};

function setNamespacedFilter(id, filter) {
  if (map.getLayer(id)) map.setFilter(id, filter);
  ['trail:', 'water_trail:'].forEach(function(prefix) {
    if (map.getLayer(prefix + id)) map.setFilter(prefix + id, filter);
  });
}
function setNamespacedLayoutProperty(id, prop, value) {
  if (map.getLayer(id)) map.setLayoutProperty(id, prop, value);
  ['trail:', 'water_trail:'].forEach(function(prefix) {
    if (map.getLayer(prefix + id)) map.setLayoutProperty(prefix + id, prop, value);
  });
}
function setNamespacedPaintProperty(id, prop, value) {
  if (map.getLayer(id)) map.setPaintProperty(id, prop, value);
  ['trail:', 'water_trail:'].forEach(function(prefix) {
    if (map.getLayer(prefix + id)) map.setPaintProperty(prefix + id, prop, value);
  });
}

function toggleWaterTrailsIfNeeded() {

  if (!map.getSource('trails_poi')) {
    map.addSource("trails_poi", {
      type: "vector",
      url: "https://dwuxtsziek7cf.cloudfront.net/trails_poi.json",
    });
  }
  if (!map.getSource('water_trails_poi')) {
    map.addSource("water_trails_poi", {
      type: "vector",
      url: "https://dwuxtsziek7cf.cloudfront.net/water_trails_poi.json",
    });
  }

  let showWaterTrails = ["canoe", "all"].includes(travelMode);
  let showLandTrails = travelMode !== "canoe";

  let needsReload = showWaterTrails && !map.getSource('water_trails') ||
    !showWaterTrails && map.getSource('water_trails') ||
    showLandTrails && !map.getSource('trails') ||
    !showLandTrails && map.getSource('trails');

  if (needsReload) {
    clearTrailLayers();
  }

  if (showWaterTrails) {
    if (!map.getSource('water_trails')) {
      map.addSource("water_trails", {
        type: "vector",
        url: "https://dwuxtsziek7cf.cloudfront.net/water_trails.json",
      });
    }
  } else if (map.getSource('water_trails')) {
    needsReload = true;
    map.removeSource('water_trails');
  }

  if (showLandTrails) {
    if (!map.getSource('trails')) {
      map.addSource("trails", {
        type: "vector",
        url: "https://dwuxtsziek7cf.cloudfront.net/trails.json",
      });
    }
  } else if (map.getSource('trails')) {
    map.removeSource('trails');
  }

  if (needsReload) {
    loadTrailLayers(showLandTrails, showWaterTrails);
  }
}

let layerIdsByCategory = {};
let trailLayerIds = [];

function addTrailLayer(def, type) {
  trailLayerIds.push(def.id);
  if (type) layerIdsByCategory[type].push(def.id);
  map.addLayer(def);
}
function clearTrailLayers() {
  trailLayerIds.forEach(function(id) {
    map.removeLayer(id);
  });
  trailLayerIds = [];
}

function loadTrailLayers(showLandTrails, showWaterTrails) {

  layerIdsByCategory = {
    clickable: [],
    hovered: [],
    selected: [],
  };

  function addNamespacedTrailLayers(def, type) {
    let sourceSuffix = def["source-suffix"] || "";
    let sourceLayerSuffix = def["source-layer-suffix"] || "";
    if (showLandTrails) {
      addTrailLayer(Object.assign(Object.assign({}, def), { id: "trail:"+ def.id, source: "trails" + sourceSuffix, "source-layer": "trail" + sourceLayerSuffix }), type);
    }
    if (showWaterTrails) {
      addTrailLayer(Object.assign(Object.assign({}, def), { id: "water_trail:" + def.id, source: "water_trails" + sourceSuffix, "source-layer": "water_trail" + sourceLayerSuffix }), type);
    }
  }

  let lineWidth = [
    "interpolate", ["linear"], ["zoom"],
    12, 1,
    22, 5
  ];
  let selectedLineWidth = [
    "interpolate", ["linear"], ["zoom"],
    12, 9,
    22, 13
  ];
  let hoverLineWidth = [
    "interpolate", ["linear"], ["zoom"],
    12, 5,
    22, 7
  ];
  let hoveredPoiPaint = {
    "circle-radius": [
      "interpolate", ["linear"], ["zoom"],
      12, 9,
      22, 18
    ],
    "circle-opacity": 0.25,
    "circle-color": colors.selection,
  };
  let selectedPoiPaint = {
    "circle-radius": [
      "interpolate", ["linear"], ["zoom"],
      12, 10,
      22, 20
    ],
    "circle-opacity": 0.4,
    "circle-color": colors.selection,
  };

  addNamespacedTrailLayers({
    "id": "hovered-paths",
    "type": "line",
    "layout": {
      "line-cap": "round",
      "line-join": "round"
    },
    "paint": {
      "line-opacity": 0.25,
      "line-color": colors.selection,
      "line-width": hoverLineWidth,
    },
    "filter": [
      "==", "OSM_ID", -1 
    ],
  }, 'hovered');
  addTrailLayer({
    "id": "hovered-peaks",
    "source": "openmaptiles",
    "source-layer": "mountain_peak",
    "type": "circle",
    "paint": hoveredPoiPaint,
    "filter": [
      "==", "OSM_ID", -1 
    ],
  }, 'hovered');
  addNamespacedTrailLayers({
    "id": "hovered-trails-qa",
    "source-layer-suffix": "_qa",
    "type": "circle",
    "paint": hoveredPoiPaint,
    "filter": [
      "==", "OSM_ID", -1 
    ],
  }, 'hovered');
  addNamespacedTrailLayers({
    "id": "hovered-pois",
    "source-suffix": "_poi",
    "source-layer-suffix": "_poi",
    "type": "circle",
    "paint": hoveredPoiPaint,
    "filter": [
      "==", "OSM_ID", -1 
    ],
  }, 'hovered');
  addNamespacedTrailLayers({
    "id": "selected-paths",
    "type": "line",
    "layout": {
      "line-cap": "round",
      "line-join": "round"
    },
    "paint": {
      "line-opacity": 0.4,
      "line-color": colors.selection,
      "line-width": selectedLineWidth,
    },
    "filter": [
      "==", "OSM_ID", -1 
    ],
  }, 'selected');
  addTrailLayer({
    "id": "selected-peaks",
    "source": "openmaptiles",
    "source-layer": "mountain_peak",
    "type": "circle",
    "paint": selectedPoiPaint,
    "filter": [
      "==", "OSM_ID", -1 
    ],
  }, 'selected');
  addNamespacedTrailLayers({
    "id": "selected-trails-qa",
    "source-layer-suffix": "_qa",
    "type": "circle",
    "paint": selectedPoiPaint,
    "filter": [
      "==", "OSM_ID", -1 
    ],
  }, 'selected');
  addNamespacedTrailLayers({
    "id": "selected-pois",
    "source-suffix": "_poi",
    "source-layer-suffix": "_poi",
    "type": "circle",
    "paint": selectedPoiPaint,
    "filter": [
      "==", "OSM_ID", -1 
    ],
  }, 'selected');
  if (showWaterTrails) addTrailLayer({
    "id": "disallowed-waterways",
    "source": 'water_trails',
    "source-layer": 'water_trail',
    "type": "line",
    "layout": {
      "line-cap": "round",
      "line-join": "round"
    },
    "paint": {
      "line-width": lineWidth,
      "line-color": colors.disallowedWater,
    }
  });
  addNamespacedTrailLayers({
    "id": "informal-paths",
    "type": "line",
    "layout": {
      "line-cap": "round",
      "line-join": "round"
    },
    "paint": {
      "line-width": lineWidth,
      "line-color": colors.trail,
      "line-dasharray": [2, 2],
    }
  });
  addNamespacedTrailLayers({
    "id": "disallowed-informal-paths",
    "type": "line",
    "layout": {
      "line-cap": "round",
      "line-join": "round"
    },
    "paint": {
      "line-width": lineWidth,
      "line-color": colors.noaccessTrail,
      "line-dasharray": [2, 2],
    }
  });
  addNamespacedTrailLayers({
    "id": "unspecified-informal-paths",
    "type": "line",
    "layout": {
      "line-cap": "round",
      "line-join": "round",
    },
    "paint": {
      "line-width": lineWidth,
      "line-color": colors.unspecified,
      "line-dasharray": [2, 2],
    }
  });
  addNamespacedTrailLayers({
    "id": "disallowed-paths",
    "type": "line",
    "layout": {
      "line-cap": "round",
      "line-join": "round",
    },
    "paint": {
      "line-width": lineWidth,
      "line-pattern": ["image", "disallowed-stripes"],
    }
  });
  addNamespacedTrailLayers({
    "id": "unspecified-paths",
    "type": "line",
    "layout": {
      "line-cap": "round",
      "line-join": "round",
    },
    "paint": {
      "line-width": lineWidth,
      "line-color": colors.unspecified,
    }
  });
  if (showWaterTrails) addTrailLayer({
    "id": "unspecified-waterways",
    "source": 'water_trails',
    "source-layer": 'water_trail',
    "type": "line",
    "layout": {
      "line-cap": "round",
      "line-join": "round"
    },
    "paint": {
      "line-width": lineWidth,
      "line-color": colors.unspecified,
    }
  });
  if (showWaterTrails) addTrailLayer({
    "id": "waterways",
    "source": 'water_trails',
    "source-layer": 'water_trail',
    "type": "line",
    "layout": {
      "line-cap": "round",
      "line-join": "round"
    },
    "paint": {
      "line-width": lineWidth,
      "line-color": colors.water,
    }
  });
  addNamespacedTrailLayers({
    "id": "paths",
    "type": "line",
    "layout": {
      "line-cap": "round",
      "line-join": "round",
    },
    "paint": {
      "line-width": lineWidth,
      "line-color": colors.trail,
    }
  });
  addNamespacedTrailLayers({
    "id": "bridge-casings",
    "type": "line",
    "minzoom": 14,
    "layout": {
     "line-cap": "butt",
     "line-join": "round",
    },
    "paint": {
      "line-gap-width": lineWidth, 
      "line-width": lineWidth,
      "line-color": "#bbb",
    }
  });
  addNamespacedTrailLayers({
    "id": "oneway-arrows",
    "type": "symbol",
    "transition": {
      "duration": 0,
      "delay": 0
    },
    "minzoom": 12,
    "layout": {
      "icon-padding": 2,
      "icon-size": [
        "interpolate", ["linear"], ["zoom"],
        14, 0.5,
        22, 1
      ],
      "symbol-placement": "line",
      "symbol-spacing": [
        "interpolate", ["linear"], ["zoom"],
        14, 10,
        18, 50,
        22, 140
      ],
      "icon-overlap": "always",
      "icon-rotation-alignment": "map",
    },
    "paint": {
      "icon-opacity": 0.8,
    },
  });
  addNamespacedTrailLayers({
    "id": "trails-labels",
    "type": "symbol",
    "layout": {
      "text-field": ["coalesce", ['get', 'name'], ['get', 'waterbody:name']],
      "text-font": ["Americana-Regular"],
      "text-size": 13,
      "symbol-placement": "line"
    },
    "paint": {
      "text-color": colors.label,
      "text-halo-width": 1.5,
      "text-halo-color": colors.labelHalo,
    }
  });
  addNamespacedTrailLayers({
    "id": "trails-pointer-targets",
    "type": "line",
    "paint": {
        "line-color": "transparent",
        "line-width": 16
    }
  }, 'clickable');
  addTrailLayer({
    "id": "peaks",
    "source": "openmaptiles",
    "source-layer": "mountain_peak",
    "type": "symbol",
    "layout": {
      "icon-image": ["image", "peak"],
      "icon-size": [
        "interpolate", ["linear"], ["zoom"],
        12, 0.5,
        22, 1
      ],
      "symbol-placement": "point",
      "text-field": [
        "step", ["zoom"], "",
        poiLabelZoom, [
          'format',
          ["concat", ["get", "name"], '\n'],
          {"text-font": ['literal', ["Americana-Bold"]]},
          ["concat", [
            "number-format",
            ['get', 'ele_ft'],
            {}
          ], " ft"],
        ]
      ],
      "text-optional": true,
      "text-size": 11,
      "text-line-height": 1.1,
      "text-font": ["Americana-Regular"],
      "text-variable-anchor": ["left", "right", "top", "bottom"],
      "text-padding": 5,
      "text-offset": [
        "interpolate", ["linear"], ["zoom"],
        12, ["literal", [0.4, 0.4]],
        22, ["literal", [1.5, 1.5]]
      ],
      "text-justify": "auto",
    },
    "paint": {
      "text-color":  colors.natural,
      "text-halo-width": 2,
      "text-halo-blur": 1,
      "text-halo-color": colors.labelHalo,
    },
  }, 'clickable');
  addTrailLayer({
    "id": "trail-pois",
    "source": 'trails_poi',
    "source-layer": 'trail_poi',
    "type": "symbol",
    "transition": {
      "duration": 0,
      "delay": 0
    },
    "layout": {
      "icon-image": [
        "case",
        ['==', ["get", "amenity"], "ranger_station"], ["image", "ranger_station"],
        ['==', ["get", "highway"], "trailhead"], ["image", "trailhead"],
        ['==', ["get", "man_made"], "cairn"], ["image", "cairn"],
        ['==', ["get", "information"], "guidepost"], ["image", "guidepost"],
        ['==', ["get", "information"], "route_marker"], ["image", "route_marker"],
        ""
      ],
      "icon-anchor": [
        "case",
        ['in', ["get", "information"], ["literal", ["guidepost", "route_marker"]]], "bottom",
        ['==', ["get", "man_made"], "cairn"], "bottom",
        "center",
      ],
      "icon-size": [
        "interpolate", ["linear"], ["zoom"],
        12, 0.5,
        22, 1
      ],
      "symbol-placement": "point",
      "symbol-sort-key": [
        "case",
        ['==', ["get", "amenity"], "ranger_station"], 2,
        ['==', ["get", "highway"], "trailhead"], 3,
        ['==', ["get", "information"], "guidepost"], 19,
        ['==', ["get", "man_made"], "cairn"], 20,
        ['==', ["get", "information"], "route_marker"], 20,
        10,
      ],
      "text-field": [
        "step", ["zoom"], "",
        poiLabelZoom, [
          'format',
          [
            "case",
            ["has", "name"], [
              "concat", ["get", "name"], ["case", ["has", "ele"], '\n', ""]
            ],
            ""
          ],
          {"text-font": ['literal', ["Americana-Bold"]]},
          [
            "case",
            ["has", "ele"], ["concat", [
              "number-format",
              ["/", ["to-number", ['get', 'ele']], 0.3048],
              { "max-fraction-digits": 0.1 } // for some reason 0 doesn't work
            ], " ft"],
            ""
          ],
          {},
        ]
      ],
      "text-optional": true,
      "text-size": 11,
      "text-line-height": 1.1,
      "text-font": ["Americana-Regular"],
      "text-variable-anchor": ["left", "right", "top", "bottom"],
      "text-padding": 5,
      "text-offset": [
        "interpolate", ["linear"], ["zoom"],
        12, ["literal", [0.4, 0.4]],
        22, ["literal", [1.5, 1.5]]
      ],
      "text-justify": "auto",
    },
    "paint": {
      "text-color": colors.label,
      "text-halo-width": 2,
      "text-halo-blur": 1,
      "text-halo-color": colors.labelHalo,
    }
  }, 'clickable');
  addTrailLayer({
    "id": "water-trail-pois",
    "source": 'water_trails_poi',
    "source-layer": 'water_trail_poi',
    "type": "symbol",
    "transition": {
      "duration": 0,
      "delay": 0
    },
    "layout": {
      "icon-size": [
        "interpolate", ["linear"], ["zoom"],
        12, 0.5,
        22, 1
      ],
      "symbol-placement": "point",
      "symbol-sort-key": [
        "case",
        ['==', ["get", "man_made"], "monitoring_station"], 2,
        [
          "any",
          ["in", ["get", "canoe"], ["literal", ["no", "private", "discouraged"]]],
          [
            "all",
            ["!", ["has", "canoe"]],
            ["in", ["get", "access"], ["literal", ["no", "private", "discouraged"]]]
          ]
        ], 15,
        10,
      ],
      "text-field": [
        "step", ["zoom"], "",
        poiLabelZoom, [
          "case",
          ['==', ["get", "lock"], "yes"], [
            'format',
            [
              "case",
              ["any", ["has", "lock_name"], ["has", "lock_ref"]], [
                "concat", ["coalesce", ["get", "lock_name"], ["get", "lock_ref"]], ["case", ["has", "lock:height"], '\n', ""]
              ],
              ""
            ],
            {},
            [
              "case",
              ["has", "lock:height"], ["concat", [
                "number-format",
                ["/", ["to-number", ['get', 'lock:height']], 0.3048],
                { "max-fraction-digits": 0.1 } // for some reason 0 doesn't work
              ], " ft"],
              ""
            ],
            {"text-font": ['literal', ["Americana-Regular"]]},
            ["case", ["has", "lock:height"], " ↕︎", ""],
            {"text-font": ['literal', ["Americana-Bold"]]},
          ],
          ['in', ["get", "waterway"], ["literal", ["waterfall", "dam", "weir"]]], [
            'format',
            [
              "case",
              ["has", "name"], [
                "concat", ["get", "name"], ["case", ["has", "height"], '\n', ""]
              ],
              ""
            ],
            {},
            [
              "case",
              ["has", "height"], ["concat", [
                "number-format",
                ["/", ["to-number", ['get', 'height']], 0.3048],
                { "max-fraction-digits": 0.1 } // for some reason 0 doesn't work
              ], " ft"],
              ""
            ],
            {"text-font": ['literal', ["Americana-Regular"]]},
            ["case", ["has", "height"], " ↕︎", ""],
            {"text-font": ['literal', ["Americana-Bold"]]},
          ],
          ["get", "name"]
        ]
      ],
      "text-optional": true,
      "text-size": 11,
      "text-line-height": 1.1,
      "text-font": ["Americana-Bold"],
      "text-variable-anchor": ["left", "right", "top", "bottom"],
      "text-padding": 5,
      "text-offset": [
        "interpolate", ["linear"], ["zoom"],
        12, ["literal", [0.4, 0.4]],
        22, ["literal", [1.5, 1.5]]
      ],
      "text-justify": "auto",
    },
    "paint": {
      "text-color": colors.label,
      "text-halo-width": 2,
      "text-halo-blur": 1,
      "text-halo-color": colors.labelHalo,
    }
  }, 'clickable');
  addTrailLayer({
    "id": "major-trail-pois",
    "source": 'trails_poi',
    "source-layer": 'trail_poi',
    "type": "symbol",
    "transition": {
      "duration": 0,
      "delay": 0
    },
    "layout": {
      "icon-image": [
        "case",
        ['in', ["get", "boundary"], ["literal", ["protected_area", "national_park"]]], ["image", "protected_area"],
        ['==', ["get", "leisure"], "nature_reserve"], ["image", "nature_reserve"],
        ["image", "park"],
      ],
      "icon-size": [
        "interpolate", ["linear"], ["zoom"],
        12, 0.5,
        22, 1
      ],
      "symbol-placement": "point",
      "text-field": ["get", "name"],
      "text-optional": true,
      "text-size": 11,
      "text-line-height": 1.1,
      "text-font": ["Americana-Bold"],
      "text-variable-anchor": ["top", "bottom", "left", "right"],
      "text-padding": 5,
      "text-offset": [
        "interpolate", ["linear"], ["zoom"],
        12, ["literal", [0.9, 0.9]],
        22, ["literal", [2, 2]]
      ],
      "text-justify": "auto",
    },
    "paint": {
      "text-color": colors.natural,
      "text-halo-width": 2,
      "text-halo-blur": 1,
      "text-halo-color": colors.labelHalo,
    },
  }, 'clickable');
  addNamespacedTrailLayers({
    "id": "trails-qa",
    "source-layer-suffix": "_qa",
    "type": "symbol",
    "transition": {
      "duration": 0,
      "delay": 0
    },
    "layout": {
      "icon-image": ["image", "question"],
      "icon-size": [
        "interpolate", ["linear"], ["zoom"],
        12, 0.5,
        22, 1
      ],
      "symbol-placement": "point"
    }
  }, 'clickable');
}

let accessHierarchy = {
  all: [],
  atv: ['vehicle', 'motor_vehicle', 'atv'],
  bicycle:  ['vehicle', 'bicycle'],
  canoe: ['boat', "canoe"],
  foot: ['foot'],
  horse: ['horse'],
  mtb: ['vehicle', 'bicycle', 'mtb'],
  portage: ['foot', 'portage'],
  snowmobile: ['vehicle', 'motor_vehicle', 'snowmobile'],
  wheelchair: ['foot', 'wheelchair'],
};

function onewayKeysForTravelMode(travelMode) {
  let keys = [];
  // oneway tag is irrelevant on waterways
  if (travelMode !== "canoe") keys.push('oneway');
  return keys.concat(accessHierarchy[travelMode].map(function(val) {
    return 'oneway:' + val;
  }));
}
function maxspeedKeysForTravelMode(travelMode) {
  let keys = ["maxspeed"];
  return keys.concat(accessHierarchy[travelMode].map(function(val) {
    return 'maxspeed:' + val;
  }));
}

function specifyingKeysForLens(lens, travelMode) {
  switch (lens) {
    case 'name': 
      switch (travelMode) {
        case "canoe": return ['name', 'noname', 'waterbody:name'];
        case 'mtb': return ['name', 'noname', 'mtb:name'];
      }
      return ['name', 'noname'];
    case 'oneway': return onewayKeysForTravelMode(travelMode);
    case 'maxspeed': return maxspeedKeysForTravelMode(travelMode);
    case 'check_date': return ['check_date', 'survey:date'];
    case 'covered': return ['covered', 'tunnel', 'indoor'];
    case 'fixme': return ['fixme', 'FIXME', 'todo', 'TODO'];
  }
  return [lens];
}
function attributeIsSpecifiedExpression(keys) {
  return [
    "any",
    ...keys.map(function(key) {
      return [
        "all",
        ["has", key],
        ["!=", key, "unknown"],
      ];
    }),
  ];
}
function isSpecifiedExpressionForLens(lens, travelMode) {

  let specifiedAttributeExpression = attributeIsSpecifiedExpression(
    specifyingKeysForLens(lens, travelMode)
  );
  // for fixmes we're looking for extant values instead of missing values
  if (lens === 'fixme') {
    specifiedAttributeExpression = [
      "none",
      specifiedAttributeExpression,
    ];
  }
  if (lens === 'operator') {
    // if a path is `informal=yes` then there's probably no operator, always style as complete
    specifiedAttributeExpression = [
      "any",
      specifiedAttributeExpression,
      ["==", "informal", "yes"],
    ];
  }
  if (lens === 'sac_scale') {
    // if a path is `informal=yes` then there's probably no operator, always style as complete
    specifiedAttributeExpression = [
      "all",
      specifiedAttributeExpression,
      ["in", "sac_scale", 'no', 'hiking', 'mountain_hiking', 'demanding_mountain_hiking', 'alpine_hiking', 'demanding_alpine_hiking', 'difficult_alpine_hiking'],
    ];
  }

  if (lens === 'tidal') {
    // assume tidal channels are always tidal=yes
    specifiedAttributeExpression = [
      "any",
      specifiedAttributeExpression,
      ["==", "waterway", "tidal_channel"],
    ];
  }
  if (lens === 'open_water') {
    // only expect open_water tag on certain features
    specifiedAttributeExpression = [
      "any",
      specifiedAttributeExpression,
      ["!in", "waterway", "fairway", "flowline"],
    ];
  }
  if (lens === 'width') {
    // don't expect width tag on links
    specifiedAttributeExpression = [
      "any",
      specifiedAttributeExpression,
      ["==", "waterway", "link"],
    ];
  }

  if (waterwayOnlyLenses.includes(lens)) {
    // don't expect waterway-only attributes on highways
    specifiedAttributeExpression = [
      "any",
      specifiedAttributeExpression,
      ["has", "highway"],
    ];
  } else if (highwayOnlyLenses.includes(lens)) {
    // don't expect highway-only attributes on waterways
    specifiedAttributeExpression = [
      "any",
      specifiedAttributeExpression,
      ["!has", "highway"],
    ];
  }
  if (lens === 'oneway' && travelMode === "canoe") {
    specifiedAttributeExpression = [
      "any",
      [
        "all",
        specifiedAttributeExpression,
        ["has", "waterway"],
      ],
      [
        "all",
        attributeIsSpecifiedExpression(specifyingKeysForLens(lens, 'portage')),
        ["!has", "waterway"],
      ],
    ];
  }
  
  return specifiedAttributeExpression;
}

function waterTrailPoisFilter(travelMode) {
  let filter = ["all"];
  if (focusAreaGeoJsonBuffered?.geometry?.coordinates?.length) {
    filter.push(["within", focusAreaGeoJsonBuffered]);
  }
  if (travelMode !== "canoe" && travelMode !== "all") {
    filter.push(["==", ["get", "waterway"], "waterfall"]);
  }
  return filter.length > 1 ? filter : null;
}

function trailPoisFilter(travelMode) {
  let filter = [
    "all",
    [
      "!",
      [
        "any",
        ['in', ["get", "leisure"], ["literal", ["park", "nature_reserve"]]],
        ['in', ["get", "boundary"], ["literal", ["protected_area", "national_park"]]],
      ]
    ],
  ]
  if (focusAreaGeoJsonBuffered?.geometry?.coordinates?.length) {
    filter.push(["within", focusAreaGeoJsonBuffered]);
  }
  if (travelMode !== "all") {
    let poiKeys = [travelMode];
    let poiKeysByTravelMode = {
      "foot": ["hiking"],
      "canoe": ["canoe", "portage"],
    };
    if (poiKeysByTravelMode[travelMode]) poiKeys = poiKeysByTravelMode[travelMode];
    filter.push([
      'any',
      [
        "!",
        [
          "any",
          ["==", ["get", "highway"], "trailhead"],
          ["in", ["get", "information"], ["literal", ["guidepost", "route_marker"]]],
          ["==", ["get", "man_made"], "cairn"],
        ]
      ],
      travelMode === "canoe" ? [
        "any",
        ...poiKeys.map(function(key) {
          return ["==", ["get", key], "yes"];
        })
      ] :
      [
        "all",
        ...poiKeys.map(function(key) {
          return [
            "any",
            ["!", ["has", key]],
            ["==", ["get", key], "yes"],
          ];
        })
      ]
    ]);
  }
  return filter;
}

function onewayArrowsFilter(travelMode) {
  let filter = ['any'];
  let onewayKeys = onewayKeysForTravelMode(travelMode);
  while (onewayKeys.length) {
    let leastSpecificKey = onewayKeys.shift();
    filter.push([
      "all",
      // if there isn't a more specific key (e.g. 'oneway:foot')
      ...onewayKeys.map(function(key) {
        return ["!has", key];
      }),
      // then pay attention to the most specific key we have (e.g. 'oneway')
      ["in", leastSpecificKey, "yes", "-1", "alternating", "reversible"],
    ]);
  }
  if (travelMode === "canoe") {
    filter = [
      "any",
      [
        "all",
        filter,
        ["has", "waterway"],
      ],
      [
        "all",
        onewayArrowsFilter('portage'),
        ["!has", "waterway"],
      ],
    ];
  }
  return filter;
}

function waterTrailPoiIconImageExpression(travelMode) {
  var showHazards = travelMode === "canoe";
  return [
    "case",
    ['==', ["get", "man_made"], "monitoring_station"], ["image", "streamgage"],
    [
      "any",
      ['==', ["get", "natural"], "beaver_dam"],
      ['in', ["get", "waterway"], ["literal", ["dam", "weir", "waterfall"]]],
      ['==', ["get", "lock"], "yes"],
    ], [
      "case",
      [
        "all",
        ["has", "canoe"],
        ["!", ["in", ["get", "canoe"], ["literal", ["no", "private", "discouraged"]]]]
      ], [
        "case",
        ['==', ["get", "natural"], "beaver_dam"], ["image", showHazards ? "beaver_dam-canoeable" : "beaver_dam"],
        ['==', ["get", "waterway"], "waterfall"], ["image", showHazards ? "waterfall-canoeable" : "waterfall"],
        ['in', ["get", "waterway"], ["literal", ["dam", "weir"]]], ["image", showHazards ? "dam-canoeable" : "dam"],
        ["image", showHazards ? "lock-canoeable" : "lock"],
      ],
      ['==', ["get", "natural"], "beaver_dam"], ["image", showHazards ? "beaver_dam-hazard" : "beaver_dam"],
      ['==', ["get", "waterway"], "waterfall"], ["image", showHazards ? "waterfall-hazard" : "waterfall"],
      ['in', ["get", "waterway"], ["literal", ["dam", "weir"]]], ["image", showHazards ? "dam-hazard" : "dam"],
      ["image", showHazards ? "lock-hazard" : "lock"],
    ],
    [
      "any",
      ["in", ["get", "canoe"], ["literal", ["no", "private", "discouraged"]]],
      [
        "all",
        ["!", ["has", "canoe"]],
        ["in", ["get", "access"], ["literal", ["no", "private", "discouraged"]]]
      ]
    ], [
      "case",
      ['==', ["get", "leisure"], "slipway"], ["case",
        ['==', ["get", "trailer"], "no"], ["image", "slipway-canoe-noaccess"],
        ["image", "slipway-canoe-trailer-noaccess"],
      ],
      ['any', ["==", ["get", "waterway"], "access_point"], ['in', ["get", "canoe"], ["literal", ["put_in", "put_in;egress", "egress"]]]], ["image", "canoe-noaccess"],
      ""
    ],
    ['==', ["get", "leisure"], "slipway"], [
      "case",
      ['==', ["get", "trailer"], "no"], ["image", "slipway-canoe"],
      ["image", "slipway-canoe-trailer"],
    ],
    ['any', ["==", ["get", "waterway"], "access_point"], ['in', ["get", "canoe"], ["literal", ["put_in", "put_in;egress", "egress"]]]], ["image", "canoe"],
    ""
  ];
}
function onewayArrowsIconImageExpression(travelMode) {
  let expression = ['case'];
  onewayKeysForTravelMode(travelMode).reverse().forEach(function(key) {
    expression = expression.concat([
      ["has", key],
      [
        "case",
        ["==", ["get", key], "yes"], ["image", "oneway-arrow-right"],
        ["==", ["get", key], "-1"], ["image", "oneway-arrow-left"],
        ["in", ["get", key], ["literal", ["alternating", "reversible"]]], ["image", "bothways-arrows"],
        ""
      ]
    ]);
  });
  expression.push("");
  if (travelMode === "canoe") {
    expression = [
      "case",
      ["has", "waterway"], expression,
      onewayArrowsIconImageExpression('portage'),
    ];
  }
  return expression;
}
// returns a filter that evaluates to true for features with enough tags to positively
// determine whether access is allowed or not allowed
function accessIsSpecifiedExpression(travelMode) {
  let filter = [
    "none",
    [
      "any",
      [
        "all",
        ["!has", travelMode],
        ...notNoAccessExpressions("access"),
        [
          "none",
          ...impliedYesExpressions[travelMode],
          ...impliedNoExpressions[travelMode]
        ]
      ],
      // access if always unspecified if mode is explicitly set to `unknown`
      ["==", travelMode, "unknown"],
    ]
  ];
  if (travelMode === "canoe") {
    filter = [
      "any",
      [
        "all",
        filter,
        ["has", "waterway"],
      ],
      [
        "all",
        accessIsSpecifiedExpression('portage'),
        ["!has", "waterway"],
      ],
    ];
  }
  return filter;
}

function updateTrailLayers() {
  toggleWaterTrailsIfNeeded();

  let focusedId = focusedEntityInfo?.id ? omtId(focusedEntityInfo.id, focusedEntityInfo.type) : null;

  // ["!=", "true", "false"] always evalutes to true because "true" actually refers to the name of a
  // data attribute key, which is always undefined, while "false" is the string it's compared to.
  let allowedAccessExpression = ["!=", "true", "false"];
  let specifiedAccessExpression = ["!=", "true", "false"];
  let specifiedExpression;

  let showFixmesExpression = [lens === "fixme" ? "!=" : '==', "true", "false"];
  let showDisallowedExpression = [lens === "access" ? "!=" : '==', "true", "false"];
  let showUnspecifiedExpression = [lens !== "" ? "!=" : '==', "true", "false"];

  let pathsColors = colors.trail;
  let waterwaysColors = colors.water;

  if (travelMode === "all") {
    allowedAccessExpression = [
      "any",
      modeIsAllowedExpression("foot"),
      modeIsAllowedExpression("wheelchair"),
      modeIsAllowedExpression("bicycle"),
      modeIsAllowedExpression("horse"),
      modeIsAllowedExpression("atv"),
      modeIsAllowedExpression("canoe"),
    ];
  } else {
    let modes = [travelMode];
    if (travelMode == "canoe") modes.push('portage');
    allowedAccessExpression = [
      "any",
      ...modes.map(function(mode) {  
        return modeIsAllowedExpression(mode);
      })
    ];
  }

  if (travelMode !== "all") {
    specifiedAccessExpression = accessIsSpecifiedExpression(travelMode);
  } else if (lens === 'access' || lens === '') {
    specifiedAccessExpression = [
      "all",
      // access not fully specified if any access tag is explicitly set to `unknown`
      ["!=", "access", "unknown"],
      ["!=", "foot", "unknown"],
      ["!=", "wheelchair", "unknown"],
      ["!=", "bicycle", "unknown"],
      ["!=", "horse", "unknown"],
      ["!=", "atv", "unknown"],
    ];  
  }

  if (lens !== "" && lens !== "access") {

    pathsColors = lens === 'check_date' ? checkDateColors :
      lens === 'OSM_TIMESTAMP' ? editedDateColors :
      colors.specified;
    
    waterwaysColors = pathsColors;
  
    specifiedExpression = isSpecifiedExpressionForLens(lens, travelMode);
    allowedAccessExpression = [
      "all",
      allowedAccessExpression,
      specifiedAccessExpression
    ];
  } else {
    specifiedExpression = specifiedAccessExpression;
  }

  let combinedFilterExpression = ["any"];
  function setTrailsLayerFilter(layerId, filter) {
    setNamespacedFilter(layerId, filter);
    combinedFilterExpression.push(filter);
  }
  
  setTrailsLayerFilter('paths', [
    "all",
    allowedAccessExpression,
    specifiedExpression,
    ["!=", "informal", "yes"],
    ["has", "highway"],
  ]);
  setTrailsLayerFilter('informal-paths', [
    "all",
    allowedAccessExpression,
    specifiedExpression,
    ["==", "informal", "yes"],
    ["has", "highway"],
  ]);
  setTrailsLayerFilter('disallowed-paths', [
    "all",
    showDisallowedExpression,
    ["none", allowedAccessExpression],
    specifiedExpression,
    ["!=", "informal", "yes"],
    ["has", "highway"],
  ]);
  setTrailsLayerFilter('disallowed-informal-paths', [
    "all",
    showDisallowedExpression,
    ["none", allowedAccessExpression],
    specifiedExpression,
    ["==", "informal", "yes"],
    ["has", "highway"],
  ]);
  setTrailsLayerFilter('unspecified-paths', [
    "all",
    showUnspecifiedExpression,
    allowedAccessExpression,
    ["none", specifiedExpression],
    ["!=", "informal", "yes"],
    ["has", "highway"],
  ]);
  setTrailsLayerFilter('unspecified-informal-paths', [
    "all",
    showUnspecifiedExpression,
    allowedAccessExpression,
    ["none", specifiedExpression],
    ["==", "informal", "yes"],
    ["has", "highway"],
  ]);
  setTrailsLayerFilter('disallowed-waterways', [
    "all",
    showDisallowedExpression,
    ["none", allowedAccessExpression],
    specifiedExpression,
    ["has", "waterway"],
  ]);
  setTrailsLayerFilter('unspecified-waterways', [
    "all",
    showUnspecifiedExpression,
    allowedAccessExpression,
    ["none", specifiedExpression],
    ["has", "waterway"],
  ]);
  setTrailsLayerFilter('waterways', [
    "all",
    allowedAccessExpression,
    specifiedExpression,
    ["has", "waterway"],
  ]);

  setNamespacedLayoutProperty('hovered-trails-qa', 'visibility', lens === 'fixme' ? 'visible' : 'none')
  setNamespacedLayoutProperty('selected-trails-qa', 'visibility', lens === 'fixme' ? 'visible' : 'none')
  setNamespacedLayoutProperty('oneway-arrows', "icon-image", onewayArrowsIconImageExpression(travelMode))
  setNamespacedLayoutProperty('water-trail-pois', "icon-image", waterTrailPoiIconImageExpression(travelMode))
  
  setNamespacedPaintProperty('paths', 'line-color', pathsColors)
  setNamespacedPaintProperty('informal-paths', 'line-color', pathsColors)
  setNamespacedPaintProperty('waterways', 'line-color', waterwaysColors);
  
  setNamespacedFilter('bridge-casings', ["all", ["has", "bridge"], ["!in", "bridge", "no", "abandoned", "raised", "proposed", "dismantled"], combinedFilterExpression])
  // oneway-arrows filter technically isn't needed since the icon-image doesn't display anything
  // if there isn't a relevant oneway value, but we might as well leave it for now in case we want
  // to add some other kind of styling in the future
  setNamespacedFilter('oneway-arrows', ["all", onewayArrowsFilter(travelMode), combinedFilterExpression])
  setNamespacedFilter('trails-qa', ["all", showFixmesExpression, combinedFilterExpression])
  setNamespacedFilter('trails-labels', combinedFilterExpression)
  setNamespacedFilter('trails-pointer-targets', combinedFilterExpression)
  setNamespacedFilter('water-trail-pois', waterTrailPoisFilter(travelMode))
  setNamespacedFilter('trail-pois', trailPoisFilter(travelMode))
  setNamespacedFilter('major-trail-pois', [
    "all",
    [
      "any",
      ['in', ["get", "leisure"], ["literal", ["park", "nature_reserve"]]],
      ['in', ["get", "boundary"], ["literal", ["protected_area", "national_park"]]]
    ],
    ["!=", ["get", "OSM_ID"], focusedEntityInfo ? focusedEntityInfo.id : null],
    ...(focusAreaGeoJsonBuffered?.geometry?.coordinates?.length ?
      focusAreaFilter = [["within", focusAreaGeoJsonBuffered]] : []),
  ])
  map.setFilter('peaks', [
    "all",
    ["has", "name"],
    ["has", "ele_ft"],
    ...(focusAreaGeoJsonBuffered?.geometry?.coordinates?.length ?
      focusAreaFilter = [["within", focusAreaGeoJsonBuffered]] : []),
  ]);

  function setParksFilter(layer, filter) {
    ['', '-landcover'].forEach(function(suffix) {
      if (suffix === '-landcover') {
        let origFilter = filter;
        filter = [
          "all",
          ["==", ["get", "subclass"], "park"],
        ];
        if (origFilter) filter.push(origFilter);
      }
      map.setFilter(layer + suffix, filter);
    });
  }
  function setParksPaintProperty(layer, key, value) {
    ['', '-landcover'].forEach(function(suffix) {
      map.setPaintProperty(layer + suffix, key, value);
    });
  }
  function setParksLayoutProperty(layer, key, value) {
    ['', '-landcover'].forEach(function(suffix) {
      map.setLayoutProperty(layer + suffix, key, value);
    });
  }
  setParksFilter('park-fill', [
    "any",
    ["==", ["id"], focusedId],
    ["!", ["in", ["id"], ["literal", conservationDistrictOmtIds]]]
  ]);
  setParksFilter('park-outline', [
    "any",
    [
      "all",
      ["!=", ["id"], focusedId],
      [">=", ["zoom"], 10],
    ],
    [">=", ["zoom"], 12],
  ]);
  setParksLayoutProperty('park-outline', "line-sort-key", [
    "case",
    ["==", ["id"], focusedId], 2,
    1
  ]);
  setParksLayoutProperty('park-fill', "fill-sort-key", [
    "case",
    ["==", ["id"], focusedId], 2,
    1
  ]);
  setParksPaintProperty('park-fill', "fill-color", [
    "case",
    ["==", ["id"], focusedId], "#D8E8B7",
    "#EFF5DC"
  ]);
  setParksPaintProperty('park-outline', "line-color", [
    "case",
    ["==", ["id"], focusedId], "#738C40",
    "#ACC47A"
  ]);
}

function notNoAccessExpressions(mode) {
  return [
    ["!=", mode, "no"],
    ["!=", mode, "private"],
    ["!=", mode, "discouraged"],
    ["!=", mode, "customers"],
    ["!=", mode, "limited"], // for `wheelchair`
  ];
}

function modeIsAllowedExpression(mode) {
  let allowedAccessExpression = [
    "all",
    [
      "any",
      [
        "all",
        ["!has", mode],
        ...notNoAccessExpressions("access"),
      ],
      [
        "all",
        ["has", mode],
        ...notNoAccessExpressions(mode),
      ],
    ],
  ];
  if (impliedNoExpressions[mode]) {
    allowedAccessExpression.push(
      [
        "any",
        ["has", mode],
        ["none",
          ...impliedNoExpressions[mode],
        ],
      ]
    );
  }
  return allowedAccessExpression;
}

async function loadInitialMap() {
  updateForHash();
  updateTrailLayers();

  map.setPaintProperty("landuse-exclusion", "fill-pattern", ["image", "restricted-zone"])

  // only add UI handlers after we've loaded the layers
  map.on('mousemove', didMouseMoveMap)
    .on('click', didClickMap)
    .on('dblclick', didDoubleClickMap);
}

// some "park" features aren't really parks
const conservationDistrictOmtIds = [
  16953943, // Adirondack Park
  62654773, // Catskill Park
  110177633, // Pinelands NR
];

function omtId(id, type) {
  let codes = {
    "node": "1",
    "way": "2",
    "relation": "3",
  };
  return parseInt(id.toString() + codes[type]);
}

function updateMapForSelection() {

  let id = selectedEntityInfo && selectedEntityInfo.id;
  let type = selectedEntityInfo && selectedEntityInfo.type;

  let idsToHighlight = [id ? id : -1];

  if (type === "relation") {
    let members = osmEntityCache[type[0] + id]?.members || [];
    members.forEach(function(member) {
      idsToHighlight.push(member.ref);
      
      if (member.type === "relation") {
        // only recurse down if we have the entity cached
        let childRelationMembers = osmEntityCache[member.type[0] + member.ref]?.members || [];
        childRelationMembers.forEach(function(member) {
          idsToHighlight.push(member.ref);
          // don't recurse relations again in case of self-references
        });
      }
    });
  }

  layerIdsByCategory.selected?.forEach(function(layerId) {
    // this will fail in rare cases where two features of different types but the same ID are both onscreen
    setNamespacedFilter(layerId, [
      "any",
      ["in", ["id"], ["literal", idsToHighlight.map(function(id) {
        return omtId(id, "node");
      })]],
      ["in", ["get", "OSM_ID"], ["literal", idsToHighlight]]
    ]);
  });
}

function updateMapForHover() {
  let entityId = hoveredEntityInfo?.id || -1;

  if (hoveredEntityInfo?.id == selectedEntityInfo?.id &&
    hoveredEntityInfo?.type == selectedEntityInfo?.type) {
    // don't show hover styling if already selected
    entityId = -1;
  }

  layerIdsByCategory.hovered?.forEach(function(layerId) {
    // this will fail in rare cases where two features of different types but the same ID are both onscreen
    setNamespacedFilter(layerId, [
      "any",
      ["==", ["get", "OSM_ID"], entityId],
      ["==", ["id"], omtId(entityId, hoveredEntityInfo?.type)],
    ]);
  });
}

function entityForEvent(e, layerIds) {
  let features = map.queryRenderedFeatures(e.point, { layers: layerIds });
  let feature = features.length && features[0];
  if (feature) {
    let focusLngLat = feature.geometry.type === 'Point' ? feature.geometry.coordinates : e.lngLat;
    if (feature.properties.OSM_ID && feature.properties.OSM_TYPE) {
      return {
        id: feature.properties.OSM_ID,
        type: feature.properties.OSM_TYPE,
        focusLngLat: focusLngLat,
        rawFeature: feature,
      };
    }
    return {
      id: feature.id.toString().slice(0, -1),
      type: 'node',
      focusLngLat: focusLngLat,
      rawFeature: feature,
    };
  }
  return null;
}

let activePopup;

function didClickMap(e) {

  let entity = entityForEvent(e, layerIdsByCategory.clickable);
  selectEntity(entity);

  if (!entity || isSidebarOpen()) return;
  
  let coordinates = entity.focusLngLat;

  // Ensure that if the map is zoomed out such that multiple
  // copies of the feature are visible, the popup appears
  // over the copy being pointed to.
  while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
  }

  let tags = entity.rawFeature.properties;

  let html = "";

  if (tags.name) html += "<b>" + tags.name + "</b><br/>"
  html += '<a href="" class="button" onclick="return didClickViewDetails()">View Details</a>';

  activePopup = new maplibregl.Popup({
      className: 'quickinfo',
      closeButton: false,
    })
    .setLngLat(coordinates)
    .setHTML(html)
    .addTo(map);
}
function didClickViewDetails() {
  openSidebar();
  return false;
}
function didDoubleClickMap(e) {
  let entity = entityForEvent(e, ['major-trail-pois']);
  if (entity) {
    e.preventDefault();
    focusEntity(entity);    
  }
}

function didMouseMoveMap(e) {
  let newHoveredEntityInfo = entityForEvent(e, layerIdsByCategory.clickable);

  if (hoveredEntityInfo?.id != newHoveredEntityInfo?.id ||
    hoveredEntityInfo?.type != newHoveredEntityInfo?.type) {
    hoveredEntityInfo = newHoveredEntityInfo;
    
    // Change the cursor style as a UI indicator
    map.getCanvas().style.cursor = hoveredEntityInfo ? 'pointer' : '';

    updateMapForHover();
  }
}