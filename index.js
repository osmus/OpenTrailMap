
var mode = "foot";

var selectedEntity;
var hoveredEntity;

var osmCache = {};

async function fetchOsmEntity(type, id) {
  var key = type + id;
  if (!osmCache[key]) {
    var url = `https://api.openstreetmap.org/api/0.6/${type}/${id}.json`;
    var response = await fetch(url);
    osmCache[key] = await response.json();
  }
  return osmCache[key];
}

window.onload = (event) => {
  
  document.getElementById("travel-mode").onchange = function(e) {
    mode = e.target.value;
    updateLayers();
  }

  try {
    maptilerApiKey;
  } catch(e) {
      if(e.name == "ReferenceError") {
        // Use the production key if we didn't find a dev key (only works on OSM US domains)
        maptilerApiKey = "qe6b8locBISzDLGJweZ3";
      }
  }

  var map = new maplibregl.Map({
    container: 'map',
    hash: "map",
    style: 'https://api.maptiler.com/maps/dataviz/style.json?key=' + maptilerApiKey,
    center: [-97.9, 38.6],
    zoom: 3
  });

  // Add zoom and rotation controls to the map.
  map
    .addControl(new maplibregl.NavigationControl({
      visualizePitch: true
    }))
    .addControl(new maplibregl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        trackUserLocation: true
    }))
    .addControl(new maplibregl.ScaleControl({
        maxWidth: 150,
        unit: 'imperial'
    }), "bottom-left");

  map.loadImage('img/disallowed-stripes.png', (error, image) => {
    if (error) throw error;
    map.addImage('disallowed-stripes', image);
  });
  map.loadImage('img/map/trailhead.png', (error, image) => {
    if (error) throw error;
    map.addImage('trailhead-icon', image, { pixelRatio: 2 });
  });
  map.loadImage('img/map/ranger_station.png', (error, image) => {
    if (error) throw error;
    map.addImage('ranger_station-icon', image, { pixelRatio: 2 });
  });

  var impliedYesHighways = {
    foot: [
      ["!=", ["get", "highway"], "path"],
      ["!=", ["get", "highway"], "footway"],
      ["!=", ["get", "highway"], "steps"],
      ["!=", ["get", "highway"], "bridleway"],
      ["!=", ["get", "highway"], "track"]
    ],
    // dog only allowed if explicit
    dog: [],
    bicycle: [
      ["!=", ["get", "highway"], "path"],
      ["!=", ["get", "highway"], "cycleway"],
      ["!=", ["get", "highway"], "bridleway"],
      ["!=", ["get", "highway"], "track"]
    ],
    horse: [
      ["!=", ["get", "highway"], "bridleway"],
      ["!=", ["get", "highway"], "track"]
    ],
    atv: [
      ["!=", ["get", "highway"], "track"]
    ]
  };

  function updateLayers() {

    var unspecifiedExpression = [
      "any",
      [
        "all",
        ["!", ["has", mode]],
        ["!=", ["get", "access"], "no"],
        ["!=", ["get", "access"], "private"],
        ["!=", ["get", "access"], "discouraged"],
        ...impliedYesHighways[mode]
      ],
      // if mode is explicitly unknown then mark as unknown 
      ["==", ["get", mode], "unknown"]
    ];

    var allowedExpression = ["any",
      [
        "all",
        ["!has", mode],
        ["!=", "access", "no"],
        ["!=", "access", "private"],
        ["!=", "access", "discouraged"]
      ],
      [
        "all",
        ["has", mode],
        ["!=", mode, "no"],
        ["!=", mode, "private"],
        ["!=", mode, "discouraged"]
      ]
    ];

    if (mode === "atv") {
      allowedExpression = [
        "all",
        allowedExpression,
        [
          "all",
          ["!=", "motor_vehicle", "no"],
          ["!=", "motor_vehicle", "private"],
          ["!=", "motor_vehicle", "discouraged"]
        ]
      ];
      unspecifiedExpression[1] = unspecifiedExpression[1].concat(
        [["!=", "motor_vehicle", "no"],
        ["!=", "motor_vehicle", "private"],
        ["!=", "motor_vehicle", "discouraged"]]
      )
    } else if (mode === "dog") {
      allowedExpression = [
        "all",
        allowedExpression,
        [
          "all",
          ["!=", "foot", "no"],
          ["!=", "foot", "private"],
          ["!=", "foot", "discouraged"]
        ]
      ];
      unspecifiedExpression[1] = unspecifiedExpression[1].concat(
        [["!=", ["get", "foot"], "no"],
        ["!=", ["get", "foot"], "private"],
        ["!=", ["get", "foot"], "discouraged"]]
      )
    }

    var lineColors = [
          "case",
          ["all", unspecifiedExpression], "#ff3a00",
          unspecifiedExpression, "#a56c5b",
          "#005908"
        ];
    
    map.setFilter('paths', [
        "all",
        allowedExpression,
        ["!=", "informal", "yes"]
      ])
      .setFilter('disallowed-paths', [
        "all",
        ["none", allowedExpression],
        ["!=", "informal", "yes"]
      ])
      .setFilter('disallowed-informal-paths', [
        "all",
        ["none", allowedExpression],
        ["==", "informal", "yes"]
      ])
      .setFilter('informal-paths', [
        "all",
        allowedExpression,
        ["==", "informal", "yes"]
      ])
      .setPaintProperty('paths', 'line-color', lineColors)
      .setPaintProperty('informal-paths', 'line-color', lineColors);
  }

  map.on('load', () => {
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
        "line-color": "yellow",
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
        "circle-color": "yellow",
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
        "line-color": "yellow",
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
        "circle-color": "yellow",
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
        "line-dasharray": [2, 2]
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
        "line-dasharray": [2, 2],
        "line-color": "#A2D61D",
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
        "text-halo-width": 1,
        "text-halo-color": "#fff",
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
      "layout": {
        "icon-image": [
          "match", ["get", "highway"],
          "trailhead", ["image", "trailhead-icon"],
          ["image", "ranger_station-icon"]
        ],
        "icon-size": [
          "interpolate", ["linear"], ["zoom"],
          12, 0.5,
          22, 1
        ]
      }
    });
  
    updateLayers();
  });

  function clearHoverIfSelected() {
    if (hoveredEntity && selectedEntity &&
      hoveredEntity.id == selectedEntity.id &&
      hoveredEntity.type == selectedEntity.type) {
      hoveredEntity = null;
    }
  }

  function didHover(e) {
    // Change the cursor style as a UI indicator.
    map.getCanvas().style.cursor = 'pointer';

    hoveredEntity = entityForEvent(e);
    clearHoverIfSelected();
    updateForHover();
    e.stopPropagation();
  }

  function updateForTags(tags) {
    var html = "";
    html += `<tr><th>Key</th><th>Value</th></tr>`;
    var keys = Object.keys(tags).sort();
    for (var i in keys) {
      var key = keys[i];
      html += `<tr><td>${key}</td><td>${tags[key]}</td></tr>`;
    }
    document.getElementById('tag-table').innerHTML = html;
  }

  function entityForEvent(e) {
    var feature = e.features.length && e.features[0];
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

  function didClick(e) {
    selectedEntity = entityForEvent(e);
    updateForSelection();
    e.stopPropagation();
  }

  function updateSidebar(entity) {

    if (!entity) {
      document.getElementById('sidebar').innerHTML = "";
      return;
    }

    var type = entity.type;
    var entityId = entity.id;
    var focusLngLat = entity.focusLngLat;

    var bbox = {
      left: left = focusLngLat.lng - 0.001,
      right: right = focusLngLat.lng + 0.001,
      bottom: left = focusLngLat.lat - 0.001,
      top: right = focusLngLat.lat + 0.001,
    };
    
    var opQuery = encodeURIComponent(`${type}(${entityId});\n(._;>;);\nout;`);
    
    var html = '';
    html += "<div class='body'>";
    html += "<table id='tag-table'>";
    html += `<tr><th>Key</th><th>Value</th></tr><tr><td>&nbsp;</td><td>&nbsp;</td></tr>`;
    html += "</table><br/>";
    html += "<h3>View</h3>";
    html += "<p class='link-list'>";
    html += `<a href="https://openstreetmap.org/${type}/${entityId}" target="_blank">osm.org</a> `;
    html += `<a href="https://www.openstreetmap.org/api/0.6/${type}/${entityId}" target="_blank">XML</a> `;
    html += `<a href="https://pewu.github.io/osm-history/#/${type}/${entityId}" target="_blank">PeWu</a> `;
    html += `<a href="https://overpass-turbo.eu?Q=${opQuery}&R=" target="_blank">Overpass Turbo</a> `;
    html += "</p>";
    html += "<h3>Edit</h3>";
    html += "<p class='link-list'>";
    html += `<a href="https://openstreetmap.org/edit?${type}=${entityId}" target="_blank">iD</a> `;
    html += `<a href="http://127.0.0.1:8111/load_and_zoom?left=${bbox.left}&right=${bbox.right}&top=${bbox.top}&bottom=${bbox.bottom}&select=${type}${entityId}" target="_blank">JOSM</a> `;
    html += `<a href="https://level0.osmz.ru/?url=${type}/${entityId}" target="_blank">Level0</a> `;
    html += "</p>";
    html += "</div>";

    document.getElementById('sidebar').innerHTML = html;

    fetchOsmEntity(type, entityId).then(function(result) {
      var tags = result && result.elements.length && result.elements[0].tags;
      if (tags) updateForTags(tags);
    });
  }

  function updateForSelection() {
    var type = selectedEntity && selectedEntity.type;
    var entityId = selectedEntity && selectedEntity.id;

    map.setFilter('selected-paths', ["==", "OSM_ID", type === "way" ? entityId : -1]);
    map.setFilter('selected-pois', ["==", "OSM_ID", type === "node" ? entityId : -1]);

    clearHoverIfSelected();
    updateForHover();

    updateSidebar(selectedEntity);
  }

  function updateForHover() {
    var type = hoveredEntity && hoveredEntity.type;
    var entityId = hoveredEntity && hoveredEntity.id;

    // disable hover indicator for now
    // map.setFilter('hovered-paths', ["==", "OSM_ID", type === "way" ? entityId : -1]);
    // map.setFilter('hovered-pois', ["==", "OSM_ID", type === "node" ? entityId : -1]);
  }

  function didUnhover() {
    map.getCanvas().style.cursor = '';
    hoveredEntity = null;
    updateForHover();
  }

  map
    .on('mouseenter', 'trail-pois', didHover)
    .on('mouseenter', 'trails-pointer-targets', didHover);

  map
    .on('click', function() {
      selectedEntity = null;
      updateForSelection();
    })
    .on('click', 'trail-pois', didClick)
    .on('click', 'trails-pointer-targets', didClick);

  map
    .on('mouseleave', 'trail-pois', didUnhover)
    .on('mouseleave', 'trails-pointer-targets', didUnhover);
}