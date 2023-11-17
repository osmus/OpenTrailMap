var map;

var mode = "foot";

const colors = {
  public: "#005908",
  noaccess: "#A2D61D",
  unspecified: "#8e00cc",
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

window.onload = (event) => {

  window.addEventListener("hashchange", updateForHash);

  document.getElementById("travel-mode").onchange = function(e) {
    mode = e.target.value;
    updateMapLayers();
  }

  try {
    maptilerApiKey;
  } catch(e) {
      if(e.name == "ReferenceError") {
        // Use the production key if we didn't find a dev key (only works on OSM US domains)
        maptilerApiKey = "qe6b8locBISzDLGJweZ3";
      }
  }

  map = new maplibregl.Map({
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

  map
    .on('load', loadInitialMap);
}