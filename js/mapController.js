import { state } from "./stateController.js";
import { osm } from "./osmController.js";
import { generateStyle } from './styleGenerator.js'; 
import { createElement } from "./utils.js";

let map;

let activePopup;
let baseStyleJsonString;

let cachedStyles = {};

let focusAreaGeoJson;
let focusAreaGeoJsonBuffered;
let focusAreaBoundingBox;

let hoveredEntityInfo;

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

window.addEventListener('load', function() {
  initializeMap();

  state.addEventListener('inspectorOpenChange', function() {
    if (state.inspectorOpen && activePopup) {
      activePopup.remove();
      activePopup = null;
    }
  });
});

async function initializeMap() {

  baseStyleJsonString = await fetch('/style/basestyle.json').then(response => response.text());

  document.addEventListener('keydown', function(e) {

    if (e.isComposing || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

    switch(e.key) {
      case 'z':
        let info = state.selectedEntityInfo || state.focusedEntityInfo;
        let feature = info && getFeatureFromLayers(info.id, info.type, ['park', 'trail', 'trail_poi', {source: 'openmaptiles', layer: 'mountain_peak'}]) || info?.rawFeature;
        if (feature) {
          let bounds = getEntityBoundingBox(feature);
          if (bounds) {
            fitMapToBounds(bounds);
          } else if (feature.geometry.type === "Point") {
            map.flyTo({center: feature.geometry.coordinates, zoom: Math.max(map.getZoom(), 12)});
          }
        }
        break;
    }
  });

  // default
  let initialCenter = [-111.545, 39.546];
  let initialZoom = 6;

  // show last-open area if any (this is overriden by the URL hash map parameter)
  let cachedTransformString = localStorage?.getItem('map_transform');
  let cachedTransform = cachedTransformString && JSON.parse(cachedTransformString);
  if (cachedTransform && cachedTransform.zoom && cachedTransform.lat && cachedTransform.lng) {
    initialZoom = cachedTransform.zoom;
    initialCenter = cachedTransform;
  }

  map = new maplibregl.Map({
    container: 'map',
    hash: "map",
    center: initialCenter,
    zoom: initialZoom,
    fadeDuration: 0,
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

  reloadMapStyle();

  map.on('mousemove', didMouseMoveMap);
  map.on('click', didClickMap);
  map.on('dblclick', didDoubleClickMap);
  map.on('moveend', checkMapExtent);
  map.on('moveend', function() {
      if (localStorage) {
        let transform = map.getCenter();
        transform.zoom = map.getZoom();
        localStorage.setItem('map_transform', JSON.stringify(transform));
      }
    });
  map.on('sourcedata', function(event) {
      if (event.sourceId === 'trails' && event.isSourceLoaded) {
        reloadFocusAreaIfNeeded();
      }
    });

  state.addEventListener('travelModeChange', function() {
    reloadMapStyle();
  });
  state.addEventListener('lensChange', function() {
    reloadMapStyle();
  });
  state.addEventListener('selectedEntityChange', function() {
    updateMapForSelection();

    let selectedEntityInfo = state.selectedEntityInfo;
    if (selectedEntityInfo && selectedEntityInfo?.type === "relation") {
      osm.fetchOsmEntity(selectedEntityInfo.type, selectedEntityInfo.id).then(function() {
        // update map again to add highlighting to any relation members
        updateMapForSelection();
      });
    }
  });
  state.addEventListener('focusedEntityChange', function() {
    document.getElementById("map-title").innerText = '';
    reloadFocusAreaIfNeeded();
    updateMapForSelection();
  });
}

function getStyleId() {
  return state.travelMode + '/' + state.lens;
}

function getCachedStyleLayer(layerId) {
  let cachedStyle = JSON.parse(cachedStyles[getStyleId()]);
  return cachedStyle.layers.find(layer => layer.id === layerId);
}

function reloadMapStyle() {

  if (!baseStyleJsonString) return;

  let styleId = getStyleId();
  if (!cachedStyles[styleId]) cachedStyles[styleId] = JSON.stringify(generateStyle(baseStyleJsonString, state.travelMode, state.lens));
  
  // always parse from string to avoid stale referenced objects
  let style = JSON.parse(cachedStyles[styleId]);

  // MapLibre requires an absolute URL for `sprite`
  style.sprite = window.location.origin + style.sprite;

  for (let cat in possibleLayerIdsByCategory) {
    layerIdsByCategory[cat] = possibleLayerIdsByCategory[cat].filter(id => style.layers.find(layer => layer.id === id));
  }

  applyStyleAddendumsToStyle(style, styleAddendumsForHover());
  applyStyleAddendumsToStyle(style, styleAddendumsForSelection());
  applyStyleAddendumsToStyle(style, styleAddendumsForFocus());

  map.setStyle(style, {
    diff: true,
    validate: true,
  });
}

function reloadFocusAreaIfNeeded() {
  let focusedEntityInfo = state.focusedEntityInfo;
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
  let focusedEntityInfo = state.focusedEntityInfo;
  let focusedId = focusedEntityInfo?.id ? omtId(focusedEntityInfo.id, focusedEntityInfo.type) : null;
  return {
    "trail-pois": {
      "minzoom": focusedEntityInfo ? 0 : getCachedStyleLayer('trail-pois').minzoom,
      "filter": [
        "all",
        getCachedStyleLayer('trail-pois').filter,
        ...(focusAreaGeoJsonBuffered?.geometry?.coordinates?.length ? [["within", focusAreaGeoJsonBuffered]] : []),
      ]
    },
    "major-trail-pois": {
      "filter": [
        "all",
        getCachedStyleLayer('major-trail-pois').filter,
        // don't show icon and label for currently focused feature
        ["!=", ["get", "OSM_ID"], focusedEntityInfo ? focusedEntityInfo.id : null],
        ...(focusAreaGeoJsonBuffered?.geometry?.coordinates?.length ? [["within", focusAreaGeoJsonBuffered]] : []),
      ],
    },
    "peaks": {
      "filter": [
        "all",
        getCachedStyleLayer('peaks').filter,
        ...(focusAreaGeoJsonBuffered?.geometry?.coordinates?.length ? [["within", focusAreaGeoJsonBuffered]] : []),
      ]
    },
    "park-fill": {
      "filter": [
        "any",
        getCachedStyleLayer('park-fill').filter,
        ["==", ["id"], focusedId],
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
  updateMapForHover();
}

function styleAddendumsForSelection() {
  let selectedEntityInfo = state.selectedEntityInfo;
  let focusedEntityInfo = state.focusedEntityInfo;

  let id = selectedEntityInfo && selectedEntityInfo.id;
  let type = selectedEntityInfo && selectedEntityInfo.type;

  let focusedId = focusedEntityInfo?.id;

  let idsToHighlight = [id && id !== focusedId ? id : -1];

  if (type === "relation") {
    let members = osm.getCachedEntity(type, id)?.members || [];
    members.forEach(function(member) {
      if (member.role !== 'inner') idsToHighlight.push(member.ref);
      
      if (member.type === "relation") {
        // only recurse down if we have the entity cached
        let childRelationMembers = osm.getCachedEntity(member.type, member.ref)?.members || [];
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

  let selectedEntityInfo = state.selectedEntityInfo;

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
  state.selectEntity(entity);

  if (!entity || state.inspectorOpen) return;
  
  let coordinates = entity.focusLngLat;

  // Ensure that if the map is zoomed out such that multiple
  // copies of the feature are visible, the popup appears
  // over the copy being pointed to.
  while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
  }

  let tags = entity.rawFeature.properties;

  let div = createElement('div');
  if (tags.name) {
    div.append(
      createElement('b')
        .append(tags.name),
      createElement('br')
    );
  }  
  div.append(
    createElement('a')
      .setAttribute('href', '#')
      .setAttribute('class', 'button')
      .addEventListener('click', didClickViewDetails)
      .append('View Details')
  );

  activePopup = new maplibregl.Popup({
      className: 'quickinfo',
      closeButton: false,
    })
    .setLngLat(coordinates)
    .setDOMContent(div)
    .addTo(map);
}

function didClickViewDetails(e) {
  e.preventDefault();
  state.setInspectorOpen(true);
  return false;
}

function didDoubleClickMap(e) {

  let entity = entityForEvent(e, ['major-trail-pois']);
  if (entity) {
    e.preventDefault();
    state.focusEntity(entity);    
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

function getFeatureFromLayers(id, type, layers) {
  for (let i in layers) {
    let layer = layers[i];
    let features = map.querySourceFeatures(layer.source || 'trails', {
      filter: [
        "any",
        [
          "all",
          ["==", ["get", "OSM_ID"], id],
          ["==", ["get", "OSM_TYPE"], type],
        ],
        ["==", ["id"], omtId(id, type)],
      ],
      sourceLayer: layer.layer || layer,
    });
    if (features.length) return features[0];
  }
}

function getEntityBoundingBoxFromLayer(id, type, layer) {
  let focusedEntityInfo = state.focusedEntityInfo;
  if (!focusedEntityInfo) return null;
  let feature = getFeatureFromLayers(id, type, [layer]);
  if (feature) {
    return getEntityBoundingBox(feature);
  }
}

function buildFocusAreaGeoJson() {
  let focusedEntityInfo = state.focusedEntityInfo;
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

function extendBbox(bbox, buffer) {
  bbox = bbox.slice();
  bbox[0] -= buffer; // west
  bbox[1] -= buffer; // south
  bbox[2] += buffer; // east
  bbox[3] += buffer; // north
  return bbox;
}