var map;

var lensStrings = {
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

const travelModes = [
  "foot",
  "wheelchair",
  "bicycle",
  "horse",
  "atv",
  "canoe",
  "snowmobile",
];
const metadataLenses = {
  label: "Metadata",
  subitems: [
    "fixme",
    "check_date",
    "OSM_TIMESTAMP",
  ]
};
const landLensOptions = [
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
  "all": landLensOptions,
  "atv": landLensOptions,
  "bicycle": landLensOptions,
  "canoe": canoeLensOptions,
  "foot": hikingLensOptions,
  "horse": landLensOptions,
  "snowmobile": landLensOptions,
  "wheelchair": landLensOptions,
};
function lensesForMode(travelMode) {
  return lensOptionsByMode[travelMode].flatMap(function(item) {
    return item.subitems;
  });
}
const highwayOnlyLenses = [
  "hand_cart",
  "incline",
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
const defaultTravelMode = "foot";
const defaultLens= "";
var travelMode = defaultTravelMode;
var lens = defaultLens;
var lastLens = defaultLens;

var selectedEntityInfo;
var hoveredEntityInfo;

function selectEntity(entityInfo) {

  if (selectedEntityInfo?.id === entityInfo?.id &&
    selectedEntityInfo?.type === entityInfo?.type
  ) return;

  selectedEntityInfo = entityInfo;

  var type = selectedEntityInfo && selectedEntityInfo.type;
  var entityId = selectedEntityInfo && selectedEntityInfo.id;

  setHashParameters({
    selected: selectedEntityInfo ? type + "/" + entityId : null
  });

  updateMapForSelection();
  updateMapForHover();

  updateSidebar(selectedEntityInfo);

  if (!selectedEntityInfo) return;

  fetchOsmEntity(type, entityId).then(function(entity) {
    if (entity) {
      fetchOsmChangeset(entity.changeset).then(function(changeset) {
        updateMetaTable(entity, changeset);
      });
    }
    var tags = entity && entity.tags;
    if (tags) updateTagsTable(tags);

    // update map again in case we selected a relation and want to highlight members
    updateMapForSelection();
  });

  fetchOsmEntityMemberships(type, entityId).then(function(memberships) {
    updateMembershipsTable(memberships);
  });
}
function updateLensControl() {
  var html = "";
  var items = lensOptionsByMode[travelMode];
  
  html += '<option value="">General</option>';
  items.forEach(function(item) {
    if (item.subitems) {
      html += '<optgroup label="' + item.label + '">';
      item.subitems.forEach(function(item) {
        var label = item.label ? item.label : lensStrings[item].label;
        html += '<option value="' + item + '">' + label + '</option>';
      })
      html += '</optgroup>';
    }
  });
  var lensElement =  document.getElementById("lens");
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
    'bothways-arrows',
    'cairn',
    'canoe',
    'canoe-noaccess',
    'dam',
    'dam-canoeable',
    'disallowed-stripes',
    'guidepost',
    'lock',
    'lock-canoeable',
    'oneway-arrow-right',
    'oneway-arrow-left',
    'question',
    'peak',
    'ranger_station',
    'route_marker',
    'slipway-canoe-trailer',
    'slipway-canoe-trailer-noaccess',
    'slipway-canoe',
    'slipway-canoe-noaccess',
    'streamgage',
    'trailhead',
    'waterfall',
    'waterfall-canoeable',
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