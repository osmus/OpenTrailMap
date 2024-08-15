let map;

let lensStrings = {
  access: {
    label: "Access"
  },
  covered: {
    label: "Covered"
  },
  dog: {
    label: "Dog Access"
  },
  incline: {
    label: "Incline"
  },
  maxspeed: {
    label: "Speed Limit"
  },
  name: {
    label: "Name"
  },
  oneway: {
    label: "Oneway"
  },
  operator: {
    label: "Operator"
  },
  sac_scale: {
    label: "SAC Hiking Scale"
  },
  smoothness: {
    label: "Smoothness"
  },
  surface: {
    label: "Surface"
  },
  trail_visibility: {
    label: "Trail Visibility"
  },
  width: {
    label: "Width"
  },
  fixme: {
    label: "Fixme Requests"
  },
  check_date: {
    label: "Last Checked Date"
  },
  OSM_TIMESTAMP: {
    label: "Last Edited Date"
  },
  intermittent: {
    label: "Intermittent"
  },
  open_water: {
    label: "Open Water"
  },
  rapids: {
    label: "Rapids"
  },
  tidal: {
    label: "Tidal"
  },
  hand_cart: {
    label: "Hand Cart"
  },
}
const metadataLenses = {
  label: "Metadata",
  subitems: [
    "fixme",
    "check_date",
    "OSM_TIMESTAMP",
  ]
};
const allLensOptions = [
  {
    label: "Attributes",
    subitems: [
      "access",
      "covered",
      "dog",
      "hand_cart",
      "incline",
      "name",
      "oneway",
      "operator",
      "sac_scale",
      "smoothness",
      "maxspeed",
      "surface",
      "trail_visibility",
      "width",
    ],
  },
  {
    label: "Waterway Attributes",
    subitems: [
      "intermittent",
      "open_water",
      "rapids",
      "tidal",
    ]
  },
  metadataLenses,
];
const basicLensOptions = [
  {
    label: "Attributes",
    subitems: [
      "access",
      "covered",
      "dog",
      "incline",
      "name",
      "oneway",
      "operator",
      "smoothness",
      "surface",
      "trail_visibility",
      "width",
    ]
  },
  metadataLenses,
];
const vehicleLensOptions = [
  {
    label: "Attributes",
    subitems: [
      "access",
      "covered",
      "dog",
      "incline",
      "name",
      "oneway",
      "operator",
      "smoothness",
      "maxspeed",
      "surface",
      "trail_visibility",
       "width",
    ]
  },
  metadataLenses,
];
const hikingLensOptions = [
  {
    label: "Attributes",
    subitems: [
      "access",
      "covered",
      "dog",
      "incline",
      "name",
      "oneway",
      "operator",
      "sac_scale",
      "smoothness",
      "surface",
      "trail_visibility",
      "width",
    ]
  },
  metadataLenses,
];
const canoeLensOptions = [
  {
    label: "Attributes",
    subitems: [
      "access",
      "covered",
      "dog",
      "name",
      "oneway",
      "width",
    ]
  },
  {
    label: "Waterway Attributes",
    subitems: [
      "intermittent",
      "open_water",
      "rapids",
      "tidal",
    ]
  },
  {
    label: "Portage Attributes",
    subitems: [
      "hand_cart",
      "incline",
      "operator",
      "surface",
      "smoothness",
      "trail_visibility",
    ]
  },
  metadataLenses,
];
const lensOptionsByMode = {
  "all": allLensOptions,
  "atv": vehicleLensOptions,
  "bicycle": vehicleLensOptions,
  "canoe": canoeLensOptions,
  "foot": hikingLensOptions,
  "horse": vehicleLensOptions,
  "snowmobile": vehicleLensOptions,
  "ski:nordic": basicLensOptions,
  "wheelchair": basicLensOptions,
};
function lensesForMode(travelMode) {
  return lensOptionsByMode[travelMode].flatMap(function(item) {
    return item.subitems;
  });
}
const highwayOnlyLenses = [
  "hand_cart",
  "incline",
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
const defaultTravelMode = "all";
const defaultLens= "";
let travelMode = defaultTravelMode;
let lens = defaultLens;
let lastLens = defaultLens;

let focusedEntityInfo;
let selectedEntityInfo;
let hoveredEntityInfo;

function isValidEntityInfo(entityInfo) {
  return ["node", "way", "relation"].includes(entityInfo?.type) &&
    entityInfo?.id > 0;
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

let focusAreaGeoJson;
let focusAreaGeoJsonBuffered;
let focusAreaBoundingBox;

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
function fitMapToFocusArea() {
  if (!focusAreaBoundingBox) return;
  let width = focusAreaBoundingBox[2] - focusAreaBoundingBox[0];
  let height = focusAreaBoundingBox[3] - focusAreaBoundingBox[1];
  let maxExtent = Math.max(width, height);
  let fitBbox = extendBbox(focusAreaBoundingBox, maxExtent / 16);
  map.fitBounds(fitBbox);
}
function reloadFocusAreaIfNeeded() {
  let newFocusAreaGeoJson = buildFocusAreaGeoJson();

  if ((newFocusAreaGeoJson && JSON.stringify(newFocusAreaGeoJson)) !==
    (focusAreaGeoJson && JSON.stringify(focusAreaGeoJson))) {

    focusAreaGeoJson = newFocusAreaGeoJson;
    focusAreaBoundingBox = bboxOfGeoJson(focusAreaGeoJson);
    focusAreaGeoJsonBuffered = focusAreaGeoJson?.geometry?.coordinates?.length ? turfBuffer.buffer(focusAreaGeoJson, 0.25, {units: 'kilometers'}) : focusAreaGeoJson;

    if (focusAreaGeoJson) document.getElementById("map-title").innerText = focusAreaGeoJson.properties.name;
  
    updateTrailLayers();
  }
}

function focusEntity(entityInfo) {
  if (!isValidEntityInfo(entityInfo)) entityInfo = null;

  if (focusedEntityInfo?.id === entityInfo?.id &&
    focusedEntityInfo?.type === entityInfo?.type
  ) return;

  focusedEntityInfo = entityInfo;

  let bodyElement = document.getElementsByTagName('body')[0];

  focusedEntityInfo ? bodyElement.classList.add('area-focused') : bodyElement.classList.remove('area-focused');

  let type = focusedEntityInfo?.type;
  let entityId = focusedEntityInfo?.id;

  setHashParameters({
    focus: focusedEntityInfo ? type + "/" + entityId : null
  });

  document.getElementById("map-title").innerText = '';
  document.getElementById("nameplate").style.display = focusedEntityInfo ? 'flex' : 'none';

  reloadFocusAreaIfNeeded();
  fitMapToFocusArea();
}

function selectEntity(entityInfo) {

  if (selectedEntityInfo?.id === entityInfo?.id &&
    selectedEntityInfo?.type === entityInfo?.type
  ) return;

  selectedEntityInfo = entityInfo;

  let type = selectedEntityInfo?.type;
  let entityId = selectedEntityInfo?.id;

  setHashParameters({
    selected: selectedEntityInfo ? type + "/" + entityId : null
  });

  updateMapForSelection();
  updateMapForHover();

  if (isSidebarOpen()) updateSidebar();

  if (!selectedEntityInfo) return;

  if (type === "relation") {
    fetchOsmEntity(type, entityId).then(function(entity) {
      // update map again to add highlighting to any relation members
      updateMapForSelection();
    });
  }
}
function updateLensControl() {
  let html = "";
  let items = lensOptionsByMode[travelMode];
  
  html += '<option value="">General</option>';
  items.forEach(function(item) {
    if (item.subitems) {
      html += '<optgroup label="' + item.label + '">';
      item.subitems.forEach(function(item) {
        let label = item.label ? item.label : lensStrings[item].label;
        html += '<option value="' + item + '">' + label + '</option>';
      })
      html += '</optgroup>';
    }
  });
  let lensElement =  document.getElementById("lens");
  lensElement.innerHTML = html;
  lensElement.value = lens;
}
function setTravelMode(value) {
  if (value === null) value = defaultTravelMode;
  if (travelMode === value) return;
  travelMode = value;

  if (!lensesForMode(travelMode).includes(lens)) setLens("", true);

  document.getElementById("travel-mode").value = travelMode;

  updateLensControl();
  updateTrailLayers();
  setHashParameters({ mode: travelMode === defaultTravelMode ? null : value });
}
function setLens(value, skipMapUpdate) {
  if (value === null) value = defaultLens;
  if (!lensesForMode(travelMode).includes(value)) value = "";

  if (lens === value) return;
  lens = value;

  document.getElementById("lens").value = lens;

  if (!skipMapUpdate) updateTrailLayers();
  setHashParameters({ lens: lens === defaultLens ? null : value });
}

window.onload = function(event) {

  window.addEventListener("hashchange", updateForHash);

  document.getElementById("travel-mode").addEventListener('change', function(e) {
    setTravelMode(e.target.value);
  });
  document.getElementById("lens").addEventListener('change', function(e) {
    setLens(e.target.value);
  });
  document.getElementById("inspect-toggle").addEventListener('click', function(e) {
    e.preventDefault();
    toggleSidebar();
  });
  document.getElementById("clear-focus").addEventListener('click', function(e) {
    e.preventDefault();
    focusEntity();
  });

  updateLensControl();

  map = new maplibregl.Map({
    container: 'map',
    hash: "map",
    style: './styles/basemap.json',
    center: [-111.545,39.546],
    zoom: 6
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

  const imageToLoad = [
    'beaver_dam',
    'beaver_dam-canoeable',
    'beaver_dam-hazard',
    'bothways-arrows',
    'cairn',
    'campground',
    'campsite',
    'canoe',
    'canoe-noaccess',
    'caravan_site',
    'dam',
    'dam-canoeable',
    'dam-hazard',
    'disallowed-stripes',
    'ferry',
    'guidepost',
    'lean_to',
    'lock',
    'lock-canoeable',
    'lock-hazard',
    'nature_reserve',
    'oneway-arrow-right',
    'oneway-arrow-left',
    'question',
    'park',
    'peak',
    'protected_area',
    'ranger_station',
    'restricted-zone',
    'route_marker',
    'slipway-canoe-trailer',
    'slipway-canoe-trailer-noaccess',
    'slipway-canoe',
    'slipway-canoe-noaccess',
    'streamgage',
    'trailhead',
    'viewpoint',
    'waterfall',
    'waterfall-canoeable',
    'waterfall-hazard',
  ];

  for (let i in imageToLoad) {
    let img = imageToLoad[i];
    map.loadImage('img/map/' + img + '.png').then(function(resp) {
      return map.addImage(img, resp.data, { pixelRatio: 2 });
    });
  }

  map
    .on('load', loadInitialMap);
}
