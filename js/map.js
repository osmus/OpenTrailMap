import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { style as sourdoughStyle, spriteUrl } from "../style/style.js";
import { osm } from "./osm.js";
import { state } from "./state.js";
import { generateStyle } from "./styleGenerator.js";
import { clickableLayerIds, decodeFeatureId, encodeFeatureId } from "./utils.js";

let map;

const cachedStyles = {};

// Style currently applied to the map, so redundant reloads are skipped.
let appliedStyleId;

let clickableLayers = [];

let hoveredEntityInfo = null;

// Feature state can only be applied once MapLibre has finished loading a
// style; until then setFeatureState throws. Selections restored from the URL
// hash arrive before that, so they are re-applied when the style is ready.
let styleReady = false;

// Tracks previously-applied feature-state targets per (slot, stateKey), so we
// can remove them before applying the next set. Each entry is an array of
// { source, sourceLayer, id } targets.
const featureStateTargets = {
  "park:hover": [],
  "park:selected": [],
  "trail:hover": [],
  "trail:selected": [],
};

// Minimum zoom level at which the QA trail overlay is shown
const QA_MIN_ZOOM = 10;

// Polygon source-layers that may contain a selected park or protected area.
const PARK_SOURCE_LAYERS = ["leisure", "boundaries"];

export function initMap() {
  // default
  let initialCenter = [-111.545, 39.546];
  let initialZoom = 6;

  // show last-open area if any (this is overriden by the URL hash map parameter)
  const cachedTransformString = localStorage?.getItem("map_transform");
  const cachedTransform = cachedTransformString && JSON.parse(cachedTransformString);
  if (cachedTransform?.zoom && cachedTransform.lat && cachedTransform.lng) {
    initialZoom = cachedTransform.zoom;
    initialCenter = cachedTransform;
  }

  map = new maplibregl.Map({
    container: "map",
    hash: "map",
    center: initialCenter,
    zoom: initialZoom,
    fadeDuration: 0,
  });

  // Add zoom and rotation controls to the map.
  map.addControl(
    new maplibregl.NavigationControl({
      visualizePitch: true,
    }),
  );

  map.addControl(
    new maplibregl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
    }),
  );

  map.addControl(
    new maplibregl.ScaleControl({
      maxWidth: 150,
      unit: "imperial",
    }),
    "bottom-left",
  );

  reloadMapStyle();

  map.on("mousemove", didMouseMoveMap);
  map.on("mouseout", didMouseOutMap);
  map.on("click", didClickMap);
  map.on("moveend", () => {
    if (localStorage) {
      const transform = map.getCenter();
      transform.zoom = map.getZoom();
      localStorage.setItem("map_transform", JSON.stringify(transform));
    }
  });
  map.on("zoom", updateZoomMessage);
  updateZoomMessage();

  map.on("styledata", () => {
    styleReady = true;
    updateMapForSelection();
  });

  state.addEventListener("travelModeChange", reloadMapStyle);
  state.addEventListener("lensChange", reloadMapStyle);
  state.addEventListener("selectedEntityChange", () => {
    updateMapForSelection();

    const selectedEntityInfo = state.selectedEntityInfo;
    if (selectedEntityInfo?.type === "relation") {
      osm
        .fetchOsmEntity(selectedEntityInfo.type, selectedEntityInfo.id)
        .then(() => {
          // update map again to add highlighting to any relation members
          updateMapForSelection();
        })
        .catch((error) => {
          console.error(error);
        });
    }
  });
}

// Trails are drawn only by the QA overlay, which starts at QA_MIN_ZOOM; the
// basemap's own trail layers are hidden.

let zoomMessageIsVisible;

function updateZoomMessage() {
  const show = map.getZoom() < QA_MIN_ZOOM;
  if (show === zoomMessageIsVisible) return;
  zoomMessageIsVisible = show;
  document.getElementById("zoom-message").style.display = show ? "" : "none";
}

function getStyleId() {
  return `${state.travelMode}/${state.lens}`;
}

function reloadMapStyle() {
  const styleId = getStyleId();
  if (styleId === appliedStyleId) return;
  appliedStyleId = styleId;

  if (!cachedStyles[styleId]) {
    cachedStyles[styleId] = generateStyle(sourdoughStyle, state.travelMode, state.lens);
  }

  // clone so MapLibre never mutates the cached style object
  const style = structuredClone(cachedStyles[styleId]);
  style.sprite = spriteUrl();

  clickableLayers = clickableLayerIds(style);

  map.setStyle(style, {
    diff: true,
    validate: import.meta.env.DEV,
  });
}

// Expand an entity into the list of {id, type} pairs that should be highlighted
// together. For relations, this includes all members (recursively for nested
// relations, one level deep). Inner ring members are excluded, matching the
// previous filter logic.
function entitiesToHighlight(entityInfo) {
  if (!entityInfo?.id) return [];
  const out = [{ id: entityInfo.id, type: entityInfo.type }];
  if (entityInfo.type !== "relation") return out;

  const members = osm.getCachedEntity(entityInfo.type, entityInfo.id)?.members || [];
  for (const member of members) {
    if (member.role !== "inner") out.push({ id: member.ref, type: member.type });
    if (member.type === "relation") {
      const childMembers = osm.getCachedEntity(member.type, member.ref)?.members || [];
      for (const m of childMembers) out.push({ id: m.ref, type: m.type });
    }
  }
  return out;
}

// Park layer targets for a single entity. The entity is looked up by its
// encoded feature ID in every source-layer that can hold a park polygon; the
// ID won't match anything in the others, which is harmless.
function parkFeatureTargets(entityInfo) {
  if (!entityInfo?.id) return [];
  const id = encodeFeatureId(entityInfo.id, entityInfo.type);
  return PARK_SOURCE_LAYERS.map((sourceLayer) => ({
    source: "sourdough",
    sourceLayer,
    id,
  }));
}

// Trail layer targets: one per entity, keyed on Planetiler's encoded feature ID.
function trailFeatureTargets(entities) {
  return entities.map(({ id, type }) => ({
    source: "trails",
    sourceLayer: "trail",
    id: encodeFeatureId(id, type),
  }));
}

function updateFeatureState(slot, stateKey, nextTargets) {
  if (!styleReady) return;
  for (const t of featureStateTargets[slot]) map.removeFeatureState(t, stateKey);
  for (const t of nextTargets) map.setFeatureState(t, { [stateKey]: true });
  featureStateTargets[slot] = nextTargets;
}

// Returns the entity we should render hover state for, or null when nothing is
// hovered or the hovered entity is the same as the selected one (avoids
// double-highlighting).
function effectiveHoveredEntity() {
  const selected = state.selectedEntityInfo;
  if (!hoveredEntityInfo?.id) return null;
  if (hoveredEntityInfo.id === selected?.id && hoveredEntityInfo.type === selected?.type)
    return null;
  return hoveredEntityInfo;
}

function updateMapForSelection() {
  const entities = entitiesToHighlight(state.selectedEntityInfo);
  updateFeatureState("park:selected", "selected", parkFeatureTargets(state.selectedEntityInfo));
  updateFeatureState("trail:selected", "selected", trailFeatureTargets(entities));
  updateMapForHover();
}

function updateMapForHover() {
  const hovered = effectiveHoveredEntity();
  updateFeatureState("park:hover", "hover", parkFeatureTargets(hovered));
  updateFeatureState("trail:hover", "hover", trailFeatureTargets(hovered ? [hovered] : []));
}

function entityForEvent(e, layerIds) {
  // Filter to layers that exist on the map (QA layers may not be present at low zoom)
  layerIds = layerIds.filter((id) => map.getLayer(id));
  if (!layerIds.length) return null;
  const features = map.queryRenderedFeatures(e.point, { layers: layerIds });
  const feature = features.length && features[0];
  if (feature?.id && feature.id > 0) {
    return decodeFeatureId(feature.id);
  }
  return null;
}

function didClickMap(e) {
  state.selectEntity(entityForEvent(e, clickableLayers));
}

function setHoveredEntity(entityInfo) {
  if (hoveredEntityInfo?.id === entityInfo?.id && hoveredEntityInfo?.type === entityInfo?.type)
    return;

  hoveredEntityInfo = entityInfo;

  map.getCanvas().style.cursor = hoveredEntityInfo ? "pointer" : "";

  updateMapForHover();
}

function didMouseMoveMap(e) {
  setHoveredEntity(entityForEvent(e, clickableLayers));
}

// The pointer leaving the map doesn't produce a final mousemove, so the hover
// highlight has to be cleared explicitly or it stays stuck on the last feature.
function didMouseOutMap() {
  setHoveredEntity(null);
}
