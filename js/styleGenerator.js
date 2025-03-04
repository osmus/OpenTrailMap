export function generateStyle(baseStyleJsonString, travelMode, lens) {

  // parse anew every time to avoid object references
  const style = JSON.parse(baseStyleJsonString);

  const highwayOnlyLenses = [
    "hand_cart",
    "incline",
    "lit",
    "maxspeed",
    "operator",
    "sac_scale",
    "smoothness",
    "surface",
    "trail_visibility",
  ];
  const waterwayOnlyLenses = [
    "tidal",
    "intermittent",
    "rapids",
    "open_water",
  ];

  const poiLabelZoom = 14;
  const thisYear = new Date().getFullYear();
  const colors = {
    trail: "#4f2e28",
    noaccessTrail: "#cc9e7e",//"#A2D61D",
    ferry: "#009FBE",
    natural: "#005908",
    specified: "#007f79",
    unspecified: "#c100cc",
    tidal: "#0041e5",
    disallowedWater: "#a6b2c4",
    water: "#003b93",
    label: "#333",
    labelHalo: "rgba(255, 255, 255, 1)",
    selection: "yellow",
  };
  const noaccessValsLiteral = ["literal", ["no", "private", "discouraged", "limited"]]; // `limited` for `wheelchair`
  const canoeNoaccessExpression = [
    "any",
    ["in", ["get", "canoe"], noaccessValsLiteral],
    [
      "all",
      ["!", ["has", "canoe"]],
      ["in", ["get", "boat"], noaccessValsLiteral]
    ],
    [
      "all",
      ["!", ["has", "canoe"]],
      ["!", ["has", "boat"]],
      ["in", ["get", "access"], noaccessValsLiteral]
    ]
  ];
  const lineWidth = [
    "interpolate", ["linear"], ["zoom"],
    12, 1,
    22, 5
  ];
  const selectedLineWidth = [
    "interpolate", ["linear"], ["zoom"],
    12, 9,
    22, 13
  ];
  const hoverLineWidth = [
    "interpolate", ["linear"], ["zoom"],
    12, 5,
    22, 7
  ];
  const hoveredPoiPaint = {
    "circle-radius": [
      "interpolate", ["linear"], ["zoom"],
      12, 9,
      22, 18
    ],
    "circle-opacity": 0.25,
    "circle-color": colors.selection,
  };
  const selectedPoiPaint = {
    "circle-radius": [
      "interpolate", ["linear"], ["zoom"],
      12, 10,
      22, 20
    ],
    "circle-opacity": 0.4,
    "circle-color": colors.selection,
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
  const isWaterwayExpression = [
    "in", ["get", "waterway"],
    ["literal", [
        "river",
        "stream",
        "tidal_channel",
        "canal",
        "drain",
        "ditch",
        "canoe_pass",
        "fairway",
        "link",
        "flowline"
      ]
    ]
  ];
  const isHighwayExpression = [
    "any",
    ["has", "highway"],
    ["==", ["get", "route"], "ferry"],
  ];
  const isNotHighwayExpression = [
    "!", isHighwayExpression
  ];
  const impliedYesExpression = {
    bicycle: [
      "in", ["get", "highway"],
      ["literal", [
      "cycleway",
      "service",
      "unclassified",
      "residential",
      "tertiary",
      "secondary",
      "primary",
      "tertiary_link",
      "secondary_link",
      "primary_link"]]
    ],
    foot: [
      "in", ["get", "highway"],
      ["literal", [
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
      "primary_link"]]
    ],
    horse: ["==", ["get", "highway"], "bridleway"],
    inline_skates: [
      "all",
      // cycleways commonly allow skating
      ["==", ["get", "highway"], "cycleway"],
      // as long as they're multi-use
      ["in", ["get", "foot"], ["literal", ["yes", "designated", "permissive"]]],
      // and have the highest smoothness
      ["==", ["get", "smoothness"], "excellent"],
      // and are properly paved (redundant to smoothness but the additional check is nice)
      ["in", ["get", "surface"], ["literal", ["paved", "asphalt", "concrete"]]],
    ],
  };

  const impliedNoExpression = {
    atv: [
        "any",
        ["in", ["get", "highway"], ["literal", ["footway", "steps"]]],
        ["in", ["get", "vehicle"], noaccessValsLiteral],
        ["in", ["get", "motor_vehicle"], noaccessValsLiteral],
        isNotHighwayExpression,
    ],
    bicycle: [
      "any",
      [
        "all",
        ["==", ["get", "highway"], "steps"],
        ["!=", ["get", "ramp:bicycle"], "yes"],
      ],
      ["in", ["get", "vehicle"], noaccessValsLiteral],
      isNotHighwayExpression,
    ],
    canoe: ["!", ["has", "canoe"]],
    foot: isNotHighwayExpression,
    horse: [
      "any",
      ["==", ["get", "highway"], "steps"],
      isNotHighwayExpression,
    ],
    inline_skates: [
      "any",
      [
        "all",
        ["has", "smoothness"],
        ["!", ["in", ["get", "smoothness"], ["literal", ["excellent", "good", "intermediate"]]]],
      ],
      [
        "all",
        ["has", "surface"],
        ["in", ["get", "surface"], ["literal", ["dirt", "grass", "sand", "sett", "cobblestone", "clay", "unhewn_cobblestone", "pebblestone", "grass_paver", "earth", "ground", "artificial_turf", "mud", "rock", "stone", "woodchips"]]],
      ],
      isNotHighwayExpression,
    ],
    mtb: [
      "any",
      ["in", ["get", "vehicle"], noaccessValsLiteral],
      ["in", ["get", "bicycle"], noaccessValsLiteral],
      isNotHighwayExpression,
    ],
    portage: ["!", ["has", "portage"]],
    'ski:nordic': [
      "any",
      ["in", ["get", "ski"], noaccessValsLiteral],
      isNotHighwayExpression,
    ],
    snowmobile: [
      "any",
      ["in", ["get", "highway"], ["literal", ["footway", "steps"]]],
      ["in", ["get", "vehicle"], noaccessValsLiteral],
      ["in", ["get", "motor_vehicle"], noaccessValsLiteral],
      isNotHighwayExpression,
    ],
    wheelchair: [
      "any",
      ["==", ["get", "highway"], "steps"],
      [
        "all",
        ["has", "sac_scale"],
        ["!=", ["get", "sac_scale"], "hiking"],
      ],
      [
        "all",
        ["has", "smoothness"],
        ["!", ["in", ["get", "smoothness"], ["literal", ["excellent", "very_good", "good", "intermediate"]]]],
      ],
      isNotHighwayExpression,
    ],
  };

  const accessHierarchy = {
    all: [],
    atv: ['vehicle', 'motor_vehicle', 'atv'],
    bicycle:  ['vehicle', 'bicycle'],
    canoe: ['boat', 'canoe'],
    foot: ['foot'],
    horse: ['horse'],
    inline_skates: ['foot', 'inline_skates'],
    mtb: ['vehicle', 'bicycle', 'mtb'],
    portage: ['foot', 'portage'],
    'ski:nordic': ['foot', 'ski', 'ski:nordic'],
    snowmobile: ['vehicle', 'motor_vehicle', 'snowmobile'],
    wheelchair: ['foot', 'wheelchair'],
  };

  function addTrailLayers() {

    const showTrailCenterpoints = lens === 'fixme';

    // ["!=", "true", "false"] always evalutes to true because "true" actually refers to the name of a
    // data attribute key, which is always undefined, while "false" is the string it's compared to.
    let allowedAccessExpression = ["!=", ["get", "true"], "false"];
    let specifiedAccessExpression = ["!=", ["get", "true"], "false"];
    let specifiedExpression;

    let showDisallowedExpression = [lens === "access" ? "!=" : "==", ["get", "true"], "false"];
    let showUnspecifiedExpression = [lens !== "" ? "!=" : "==", ["get", "true"], "false"];

    let pathsColors = [
      "case",
      ["==", ["get", "route"], "ferry"], colors.ferry,
      colors.trail
    ];
    let waterwaysColors = colors.water;

    if (travelMode === "all") {
      allowedAccessExpression = [
        "any",
        modeIsAllowedExpression("foot"),
        modeIsAllowedExpression("wheelchair"),
        modeIsAllowedExpression("bicycle"),
        modeIsAllowedExpression("horse"),
        modeIsAllowedExpression("atv"),
        modeIsAllowedExpression("mtb"),
        modeIsAllowedExpression("inline_skates"),
        modeIsAllowedExpression("snowmobile"),
        modeIsAllowedExpression("ski:nordic"),
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
        ["!=", ["get", "access"], "unknown"],
        ["!=", ["get", "foot"], "unknown"],
        ["!=", ["get", "wheelchair"], "unknown"],
        ["!=", ["get", "bicycle"], "unknown"],
        ["!=", ["get", "horse"], "unknown"],
        ["!=", ["get", "atv"], "unknown"],
        ["!=", ["get", "mtb"], "unknown"],
        ["!=", ["get", "inline_skates"], "unknown"],
        ["!=", ["get", "portage"], "unknown"],
        ["!=", ["get", "snowmobile"], "unknown"],
        ["!=", ["get", "ski:nordic"], "unknown"],
      ];  
    }

    if (lens !== "" && lens !== "access") {

      pathsColors = lens === 'check_date' ? checkDateColors :
        lens === 'OSM_TIMESTAMP' ? editedDateColors :
        lens === 'tidal' ? [
          "case",
          ["any", ["==", ["get", "tidal"], "yes"], isImpliedExpressionForLens("tidal")], colors.tidal,
          ["==", ["get", "tidal"], "no"], colors.specified,
          colors.unspecified
        ] :
        colors.specified;
      
      waterwaysColors = pathsColors;
    
      specifiedExpression = isSpecifiedExpressionForLens(lens, travelMode);
      allowedAccessExpression = [
        "all",
        allowedAccessExpression,
        specifiedAccessExpression
      ];

      if (waterwayOnlyLenses.includes(lens)) {
        allowedAccessExpression.push(isWaterwayExpression);
      } else if (highwayOnlyLenses.includes(lens)) {
        allowedAccessExpression.push(isHighwayExpression);
      }
    } else {
      specifiedExpression = specifiedAccessExpression;
    }

    let trailFiltersById = {};
    let combinedFilterExpression = ["any"];
    function registerTrailsLayerFilter(layerId, filter) {
      trailFiltersById[layerId] = filter;
      combinedFilterExpression.push(filter);
    }
    
    registerTrailsLayerFilter('paths', [
      "all",
      allowedAccessExpression,
      specifiedExpression,
      ["!=", ["get", "informal"], "yes"],
      isHighwayExpression,
    ]);
    registerTrailsLayerFilter('informal-paths', [
      "all",
      allowedAccessExpression,
      specifiedExpression,
      ["==", ["get", "informal"], "yes"],
      isHighwayExpression,
    ]);
    registerTrailsLayerFilter('disallowed-paths', [
      "all",
      showDisallowedExpression,
      ["!", allowedAccessExpression],
      specifiedExpression,
      ["!=", ["get", "informal"], "yes"],
      isHighwayExpression,
    ]);
    registerTrailsLayerFilter('disallowed-informal-paths', [
      "all",
      showDisallowedExpression,
      ["!", allowedAccessExpression],
      specifiedExpression,
      ["==", ["get", "informal"], "yes"],
      isHighwayExpression,
    ]);
    registerTrailsLayerFilter('unspecified-paths', [
      "all",
      showUnspecifiedExpression,
      allowedAccessExpression,
      ["!", specifiedExpression],
      ["!=", ["get", "informal"], "yes"],
      isHighwayExpression,
    ]);
    registerTrailsLayerFilter('unspecified-informal-paths', [
      "all",
      showUnspecifiedExpression,
      allowedAccessExpression,
      ["!", specifiedExpression],
      ["==", ["get", "informal"], "yes"],
      isHighwayExpression,
    ]);
    registerTrailsLayerFilter('disallowed-waterways', [
      "all",
      showDisallowedExpression,
      ["!", allowedAccessExpression],
      specifiedExpression,
      isWaterwayExpression,
    ]);
    registerTrailsLayerFilter('unspecified-waterways', [
      "all",
      showUnspecifiedExpression,
      allowedAccessExpression,
      ["!", specifiedExpression],
      isWaterwayExpression,
    ]);
    registerTrailsLayerFilter('waterways', [
      "all",
      allowedAccessExpression,
      specifiedExpression,
      isWaterwayExpression,
    ]);

    function addTrailLayer(def) {
      if (trailFiltersById[def.id]) def.filter = trailFiltersById[def.id];
      style.layers.push(def);
    }

    addTrailLayer({
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
      ],
    });
    addTrailLayer({
      "id": "hovered-peaks",
      "source": "openmaptiles",
      "source-layer": "mountain_peak",
      "type": "circle",
      "paint": hoveredPoiPaint,
      "filter": [
        "==", "OSM_ID", -1 
      ],
    });
    if (showTrailCenterpoints) {
      addTrailLayer({
        "id": "hovered-trail-centerpoints",
        "source": "trails",
        "source-layer": "trail_centerpoint",
        "type": "circle",
        "paint": hoveredPoiPaint,
        "filter": [
          "==", "OSM_ID", -1 
        ],
      });
    }
    addTrailLayer({
      "id": "hovered-pois",
      "source": "trails",
      "source-layer": "trail_poi",
      "type": "circle",
      "paint": hoveredPoiPaint,
      "filter": [
        "==", "OSM_ID", -1 
      ],
    });
    addTrailLayer({
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
      ],
    });
    addTrailLayer({
      "id": "selected-peaks",
      "source": "openmaptiles",
      "source-layer": "mountain_peak",
      "type": "circle",
      "paint": selectedPoiPaint,
      "filter": [
        "==", "OSM_ID", -1 
      ],
    });
    if (showTrailCenterpoints) {
      addTrailLayer({
        "id": "selected-trail-centerpoints",
        "source": "trails",
        "source-layer": "trail_centerpoint",
        "type": "circle",
        "paint": selectedPoiPaint,
        "filter": [
          "==", "OSM_ID", -1 
        ],
      });
    }
    addTrailLayer({
      "id": "selected-pois",
      "source": "trails",
      "source-layer": "trail_poi",
      "type": "circle",
      "paint": selectedPoiPaint,
      "filter": [
        "==", "OSM_ID", -1 
      ],
    });
    addTrailLayer({
      "id": "disallowed-waterways",
      "source": 'trails',
      "source-layer": 'trail',
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
      "source": "trails",
      "source-layer": "trail",
      "type": "line",
      "layout": {
        "line-cap": "round",
        "line-join": "round"
      },
      "paint": {
        "line-width": lineWidth,
        "line-color": colors.trail,
        "line-dasharray": [2, 2],
        "line-color": pathsColors,
      }
    });
    addTrailLayer({
      "id": "disallowed-informal-paths",
      "source": "trails",
      "source-layer": "trail",
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
      "source": "trails",
      "source-layer": "trail",
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
      "source": "trails",
      "source-layer": "trail",
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
      "source": "trails",
      "source-layer": "trail",
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
      "source": 'trails',
      "source-layer": 'trail',
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
      "source": 'trails',
      "source-layer": 'trail',
      "type": "line",
      "layout": {
        "line-cap": "round",
        "line-join": "round"
      },
      "paint": {
        "line-width": lineWidth,
        "line-color": waterwaysColors,
      }
    });
    addTrailLayer({
      "id": "paths",
      "source": "trails",
      "source-layer": "trail",
      "type": "line",
      "layout": {
        "line-cap": "round",
        "line-join": "round",
      },
      "paint": {
        "line-width": lineWidth,
        "line-color": pathsColors,
      }
    });
    addTrailLayer({
      "id": "bridge-casings",
      "source": "trails",
      "source-layer": "trail",
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
      },
      "filter": [
        "all",
        ["has", "bridge"],
        ["!", ["in", ["get", "bridge"], ["literal", ["no", "abandoned", "raised", "proposed", "dismantled"]]]],
        combinedFilterExpression
      ]
    });
    addTrailLayer({
      "id": "oneway-arrows",
      "source": "trails",
      "source-layer": "trail",
      "type": "symbol",
      "transition": {
        "duration": 0,
        "delay": 0
      },
      "minzoom": lens === "oneway" ? 4 : 12,
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
        "icon-image": onewayArrowsIconImageExpression(travelMode),
      },
      "paint": {
        "icon-opacity": 0.8,
      },
      // A specific filter isn't needed since the icon-image doesn't display anything if there isn't a relevant oneway value.
      "filter": /*["all", onewayArrowsFilter(travelMode), */ combinedFilterExpression //],
    });
    addTrailLayer({
      "id": "trails-labels",
      "source": "trails",
      "source-layer": "trail",
      "type": "symbol",
      "layout": {
        "text-field": getTrailLabelExpression(lens, travelMode),
        "text-font": ["Americana-Regular"],
        "text-size": 12,
        "symbol-placement": "line",
      },
      "paint": {
        "text-color": colors.label,
        "text-halo-width": 1.5,
        "text-halo-color": colors.labelHalo,
      },
      "filter": combinedFilterExpression,
    });
    addTrailLayer({
      "id": "trails-pointer-targets",
      "source": "trails",
      "source-layer": "trail",
      "type": "line",
      "paint": {
          "line-color": "transparent",
          "line-width": 16
      },
      "filter": combinedFilterExpression,
    });
    addTrailLayer({
      "id": "trees",
      "source": "trails",
      "source-layer": "trail_poi",
      "type": "circle",
      "minzoom": 16,
      "paint": {
        "circle-radius": [
          "interpolate", ["exponential", 2], ["zoom"],
          16, 2,
          22, 128
        ],
        "circle-opacity": [
          "interpolate", ["linear"], ["zoom"],
          16, 0.25,
          22, 0.075
        ],
        "circle-color": colors.natural,
      },
      "filter": [
        "==", ["get", "natural"], "tree" 
      ],
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
      "filter": [
        "all",
        ["has", "name"],
        ["has", "ele_ft"],
      ],
    });
    addTrailLayer({
      "id": "trail-pois",
      "source": 'trails',
      "source-layer": 'trail_poi',
      "type": "symbol",
      "minzoom": 12,
      "transition": {
        "duration": 0,
        "delay": 0
      },
      "layout": {
        "icon-image": poiIconImageExpression(travelMode),
        "icon-anchor": [
          "case",
          [
            "any",
            ["in", ["get", "information"], ["literal", ["guidepost", "route_marker"]]],
            ["==", ["get", "man_made"], "cairn"],
          ], "bottom",
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
          ["==", ["get", "route"], "ferry"], 1,
          ["==", ["get", "man_made"], "monitoring_station"], 4,
          ["==", ["get", "tourism"], "camp_site"], 5,
          ["==", ["get", "tourism"], "caravan_site"], 5,
          ["==", ["get", "amenity"], "ranger_station"], 6,
          ["==", ["get", "highway"], "trailhead"], 7,
          ["==", ["get", "tourism"], "wilderness_hut"], 8,
          ["==", ["get", "tourism"], "camp_pitch"], 8,
          ["==", ["get", "shelter_type"], "lean_to"], 9,
          ["==", ["get", "tourism"], "viewpoint"], 18,
          ["==", ["get", "information"], "guidepost"], 19,
          ["==", ["get", "man_made"], "cairn"], 20,
          ["==", ["get", "information"], "route_marker"], 20,
          canoeNoaccessExpression, 21,
          ["==", ["get", "parking"], "no"], 11,
          10,
        ],
        "text-field": [
          "step", ["zoom"], "",
          poiLabelZoom, getLabelExpression(poiLabelData)
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
      },
      "filter": trailPoisFilter(travelMode),
    });
    addTrailLayer({
      "id": "major-trail-pois",
      "source": 'trails',
      "source-layer": 'trail_poi',
      "type": "symbol",
      "transition": {
        "duration": 0,
        "delay": 0
      },
      "layout": {
        "icon-image": [
          "case",
          ["==", ["get", "protected_area"], "game_land"], ["image", "game_land"],
          ["==", ["get", "protected_area"], "forest_reserve"], ["image", "forest_reserve"],
          ["==", ["get", "protected_area"], "grassland_reserve"], ["image", "grassland_reserve"],
          ["==", ["get", "protected_area"], "watershed_reserve"], ["image", "watershed_reserve"],
          ["==", ["get", "protected_area"], "wildlife_refuge"], [
            "case",
            ["==", ["get", "wildlife_refuge"], "bird_refuge"], ["image", "bird_refuge"],
            ["==", ["get", "wildlife_refuge"], "bison_refuge"], ["image", "bison_refuge"],
            ["image", "wildlife_refuge"],
          ],
          ["==", ["get", "protected_area"], "wilderness_preserve"], ["image", "wilderness_preserve"],
          ["==", ["get", "leisure"], "nature_reserve"], ["image", "nature_reserve"],
          ["==", ["get", "leisure"], "park"], ["image", "park"],
          ["image", "protected_area"],
        ],
        "icon-size": [
          "interpolate", ["linear"], ["zoom"],
          12, 0.5,
          22, 1
        ],
        "symbol-placement": "point",
        "symbol-sort-key": ["-", ["get", "AREA_Z0_PX2"]],
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
      "filter": [
        "all",
        [
          "any",
          ["in", ["get", "leisure"], ["literal", ["park", "nature_reserve"]]],
          ["in", ["get", "boundary"], ["literal", ["protected_area", "national_park"]]]
        ],
        [">=", ["*", ["get", "AREA_Z0_PX2"], ["^", ["^", 2, ["zoom"]], 2]], 0.000000075],
        ["<=", ["*", ["get", "AREA_Z0_PX2"], ["^", ["^", 2, ["zoom"]], 2]], 0.0001],
        ["!", ["in", ["get", "tourism"], ["literal", ["camp_site", "caravan_site"]]]],
      ],
    });
    if (showTrailCenterpoints) {
      addTrailLayer({
        "id": "trail-centerpoints",
        "source": "trails",
        "source-layer": "trail_centerpoint",
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
        },
        "filter": [
          "all",
          [
            "any",
            ["has", "fixme"],
            ["has", "FIXME"],
            ["has", "todo"],
            ["has", "TODO"],
          ],
          combinedFilterExpression
        ]
      });
    }
  }

  function onewayKeysForTravelMode(travelMode) {
    let keys = [];
    // basic `oneway` tag is ambiguous on waterways
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
      case 'access':
        let keys = accessHierarchy[travelMode].slice().reverse();
        if (travelMode === 'canoe') keys.push('portage');
        keys.push('access');
        return keys;
      case 'name': 
        switch (travelMode) {
          case "canoe": return ['name', 'waterbody:name', 'noname'];
          case 'mtb': return ['name', 'mtb:name', 'noname'];
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
          ["!=", ["get", key], "unknown"],
        ];
      }),
    ];
  }

  function isImpliedExpressionForLens(lens) {
    switch (lens) {
      case 'operator':
        // if a path is `informal=yes` then there's probably no operator, always style as complete
        return ["==", ["get", "informal"], "yes"];
      case 'tidal':
        // assume tidal channels are always tidal=yes
        return ["==", ["get", "waterway"], "tidal_channel"];
      case 'open_water':
        // only expect open_water tag on certain features
        return ["!", ["in", ["get", "waterway"], ["literal", ["fairway", "flowline"]]]];
      case 'width':
        // don't expect width tag on links
        return ["==", ["get", "waterway"], "link"];
    }
    return null;
  }

  function isSpecifiedExpressionForLens(lens, travelMode) {

    let specifiedAttributeExpression = attributeIsSpecifiedExpression(
      specifyingKeysForLens(lens, travelMode)
    );
    let impliedAttributeExpression = isImpliedExpressionForLens(lens);
    if (impliedAttributeExpression) {
      specifiedAttributeExpression = [
        "any",
        specifiedAttributeExpression,
        impliedAttributeExpression
      ];
    }
    switch (lens) {
      case 'fixme':
        // for fixmes we're looking for extant values instead of missing values
        specifiedAttributeExpression = ["!", specifiedAttributeExpression];
        break;
      case 'sac_scale':
        // there are a lot of junk sac_scale values, so require one from a known set
        specifiedAttributeExpression = [
          "all",
          specifiedAttributeExpression,
          ["in", ["get", "sac_scale"], ["literal", ['no', 'hiking', 'mountain_hiking', 'demanding_mountain_hiking', 'alpine_hiking', 'demanding_alpine_hiking', 'difficult_alpine_hiking']]],
        ];
        break;
      case 'oneway':
        if (travelMode === 'canoe') {
          specifiedAttributeExpression = [
            "any",
            [
              "all",
              specifiedAttributeExpression,
              isWaterwayExpression,
            ],
            [
              "all",
              attributeIsSpecifiedExpression(specifyingKeysForLens(lens, 'portage')),
              ["!", isWaterwayExpression],
            ],
          ];
        }
        break;
      default:
        break;
    }
    return specifiedAttributeExpression;
  }
/*
  function onewayArrowsFilter(travelMode) {
    let filter = ["any"];
    let onewayKeys = onewayKeysForTravelMode(travelMode);
    while (onewayKeys.length) {
      let leastSpecificKey = onewayKeys.shift();
      filter.push([
        "all",
        // if there isn't a more specific key (e.g. 'oneway:foot')
        ...onewayKeys.map(function(key) {
          return ["!", ["has", key]];
        }),
        // then pay attention to the most specific key we have (e.g. 'oneway')
        ["in", ["get", leastSpecificKey], ["literal", ["yes", "-1", "alternating", "reversible"]]],
      ]);
    }
    if (travelMode === "canoe") {
      filter = [
        "any",
        [
          "all",
          filter,
          isWaterwayExpression,
        ],
        [
          "all",
          onewayArrowsFilter('portage'),
          ["!", isWaterwayExpression],
        ],
      ];
    }
    return filter;
  }
*/
  function poiIconImageExpression(travelMode) {
    let showHazards = travelMode === "canoe";
    return [
      "case",
      ["==", ["get", "route"], "ferry"], [
        "case",
        ["in", ["get", "access"], noaccessValsLiteral], ["image", "ferry-noaccess"],
        ["image", "ferry"],
      ],
      ["==", ["get", "amenity"], "ranger_station"], [
        "case",
        ["in", ["get", "access"], noaccessValsLiteral], ["image", "ranger_station-noaccess"],
        ["image", "ranger_station"],
      ],
      ["==", ["get", "highway"], "trailhead"], [
        "case",
        ["in", ["get", "access"], noaccessValsLiteral], ["image", "trailhead-noaccess"],
        ["image", "trailhead"],
      ],
      ["==", ["get", "man_made"], "cairn"], ["image", "cairn"],
      ["==", ["get", "information"], "guidepost"], ["image", "guidepost"],
      ["==", ["get", "information"], "route_marker"], ["image", "route_marker"],
      ["==", ["get", "man_made"], "monitoring_station"], ["image", "streamgage"],
      ["==", ["get", "tourism"], "camp_site"], [
        "case",
        ["in", ["get", "access"], noaccessValsLiteral], ["image", "campground-noaccess"],
        ["image", "campground"],
      ],
      ["==", ["get", "tourism"], "caravan_site"], [
        "case",
        ["in", ["get", "access"], noaccessValsLiteral], ["image", "caravan_site-noaccess"],
        ["image", "caravan_site"],
      ],
      ["==", ["get", "tourism"], "camp_pitch"], ["image", "campsite"],
      ["==", ["get", "shelter_type"], "lean_to"], ["image", "lean_to"],
      ["==", ["get", "tourism"], "wilderness_hut"], ["image", "lean_to"],
      ["==", ["get", "tourism"], "viewpoint"], ["image", "viewpoint"],
      [
        "any",
        ["==", ["get", "natural"], "beaver_dam"],
        ["in", ["get", "waterway"], ["literal", ["dam", "weir", "waterfall"]]],
        ["==", ["get", "lock"], "yes"],
      ], [
        "case",
        [
          "all",
          ["has", "canoe"],
          ["!", ["in", ["get", "canoe"], noaccessValsLiteral]]
        ], [
          "case",
          ["==", ["get", "natural"], "beaver_dam"], ["image", showHazards ? "beaver_dam-canoeable" : "beaver_dam"],
          ["==", ["get", "waterway"], "waterfall"], ["image", showHazards ? "waterfall-canoeable" : "waterfall"],
          ["in", ["get", "waterway"], ["literal", ["dam", "weir"]]], ["image", showHazards ? "dam-canoeable" : "dam"],
          ["image", showHazards ? "lock-canoeable" : "lock"],
        ],
        ["==", ["get", "natural"], "beaver_dam"], ["image", showHazards ? "beaver_dam-hazard" : "beaver_dam"],
        ["==", ["get", "waterway"], "waterfall"], ["image", showHazards ? "waterfall-hazard" : "waterfall"],
        ["in", ["get", "waterway"], ["literal", ["dam", "weir"]]], ["image", showHazards ? "dam-hazard" : "dam"],
        ["image", showHazards ? "lock-hazard" : "lock"],
      ],
      canoeNoaccessExpression, [
        "case",
        ["==", ["get", "leisure"], "slipway"], ["case",
          ["==", ["get", "trailer"], "no"], ["image", "slipway-canoe-noaccess"],
          ["image", "slipway-canoe-trailer-noaccess"],
        ],
        ["==", ["get", "waterway"], "access_point"], ["image", "access_point-noaccess"],
        ""
      ],
      ["==", ["get", "leisure"], "slipway"], [
        "case",
        ["==", ["get", "trailer"], "no"], ["image", "slipway-canoe"],
        ["image", "slipway-canoe-trailer"],
      ],
      ["==", ["get", "waterway"], "access_point"], [
        "case",
        ["==", ["get", "parking"], "no"], ["image", "access_point-minor"],
        ["image", "access_point"],
      ],
      ""
    ];
  }

  function trailPoisFilter(travelMode) {
    let filter = [
      "all",
      [
        "any",
        [
          "all",
          ["!", ["in", ["get", "leisure"], ["literal", ["park", "nature_reserve"]]]],
          ["!", ["in", ["get", "boundary"], ["literal", ["protected_area", "national_park"]]]],
        ],
        ["in", ["get", "tourism"], ["literal", ["camp_site", "caravan_site"]]],
      ],
      ["!=", ["get", "natural"], "tree"],
    ];
    
    if (travelMode !== "all") {
      if (travelMode !== "canoe") {
        // don't show canoe-specific POIs for other travel modes
        filter.push([
          "!", [
            "any",
            ["==", ["get", "natural"], "beaver_dam"],
            ["==", ["get", "leisure"], "slipway"],
            ["in", ["get", "waterway"], ["literal", ["dam", "weir", "access_point"]]],
            ["==", ["get", "lock"], "yes"],
            ["==", ["get", "man_made"], "monitoring_station"],
          ]
        ]);
      }
      const poiKeysByTravelMode = {
        "foot": ["hiking"],
        "canoe": ["canoe", "portage"],
      };
      const poiKeys = poiKeysByTravelMode[travelMode] ? poiKeysByTravelMode[travelMode] : [travelMode];
      filter.push([
        "any",
        [
          "!", [
            "any",
            ["==", ["get", "highway"], "trailhead"],
            ["in", ["get", "information"], ["literal", ["guidepost", "route_marker"]]],
            ["==", ["get", "man_made"], "cairn"],
            ["==", ["get", "route"], "ferry"],
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

  function onewayArrowsIconImageExpression(travelMode, fromAll) {
    let expression = ["case"];
    onewayKeysForTravelMode(travelMode).reverse().forEach(function(key) {
      expression = expression.concat([
        ["has", key],
        [
          "case",
          ["==", ["get", key], "yes"], ["image", "arrow-right"],
          ["==", ["get", key], "-1"], ["image", "arrow-left"],
          ["in", ["get", key], ["literal", ["alternating", "reversible"]]], ["image", "arrows-leftright"],
          ""
        ]
      ]);
    });
    if (travelMode === "canoe") {

      expression = expression.concat([
        ["all",
          // assume features with current are oneway
          ["in", ["get", "waterway"], ["literal", [
            "river",
            "stream",
            "canal",
            "drain",
            "ditch",
            "canoe_pass"
          ]]],
          // unless they're tidal
          ["!=", ["get", "tidal"], "yes"],
        ],
        ["image", "arrow-right"],
        "",
      ]);

      if (!fromAll) {
        expression = [
          "case",
          isWaterwayExpression, expression,
          onewayArrowsIconImageExpression('portage'),
        ];
      }
      
    } else {
      expression.push("");
    }

    if (travelMode === 'all') {
      expression = [
        "case",
        isWaterwayExpression, onewayArrowsIconImageExpression('canoe', true),
        expression,
      ];
    }

    return expression;
  }

  // returns a filter that evaluates to true for features with enough tags to positively
  // determine whether access is allowed or not allowed
  function accessIsSpecifiedExpression(travelMode) {
    let filter = [
      "!", [
        "any",
        [
          "all",
          ["!", ["has", travelMode]],
          notNoAccessExpression("access"),
          ...(impliedYesExpression[travelMode] ? [["!", impliedYesExpression[travelMode]]] : []),
          ...(impliedNoExpression[travelMode] ? [["!", impliedNoExpression[travelMode]]] : []),
        ],
        // access if always unspecified if mode is explicitly set to `unknown`
        ["==", ["get", travelMode], "unknown"],
      ]
    ];
    if (travelMode === "canoe") {
      filter = [
        "any",
        [
          "all",
          filter,
          isWaterwayExpression,
        ],
        [
          "all",
          accessIsSpecifiedExpression('portage'),
          ["!", isWaterwayExpression],
        ],
      ];
    }
    return filter;
  }

  function notNoAccessExpression(mode) {
    return ["!", ["in", ["get", mode], noaccessValsLiteral]];
  }

  function modeIsAllowedExpression(mode) {
    let allowedAccessExpression = [
      "all",
      [
        "any",
        [
          "all",
          ["!", ["has", mode]],
          notNoAccessExpression("access"),
        ],
        [
          "all",
          ["has", mode],
          notNoAccessExpression(mode),
        ],
      ],
    ];
    if (impliedNoExpression[mode]) {
      allowedAccessExpression.push(
        [
          "any",
          ["has", mode],
          ["!", impliedNoExpression[mode]],
        ]
      );
    }
    return allowedAccessExpression;
  }

  function getTrailLabelExpression(lens, travelMode) {

    let sublabels = null;

    if (lens !== "") {
      let keys = specifyingKeysForLens(lens, travelMode);
      sublabels = [{
        selector: ["any", ...keys.map(key => ["has", key])],
        label: ["case", ...keys.map(key => {
          let val = ["concat", key, "=", ["get", key]];
          if (key === 'name' || key.endsWith(':name')) val = key;
          return [["has", key], val];
        }).flat(1), ""],
      }];
    }
    const trailLabelData = [
      {
        caseSelector: isWaterwayExpression,
        selector: ["any", ["has", "name"], ["has", "waterbody:name"]],
        label: ["coalesce", ["get", "name"], ["get", "waterbody:name"]],
        sublabels: sublabels
      },
      {
        selector: ["any", ["has", "name"], ["has", "mtb:name"]],
        label: ["coalesce", ["get", "name"], ["get", "mtb:name"]],
        sublabels: sublabels
      }
    ];

    return getLabelExpression(trailLabelData);
  }

  const poiLabelData = [
    {
      caseSelector: ["in", ["get", "tourism"], ["literal", ["camp_site", "caravan_site"]]],
      selector: ["any", ["has", "name"], ["has", "ref"]],
      label: ["coalesce", ["get", "name"], ["get", "ref"]],
      sublabels: [
        {
          selector: ["==", ["get", "tents"], "no"],
          label: "No tents",
        },
        {
          selector: ["==", ["get", "group_only"], "yes"], 
          label: "Groups only",
        },
        {
          selector: ["==", ["get", "reservation"], "required"],
          label: "Reservations required",
        },
        {
          selector: ["==", ["get", "reservation"], "no"],
          label: "First-come, first-served",
        }
      ]
    },
    {
      caseSelector: ["any", ["==", ["get", "waterway"], "access_point"], ["==", ["get", "leisure"], "slipway"]],
      selector: ["any", ["has", "name"], ["has", "ref"]],
      label: ["coalesce", ["get", "name"], ["get", "ref"]],
      sublabels: [
        {
          selector: ["==", ["get", "group_only"], "yes"], 
          label: "Groups only",
        },
        {
          selector: ["==", ["get", "reservation"], "required"],
          label: "Reservations required",
        }
      ]
    },
    {
      caseSelector: ["==", ["get", "lock"], "yes"],
      selector: ["any", ["has", "lock_name"], ["has", "lock_ref"]],
      label: ["coalesce", ["get", "lock_name"], ["get", "lock_ref"]],
      sublabels: [
        {
          selector: ["has", "lock:height"],
          label: ["concat", [
            "number-format",
            ["/", ["to-number", ['get', 'lock:height']], 0.3048],
            { "max-fraction-digits": 0.1 } // for some reason 0 doesn't work
          ], " ft"],
        },
        {
          selector: ["has", "lock:height"],
          label: " ↕︎",
          font: "Americana-Bold",
          conjoined: true
        }
      ]
    },
    {
      caseSelector: ["in", ["get", "waterway"], ["literal", ["waterfall", "dam", "weir"]]],
      selector: ["any", ["has", "name"], ["has", "ref"]],
      label: ["coalesce", ["get", "name"], ["get", "ref"]],
      sublabels: [
        {
          selector: ["has", "height"],
          label:  ["concat", [
            "number-format",
            ["/", ["to-number", ['get', 'height']], 0.3048],
            { "max-fraction-digits": 0.1 } // for some reason 0 doesn't work
          ], " ft"],
        },
        {
          selector: ["has", "height"],
          label: " ↕︎",
          font: "Americana-Bold",
          conjoined: true
        }
      ]
    },
    {
      selector: ["any", ["has", "name"], ["has", "ref"]],
      label: ["coalesce", ["get", "name"], ["get", "ref"]],
      sublabels: [
        {
          selector: ["has", "ele"],
          label:  ["concat", [
            "number-format",
            ["/", ["to-number", ['get', 'ele']], 0.3048],
            { "max-fraction-digits": 0.1 } // for some reason 0 doesn't work
          ], " ft"],
        },
      ]
    },
  ];

  function getLabelExpression(items) {
    let filters = ["case"];
    for(let i in items) {
      let item = items[i];

      if (item.caseSelector) filters.push(item.caseSelector);

      let filter = [
        "format",
        [
          "case",
          item.selector, item.sublabels ? [
            "concat",
            item.label,
            [
              "case",
              ["any", ...item.sublabels.map(item => item.selector)], '\n',
              ""
            ]
          ] : item.label,
          ""
        ],
        {"text-font": ['literal', [item.font ? item.font : "Americana-Bold"]]},
      ]

      if (item.sublabels) {
        filter = filter.concat(getSublabelExpressions(item.sublabels));
      }
      filters.push(filter);
    }
    return filters;
  }

  function getSublabelExpressions(items) {
    let filters = [];
    for(let i in items) {
      let item = items[i];

      let sublabelsFilter = [];
      if (item.sublabels) {
        sublabelsFilter = [["any", ...item.sublabels.map(item => item.selector)], '\n'];
      }
      filters.push([
          "case",
          item.selector, [
            "concat", item.label,
            [
              "case",
              ["any", ...items.slice(parseInt(i) + 1).filter(item => !item.conjoined).map(item => item.selector)], " · ",
              ...sublabelsFilter,
              ""
            ]
          ],
          ""
        ]);
      filters.push({"text-font": ['literal', [item.font ? item.font : "Americana-Regular"]]});
    }
    return filters;
  }

  addTrailLayers();
  return style;
}