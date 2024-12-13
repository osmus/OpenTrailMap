let activePopup;

let cachedStyles = {};

let focusAreaGeoJson;
let focusAreaGeoJsonBuffered;
let focusAreaBoundingBox;

const possibleLayerIdsByCategory = {
  clickable: ["trails-pointer-targets", "peaks", "trail-pois", "major-trail-pois", "trail-centerpoints"],
  hovered: ["hovered-paths", "hovered-peaks", "hovered-trail-centerpoints", "hovered-pois"],
  selected: ["selected-paths", "selected-peaks", "selected-trail-centerpoints", "selected-pois"],
};
const layerIdsByCategory = {
  clickable: [],
  hovered: [],
  selected: [],
};

async function loadInitialMap() {

  updateForHash(true);
  reloadMapStyle();

  map.on('mousemove', didMouseMoveMap)
    .on('click', didClickMap)
    .on('dblclick', didDoubleClickMap)
    .on('moveend', checkMapExtent)
    .on('moveend', function() {
      if (localStorage) {
        let transform = map.getCenter();
        transform.zoom = map.getZoom();
        localStorage.setItem('map_transform', JSON.stringify(transform));
      }
    })
    .on('sourcedata', function(event) {
      if (event.sourceId === 'trails' && event.isSourceLoaded) {
        reloadFocusAreaIfNeeded();
      }
    });
}

async function reloadMapStyle() {

  let styleId = travelMode + '/' + lens;
  if (!cachedStyles[styleId]) cachedStyles[styleId] = await generateStyle(travelMode, lens);
  
  let style = cachedStyles[styleId];

  for (let cat in possibleLayerIdsByCategory) {
    layerIdsByCategory[cat] = possibleLayerIdsByCategory[cat].filter(id => style.layers.find(layer => layer.id === id));
  }

  // it doesn't matter that we write to a cached referenced objects as long as we update the same properties each time
  applyStyleAddendumsToStyle(style, styleAddendumsForHover());
  applyStyleAddendumsToStyle(style, styleAddendumsForSelection());
  applyStyleAddendumsToStyle(style, styleAddendumsForFocus());

  map.setStyle(style, {
    diff: true,
    validate: true,
  });
}

function reloadFocusAreaIfNeeded() {
  let newFocusAreaGeoJson = buildFocusAreaGeoJson();

  if ((newFocusAreaGeoJson && JSON.stringify(newFocusAreaGeoJson)) !==
    (focusAreaGeoJson && JSON.stringify(focusAreaGeoJson))) {

    focusAreaBoundingBox = focusedEntityInfo && getEntityBoundingBoxFromLayer(focusedEntityInfo.id, focusedEntityInfo.type, "park");

    focusAreaGeoJson = newFocusAreaGeoJson;
    focusAreaGeoJsonBuffered = focusAreaGeoJson?.geometry?.coordinates?.length ? turfBuffer.buffer(focusAreaGeoJson, 0.25, {units: 'kilometers'}) : focusAreaGeoJson;

    if (focusAreaGeoJson) document.getElementById("map-title").innerText = focusAreaGeoJson.properties.name;

    updateMapForFocus();
  }
}

function omtId(id, type) {
  let codes = {
    "node": "1",
    "way": "2",
    "relation": "3",
  };
  return parseInt(id.toString() + codes[type]);
}

function applyStyleAddendumsToStyle(style, obj) {
  for (let layerId in obj) {
    let layer = style.layers.find(layer => layer.id === layerId);
    for (let key in obj[layerId]) {
      if (key === 'paint' || key === 'layout') {
        if (!layer[key]) layer[key] = {};
        Object.assign(layer[key], obj[layerId][key]);
      } else {
        layer[key] = obj[layerId][key];
      }
    }
  }
}

function applyStyleAddendumsToMap(obj) {
  for (let layerId in obj) {
    for (let key in obj[layerId]) {
      switch(key) {
        case "filter":
          map.setFilter(layerId, obj[layerId][key]);
          break;
        case "layout":
          for (let prop in obj[layerId][key]) {
            map.setLayoutProperty(layerId, prop, obj[layerId][key][prop]);
          }
          break;
        case "paint":
          for (let prop in obj[layerId][key]) {
            map.setPaintProperty(layerId, prop, obj[layerId][key][prop]);
          }
          break;
        case "minzoom":
          map.setLayerZoomRange(layerId, obj[layerId][key], 24);
        default:
          break;
    }
    }
  }
}

function updateMapForFocus() {
  applyStyleAddendumsToMap(styleAddendumsForFocus());
}

function styleAddendumsForFocus() {
  let focusedId = focusedEntityInfo?.id ? omtId(focusedEntityInfo.id, focusedEntityInfo.type) : null;
  return {
    "trail-pois": {
      "minzoom": focusedEntityInfo ? 0 : 12,
      "filter": trailPoisFilter(travelMode),
    },
    "major-trail-pois": {
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
        // don't show icon and label for currently focused feature
        ["!=", ["get", "OSM_ID"], focusedEntityInfo ? focusedEntityInfo.id : null],
        ...(focusAreaGeoJsonBuffered?.geometry?.coordinates?.length ?
          focusAreaFilter = [["within", focusAreaGeoJsonBuffered]] : []),
      ]
    },
    "peaks": {
      "filter": [
        "all",
        ["has", "name"],
        ["has", "ele_ft"],
        ...(focusAreaGeoJsonBuffered?.geometry?.coordinates?.length ?
          focusAreaFilter = [["within", focusAreaGeoJsonBuffered]] : []),
      ]
    },
    "park-fill": {
      "filter": [
        "any",
        ["==", ["id"], focusedId],
        ["!", ["in", ["get", "protected_area"], ["literal", ["conservation_district"]]]]
      ],
      "layout": {
        "fill-sort-key": [
          "case",
          ["==", ["id"], focusedId], 2,
          1
        ]
      },
      "paint": {
        "fill-color": [
          "case",
          ["==", ["id"], focusedId], "#B1D06F",
          "#DFEAB8"
        ]
      }
    },
    "park-outline": {
      "filter": [
        "any",
        [
          "all",
          ["!=", ["id"], focusedId],
          [">=", ["zoom"], 10],
        ],
        [">=", ["zoom"], 12],
      ],
      "layout": {
        "line-sort-key": [
          "case",
          ["==", ["id"], focusedId], 2,
          1
        ]
      },
      "paint": {
        "line-color": [
          "case",
          ["==", ["id"], focusedId], "#738C40",
          "#ACC47A"
        ]
      }
    }
  };
}

function updateMapForSelection() {
  applyStyleAddendumsToMap(styleAddendumsForSelection());
}

function styleAddendumsForSelection() {
  let id = selectedEntityInfo && selectedEntityInfo.id;
  let type = selectedEntityInfo && selectedEntityInfo.type;

  let focusedId = focusedEntityInfo?.id;

  let idsToHighlight = [id && id !== focusedId ? id : -1];

  if (type === "relation") {
    let members = osmEntityCache[type[0] + id]?.members || [];
    members.forEach(function(member) {
      if (member.role !== 'inner') idsToHighlight.push(member.ref);
      
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

  let styleAddendums = {};
  layerIdsByCategory.selected.forEach(function(layerId) {
    // this will fail in rare cases where two features of different types but the same ID are both onscreen
    styleAddendums[layerId] = {
      "filter": [
        "any",
        ["in", ["id"], ["literal", idsToHighlight.map(function(id) {
          return omtId(id, "node");
        })]],
        ["in", ["get", "OSM_ID"], ["literal", idsToHighlight]]
      ]
    };
  });
  return styleAddendums;
}

function updateMapForHover() {
  applyStyleAddendumsToMap(styleAddendumsForHover());
}

function styleAddendumsForHover() {

  let entityId = hoveredEntityInfo?.id || -1;

  if (hoveredEntityInfo?.id == selectedEntityInfo?.id &&
    hoveredEntityInfo?.type == selectedEntityInfo?.type) {
    // don't show hover styling if already selected
    entityId = -1;
  }

  let styleAddendums = {};
  layerIdsByCategory.hovered.forEach(function(layerId) {
    // this will fail in rare cases where two features of different types but the same ID are both onscreen
    styleAddendums[layerId] = {
      "filter": [
        "any",
        ["==", ["get", "OSM_ID"], entityId],
        ["==", ["id"], omtId(entityId, hoveredEntityInfo?.type)],
      ]
    };
  });
  return styleAddendums;
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
        changeset: feature.properties.OSM_CHANGESET,
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

function compositeGeoJson(features) {
  if (!features.length) return;
  let coordinates = [];
  features.forEach(function(feature) {
    if (feature.geometry.type === 'Polygon') {
      coordinates.push(feature.geometry.coordinates);
    } else if (feature.geometry.type === 'MultiPolygon') {
      coordinates = coordinates.concat(feature.geometry.coordinates);
    }
  });
  return {
    type: "Feature",
    geometry: {
      type: "MultiPolygon",
      coordinates: coordinates,
    },
    properties: features[0].properties
  };
}

function getEntityBoundingBox(entity) {
  const props = entity?.properties;
  if (props?.hasOwnProperty('MIN_LON') &&
    props?.hasOwnProperty('MIN_LAT') &&
    props?.hasOwnProperty('MAX_LON') &&
    props?.hasOwnProperty('MAX_LAT')) {
    return [
      props.MIN_LON,
      props.MIN_LAT,
      props.MAX_LON,
      props.MAX_LAT
    ];
  }
}

function getEntityBoundingBoxFromLayer(id, type, layer) {
  if (!focusedEntityInfo) return null;
  let features = map.querySourceFeatures('trails', {
    filter: [
      "all",
      ["==", ["get", "OSM_ID"], id],
      ["==", ["get", "OSM_TYPE"], type],
    ],
    sourceLayer: layer,
  });
  if (features.length) {
    return getEntityBoundingBox(features[0]);
  }
}

function buildFocusAreaGeoJson() {
  if (!focusedEntityInfo) return null;
  let results = map.querySourceFeatures('trails', {
    filter: [
      "all",
      ["==", ["get", "OSM_ID"], focusedEntityInfo.id],
      ["==", ["get", "OSM_TYPE"], focusedEntityInfo.type],
    ],
    sourceLayer: "park",
  });
  return compositeGeoJson(results);
}
// check the current extent of the map, and if focused area is too far offscreen, put it back onscreen
function checkMapExtent() {
  if (!focusAreaBoundingBox) return;
  let currentBounds = map.getBounds();
  let targetBounds = currentBounds.toArray();
  let width = focusAreaBoundingBox[2] - focusAreaBoundingBox[0];
  let height = focusAreaBoundingBox[3] - focusAreaBoundingBox[1];
  let maxExtent = Math.max(width, height);
  let margin = maxExtent / 4;

  if (currentBounds.getNorth() < focusAreaBoundingBox[1] - margin) targetBounds[1][1] = focusAreaBoundingBox[1] + margin;
  if (currentBounds.getSouth() > focusAreaBoundingBox[3] + margin) targetBounds[0][1] = focusAreaBoundingBox[3] - margin;
  if (currentBounds.getEast() < focusAreaBoundingBox[0] - margin) targetBounds[1][0] = focusAreaBoundingBox[0] + margin;
  if (currentBounds.getWest() > focusAreaBoundingBox[2] + margin) targetBounds[0][0] = focusAreaBoundingBox[2] - margin;
  if (currentBounds.toArray().toString() !== targetBounds.toString()) {
    map.fitBounds(targetBounds);
  }
}

function fitMapToBounds(bbox) {
  let width = bbox[2] - bbox[0];
  let height = bbox[3] - bbox[1];
  let maxExtent = Math.max(width, height);
  let fitBbox = extendBbox(bbox, maxExtent / 16);
  map.fitBounds(fitBbox);
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
  if (focusAreaGeoJsonBuffered?.geometry?.coordinates?.length) {
    filter.push(["within", focusAreaGeoJsonBuffered]);
  }
  if (travelMode !== "canoe" && travelMode !== "all") {
    // don't show canoe-specific POIs for other travel modes
    filter.push([
      "!", [
        "any",
        ["==", ["get", "natural"], "beaver_dam"],
        ["in", ["get", "waterway"], ["literal", ["dam", "weir"]]],
        ["==", ["get", "lock"], "yes"],
        ["==", ["get", "man_made"], "monitoring_station"],
      ]
    ]);
  }
  if (travelMode !== "all") {
    let poiKeys = [travelMode];
    let poiKeysByTravelMode = {
      "foot": ["hiking"],
      "canoe": ["canoe", "portage"],
    };
    if (poiKeysByTravelMode[travelMode]) poiKeys = poiKeysByTravelMode[travelMode];
    filter.push([
      "any",
      [
        "!", [
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