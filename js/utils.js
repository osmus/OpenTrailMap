// Builds an HTML element. Attribute keys starting with "on" are attached as
// event listeners (e.g. onclick -> "click"); all others are set via
// setAttribute. Children may be strings or nodes; null/false/undefined children
// are skipped so callers can inline them with && conditionals.
export function el(tag, attrs, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (key.startsWith("on")) {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      node.setAttribute(key, value);
    }
  }
  for (const child of children) {
    if (child == null || child === false) continue;
    node.append(child);
  }
  return node;
}

// Sourdough (like OpenMapTiles) encodes OSM type+id into feature IDs as:
// id * 10 + type_code, where type_code is 1=node, 2=way, 3=relation.
const featureIdTypeCodes = { "node": 1, "way": 2, "relation": 3 };
const featureIdTypes = { 1: "node", 2: "way", 3: "relation" };

export function encodeFeatureId(id, type) {
  return id * 10 + featureIdTypeCodes[type];
}

export function decodeFeatureId(featureId) {
  const typeCode = featureId % 10;
  const id = (featureId - typeCode) / 10;
  return { id, type: featureIdTypes[typeCode] };
}

// Layers whose features can be selected by clicking the map, declared by the
// layers themselves via `metadata: { clickable: true }`.
export function clickableLayerIds(style) {
  return style.layers.filter((layer) => layer.metadata?.clickable).map((layer) => layer.id);
}
