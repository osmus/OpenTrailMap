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
const landTrailLenses = [
  "",
  "access",
  "name",
  "operator",
  "surface",
  "smoothness",
  "trail_visibility",
  "width",
  "incline",
  "fixme",
  "check_date"
];
const waterTrailLenses = [
  "",
  "access",
  "name",
  "tidal",
  "intermittent",
  "rapids",
  "open_water",
  "oneway",
  "width",
  "fixme",
  "check_date"
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
function setTravelMode(value) {
  if (value === null) value = defaultTravelMode;
  if (travelMode === value) return;
  travelMode = value;

  document.getElementById("travel-mode").value = travelMode;

  updateTrailLayers();
  setHashParameters({ mode: travelMode === defaultTravelMode ? null : value });
}
function setLens(value) {
  if (value === null) value = defaultLens;
  if (travelMode === 'canoe' && !waterTrailLenses.includes(value)) value = waterTrailLenses[0];
  if (travelMode !== 'canoe' && !landTrailLenses.includes(value)) value = landTrailLenses[0];

  if (lens === value) return;
  lens = value;

  document.getElementById("lens").value = lens;

  updateTrailLayers();
  setHashParameters({ lens: lens === defaultLens ? null : value });
}

/*
function setMapStyle(newMapStyle) {
  //if (newMapStyle === null) newMapStyle = defaultMapStyle;
  //if (newMapStyle === 'all') newMapStyle = lastAdvancedStyle;
  //if (!mapStyle.startsWith('canoe') && newMapStyle === 'canoe') newMapStyle = lastCanoeStyle;

  

  //if (advancedMapStyles.includes(mapStyle)) lastAdvancedStyle = mapStyle;
  //if (mapStyle.startsWith('canoe')) lastCanoeStyle = mapStyle;

  //document.getElementById("map-style").value = mapStyle.startsWith('canoe') ? 'canoe' : basicMapStyles.includes(mapStyle) ? mapStyle : 'all';
  //document.getElementById("advanced-style").value = mapStyle;
  //document.getElementById("canoe-style").value = mapStyle;
  //document.getElementById("advanced-style").style.display = advancedMapStyles.includes(mapStyle) ? 'block' : 'none';
  //document.getElementById("canoe-style").style.display = mapStyle.startsWith('canoe') ? 'block' : 'none';

  updateTrailLayers();
  setHashParameters({ style: mapStyle === defaultMapStyle ? null : mapStyle });
}
*/
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