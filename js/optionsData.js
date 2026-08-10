// Data objects for the options shown in the UI.

import { accessHierarchy, maxspeedKeysForMode, onewayKeysForMode } from "./accessExpressions.js";

function accessKeysForMode(mode) {
  const keys = accessHierarchy[mode].slice().reverse();
  if (mode === "canoe") keys.push("portage");
  keys.push("access");
  return keys;
}

function nameKeysForMode(mode) {
  switch (mode) {
    case "canoe":
      return ["name", "waterbody:name", "noname"];
    case "mtb":
      return ["name", "mtb:name", "noname"];
  }
  return ["name", "noname"];
}

// Declarative description of every lens. Fields:
//   label      - UI string shown in the lens picker
//   keys       - the OSM keys that "specify" this attribute, as a static array
//                or a function of travel mode
//   scope      - "highway" or "waterway" to restrict the lens to those features
//   implied    - expression for features whose value is implied even when
//                untagged (treated as specified)
//   colorRamp  - "checkDate" or "editedDate" to color trails by a date ramp
//   invert     - specified test is negated (looking for present values, e.g. fixme)
//   allowlist  - the lens value must be one of these to count as specified
export const lenses = {
  access: {
    label: "Access",
    keys: accessKeysForMode,
  },
  covered: {
    label: "Covered",
    keys: ["covered", "tunnel", "indoor"],
  },
  dog: {
    label: "Dog Access",
    keys: ["dog"],
  },
  incline: {
    label: "Incline",
    scope: "highway",
    keys: ["incline"],
  },
  lit: {
    label: "Lit",
    scope: "highway",
    keys: ["lit"],
  },
  maxspeed: {
    label: "Speed Limit",
    scope: "highway",
    keys: maxspeedKeysForMode,
  },
  name: {
    label: "Name",
    keys: nameKeysForMode,
  },
  oneway: {
    label: "Oneway",
    keys: onewayKeysForMode,
  },
  operator: {
    label: "Operator",
    scope: "highway",
    // if a path is `informal=yes` then there's probably no operator, always style as complete
    implied: ["==", ["get", "informal"], "yes"],
    keys: ["operator"],
  },
  sac_scale: {
    label: "SAC Hiking Scale",
    scope: "highway",
    // there are a lot of junk sac_scale values, so require one from a known set
    allowlist: [
      "no",
      "strolling",
      "hiking",
      "mountain_hiking",
      "demanding_mountain_hiking",
      "alpine_hiking",
      "demanding_alpine_hiking",
      "difficult_alpine_hiking",
    ],
    keys: ["sac_scale"],
  },
  smoothness: {
    label: "Smoothness",
    scope: "highway",
    keys: ["smoothness"],
  },
  surface: {
    label: "Surface",
    scope: "highway",
    keys: ["surface"],
  },
  trail_visibility: {
    label: "Trail Visibility",
    scope: "highway",
    keys: ["trail_visibility"],
  },
  width: {
    label: "Width",
    // don't expect width tag on links
    implied: ["==", ["get", "waterway"], "link"],
    keys: ["width"],
  },
  fixme: {
    label: "Fixme Requests",
    invert: true,
    keys: ["fixme", "FIXME", "todo", "TODO"],
  },
  check_date: {
    label: "Last Checked Date",
    colorRamp: "checkDate",
    keys: ["check_date", "survey:date"],
  },
  OSM_TIMESTAMP: {
    label: "Last Edited Date",
    colorRamp: "editedDate",
    keys: ["OSM_TIMESTAMP"],
  },
  intermittent: {
    label: "Intermittent",
    scope: "waterway",
    keys: ["intermittent"],
  },
  open_water: {
    label: "Open Water",
    scope: "waterway",
    // only expect open_water tag on certain features
    implied: ["!", ["in", ["get", "waterway"], ["literal", ["fairway", "flowline"]]]],
    keys: ["open_water"],
  },
  rapids: {
    label: "Rapids",
    scope: "waterway",
    // we assume non-tidal flowlines do not have rapids
    implied: ["all", ["==", ["get", "waterway"], "flowline"], ["==", ["get", "tidal"], "no"]],
    keys: ["rapids"],
  },
  tidal: {
    label: "Tidal",
    scope: "waterway",
    // assume tidal channels are always tidal=yes
    implied: ["==", ["get", "waterway"], "tidal_channel"],
    keys: ["tidal"],
  },
  hand_cart: {
    label: "Hand Cart",
    scope: "highway",
    keys: ["hand_cart"],
  },
};

// The OSM keys that specify a lens' attribute for the given travel mode.
export function keysForLens(lens, travelMode) {
  const keys = lenses[lens].keys;
  return typeof keys === "function" ? keys(travelMode) : keys;
}

export const travelModeOptions = [
  { value: "all", label: "All Trails" },
  {
    label: "Trails",
    subitems: [
      { value: "foot", label: "Hiking & Walking Trails" },
      { value: "wheelchair", label: "Wheelchair Trails" },
      { value: "bicycle", label: "Biking Trails" },
      { value: "mtb", label: "Mountain Biking Trails" },
      { value: "inline_skates", label: "Inline Skating Trails" },
      { value: "horse", label: "Horseback Riding Trails" },
      { value: "atv", label: "ATV Trails" },
    ],
  },
  {
    label: "Snow Trails",
    subitems: [
      { value: "ski:nordic", label: "Cross-Country Ski Trails" },
      { value: "snowmobile", label: "Snowmobile Trails" },
    ],
  },
  {
    label: "Water Trails",
    subitems: [{ value: "canoe", label: "Canoe & Kayak Trails" }],
  },
];

const metadataLenses = {
  label: "Metadata",
  subitems: ["fixme", "check_date", "OSM_TIMESTAMP"],
};

const allLensOptions = [
  {
    label: "Attributes",
    subitems: [
      "access",
      "covered",
      "dog",
      "hand_cart",
      "incline",
      "lit",
      "name",
      "oneway",
      "operator",
      "sac_scale",
      "smoothness",
      "maxspeed",
      "surface",
      "trail_visibility",
      "width",
    ],
  },
  {
    label: "Waterway Attributes",
    subitems: ["intermittent", "open_water", "rapids", "tidal"],
  },
  metadataLenses,
];

const basicLensOptions = [
  {
    label: "Attributes",
    subitems: [
      "access",
      "covered",
      "dog",
      "incline",
      "lit",
      "name",
      "oneway",
      "operator",
      "smoothness",
      "surface",
      "trail_visibility",
      "width",
    ],
  },
  metadataLenses,
];

const vehicleLensOptions = [
  {
    label: "Attributes",
    subitems: [
      "access",
      "covered",
      "dog",
      "incline",
      "lit",
      "name",
      "oneway",
      "operator",
      "smoothness",
      "maxspeed",
      "surface",
      "trail_visibility",
      "width",
    ],
  },
  metadataLenses,
];

const hikingLensOptions = [
  {
    label: "Attributes",
    subitems: [
      "access",
      "covered",
      "dog",
      "incline",
      "lit",
      "name",
      "oneway",
      "operator",
      "sac_scale",
      "smoothness",
      "surface",
      "trail_visibility",
      "width",
    ],
  },
  metadataLenses,
];

const canoeLensOptions = [
  {
    label: "Attributes",
    subitems: ["access", "covered", "dog", "name", "oneway", "width"],
  },
  {
    label: "Waterway Attributes",
    subitems: ["intermittent", "open_water", "rapids", "tidal"],
  },
  {
    label: "Portage Attributes",
    subitems: [
      "hand_cart",
      "incline",
      "lit",
      "operator",
      "surface",
      "smoothness",
      "trail_visibility",
    ],
  },
  metadataLenses,
];

export const lensOptionsByMode = {
  "all": allLensOptions,
  "atv": vehicleLensOptions,
  "bicycle": vehicleLensOptions,
  "mtb": vehicleLensOptions,
  "canoe": canoeLensOptions,
  "foot": hikingLensOptions,
  "horse": vehicleLensOptions,
  "inline_skates": basicLensOptions,
  "snowmobile": vehicleLensOptions,
  "ski:nordic": basicLensOptions,
  "wheelchair": basicLensOptions,
};
