function setHashParameters(params) {
  var searchParams = new URLSearchParams(window.location.hash.slice(1));
  for (var key in params) {
    if (params[key]) {
      searchParams.set(key, params[key]);
    } else if (searchParams.has(key)) {
      searchParams.delete(key);
    }
  }
  var hash = "#" + decodeURIComponent(searchParams.toString());
  if (hash !== window.location.hash) {
    window.location.hash = hash;
  }
}

function hashValue(key) {
  var searchParams = new URLSearchParams(window.location.hash.slice(1));
  if (searchParams.has(key)) return searchParams.get(key);
  return null;
}

function parseEntityInfoFromString(string) {
  var components = string.split("/");
  if (components.length == 2) {
    var type = components[0];
    var id = parseInt(components[1]);
    if (["node", "way", "relation"].includes(type)) {
      return {
        type: type,
        id: id,
      };
    }
  }
}

function focusedEntityInfoFromHash() {
  var value = hashValue("focus");
  if (value) return parseEntityInfoFromString(value);
  return null;
}

function selectedEntityInfoFromHash() {
  var value = hashValue("selected");
  if (value) return parseEntityInfoFromString(value);
  return null;
}

function updateForHash() { 
  setTravelMode(hashValue("mode"));
  setLens(hashValue("lens"));
  selectEntity(selectedEntityInfoFromHash());
  focusEntity(focusedEntityInfoFromHash());
  hashValue("inspect") ? openSidebar() : closeSidebar();
}