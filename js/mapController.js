var impliedYesExpressions = {
  atv: [
    ["==", "highway", "track"]
  ],
  bicycle: [
    ["==", "highway", "cycleway"],
    ["==", "highway", "bridleway"],
    ["==", "highway", "track"],
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
    ["==", "highway", "track"],
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
    ["==", "highway", "bridleway"],
    ["==", "highway", "track"]
  ],
  wheelchair: [
    ["==", "smoothness", "excellent"],
    ["==", "smoothness", "very_good"],
    ["==", "smoothness", "good"],
    ["==", "smoothness", "intermediate"],
  ],
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

  if (mapStyle === 'canoe' && !map.getSource('water_trails')) {
    clearTrailLayers();
    if (map.getSource('trails')) map.removeSource('trails');
    map.addSource("water_trails", {
      type: "vector",
      url: "https://d1zqyi8v6vm8p9.cloudfront.net/water_trails.json",
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>'
    });
    map.addSource("water_trails_poi", {
      type: "vector",
      url: "https://d1zqyi8v6vm8p9.cloudfront.net/water_trails_poi.json",
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>'
    });
    loadTrailLayers('water_trail');

  } else if (mapStyle !== 'canoe' && !map.getSource('trails')) {
    clearTrailLayers();
    if (map.getSource('water_trails')) map.removeSource('water_trails');
    if (map.getSource('water_trails_poi')) map.removeSource('water_trails_poi');
    map.addSource("trails", {
      type: "vector",
      url: "https://d1zqyi8v6vm8p9.cloudfront.net/trails.json",
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
  var lineOpacity = [
      "interpolate", ["linear"], ["zoom"],
      12, 1,
      22, 0.4
    ];
  var poiIconImage = [
      "case",
      ['==', ["get", "amenity"], "ranger_station"], ["image", "ranger-station"],
      ['==', ["get", "highway"], "trailhead"], ["image", "trailhead"],
      [
        'all',
        ['==', ["get", "leisure"], "slipway"],
        ['==', ["get", "trailer"], "no"],
      ], ["image", "slipway-canoe"],
      ['==', ["get", "leisure"], "slipway"], ["image", "slipway-canoe-trailer"],
      ["image", "canoe"]
    ];
  var poiIconSize = [
      "interpolate", ["linear"], ["zoom"],
      12, 0.5,
      22, 1
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
    "source": name == 'trail' ? "trails" : 'water_trails_poi',
    "source-layer": name == 'trail' ? "trail_poi" : 'water_trail_poi',
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
    "source": name == 'trail' ? "trails" : 'water_trails_poi',
    "source-layer": name == 'trail' ? "trail_poi" : 'water_trail_poi',
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
      //"line-opacity": lineOpacity,
      "line-width": lineWidth,
      "line-color": colors.bgwater,
    },
    "filter": [
      "all",
      ["!has", "highway"],
      [
        "none",
        [
          "all",
          ...notNoAccessExpressions('canoe'),
        ]
      ],
    ]
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
      //"line-opacity": lineOpacity,
      "line-width": lineWidth,
      "line-color": colors.public,
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
      //"line-opacity": lineOpacity,
      "line-width": lineWidth,
      "line-color": colors.noaccess,
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
      //"line-opacity": lineOpacity,
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
      //"line-opacity": lineOpacity,
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
      //"line-opacity": lineOpacity,
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
      //"line-opacity": lineOpacity,
      "line-width": lineWidth,
      "line-color": colors.water,
    },
    "filter": [
      "all",
      ["!has", "highway"],
      ...notNoAccessExpressions('canoe'),
    ]
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
      //"line-opacity": lineOpacity,
      "line-width": lineWidth,
      "line-color": colors.public,
    }
  });
  addTrailLayer({
    "id": "oneway-arrows",
    "source": name + 's',
    "source-layer": name,
    "type": "symbol",
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
      "text-field": ['get', 'name'],
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
    "source": name == 'trail' ? "trails" : 'water_trails_poi',
    "source-layer": name == 'trail' ? "trail_poi" : 'water_trail_poi',
    "type": "symbol",
    "transition": {
      "duration": 0,
      "delay": 0
    },
    "layout": {
      "icon-image": poiIconImage,
      "icon-size": poiIconSize,
      "symbol-placement": "point",
      "text-field": ["step", ["zoom"], "", poiLabelZoom, ["get", "name"]],
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
      "text-color": colors.poiLabel,
      "text-halo-width": 2,
      "text-halo-blur": 1,
      "text-halo-color": colors.labelHalo,
    },
    "filter": [
      "any",
      ["==", "amenity", "ranger_station"],
      ["==", "highway", "trailhead"],
      ["==", "canoe", "put_in"],
      [
        "all",
        ["==", "leisure", "slipway"],
        ["!=", "canoe", "no"],
        ["!=", "canoe", "private"],
        ["!=", "canoe", "discouraged"],
      ],
    ]
  });
}

function updateMapLayers() {
  toggleWaterTrailsIfNeeded();

  map
    .setFilter('oneway-arrows', [
      "==", "oneway", "yes" 
    ]);

  if (mapStyle === 'access') {
    updateMapLayersForAllAccess();
  } else if (basicMapStyles.includes(mapStyle)) {
    updateMapLayersForTravelMode(mapStyle);
  } else {
    updateMapLayersForAdvanced(mapStyle);
  }
}

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
  2023, '#67001f',
];

var keysForStyle = {
  name: ['name', 'noname'],
  fixme: ['fixme', 'FIXME', 'todo', 'TODO'],
  check_date: ['check_date', 'survey:date']
};

function updateMapLayersForAdvanced(style) {

  var keys = [style];
  if (keysForStyle[style]) keys = keysForStyle[style];

  // for most keys we're looking for missing values, but for fixmes we're looking for extant values
  var hasKeyMeansSpecified = style !== "fixme";

  var specifiedExpression = [
    hasKeyMeansSpecified ? "any" : "all",
    ...keys.map(key => [
      hasKeyMeansSpecified ? "has" : "!has",
      key
    ]),
  ];
  var unspecifiedExpression = [
    hasKeyMeansSpecified ? "all" : "any",
    ...keys.map(key => [
      hasKeyMeansSpecified ? "!has" : "has",
      key
    ]), 
  ];

  map
    .setLayoutProperty('disallowed-paths', 'visibility', 'none')
    .setLayoutProperty('disallowed-informal-paths', 'visibility', 'none')
    .setPaintProperty('paths', 'line-color', colors.specified)
    .setPaintProperty('informal-paths', 'line-color', colors.specified)
    .setFilter('paths', [
      "all",
      specifiedExpression,
      ["!=", "informal", "yes"],
      ["has", "highway"],
    ])
    .setFilter('informal-paths', [
      "all",
      specifiedExpression,
      ["==", "informal", "yes"],
      ["has", "highway"],
    ])
    .setFilter('unspecified-paths', [
      "all",
      unspecifiedExpression,
      ["!=", "informal", "yes"],
      ["has", "highway"],
    ])
    .setFilter('unspecified-informal-paths', [
      "all",
      unspecifiedExpression,
      ["==", "informal", "yes"],
      ["has", "highway"],
    ]);

  if (style === 'operator') {
    // if a path is `informal=yes` then there's probably no operator, always style as complete
    map
      .setFilter('informal-paths', [
        "all",
        ["==", "informal", "yes"],
        ["has", "highway"],
      ]);
    map.setLayoutProperty('unspecified-informal-paths', 'visibility', 'none');
  } else {
    map.setLayoutProperty('unspecified-informal-paths', 'visibility', 'visible');
  }

  if (style === 'check_date') {
    map
      .setPaintProperty('paths', 'line-color', checkDateColors)
      .setPaintProperty('informal-paths', 'line-color', checkDateColors);
  }
}

function updateMapLayersForAccess(allowedExpression, unspecifiedExpression) {
  map
    .setLayoutProperty('disallowed-paths', 'visibility', 'visible')
    .setLayoutProperty('disallowed-informal-paths', 'visibility', 'visible')
    .setLayoutProperty('unspecified-informal-paths', 'visibility', 'visible')
    .setPaintProperty('paths', 'line-color', colors.public)
    .setPaintProperty('informal-paths', 'line-color', colors.public)
    .setFilter('paths', [
      "all",
      allowedExpression,
      ["none", unspecifiedExpression],
      ["!=", "informal", "yes"],
      ["has", "highway"],
    ])
    .setFilter('informal-paths', [
      "all",
      allowedExpression,
      ["none", unspecifiedExpression],
      ["==", "informal", "yes"],
      ["has", "highway"],
    ])
    .setFilter('disallowed-paths', [
      "all",
      ["none", allowedExpression],
      ["none", unspecifiedExpression],
      ["!=", "informal", "yes"],
      ["has", "highway"],
    ])
    .setFilter('disallowed-informal-paths', [
      "all",
      ["none", allowedExpression],
      ["none", unspecifiedExpression],
      ["==", "informal", "yes"],
      ["has", "highway"],
    ])
    .setFilter('unspecified-paths', [
      "all",
      unspecifiedExpression,
      ["!=", "informal", "yes"],
      ["has", "highway"],
    ])
    .setFilter('unspecified-informal-paths', [
      "all",
      unspecifiedExpression,
      ["==", "informal", "yes"],
      ["has", "highway"],
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
  var allowedExpression = [
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
    allowedExpression.push(
      [
        "any",
        ["has", mode],
        ["none",
          ...impliedNoExpressions[mode],
        ],
      ]
    );
  }
  return allowedExpression;
}

function updateMapLayersForAllAccess() {

  var unspecifiedExpression = [
    "any",
    // access not fully specified if any access tag is explicitly set to `unknown`
    ["==", "access", "unknown"],
    ["==", "foot", "unknown"],
    ["==", "wheelchair", "unknown"],
    ["==", "bicycle", "unknown"],
    ["==", "horse", "unknown"],
    ["==", "atv", "unknown"],
  ];

  var allowedExpression = [
    "any",
    modeIsAllowedExpression("foot"),
    modeIsAllowedExpression("wheelchair"),
    modeIsAllowedExpression("bicycle"),
    modeIsAllowedExpression("horse"),
    modeIsAllowedExpression("atv"),
  ];

  updateMapLayersForAccess(allowedExpression, unspecifiedExpression);
}

function updateMapLayersForTravelMode(mapStyle) {

  var modes = [mapStyle];
  if (mapStyle == 'canoe') modes.push('portage');

  var unspecifiedExpression = ["any"];
  var allowedExpression = ["any"];

  map
    .setFilter('oneway-arrows', [
      "any",
      [
        "all",
        ...modes.map(mode => ["!has", "oneway:" + mode]),
        ["==", "oneway", "yes"],
      ],
      ...modes.map(mode => ["==", "oneway:" + mode, "yes"]),
    ]);

  modes.forEach(mode => {
    unspecifiedExpression.push([
      "any",
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
    ]);

    allowedExpression.push(modeIsAllowedExpression(mode));
  });

  updateMapLayersForAccess(allowedExpression, unspecifiedExpression);
}

let isFocusing;

async function loadInitialMap() {

  let isFocusing = hashValue('focus') !== 'no';

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
  updateMapLayers();

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
  let layers = ['trail-pois', 'trails-pointer-targets'];
  
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