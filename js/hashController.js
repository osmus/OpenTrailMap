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

function updateForHash(skipMapUpdate) { 
  setTravelMode(hashValue("mode"), skipMapUpdate);
  setLens(hashValue("lens"), skipMapUpdate);
  selectEntity(selectedEntityInfoFromHash(), skipMapUpdate);
  focusEntity(focusedEntityInfoFromHash(), skipMapUpdate);
  hashValue("inspect") ? openSidebar() : closeSidebar();
}