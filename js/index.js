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
  lit: {
    label: "Lit"
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
      "lit",
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
      "lit",
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
      "lit",
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
      "lit",
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
      "lit",
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
  "mtb": vehicleLensOptions,
  "canoe": canoeLensOptions,
  "foot": hikingLensOptions,
  "horse": vehicleLensOptions,
  "inline_skates": basicLensOptions,
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

function focusEntity(entityInfo, skipMapUpdate) {
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

  if (!skipMapUpdate) {
    reloadFocusAreaIfNeeded();
    updateMapForSelection();
  }
}

function selectEntity(entityInfo, skipMapUpdate) {

  if (selectedEntityInfo?.id === entityInfo?.id &&
    selectedEntityInfo?.type === entityInfo?.type
  ) return;

  selectedEntityInfo = entityInfo;

  let type = selectedEntityInfo?.type;
  let entityId = selectedEntityInfo?.id;

  setHashParameters({
    selected: selectedEntityInfo ? type + "/" + entityId : null
  });

  if (!skipMapUpdate) {
    updateMapForSelection();
    updateMapForHover();
  }

  if (isSidebarOpen()) updateSidebar(selectedEntityInfo);

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
function setTravelMode(value, skipMapUpdate) {
  if (value === null) value = defaultTravelMode;
  if (travelMode === value) return;
  travelMode = value;

  if (!lensesForMode(travelMode).includes(lens)) setLens("", true);

  document.getElementById("travel-mode").value = travelMode;

  updateLensControl();
  if (!skipMapUpdate) reloadMapStyle();
  setHashParameters({ mode: travelMode === defaultTravelMode ? null : value });
}
function setLens(value, skipMapUpdate) {
  if (value === null) value = defaultLens;
  if (!lensesForMode(travelMode).includes(value)) value = "";

  if (lens === value) return;
  lens = value;

  document.getElementById("lens").value = lens;

  if (!skipMapUpdate) reloadMapStyle();
  setHashParameters({ lens: lens === defaultLens ? null : value });
}

window.onload = function() {

  window.addEventListener("hashchange", function() {
    updateForHash(false);
  });

  document.addEventListener('keydown', function(e) {

    if (e.isComposing || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

    switch(e.key) {
      case 'z':
        if (selectedEntityInfo) {
          let bounds = getEntityBoundingBox(selectedEntityInfo.rawFeature);
          if (bounds) {
            fitMapToBounds(bounds);
          }
        }
        break;
    }
  });

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

    loadInitialMap();
}
