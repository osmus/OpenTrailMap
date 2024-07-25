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
  label: "#000",
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

function toggleWaterTrailsIfNeeded() {

  if (!map.getSource('trails_poi')) {
    map.addSource("trails_poi", {
      type: "vector",
      url: "https://dwuxtsziek7cf.cloudfront.net/trails_poi.json",
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>'
    });
  }

  if (travelMode === 'canoe' && !map.getSource('water_trails')) {
    clearTrailLayers();
    if (map.getSource('trails')) map.removeSource('trails');
    map.addSource("water_trails", {
      type: "vector",
      url: "https://dwuxtsziek7cf.cloudfront.net/water_trails.json",
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>'
    });
    map.addSource("water_trails_poi", {
      type: "vector",
      url: "https://dwuxtsziek7cf.cloudfront.net/water_trails_poi.json",
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>'
    });
    loadTrailLayers('water_trail');

  } else if (travelMode !== 'canoe' && !map.getSource('trails')) {
    clearTrailLayers();
    if (map.getSource('water_trails')) map.removeSource('water_trails');
    if (map.getSource('water_trails_poi')) map.removeSource('water_trails_poi');
    map.addSource("trails", {
      type: "vector",
      url: "https://dwuxtsziek7cf.cloudfront.net/trails.json",
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>'
    });
    loadTrailLayers('trail');
  }  
}

var layerIdsByCategory = {};
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

function loadTrailLayers(name) {

  layerIdsByCategory = {
    clickable: [],
    hovered: [],
    selected: [],
  };

  var lineWidth = [
    "interpolate", ["linear"], ["zoom"],
    12, 1,
    22, 5
  ];
  var selectedLineWidth = [
    "interpolate", ["linear"], ["zoom"],
    12, 9,
    22, 13
  ];
  var hoverLineWidth = [
    "interpolate", ["linear"], ["zoom"],
    12, 5,
    22, 7
  ];
  var hoveredPoiPaint = {
    "circle-radius": [
      "interpolate", ["linear"], ["zoom"],
      12, 9,
      22, 18
    ],
    "circle-opacity": 0.25,
    "circle-color": colors.selection,
  };
  var selectedPoiPaint = {
    "circle-radius": [
      "interpolate", ["linear"], ["zoom"],
      12, 10,
      22, 20
    ],
    "circle-opacity": 0.4,
    "circle-color": colors.selection,
  };

  addTrailLayer({
    "id": "hovered-paths",
    "source": name + 's',
    "source-layer": name,
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
    "id": "hovered-trails-qa",
    "source": name + 's',
    "source-layer": name + '_qa',
    "type": "circle",
    "paint": hoveredPoiPaint,
    "filter": [
      "==", "OSM_ID", -1 
    ],
  }, 'hovered');
  addTrailLayer({
    "id": "hovered-pois",
    "source": 'trails_poi',
    "source-layer": 'trail_poi',
    "type": "circle",
    "paint": hoveredPoiPaint,
    "filter": [
      "==", "OSM_ID", -1 
    ],
  }, 'hovered');
  if (name === "water_trail") addTrailLayer({
    "id": "hovered-water-trail-pois",
    "source": 'water_trails_poi',
    "source-layer": 'water_trail_poi',
    "type": "circle",
    "paint": hoveredPoiPaint,
    "filter": [
      "==", "OSM_ID", -1 
    ],
  }, 'hovered');
  addTrailLayer({
    "id": "selected-paths",
    "source": name + 's',
    "source-layer": name,
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
    "id": "selected-trails-qa",
    "source": name + 's',
    "source-layer": name + '_qa',
    "type": "circle",
    "paint": selectedPoiPaint,
    "filter": [
      "==", "OSM_ID", -1 
    ],
  }, 'selected');
  addTrailLayer({
    "id": "selected-pois",
    "source": 'trails_poi',
    "source-layer": 'trail_poi',
    "type": "circle",
    "paint": selectedPoiPaint,
    "filter": [
      "==", "OSM_ID", -1 
    ],
  }, 'selected');
  if (name === "water_trail") addTrailLayer({
    "id": "selected-water-trail-pois",
    "source": 'water_trails_poi',
    "source-layer": 'water_trail_poi',
    "type": "circle",
    "paint": selectedPoiPaint,
    "filter": [
      "==", "OSM_ID", -1 
    ],
  }, 'selected');
  addTrailLayer({
    "id": "disallowed-waterways",
    "source": name + 's',
    "source-layer": name,
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
  addTrailLayer({
    "id": "informal-paths",
    "source": name + 's',
    "source-layer": name,
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
  addTrailLayer({
    "id": "disallowed-informal-paths",
    "source": name + 's',
    "source-layer": name,
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
  addTrailLayer({
    "id": "unspecified-informal-paths",
    "source": name + 's',
    "source-layer": name,
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
  addTrailLayer({
    "id": "disallowed-paths",
    "source": name + 's',
    "source-layer": name,
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
  addTrailLayer({
    "id": "unspecified-paths",
    "source": name + 's',
    "source-layer": name,
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
  addTrailLayer({
    "id": "unspecified-waterways",
    "source": name + 's',
    "source-layer": name,
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
  addTrailLayer({
    "id": "waterways",
    "source": name + 's',
    "source-layer": name,
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
  addTrailLayer({
    "id": "paths",
    "source": name + 's',
    "source-layer": name,
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
  addTrailLayer({
    "id": "bridge-casings",
    "source": name + 's',
    "source-layer": name,
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
  addTrailLayer({
    "id": "oneway-arrows",
    "source": name + 's',
    "source-layer": name,
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
  addTrailLayer({
    "id": "trails-labels",
    "source": name + 's',
    "source-layer": name,
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
  addTrailLayer({
    "id": "trails-pointer-targets",
    "source": name + 's',
    "source-layer": name,
    "type": "line",
    "paint": {
        "line-color": "transparent",
        "line-width": 16
    }
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
        ['==', ["get", "amenity"], "ranger_station"], 1,
        ['==', ["get", "highway"], "trailhead"], 3,
        ['==', ["get", "information"], "guidepost"], 19,
        ['==', ["get", "man_made"], "cairn"], 20,
        ['==', ["get", "information"], "route_marker"], 20,
        10,
      ],
      "text-field": [
        "step", ["zoom"], "",
        poiLabelZoom, ["get", "name"]
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
      "text-color":  [
        "case",
        ['==', ["get", "highway"], 'trailhead'], colors.trail,
        ['==', ["get", "amenity"], 'ranger_station'], colors.trail,
        colors.label
      ],
      "text-halo-width": 2,
      "text-halo-blur": 1,
      "text-halo-color": colors.labelHalo,
    }
  }, 'clickable');
  if (name === "water_trail") addTrailLayer({
    "id": "water-trail-pois",
    "source": 'water_trails_poi',
    "source-layer": 'water_trail_poi',
    "type": "symbol",
    "transition": {
      "duration": 0,
      "delay": 0
    },
    "layout": {
      "icon-image": [
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
            ['==', ["get", "natural"], "beaver_dam"], ["image", "beaver_dam-canoeable"],
            ['==', ["get", "waterway"], "waterfall"], ["image", "waterfall-canoeable"],
            ['in', ["get", "waterway"], ["literal", ["dam", "weir"]]], ["image", "dam-canoeable"],
            ["image", "lock-canoeable"],
          ],
          ['==', ["get", "natural"], "beaver_dam"], ["image", "beaver_dam"],
          ['==', ["get", "waterway"], "waterfall"], ["image", "waterfall"],
          ['in', ["get", "waterway"], ["literal", ["dam", "weir"]]], ["image", "dam"],
          ["image", "lock"],
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
      ],
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
          ['==', ["get", "lock"], "yes"], ["coalesce", ["get", "lock_name"], ["get", "lock_ref"]],
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
  if (name === "trail") addTrailLayer({
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
        poiLabelZoom, ["get", "name"]
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
      "text-color":  colors.natural,
      "text-halo-width": 2,
      "text-halo-blur": 1,
      "text-halo-color": colors.labelHalo,
    },
    "filter": [
      "has", "name",
    ]
  });
  addTrailLayer({
    "id": "trails-qa",
    "source": name + 's',
    "source-layer": name + '_qa',
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

var accessHierarchy = {
  all: [],
  atv: ['vehicle', 'motor_vehicle', 'atv'],
  bicycle:  ['vehicle', 'bicycle'],
  canoe: ['boat', 'canoe'],
  foot: ['foot'],
  horse: ['horse'],
  mtb: ['vehicle', 'bicycle', 'mtb'],
  portage: ['foot', 'portage'],
  snowmobile: ['vehicle', 'motor_vehicle', 'snowmobile'],
  wheelchair: ['foot', 'wheelchair'],
};

function onewayKeysForTravelMode(travelMode) {
  var keys = [];
  // oneway tag is irrelevant on waterways
  if (travelMode !== 'canoe') keys.push('oneway');
  return keys.concat(accessHierarchy[travelMode].map(function(val) {
    return 'oneway:' + val;
  }));
}

function specifyingKeysForLens(lens, travelMode) {
  switch (lens) {
    case 'name': 
      switch (travelMode) {
        case 'canoe': return ['name', 'noname', 'waterbody:name'];
        case 'mtb': return ['name', 'noname', 'mtb:name'];
      }
      return ['name', 'noname'];
    case 'oneway': return onewayKeysForTravelMode(travelMode);
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

  var specifiedAttributeExpression = attributeIsSpecifiedExpression(
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

  if (travelMode === 'canoe') {
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
    } else if (lens === 'oneway') {
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
  }
  
  return specifiedAttributeExpression;
}

function trailPoisFilter(travelMode) {
  if (travelMode === 'all') return null;
  var poiKeys = [travelMode];
  var poiKeysByTravelMode = {
    "foot": ["hiking"],
    "canoe": ["canoe", "portage"],
  };
  if (poiKeysByTravelMode[travelMode]) poiKeys = poiKeysByTravelMode[travelMode];
  return [
    'any',
    [
      "none",
      ["==", "highway", "trailhead"],
      ["in", "information", "guidepost", "route_marker"],
      ["==", "man_made", "cairn"],
    ],
    travelMode === 'canoe' ? [
      "any",
      ...poiKeys.map(function(key) {
        return ["==", key, "yes"];
      })
    ] :
    [
      "all",
      ...poiKeys.map(function(key) {
        return [
          "any",
          ["!has", key],
          ["==", key, "yes"],
        ];
      })
    ]
  ];
}

function onewayArrowsFilter(travelMode) {
  var filter = ['any'];
  var onewayKeys = onewayKeysForTravelMode(travelMode);
  while (onewayKeys.length) {
    var leastSpecificKey = onewayKeys.shift();
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
  if (travelMode === 'canoe') {
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
function onewayArrowsIconImageExpression(travelMode) {
  var expression = ['case'];
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
  if (travelMode === 'canoe') {
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
  var filter = [
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
  if (travelMode === 'canoe') {
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

  // ["!=", "true", "false"] always evalutes to true because "true" actually refers to the name of a
  // data attribute key, which is always undefined, while "false" is the string it's compared to.
  var allowedAccessExpression = ["!=", "true", "false"];
  var specifiedAccessExpression = ["!=", "true", "false"];
  var specifiedExpression;

  var showFixmesExpression = [lens === "fixme" ? "!=" : '==', "true", "false"];
  var showDisallowedExpression = [lens === "access" ? "!=" : '==', "true", "false"];
  var showUnspecifiedExpression = [lens !== "" ? "!=" : '==', "true", "false"];

  var pathsColors = colors.trail;
  var waterwaysColors = colors.water;

  if (travelMode !== 'all') {

    specifiedAccessExpression = accessIsSpecifiedExpression(travelMode);

    var modes = [travelMode];
    if (travelMode == 'canoe') modes.push('portage');
    allowedAccessExpression = [
      "any",
      ...modes.map(function(mode) {  
        return modeIsAllowedExpression(mode);
      })
    ];
  } else if (lens === 'access') {

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
  
    allowedAccessExpression = [
      "any",
      modeIsAllowedExpression("foot"),
      modeIsAllowedExpression("wheelchair"),
      modeIsAllowedExpression("bicycle"),
      modeIsAllowedExpression("horse"),
      modeIsAllowedExpression("atv"),
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

  var combinedFilterExpression = ["any"];
  function setTrailsLayerFilter(layerId, filter) {
    map.setFilter(layerId, filter);
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

  map
    .setLayoutProperty('hovered-trails-qa', 'visibility', lens === 'fixme' ? 'visible' : 'none')
    .setLayoutProperty('selected-trails-qa', 'visibility', lens === 'fixme' ? 'visible' : 'none')
    .setPaintProperty('paths', 'line-color', pathsColors)
    .setPaintProperty('informal-paths', 'line-color', pathsColors)
    .setPaintProperty('waterways', 'line-color', waterwaysColors)
    .setFilter('bridge-casings', ["all", ["has", "bridge"], ["!in", "bridge", "no", "abandoned", "raised", "proposed", "dismantled"], combinedFilterExpression])
    .setLayoutProperty('oneway-arrows', "icon-image", onewayArrowsIconImageExpression(travelMode))
    // oneway-arrows filter technically isn't needed since the icon-image doesn't display anything
    // if there isn't a relevant oneway value, but we might as well leave it for now in case we want
    // to add some other kind of styling in the future
    .setFilter('oneway-arrows', ["all", onewayArrowsFilter(travelMode), combinedFilterExpression])
    .setFilter('trails-qa', ["all", showFixmesExpression, combinedFilterExpression])
    .setFilter('trails-labels', combinedFilterExpression)
    .setFilter('trails-pointer-targets', combinedFilterExpression)
    .setFilter('trail-pois', trailPoisFilter(travelMode));
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
  var allowedAccessExpression = [
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

let isFocusing;

async function loadInitialMap() {

  isFocusing = false;//hashValue('focus') !== 'no';

  if (isFocusing) {
    const response = await fetch('json/focus.json');
    const focusJson = await response.json();
  
    // Add as source to the map
    map.addSource('focus-source', {
      'type': 'geojson',
      'data': focusJson
    });
    const focusCoords = focusJson.features[0].geometry.coordinates[0][1];
    const focusBounds = focusCoords.reduce(function(bounds, coord) {
      return bounds.extend(coord);
    }, new maplibregl.LngLatBounds(focusCoords[0], focusCoords[0]));
  
    map.setMaxBounds(new maplibregl.LngLatBounds([focusBounds.getWest()-1.5,focusBounds.getSouth()-1], [focusBounds.getEast()+1.5,focusBounds.getNorth()+1]));
  }

  updateForHash();
  updateTrailLayers();

  if (isFocusing) {
    map.addLayer({
      'id': 'focus',
      'type': 'fill',
      'source': 'focus-source',
      'paint': {
          'fill-color': '#f9f5ed',
          'fill-outline-color': '#E2C6C8',
      },
    });
  }

  // only add UI handlers after we've loaded the layers
  map.on('mousemove', didMouseMoveMap)
    .on('click', didClickMap);
}


function updateMapForSelection() {

  var id = selectedEntityInfo && selectedEntityInfo.id;
  var type = selectedEntityInfo && selectedEntityInfo.type;

  var idsToHighlight = [id ? id : -1];

  if (type === "relation") {
    var members = osmEntityCache[type[0] + id]?.members || [];
    members.forEach(function(member) {
      idsToHighlight.push(member.ref);
      
      if (member.type === "relation") {
        // only recurse down if we have the entity cached
        var childRelationMembers = osmEntityCache[member.type[0] + member.ref]?.members || [];
        childRelationMembers.forEach(function(member) {
          idsToHighlight.push(member.ref);
          // don't recurse relations again in case of self-references
        });
      }
    });
  }

  layerIdsByCategory.selected?.forEach(function(layerId) {
    // this will fail in rare cases where two features of different types but the same ID are both onscreen
    map.setFilter(layerId, ["in", "OSM_ID", ...idsToHighlight]);
  });
}

function updateMapForHover() {
  var entityId = hoveredEntityInfo?.id || -1;

  if (hoveredEntityInfo?.id == selectedEntityInfo?.id &&
    hoveredEntityInfo?.type == selectedEntityInfo?.type) {
    // don't show hover styling if already selected
    entityId = -1;
  }

  layerIdsByCategory.hovered?.forEach(function(layerId) {
    // this will fail in rare cases where two features of different types but the same ID are both onscreen
    map.setFilter(layerId, ["==", "OSM_ID", entityId]);
  });
}

function entityForEvent(e) {
  let layers = layerIdsByCategory.clickable.slice(); // copy array
  
  // we need to add focus as a target or else you can click hidden stuff
  if (isFocusing) layers.unshift('focus');

  var features = map.queryRenderedFeatures(e.point, {layers: layers});
  var feature = features.length && features[0];
  if (feature && feature.properties.OSM_ID && feature.properties.OSM_TYPE) {
    return {
      id: feature.properties.OSM_ID,
      type: feature.properties.OSM_TYPE,
      version: feature.properties.OSM_VERSION,
      changeset: feature.properties.OSM_CHANGESET,
      focusLngLat: e.lngLat,
    };
  }
  return null;
}

function didClickMap(e) {
  selectEntity(entityForEvent(e));
}

function didMouseMoveMap(e) {
  var newHoveredEntityInfo = entityForEvent(e);

  if (hoveredEntityInfo?.id != newHoveredEntityInfo?.id ||
    hoveredEntityInfo?.type != newHoveredEntityInfo?.type) {
    hoveredEntityInfo = newHoveredEntityInfo;
    
    // Change the cursor style as a UI indicator
    map.getCanvas().style.cursor = hoveredEntityInfo ? 'pointer' : '';

    updateMapForHover();
  }
}