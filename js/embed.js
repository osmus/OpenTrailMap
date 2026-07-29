import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { style as sourdoughStyle, spriteUrl } from "../style/style.js";
import { clickableLayerIds, decodeFeatureId, encodeFeatureId } from "./utils.js";

let map;

// Polygon source-layers that a highlighted park or protected area may live in.
const HIGHLIGHT_SOURCE_LAYERS = ["leisure", "boundaries"];

function parseHighlight(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => {
      const match = part.trim().match(/^(node|way|relation)\/(\d+)$/);
      if (!match) return null;
      return { type: match[1], id: parseInt(match[2], 10) };
    })
    .filter(Boolean);
}

function applyHighlights(entities) {
  for (const entity of entities) {
    const id = encodeFeatureId(entity.id, entity.type);
    for (const sourceLayer of HIGHLIGHT_SOURCE_LAYERS) {
      map.setFeatureState({ source: "sourdough", sourceLayer, id }, { selected: true });
    }
  }
}

function initializeMap() {
  const style = structuredClone(sourdoughStyle);
  style.sprite = spriteUrl();

  map = new maplibregl.Map({
    container: "map",
    style,
    hash: "map",
    center: [-111.545, 39.546],
    zoom: 6,
    fadeDuration: 0,
  });

  map
    .addControl(new maplibregl.NavigationControl({ visualizePitch: true }))
    .addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
    )
    .addControl(new maplibregl.ScaleControl({ maxWidth: 150, unit: "imperial" }), "bottom-left");

  // Clickable features show a popup with name + OSM link
  let activeLayerIds = [];
  const highlights = parseHighlight(new URLSearchParams(window.location.search).get("highlight"));

  map.on("load", () => {
    activeLayerIds = clickableLayerIds(style).filter((id) => map.getLayer(id));
    if (highlights.length) applyHighlights(highlights);
  });

  map.on("mousemove", (e) => {
    if (!activeLayerIds.length) return;
    const features = map.queryRenderedFeatures(e.point, { layers: activeLayerIds });
    map.getCanvas().style.cursor = features.length ? "pointer" : "";
  });

  map.on("click", (e) => {
    if (!activeLayerIds.length) return;
    const features = map.queryRenderedFeatures(e.point, { layers: activeLayerIds });
    const feature = features[0];
    if (!feature) return;

    const coords =
      feature.geometry.type === "Point"
        ? feature.geometry.coordinates
        : [e.lngLat.lng, e.lngLat.lat];
    const name = feature.properties.name;
    let osmLink = null;

    if (feature.id && feature.id > 0) {
      const decoded = decodeFeatureId(feature.id);
      osmLink = `https://www.openstreetmap.org/${decoded.type}/${decoded.id}`;
    }

    let html = "";
    if (name) html += `<strong>${escapeHtml(name)}</strong>`;
    if (osmLink) {
      if (name) html += "<br>";
      html += `<a href="${osmLink}" target="_blank" rel="noopener">View on OpenStreetMap</a>`;
    }
    if (!html) return;

    new maplibregl.Popup({ closeButton: false, maxWidth: "250px" })
      .setLngLat(coords)
      .setHTML(html)
      .addTo(map);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

window.addEventListener("load", initializeMap);
