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

function entityInfoFromHash() {
  var searchParams = new URLSearchParams(window.location.hash.slice(1));
  if (searchParams.has("selected")) {
    var value = searchParams.get("selected");
    var components = value.split("/");
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
  return null;
}

function updateForHash() {
  selectEntity(entityInfoFromHash());
}