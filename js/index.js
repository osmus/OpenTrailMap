var map;

const travelModes = [
  "foot",
  "wheelchair",
  "bicycle",
  "horse",
  "atv",
  "canoe",
  "snowmobile",
];
const landLabels = [
  {
    id: "",
    label: "General"
  },
  {
    label: "Attributes",
    subitems: [
      {
        id: "access",
        label: "Access"
      },
      {
        id: "dog",
        label: "Dog Access"
      },
      {
        id: "incline",
        label: "Incline"
      },
      {
        id: "name",
        label: "Name"
      },
      {
        id: "oneway",
        label: "Oneway"
      },
      {
        id: "operator",
        label: "Operator"
      },
      {
        id: "surface",
        label: "Surface"
      },
      {
        id: "smoothness",
        label: "Smoothness"
      },
      {
        id: "trail_visibility",
        label: "Trail Visibility"
      },
      {
        id: "width",
        label: "Width"
      },
    ]
  },
  {
    label: "Metadata",
    subitems: [
      {
        id: "fixme",
        label: "Fixme Requests"
      },
      {
        id: "check_date",
        label: "Last Checked Date"
      },
      {
        id: "OSM_TIMESTAMP",
        label: "Last Edited Date"
      },
    ]
  },
];
const canoeLabels = [
  {
    id: "",
    label: "General"
  },
  {
    label: "Attributes",
    subitems: [
      {
        id: "access",
        label: "Access"
      },
      {
        id: "dog",
        label: "Dog Access"
      },
      {
        id: "name",
        label: "Name"
      },
      {
        id: "oneway",
        label: "Oneway"
      },
      {
        id: "width",
        label: "Width"
      },
    ]
  },
  {
    label: "Waterway Attributes",
    subitems: [
      {
        id: "intermittent",
        label: "Intermittent"
      },
      {
        id: "open_water",
        label: "Open Water"
      },
      {
        id: "rapids",
        label: "Rapids"
      },
      {
        id: "tidal",
        label: "Tidal"
      },
    ]
  },
  {
    label: "Portage Attributes",
    subitems: [
      {
        id: "hand_cart",
        label: "Hand Cart"
      },
      {
        id: "incline",
        label: "Incline"
      },
      {
        id: "operator",
        label: "Operator"
      },
      {
        id: "surface",
        label: "Surface"
      },
      {
        id: "smoothness",
        label: "Smoothness"
      },
      {
        id: "trail_visibility",
        label: "Trail Visibility"
      },
    ]
  },
  {
    label: "Metadata",
    subitems: [
      {
        id: "fixme",
        label: "Fixme Requests"
      },
      {
        id: "check_date",
        label: "Last Checked Date"
      },
      {
        id: "OSM_TIMESTAMP",
        label: "Last Edited Date"
      },
    ]
  },
];
const highwayOnlyLenses = [
  "operator",
  "surface",
  "smoothness",
  "trail_visibility",
  "incline",
  "hand_cart",
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

const colors = {
  public: "#005908",
  noaccess: "#A2D61D",
  specified: "#007f79",
  unspecified: "#8e00cc",
  bgwater: "#a6b2c4",
  water: "#003b93",
  label: "#000",
  poiLabel: "#4A282A",
  labelHalo: "rgba(255, 255, 255, 1)",
  selection: "yellow",
};

const poiLabelZoom = 14;

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
  var items = travelMode === 'canoe' ? canoeLabels : landLabels;
  items.forEach(function(item) {
    if (item.subitems) {
      html += '<optgroup label="' + item.label + '">';
      item.subitems.forEach(function(item) {
        html += '<option value="' + item.id + '">' + item.label + '</option>';
      })
      html += '</optgroup>';
    } else {
      html += '<option value="' + item.id + '">' + item.label + '</option>';
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

  document.getElementById("travel-mode").value = travelMode;

  updateLensControl();
  updateTrailLayers();
  setHashParameters({ mode: travelMode === defaultTravelMode ? null : value });
}
function setLens(value) {
  if (value === null) value = defaultLens;
  if (travelMode !== 'canoe' && waterwayOnlyLenses.includes(value)) value = "";

  if (lens === value) return;
  lens = value;

  document.getElementById("lens").value = lens;

  updateTrailLayers();
  setHashParameters({ lens: lens === defaultLens ? null : value });
}

window.onload = (event) => {

  window.addEventListener("hashchange", updateForHash);

  document.getElementById("travel-mode").addEventListener('change', function(e) {
    setTravelMode(e.target.value);
  });
  document.getElementById("lens").addEventListener('change', function(e) {
    setLens(e.target.value);
  });

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
    'canoe',
    'dam',
    'dam-canoeable',
    'disallowed-stripes',
    'lock',
    'lock-canoeable',
    'oneway-arrow-right',
    'oneway-arrow-left',
    'question',
    'ranger-station',
    'slipway-canoe-trailer',
    'slipway-canoe',
    'streamgage',
    'trailhead',
    'waterfall',
    'waterfall-canoeable',
  ];

  for (let i in imageToLoad) {
    let img = imageToLoad[i];
    map.loadImage('img/map/' + img + '.png').then(resp => {
      map.addImage(img, resp.data, { pixelRatio: 2 });
    });
  }

  map
    .on('load', loadInitialMap);
}