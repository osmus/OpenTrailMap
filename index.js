
var mode = "foot";

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
        maxWidth: 200,
        unit: 'imperial'
    }), "bottom-right");

  map.loadImage('img/disallowed-stripes.png', (error, image) => {
    if (error) throw error;
    map.addImage('disallowed-stripes', image);
    updateLayers();
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

    var allFilter;

    if (mode === "bicycle" || mode === "horse" || mode === "atv") {
      allFilter =   
        ["any",
          ["all",
            ["!=", "highway", "track"],
            ["!=", "highway", "footway"],
            ["!=", "highway", "steps"],
          ],
          ["has", "foot"],
          ["has", "atv"],
          ["has", "bicycle"],
          ["has", "horse"],
          ["has", "dog"],
          ["has", "wheelchair"]
        ];
    } else {
      allFilter = 
        ["any",
          ["!=", "highway", "track"],
          ["has", "foot"],
          ["has", "atv"],
          ["has", "bicycle"],
          ["has", "horse"],
          ["has", "dog"],
          ["has", "wheelchair"]
        ];
    }
    
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
    
    map.setFilter('trails-labels', allFilter)
      .setFilter('trails-pointer-targets', allFilter)
      .setFilter('paths', [
        "all",
        allowedExpression,
        allFilter,
        ["!=", "informal", "true"]
      ])
      .setFilter('disallowed-paths', [
        "all",
        ["none", allowedExpression],
        allFilter,
        ["!=", "informal", "true"]
      ])
      .setFilter('disallowed-informal-paths', [
        "all",
        ["none", allowedExpression],
        allFilter,
        ["==", "informal", "true"]
      ])
      .setFilter('informal-paths', [
        "all",
        allowedExpression,
        allFilter,
        ["==", "informal", "true"]
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
    var lineOpacity = [
        "interpolate", ["linear"], ["zoom"],
        12, 1,
        22, 0.4
      ];

    map.addLayer({
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
      "source-layer": "trail",
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
    });

    updateLayers();
});

// Create a popup, but don't add it to the map yet.
const popup = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false
});

map.on('mouseenter', 'trails-pointer-targets', (e) => {
    // Change the cursor style as a UI indicator.
    map.getCanvas().style.cursor = 'pointer';

    let desc = '';
    

    for (var key in e.features[0].properties) {
      if ( e.features[0].properties[key] === "null") continue;
      desc += `${key}=${e.features[0].properties[key]}<br/>`;
    }

    const coordinates = e.lngLat.wrap();

    // Ensure that if the map is zoomed out such that multiple
    // copies of the feature are visible, the popup appears
    // over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }
    // Populate the popup and set its coordinates
    // based on the feature found.
    popup.setLngLat(coordinates).setHTML(desc).addTo(map);
});

map.on('click', 'trails-pointer-targets', (e) => {
    window.open('https://openstreetmap.org/way/'+e.features[0].id, "_blank");
});

map.on('mouseleave', 'trails-pointer-targets', () => {
    map.getCanvas().style.cursor = '';
    popup.remove();
});
}