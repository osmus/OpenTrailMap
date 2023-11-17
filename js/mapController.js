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
    ]
  ],
  foot: [],
  horse: [
    ["==", "highway", "steps"],
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
      ]
    ]
  ],
};

function updateMapLayers() {
  if (basicMapStyles.includes(mapStyle)) {
    updateMapLayersForTravelMode(mapStyle);
  } else {
    map
      .setLayoutProperty('disallowed-paths', 'visibility', 'none')
      .setLayoutProperty('disallowed-informal-paths', 'visibility', 'none');
    
    updateMapLayersForAdvanced(mapStyle);
  }
}

function updateMapLayersForAdvanced(key) {

  map
    .setFilter('paths', [
      "all",
      ["has", key],
      ["!=", "informal", "yes"]
    ])
    .setFilter('informal-paths', [
      "all",
      ["has", key],
      ["==", "informal", "yes"]
    ])
    .setFilter('unspecified-paths', [
      "all",
      ["!has", key],
      ["!=", "informal", "yes"]
    ])
    .setFilter('unspecified-informal-paths', [
      "all",
      ["!has", key],
      ["==", "informal", "yes"]
    ]);

  if (key === 'operator') {
    // if a path is `informal=yes` then there's probably no operator, always style as complete
    map
      .setFilter('informal-paths', [
        "all",
        ["==", "informal", "yes"]
      ]);
    map.setLayoutProperty('unspecified-informal-paths', 'visibility', 'none');
  } else {
    map.setLayoutProperty('unspecified-informal-paths', 'visibility', 'visible');
  }
}

function updateMapLayersForTravelMode(mode) {

  var unspecifiedExpression = [
    "any",
    [
      "all",
      ["!has", mode],
      ["!=", "access", "no"],
      ["!=", "access", "private"],
      ["!=", "access", "discouraged"],
      [
        "none",
        ...impliedYesExpressions[mode],
        ...impliedNoExpressions[mode]
      ]
    ],
    // access if always unspecified if mode is explicitly set to `unknown`
    ["==", mode, "unknown"],
  ];

  var allowedExpression = [
    "all",
    [
      "any",
      [
        "all",
        ["!has", mode],
        ["!=", "access", "no"],
        ["!=", "access", "private"],
        ["!=", "access", "discouraged"],
      ],
      [
        "all",
        ["has", mode],
        ["!=", mode, "no"],
        ["!=", mode, "private"],
        ["!=", mode, "discouraged"],
        ["!=", mode, "limited"], // for `wheelchair`
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
  
  map
    .setLayoutProperty('disallowed-paths', 'visibility', 'visible')
    .setLayoutProperty('disallowed-informal-paths', 'visibility', 'visible')
    .setLayoutProperty('unspecified-informal-paths', 'visibility', 'visible')
    .setFilter('paths', [
      "all",
      allowedExpression,
      ["none", unspecifiedExpression],
      ["!=", "informal", "yes"]
    ])
    .setFilter('informal-paths', [
      "all",
      allowedExpression,
      ["none", unspecifiedExpression],
      ["==", "informal", "yes"]
    ])
    .setFilter('disallowed-paths', [
      "all",
      ["none", allowedExpression],
      ["none", unspecifiedExpression],
      ["!=", "informal", "yes"]
    ])
    .setFilter('disallowed-informal-paths', [
      "all",
      ["none", allowedExpression],
      ["none", unspecifiedExpression],
      ["==", "informal", "yes"]
    ])
    .setFilter('unspecified-paths', [
      "all",
      unspecifiedExpression,
      ["!=", "informal", "yes"]
    ])
    .setFilter('unspecified-informal-paths', [
      "all",
      unspecifiedExpression,
      ["==", "informal", "yes"]
    ]);
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
      "match", ["get", "highway"],
      "trailhead", ["image", "trailhead-icon"],
      ["image", "ranger_station-icon"]
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
    "id": "informal-paths",
    "source": "trails",
    "source-layer": "trail",
    "type": "line",
    "layout": {
      "line-cap": "butt",
      "line-join": "round"
    },
    "paint": {
      "line-opacity": lineOpacity,
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
      "line-opacity": lineOpacity,
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
      "line-opacity": lineOpacity,
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
      "line-opacity": lineOpacity,
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
      "line-opacity": lineOpacity,
      "line-width": lineWidth,
      "line-color": colors.unspecified,
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
      "line-opacity": lineOpacity,
      "line-width": lineWidth,
      "line-color": colors.public,
    }
  })
  .addLayer({
    "id": "trails-labels",
    "source": "trails",
    "source-layer": "trail_name",
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
    var type = feature.sourceLayer.includes("poi") ? 'node' : 'way';
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