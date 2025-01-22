import { state } from "./stateController.js";

function setHashParameters(params) {
  let searchParams = new URLSearchParams(window.location.hash.slice(1));
  for (let key in params) {
    if (params[key]) {
      searchParams.set(key, params[key]);
    } else if (searchParams.has(key)) {
      searchParams.delete(key);
    }
  }
  let hash = "#" + decodeURIComponent(searchParams.toString());
  if (hash !== window.location.hash) {
    window.location.hash = hash;
  }
}

function hashValue(key) {
  let searchParams = new URLSearchParams(window.location.hash.slice(1));
  if (searchParams.has(key)) return searchParams.get(key);
  return null;
}

function parseEntityInfoFromString(string) {
  let components = string.split("/");
  if (components.length == 2) {
    let type = components[0];
    let id = parseInt(components[1]);
    if (["node", "way", "relation"].includes(type)) {
      return {
        type: type,
        id: id,
      };
    }
  }
}

function focusedEntityInfoFromHash() {
  let value = hashValue("focus");
  if (value) return parseEntityInfoFromString(value);
  return null;
}

function selectedEntityInfoFromHash() {
  let value = hashValue("selected");
  if (value) return parseEntityInfoFromString(value);
  return null;
}

function updateForHash() {
  state.setInspectorOpen(hashValue("inspect"));
  state.setTravelMode(hashValue("mode"));
  state.setLens(hashValue("lens"));
  state.selectEntity(selectedEntityInfoFromHash());
  state.focusEntity(focusedEntityInfoFromHash());
}

window.addEventListener('load', function() {

  updateForHash();

  window.addEventListener("hashchange", function() {
    updateForHash();
  });

  state.addEventListener('inspectorOpenChange', function() {
    setHashParameters({ inspect: state.inspectorOpen ? '1' : null });
  });
  state.addEventListener('lensChange', function() {
    setHashParameters({ lens: state.lens === state.defaultLens ? null : state.lens });
  });
  state.addEventListener('travelModeChange', function() {
    setHashParameters({ mode: state.travelMode === state.defaultTravelMode ? null : state.travelMode });
  });
  state.addEventListener('selectedEntityChange', function() {
    let selectedEntityInfo = state.selectedEntityInfo;
    let type = selectedEntityInfo?.type;
    let entityId = selectedEntityInfo?.id;
    setHashParameters({
      selected: selectedEntityInfo ? type + "/" + entityId : null
    });
  });
  state.addEventListener('focusedEntityChange', function() {
    let focusedEntityInfo = state.focusedEntityInfo;
    let type = focusedEntityInfo?.type;
    let entityId = focusedEntityInfo?.id;
    setHashParameters({
      focus: focusedEntityInfo ? type + "/" + entityId : null
    });
  });

});

