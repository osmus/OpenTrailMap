import { defaultLens, defaultTravelMode, state } from "./state.js";

function setHashParameters(params) {
  const searchParams = new URLSearchParams(window.location.hash.slice(1));
  for (const key in params) {
    if (params[key]) {
      searchParams.set(key, params[key]);
    } else if (searchParams.has(key)) {
      searchParams.delete(key);
    }
  }
  // URLSearchParams percent-encodes the separators in MapLibre's own `map=`
  // parameter, which it then fails to parse, so undo the encoding wholesale.
  const hash = `#${decodeURIComponent(searchParams.toString())}`;
  if (hash !== window.location.hash) {
    // replaceState (rather than assigning location.hash) keeps every mode,
    // lens and selection change out of the browser's history stack. This is
    // also what MapLibre's own hash control does.
    window.history.replaceState(null, "", hash);
  }
}

function hashValue(key) {
  const searchParams = new URLSearchParams(window.location.hash.slice(1));
  if (searchParams.has(key)) return searchParams.get(key);
  return null;
}

function parseEntityInfoFromString(string) {
  const components = string.split("/");
  if (components.length === 2) {
    const type = components[0];
    const id = parseInt(components[1], 10);
    if (["node", "way", "relation"].includes(type)) {
      return {
        type: type,
        id: id,
      };
    }
  }
}

function selectedEntityInfoFromHash() {
  const value = hashValue("selected");
  if (value) return parseEntityInfoFromString(value);
  return null;
}

function updateForHash() {
  state.setTravelMode(hashValue("mode"));
  state.setLens(hashValue("lens"));
  state.selectEntity(selectedEntityInfoFromHash());
}

export function initHash() {
  updateForHash();

  window.addEventListener("hashchange", () => {
    updateForHash();
  });

  state.addEventListener("lensChange", () => {
    setHashParameters({ lens: state.lens === defaultLens ? null : state.lens });
  });
  state.addEventListener("travelModeChange", () => {
    setHashParameters({
      mode: state.travelMode === defaultTravelMode ? null : state.travelMode,
    });
  });
  state.addEventListener("selectedEntityChange", () => {
    const selectedEntityInfo = state.selectedEntityInfo;
    const type = selectedEntityInfo?.type;
    const entityId = selectedEntityInfo?.id;
    setHashParameters({
      selected: selectedEntityInfo ? `${type}/${entityId}` : null,
    });
  });
}
