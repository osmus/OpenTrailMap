var thisYear = new Date().getFullYear();
var checkDateColors = [
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
var editedDateColors = [
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
var impliedYesExpressions = {
  atv: [],
  bicycle: [
    ["==", "highway", "cycleway"],
    ["==", "highway", "bridleway"],
    ["==", "highway", "service"],
    ["==", "highway", "unclassified"],
    ["==", "highway", "residential"],
    ["==", "highway", "tertiary"],
    ["==", "highway", "secondary"],
    ["==", "highway", "primary"],
    ["==", "highway", "tertiary_link"],
    ["==", "highway", "secondary_link"],
    ["==", "highway", "primary_link"],
  ],
  foot: [
    ["==", "highway", "path"],
    ["==", "highway", "footway"],
    ["==", "highway", "steps"],
    ["==", "highway", "bridleway"],
    ["==", "highway", "service"],
    ["==", "highway", "unclassified"],
    ["==", "highway", "residential"],
    ["==", "highway", "tertiary"],
    ["==", "highway", "secondary"],
    ["==", "highway", "primary"],
    ["==", "highway", "tertiary_link"],
    ["==", "highway", "secondary_link"],
    ["==", "highway", "primary_link"],
  ],
  horse: [
    ["==", "highway", "bridleway"]
  ],
  wheelchair: [],
  canoe: [],
  portage: [],
  snowmobile: [],
};

var impliedNoExpressions = {
  atv: [
    [
      "any",
      ["==", "highway", "footway"],
      ["==", "highway", "steps"],
      ["==", "vehicle", "no"],
      ["==", "vehicle", "private"],
      ["==", "vehicle", "discouraged"],
      ["==", "motor_vehicle", "no"],
      ["==", "motor_vehicle", "private"],
      ["==", "motor_vehicle", "discouraged"],
      ["!has", "highway"],
    ]
  ],
  snowmobile: [
    [
      "any",
      ["==", "highway", "footway"],
      ["==", "highway", "steps"],
      ["==", "vehicle", "no"],
      ["==", "vehicle", "private"],
      ["==", "vehicle", "discouraged"],
      ["==", "motor_vehicle", "no"],
      ["==", "motor_vehicle", "private"],
      ["==", "motor_vehicle", "discouraged"],
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
      ["==", "vehicle", "no"],
      ["==", "vehicle", "private"],
      ["==", "vehicle", "discouraged"],
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
        ["!=", "smoothness", "excellent"],
        ["!=", "smoothness", "very_good"],
        ["!=", "smoothness", "good"],
        ["!=", "smoothness", "intermediate"],
      ],
      ["!has", "highway"],
    ]
  ],
};

function toggleWaterTrailsIfNeeded() {

  if (travelMode === 'canoe' && !map.getSource('water_trails')) {
    clearTrailLayers();
    if (map.getSource('trails')) map.removeSource('trails');
    if (map.getSource('trails_poi')) map.removeSource('trails_poi');
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
    map.addSource("trails_poi", {
      type: "vector",
      url: "https://dwuxtsziek7cf.cloudfront.net/trails_poi.json",
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>'
    });
    loadTrailLayers('trail');
  }  
}

let trailLayerIds = [];
function addTrailLayer(def) {
  trailLayerIds.push(def.id);
  map.addLayer(def);
}
function clearTrailLayers() {
  trailLayerIds.forEach(function(id) {
    map.removeLayer(id);
  });
  trailLayerIds = [];
}

function loadTrailLayers(name) {

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
    ]
  });
  addTrailLayer({
    "id": "hovered-pois",
    "source": name + 's_poi',
    "source-layer": name + '_poi',
    "type": "circle",
    "paint": {
      "circle-radius": [
        "interpolate", ["linear"], ["zoom"],
        12, 9,
        22, 18
      ],
      "circle-opacity": 0.25,
      "circle-color": colors.selection,
    },
    "filter": [
      "==", "OSM_ID", -1 
    ]
  });
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
    ]
  });
  addTrailLayer({
    "id": "selected-pois",
    "source": name + 's_poi',
    "source-layer": name + '_poi',
    "type": "circle",
    "paint": {
      "circle-radius": [
        "interpolate", ["linear"], ["zoom"],
        12, 10,
        22, 20
      ],
      "circle-opacity": 0.4,
      "circle-color": colors.selection,
    },
    "filter": [
      "==", "OSM_ID", -1 
    ]
  });
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
      "line-color": colors.bgwater,
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
      "icon-image": [
        "case",
        ["==", ["get", "oneway"], "-1"], ["image", "oneway-arrow-left"],
        ["image", "oneway-arrow-right"]
      ],
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
  });
  addTrailLayer({
    "id": "trail-pois",
    "source": name + 's_poi',
    "source-layer": name + '_poi',
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
        ['==', ["get", "man_made"], "monitoring_station"], ["image", "streamgage"],
        ['==', ["get", "man_made"], "cairn"], ["image", "cairn"],
        ['==', ["get", "information"], "guidepost"], ["image", "guidepost"],
        ['==', ["get", "information"], "route_marker"], ["image", "route_marker"],
        [
          'all',
          ['==', ["get", "leisure"], "slipway"],
          ['==', ["get", "trailer"], "no"],
        ], ["image", "slipway-canoe"],
        ['==', ["get", "leisure"], "slipway"], ["image", "slipway-canoe-trailer"],
        ['any', ["==", ["get", "waterway"], "access_point"], ['in', ["get", "canoe"], ["literal", ["put_in", "put_in;egress", "egress"]]]], ["image", "canoe"],
        ["all", ["has", "canoe"], ["!", ["in", ["get", "canoe"], ["literal", ["no", "private", "discouraged"]]]]], ["case",
          ['==', ["get", "waterway"], "waterfall"], ["image", "waterfall-canoeable"],
          ['in', ["get", "waterway"], ["literal", ["dam", "weir"]]], ["image", "dam-canoeable"],
          ['==', ["get", "lock"], "yes"], ["image", "lock-canoeable"],
          ""
        ],
        ['==', ["get", "waterway"], "waterfall"], ["image", "waterfall"],
        ['in', ["get", "waterway"], ["literal", ["dam", "weir"]]], ["image", "dam"],
        ['==', ["get", "lock"], "yes"], ["image", "lock"],
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
        ['==', ["get", "man_made"], "monitoring_station"], 2,
        ['==', ["get", "information"], "guidepost"], 19,
        ['==', ["get", "information"], "route_marker"], 20,
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
      "text-color":  [
        "case",
        ['==', ["get", "highway"], 'trailhead'], colors.trail,
        ['==', ["get", "amenity"], 'ranger_station'], colors.trail,
        colors.label
      ],
      "text-halo-width": 2,
      "text-halo-blur": 1,
      "text-halo-color": colors.labelHalo,
    },
    "filter": [
      "any",
      ["!=", "leisure", "slipway"],
      [
        "all",
        ["==", "leisure", "slipway"],
        ["!=", "canoe", "no"],
        ["!=", "canoe", "private"],
        ["!=", "canoe", "discouraged"],
      ],
    ]
  });
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
  });
}

function isSpecifiedExpressionForLens(lens) {

  var keysByLens = {
    name: ['name', 'noname'],
    fixme: ['fixme', 'FIXME', 'todo', 'TODO'],
    check_date: ['check_date', 'survey:date'],
  };
  var keysByLensByMode = {
    atv: {
      oneway: ['oneway', 'oneway:vehicle', 'oneway:motor_vehicle', 'oneway:atv'],
    },
    bicycle: {
      oneway: ['oneway', 'oneway:vehicle', 'oneway:bicycle'],
    },
    canoe: {
      name: ['name', 'noname', 'waterbody:name'],
      oneway: ['oneway:boat', 'oneway:canoe'],
    },
    foot: {
      oneway: ['oneway', 'oneway:foot'],
    },
    horse: {
      oneway: ['oneway', 'oneway:horse'],
    },
    mtb: {
      name: ['name', 'noname', 'mtb:name'],
      oneway: ['oneway', 'oneway:vehicle', 'oneway:bicycle', 'oneway:mtb'],
    },
    snowmobile: {
      oneway: ['oneway', 'oneway:vehicle', 'oneway:motor_vehicle', 'oneway:snowmobile'],
    },
    wheelchair: {
      oneway: ['oneway', 'oneway:foot', 'oneway:wheelchair'],
    },
  };

  var keys = [lens];
  if (keysByLensByMode[travelMode] && keysByLensByMode[travelMode][lens]) keys = keysByLensByMode[travelMode][lens];
  else if (keysByLens[lens]) keys = keysByLens[lens];

  // for most keys we're looking for missing values, but for fixmes we're looking for extant values
  var hasKeyMeansSpecified = lens !== "fixme";

  var specifiedAttributeExpression = [
    hasKeyMeansSpecified ? "any" : "all",
    ...keys.map(key => [
      hasKeyMeansSpecified ? "has" : "!has",
      key
    ]),
  ];
  if (travelMode === 'canoe') {
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
  return specifiedAttributeExpression;
}

function updateTrailLayers() {
  toggleWaterTrailsIfNeeded();

  // ["!=", "true", "false"] always evalutes to true because "true" actually refers to the name of a
  // data attribute key, which is always undefined, while "false" is the string it's compared to.
  var allowedAccessExpression = ["!=", "true", "false"];
  var specifiedAccessExpression = ["!=", "true", "false"];
  var specifiedExpression;

  var showFixmesExpression = [lens === "fixme" ? "!=" : '==', "true", "false"];
  var showDisallowedPathsExpression = [lens === "access" ? "!=" : '==', "true", "false"];
  var showUnspecifiedPathsExpression = [lens !== "" ? "!=" : '==', "true", "false"];

  var pathsColors = colors.trail;
  var waterwaysColors = colors.water;

  var onewayArrowsFilter = [
    "==", "oneway", "yes" 
  ];

  if (travelMode !== 'all') {

    var modes = [travelMode];
    if (travelMode == 'canoe') modes.push('portage');
  
    allowedAccessExpression = ["any"];
  
    onewayArrowsFilter = [
      "any",
      [
        "all",
        ...modes.map(mode => ["!has", "oneway:" + mode]),
        ["==", "oneway", "yes"],
      ],
      ...modes.map(mode => ["==", "oneway:" + mode, "yes"]),
    ];
    
    specifiedAccessExpression = ["any"];
  
    modes.forEach(mode => {
      specifiedAccessExpression.push([
          "none",
          ["any",
            [
              "all",
              ["!has", mode],
              ...notNoAccessExpressions("access"),
              [
                "none",
                ...impliedYesExpressions[mode],
                ...impliedNoExpressions[mode]
              ]
            ],
            // access if always unspecified if mode is explicitly set to `unknown`
            ["==", mode, "unknown"],
          ]
        ]);
  
      allowedAccessExpression.push(modeIsAllowedExpression(mode));
    });
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
    
    if (lens === 'check_date' || lens === 'OSM_TIMESTAMP') waterwaysColors = pathsColors;
  
    specifiedExpression = isSpecifiedExpressionForLens(lens);
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
    showDisallowedPathsExpression,
    ["none", allowedAccessExpression],
    specifiedExpression,
    ["!=", "informal", "yes"],
    ["has", "highway"],
  ]);
  setTrailsLayerFilter('disallowed-informal-paths', [
    "all",
    showDisallowedPathsExpression,
    ["none", allowedAccessExpression],
    specifiedExpression,
    ["==", "informal", "yes"],
    ["has", "highway"],
  ]);
  setTrailsLayerFilter('unspecified-paths', [
    "all",
    showUnspecifiedPathsExpression,
    allowedAccessExpression,
    ["none", specifiedExpression],
    ["!=", "informal", "yes"],
    ["has", "highway"],
  ]);
  setTrailsLayerFilter('unspecified-informal-paths', [
    "all",
    showUnspecifiedPathsExpression,
    allowedAccessExpression,
    ["none", specifiedExpression],
    ["==", "informal", "yes"],
    ["has", "highway"],
  ]);
  setTrailsLayerFilter('disallowed-waterways', [
    "all",
    showDisallowedPathsExpression,
    ["none", allowedAccessExpression],
    specifiedExpression,
    ["!has", "highway"],
  ]);
  setTrailsLayerFilter('unspecified-waterways', [
    "all",
    allowedAccessExpression,
    ["none", specifiedExpression],
    ["!has", "highway"],
  ]);
  setTrailsLayerFilter('waterways', [
    "all",
    allowedAccessExpression,
    specifiedExpression,
    ["!has", "highway"],
  ]);

  map
    .setPaintProperty('paths', 'line-color', pathsColors)
    .setPaintProperty('informal-paths', 'line-color', pathsColors)
    .setPaintProperty('waterways', 'line-color', waterwaysColors)
    .setFilter('oneway-arrows', ["all", onewayArrowsFilter, combinedFilterExpression])
    .setFilter('trails-qa', ["all", showFixmesExpression, combinedFilterExpression])
    .setFilter('trails-labels', combinedFilterExpression)
    .setFilter('trails-pointer-targets', combinedFilterExpression);
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
    const focusBounds = focusCoords.reduce((bounds, coord) => {
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

  // this will fail in cases where two features of different types but the same ID are both onscreen
  map.setFilter('selected-paths', ["in", "OSM_ID", ...idsToHighlight]);
  map.setFilter('selected-pois', ["in", "OSM_ID", ...idsToHighlight]);
}

function updateMapForHover() {
  var entityId = hoveredEntityInfo?.id || -1;

  if (hoveredEntityInfo?.id == selectedEntityInfo?.id &&
    hoveredEntityInfo?.type == selectedEntityInfo?.type) {
    // don't show hover styling if already selected
    entityId = -1;
  }

  // this will fail in cases where two features of different types but the same ID are both onscreen
  map.setFilter('hovered-paths', ["==", "OSM_ID", entityId]);
  map.setFilter('hovered-pois', ["==", "OSM_ID", entityId]);
}

function entityForEvent(e) {
  let layers = ['trails-qa', 'trail-pois', 'trails-pointer-targets'];
  
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