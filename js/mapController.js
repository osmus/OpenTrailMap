var impliedYesExpressions = {
  atv: [
    ["==", "highway", "track"]
  ],
  bicycle: [
    ["==", "highway", "path"],
    ["==", "highway", "cycleway"],
    ["==", "highway", "bridleway"],
    ["==", "highway", "track"]
  ],
  foot: [
    ["==", "highway", "path"],
    ["==", "highway", "footway"],
    ["==", "highway", "steps"],
    ["==", "highway", "bridleway"],
    ["==", "highway", "track"]
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

function updateMapLayers() {
  if (mapStyle === 'access') {
    updateMapLayersForAllAccess();
  } else if (basicMapStyles.includes(mapStyle)) {
    updateMapLayersForTravelMode(mapStyle);
  } else {
    updateMapLayersForAdvanced(mapStyle);
  }

  if (mapStyle === 'canoe') {
    map
      .setFilter('disallowed-waterways', [
        "all",
        ["!has", "highway"],
        [
          "none",
          [
            "all",
            ...notNoAccessExpressions('canoe'),
          ]
        ],
      ])
      .setFilter('waterways', [
        "all",
        ["!has", "highway"],
        ...notNoAccessExpressions('canoe'),
      ])
      .setLayoutProperty('waterways', 'visibility', 'visible')
      .setFilter('trail-pois', [
        "any",
        ["==", "amenity", "ranger_station"],
        ["==", "canoe", "put_in"],
      ]);
  } else {
    map.setFilter('disallowed-waterways', [
      "all",
      ["!has", "highway"],
      ...notNoAccessExpressions('canoe'),
    ])
    .setLayoutProperty('waterways', 'visibility', 'none')
    .setFilter('trail-pois', [
      "any",
      ["==", "amenity", "ranger_station"],
      ["==", "highway", "trailhead"],
    ]);
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

function updateMapLayersForAdvanced(key) {

  var has = key === "fixme" ? "!has" : "has";
  var noHas = key === "fixme" ? "has" : "!has";

  map
    .setLayoutProperty('disallowed-paths', 'visibility', 'none')
    .setLayoutProperty('disallowed-informal-paths', 'visibility', 'none')
    .setPaintProperty('paths', 'line-color', colors.specified)
    .setPaintProperty('informal-paths', 'line-color', colors.specified)
    .setFilter('paths', [
      "all",
      [has, key],
      ["!=", "informal", "yes"],
      ["has", "highway"],
    ])
    .setFilter('informal-paths', [
      "all",
      [has, key],
      ["==", "informal", "yes"],
      ["has", "highway"],
    ])
    .setFilter('unspecified-paths', [
      "all",
      [noHas, key],
      ["!=", "informal", "yes"],
      ["has", "highway"],
    ])
    .setFilter('unspecified-informal-paths', [
      "all",
      [noHas, key],
      ["==", "informal", "yes"],
      ["has", "highway"],
    ]);

  if (key === 'operator') {
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

  if (mapStyle === 'check_date') {
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
    // access not fully unspecified if any access tag is explicitly set to `unknown`
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

function updateMapLayersForTravelMode(mode) {

  var unspecifiedExpression = [
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
  ];

  var allowedExpression = modeIsAllowedExpression(mode);

  updateMapLayersForAccess(allowedExpression, unspecifiedExpression);
}

function loadInitialMap() {
  map.addSource("trails", {
    type: "vector",
    url: "https://d1zqyi8v6vm8p9.cloudfront.net/trails.json",
    attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>'
  });

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
      ["image", "canoe"]
    ];
  var poiIconSize = [
      "interpolate", ["linear"], ["zoom"],
      12, 0.5,
      22, 1
    ];

  map.addLayer({
    "id": "hovered-paths",
    "source": "trails",
    "source-layer": "trail",
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
  }).addLayer({
    "id": "hovered-pois",
    "source": "trails",
    "source-layer": "trail_poi",
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
  }).addLayer({
    "id": "selected-paths",
    "source": "trails",
    "source-layer": "trail",
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
  }).addLayer({
    "id": "selected-pois",
    "source": "trails",
    "source-layer": "trail_poi",
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
  }).addLayer({
    "id": "disallowed-waterways",
    "source": "trails",
    "source-layer": "trail",
    "type": "line",
    "layout": {
      "line-cap": "butt",
      "line-join": "round"
    },
    "paint": {
      //"line-opacity": lineOpacity,
      "line-width": lineWidth,
      "line-color": colors.bgwater,
    }
  }).addLayer({
    "id": "informal-paths",
    "source": "trails",
    "source-layer": "trail",
    "type": "line",
    "layout": {
      "line-cap": "butt",
      "line-join": "round"
    },
    "paint": {
      //"line-opacity": lineOpacity,
      "line-width": lineWidth,
      "line-color": colors.public,
      "line-dasharray": [2, 2],
    }
  })
  .addLayer({
    "id": "disallowed-informal-paths",
    "source": "trails",
    "source-layer": "trail",
    "type": "line",
    "layout": {
      "line-cap": "butt",
      "line-join": "round"
    },
    "paint": {
      //"line-opacity": lineOpacity,
      "line-width": lineWidth,
      "line-color": colors.noaccess,
      "line-dasharray": [2, 2],
    }
  })
  .addLayer({
    "id": "unspecified-informal-paths",
    "source": "trails",
    "source-layer": "trail",
    "type": "line",
    "layout": {
      "line-cap": "butt",
      "line-join": "round",
    },
    "paint": {
      //"line-opacity": lineOpacity,
      "line-width": lineWidth,
      "line-color": colors.unspecified,
      "line-dasharray": [2, 2],
    }
  })
  .addLayer({
    "id": "disallowed-paths",
    "source": "trails",
    "source-layer": "trail",
    "type": "line",
    "layout": {
      "line-cap": "butt",
      "line-join": "round",
    },
    "paint": {
      //"line-opacity": lineOpacity,
      "line-width": lineWidth,
      "line-pattern": ["image", "disallowed-stripes"],
    }
  })
  .addLayer({
    "id": "unspecified-paths",
    "source": "trails",
    "source-layer": "trail",
    "type": "line",
    "layout": {
      "line-cap": "butt",
      "line-join": "round",
    },
    "paint": {
      //"line-opacity": lineOpacity,
      "line-width": lineWidth,
      "line-color": colors.unspecified,
    }
  })
  .addLayer({
    "id": "waterways",
    "source": "trails",
    "source-layer": "trail",
    "type": "line",
    "layout": {
      "line-cap": "butt",
      "line-join": "round"
    },
    "paint": {
      //"line-opacity": lineOpacity,
      "line-width": lineWidth,
      "line-color": colors.water,
    }
  })
  .addLayer({
    "id": "paths",
    "source": "trails",
    "source-layer": "trail",
    "type": "line",
    "layout": {
      "line-cap": "butt",
      "line-join": "round",
    },
    "paint": {
      //"line-opacity": lineOpacity,
      "line-width": lineWidth,
      "line-color": colors.public,
    }
  })
  .addLayer({
    "id": "trails-labels",
    "source": "trails",
    "source-layer": "trail",
    "type": "symbol",
    "layout": {
      "text-field": ['get', 'name'],
      "text-size": 13,
      "symbol-placement": "line"
    },
    "paint": {
      "text-color": colors.label,
      "text-halo-width": 1.5,
      "text-halo-color": colors.labelHalo,
    }
  })
  .addLayer({
    "id": "trails-pointer-targets",
    "source": "trails",
    "source-layer": "trail",
    "type": "line",
    "paint": {
        "line-color": "transparent",
        "line-width": 16
    }
  })
  .addLayer({
    "id": "trail-pois",
    "source": "trails",
    "source-layer": "trail_poi",
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
      "text-font": ["Open Sans Semibold", "Arial Unicode MS Semibold"],
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
  });

  updateMapLayers();
  updateForHash();

  // only add UI handlers after we've loaded the layers
  map.on('mousemove', didMouseMoveMap)
    .on('click', didClickMap);
}


function updateMapForSelection() {

  var id = selectedEntityInfo && selectedEntityInfo.id;
  var type = selectedEntityInfo && selectedEntityInfo.type;

  var wayIds = [type === "way" ? id : -1];
  var nodeIds = [type === "node" ? id : -1];

  if (type === "relation") {
    var members = osmEntityCache[type[0] + id]?.members || [];
    members.forEach(function(member) {
      if (member.type === "way") {
        wayIds.push(member.ref);
      } else if (member.type === "node") {
        nodeIds.push(member.ref);
      } else if (member.type === "relation") {
        // only recurse down if we have the entity cached
        var childRelationMembers = osmEntityCache[member.type[0] + member.ref]?.members || [];
        childRelationMembers.forEach(function(member) {
          if (member.type === "way") {
            wayIds.push(member.ref);
          } else if (member.type === "node") {
            nodeIds.push(member.ref);
          }
          // don't recurse relations again in case of self-references
        });
      }
    });
  }

  map.setFilter('selected-paths', ["in", "OSM_ID", ...wayIds]);
  map.setFilter('selected-pois', ["in", "OSM_ID", ...nodeIds]);
}

function updateMapForHover() {
  var type = hoveredEntityInfo?.type;
  var entityId = hoveredEntityInfo?.id || -1;

  if (hoveredEntityInfo?.id == selectedEntityInfo?.id &&
    hoveredEntityInfo?.type == selectedEntityInfo?.type) {
    // don't show hover styling if already selected
    entityId = -1;
  }

  map.setFilter('hovered-paths', ["==", "OSM_ID", type === "way" ? entityId : -1]);
  map.setFilter('hovered-pois', ["==", "OSM_ID", type === "node" ? entityId : -1]);
}

function entityForEvent(e) {
  var features = map.queryRenderedFeatures(e.point, {layers: ['trail-pois', 'trails-pointer-targets']});
  var feature = features.length && features[0];
  if (feature && feature.properties.OSM_ID) {
    var type = (feature.properties.SRC_GEOM === "polygon" || !feature.sourceLayer.includes("poi")) ? 'way' : 'node';
    return {
      id: feature.properties.OSM_ID,
      type: type,
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