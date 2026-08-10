// Generates the QA trail overlay using the trails tileset, and inserts
// it into the Sourdough basemap.

import {
  DISALLOWED_WATER_COLOR,
  FERRY_COLOR,
  LABEL_COLOR,
  LABEL_HALO_COLOR,
  NOACCESS_TRAIL_COLOR,
  SELECTION_COLOR,
  SPECIFIED_COLOR,
  TIDAL_COLOR,
  TRAIL_COLOR,
  UNSPECIFIED_COLOR,
  WATER_COLOR,
} from "../style/constants.js";
import { TRAIL_LABELS, TRAILS } from "../style/layers/trails.js";
import { QA_INSERTION_POINT } from "../style/style.js";
import {
  accessIsSpecifiedExpression,
  attributeIsSpecifiedExpression,
  isHighwayExpression,
  isWaterwayExpression,
  modeIsAllowedExpression,
  onewayArrowsIconImageExpression,
} from "./accessExpressions.js";
import { keysForLens, lenses } from "./optionsData.js";
import { getTrailLabelExpression } from "./trailLabels.js";

const TRAILS_SOURCE = {
  "type": "vector",
  "url": "https://tiles.openstreetmap.us/vector/trails.json",
};

// Basemap layers that would double-render the trails the overlay draws itself.
const BASEMAP_TRAIL_LAYER_IDS = [...TRAILS, ...TRAIL_LABELS].map((layer) => layer.id);

// Minimum zoom for the overlay. The trail tileset is far too dense to draw
// whole-country, and the QA filters are only meaningful at street scale.
const MIN_ZOOM = 10;

const ALL_MODES = [
  "foot",
  "wheelchair",
  "bicycle",
  "horse",
  "atv",
  "mtb",
  "inline_skates",
  "snowmobile",
  "ski:nordic",
  "canoe",
];

const lineWidth = ["interpolate", ["linear"], ["zoom"], 12, 1, 22, 5];
const selectedLineWidth = ["interpolate", ["linear"], ["zoom"], 12, 9, 22, 13];
const hoverLineWidth = ["interpolate", ["linear"], ["zoom"], 12, 5, 22, 7];

const thisYear = new Date().getFullYear();

// Dates are stored as ISO strings; take the leading year and fall back to a
// year below the ramp when neither key is present, so that a feature which
// somehow reaches these layers untagged renders at the oldest color rather
// than erroring out (which would paint it the default black).
const checkDateYear = [
  "to-number",
  ["slice", ["coalesce", ["get", "check_date"], ["get", "survey:date"], "0"], 0, 4],
  0,
];

const checkDateColors = [
  "interpolate",
  ["linear"],
  checkDateYear,
  2010,
  "#e7e1ef",
  2014,
  "#d4b9da",
  2016,
  "#c994c7",
  2018,
  "#df65b0",
  2020,
  "#e7298a",
  2021,
  "#ce1256",
  2022,
  "#980043",
  thisYear,
  "#67001f",
];

const editedDateColors = [
  "interpolate",
  ["linear"],
  [
    // convert unix timestamp to year
    "floor",
    ["+", ["/", ["coalesce", ["get", "OSM_TIMESTAMP"], 0], 31536000], 1970],
  ],
  2004,
  "#e7e1ef",
  2008,
  "#d4b9da",
  2012,
  "#c994c7",
  2016,
  "#df65b0",
  2018,
  "#e7298a",
  2020,
  "#ce1256",
  2022,
  "#980043",
  thisYear,
  "#380010",
];

const colorRamps = {
  checkDate: checkDateColors,
  editedDate: editedDateColors,
};

// Filter for features with enough tags to positively determine the value of
// the given lens' attribute (accounting for implied values and special cases).
function specifiedForLens(lens, travelMode) {
  const config = lenses[lens];
  let expression = attributeIsSpecifiedExpression(keysForLens(lens, travelMode));

  if (config.implied) {
    expression = ["any", expression, config.implied];
  }
  if (config.invert) {
    // for fixmes we're looking for extant values instead of missing values
    expression = ["!", expression];
  }
  if (config.allowlist) {
    expression = ["all", expression, ["in", ["get", lens], ["literal", config.allowlist]]];
  }
  if (lens === "oneway" && travelMode === "canoe") {
    // canoe routes are oneway by current, portages by their own oneway tags
    expression = [
      "any",
      ["all", expression, isWaterwayExpression],
      [
        "all",
        attributeIsSpecifiedExpression(keysForLens("oneway", "portage")),
        ["!", isWaterwayExpression],
      ],
    ];
  }
  return expression;
}

function pathsColorForLens(lens) {
  const config = lenses[lens];
  if (config.colorRamp) return colorRamps[config.colorRamp];
  if (lens === "tidal") {
    return [
      "case",
      ["any", ["==", ["get", "tidal"], "yes"], config.implied],
      TIDAL_COLOR,
      ["==", ["get", "tidal"], "no"],
      SPECIFIED_COLOR,
      UNSPECIFIED_COLOR,
    ];
  }
  return SPECIFIED_COLOR;
}

// Resolves a (travel mode, lens) pair into the handful of expressions that
// every overlay layer is built from.
function overlayContext(travelMode, lens) {
  const isLensActive = lens !== "" && lens !== "access";

  let allowed;
  if (travelMode === "all") {
    allowed = ["any", ...ALL_MODES.map(modeIsAllowedExpression)];
  } else {
    const modes = travelMode === "canoe" ? ["canoe", "portage"] : [travelMode];
    allowed = ["any", ...modes.map(modeIsAllowedExpression)];
  }

  let accessSpecified = null;
  if (travelMode !== "all") {
    accessSpecified = accessIsSpecifiedExpression(travelMode);
  } else if (lens === "access" || lens === "") {
    accessSpecified = [
      "all",
      // access not fully specified if any access tag is explicitly set to `unknown`
      ["!=", ["get", "access"], "unknown"],
      ...ALL_MODES.concat("portage").map((mode) => ["!=", ["get", mode], "unknown"]),
    ];
  }

  let pathsColor = ["case", ["==", ["get", "route"], "ferry"], FERRY_COLOR, TRAIL_COLOR];
  let waterwaysColor = WATER_COLOR;
  let specified = accessSpecified;
  let included = allowed;

  if (isLensActive) {
    pathsColor = pathsColorForLens(lens);
    waterwaysColor = pathsColor;
    specified = specifiedForLens(lens, travelMode);

    const terms = travelMode === "all" ? [] : [allowed];
    if (accessSpecified) terms.push(accessSpecified);
    const scope = lenses[lens].scope;
    if (scope === "waterway") terms.push(isWaterwayExpression);
    else if (scope === "highway") terms.push(isHighwayExpression);
    included = terms.length === 0 ? true : terms.length === 1 ? terms[0] : ["all", ...terms];
  }

  return {
    allowed,
    included,
    specified,
    pathsColor,
    waterwaysColor,
    // Disallowed trails are only shown in "all" mode; picking a travel mode
    // means you want to see where you can actually go.
    showDisallowed: travelMode === "all",
    // Unspecified trails are only meaningful when a lens is asking a question.
    showUnspecified: lens !== "",
  };
}

// Per-layer filters, keyed by layer id. Insertion order matters only in that
// the combined filter (used by labels, arrows and hit targets) is their union.
function trailFilters(ctx) {
  const { included, specified, showDisallowed, showUnspecified } = ctx;
  const informal = ["==", ["get", "informal"], "yes"];
  const formal = ["!=", ["get", "informal"], "yes"];

  return {
    "paths": ["all", included, specified, formal, isHighwayExpression],
    "informal-paths": ["all", included, specified, informal, isHighwayExpression],
    "disallowed-paths": [
      "all",
      showDisallowed,
      ["!", included],
      specified,
      formal,
      isHighwayExpression,
    ],
    "disallowed-informal-paths": [
      "all",
      showDisallowed,
      ["!", included],
      specified,
      informal,
      isHighwayExpression,
    ],
    "unspecified-paths": [
      "all",
      showUnspecified,
      included,
      ["!", specified],
      formal,
      isHighwayExpression,
    ],
    "unspecified-informal-paths": [
      "all",
      showUnspecified,
      included,
      ["!", specified],
      informal,
      isHighwayExpression,
    ],
    "waterways": ["all", included, specified, isWaterwayExpression],
    "disallowed-waterways": [
      "all",
      showDisallowed,
      ["!", included],
      specified,
      isWaterwayExpression,
    ],
    "unspecified-waterways": [
      "all",
      showUnspecified,
      included,
      ["!", specified],
      isWaterwayExpression,
    ],
  };
}

function trailLine(id, paint, extra) {
  return {
    "id": id,
    "source": "trails",
    "source-layer": "trail",
    "type": "line",
    "layout": {
      "line-cap": "round",
      "line-join": "round",
    },
    "paint": paint,
    ...extra,
  };
}

// A wide invisible line under the cursor, so thin trails are still easy to
// click. queryRenderedFeatures hits this layer rather than the drawn lines.
function pointerTargets(filter) {
  return {
    "id": "trails-pointer-targets",
    "source": "trails",
    "source-layer": "trail",
    "type": "line",
    "paint": {
      "line-color": "transparent",
      "line-width": 16,
    },
    "metadata": { "clickable": true },
    "filter": filter,
  };
}

function highlightLine(id, stateKey, opacity, width) {
  return trailLine(id, {
    "line-opacity": ["case", ["boolean", ["feature-state", stateKey], false], opacity, 0],
    "line-color": SELECTION_COLOR,
    "line-width": width,
  });
}

// The overlay's layers, bottom to top.
function trailLayers(ctx, travelMode, lens, filters, combinedFilter) {
  const dashed = { "line-dasharray": [2, 2] };

  // id, color and whether the line is dashed; informal (unofficial) trails are
  // dashed, as are trails the selected travel mode isn't allowed on.
  const lines = [
    ["disallowed-waterways", DISALLOWED_WATER_COLOR, false],
    ["informal-paths", ctx.pathsColor, true],
    ["disallowed-informal-paths", NOACCESS_TRAIL_COLOR, true],
    ["unspecified-informal-paths", UNSPECIFIED_COLOR, true],
    ["disallowed-paths", NOACCESS_TRAIL_COLOR, true],
  ];
  const linesAboveSymbols = [
    ["unspecified-paths", UNSPECIFIED_COLOR, false],
    ["unspecified-waterways", UNSPECIFIED_COLOR, false],
    ["waterways", ctx.waterwaysColor, false],
    ["paths", ctx.pathsColor, false],
  ];

  const lineLayer = ([id, color, isDashed]) =>
    trailLine(
      id,
      {
        "line-width": lineWidth,
        "line-color": color,
        ...(isDashed ? dashed : {}),
      },
      { "filter": filters[id] },
    );

  return [
    trailLine(
      "bridge-casings",
      {
        "line-gap-width": lineWidth,
        "line-width": ["interpolate", ["linear"], ["zoom"], 16, 2, 20, 6],
        "line-color": "#bbb",
      },
      {
        "minzoom": 14,
        "layout": { "line-cap": "butt", "line-join": "round" },
        "filter": [
          "all",
          ["has", "bridge"],
          [
            "!",
            [
              "in",
              ["get", "bridge"],
              ["literal", ["no", "abandoned", "raised", "proposed", "dismantled"]],
            ],
          ],
          combinedFilter,
        ],
      },
    ),
    highlightLine("hovered-paths", "hover", 0.25, hoverLineWidth),
    highlightLine("selected-paths", "selected", 0.4, selectedLineWidth),
    ...lines.map(lineLayer),
    {
      "id": "disallowed-symbols",
      "source": "trails",
      "source-layer": "trail",
      "type": "symbol",
      "minzoom": 13,
      "filter": ["all", ctx.showDisallowed, ["!", ctx.allowed], combinedFilter],
      "layout": {
        "symbol-placement": "line",
        "symbol-spacing": 200,
        "icon-image": "no_entry",
        "icon-size": 0.4,
        "icon-overlap": "always",
        "icon-rotation-alignment": "viewport",
      },
      "paint": {
        "icon-color": "#ee2222",
        "icon-halo-color": "#ffffff",
        "icon-halo-width": 1.75,
        "icon-halo-blur": 0.5,
      },
    },
    ...linesAboveSymbols.map(lineLayer),
    {
      "id": "oneway-arrows",
      "source": "trails",
      "source-layer": "trail",
      "type": "symbol",
      "transition": {
        "duration": 0,
        "delay": 0,
      },
      "minzoom": lens === "oneway" ? 4 : 13,
      "layout": {
        "symbol-placement": "line",
        "symbol-spacing": ["interpolate", ["linear"], ["zoom"], 14, 10, 18, 50, 22, 140],
        "icon-image": onewayArrowsIconImageExpression(travelMode),
        "icon-overlap": "always",
        "icon-padding": 2,
        "icon-rotation-alignment": "map",
        "icon-size": ["interpolate", ["linear"], ["zoom"], 14, 0.3, 22, 0.7],
      },
      "paint": {
        "icon-color": ["case", ["has", "waterway"], WATER_COLOR, TRAIL_COLOR],
        "icon-halo-color": LABEL_HALO_COLOR,
        "icon-halo-width": 1.0,
        "icon-halo-blur": 0.25,
      },
      // A specific filter isn't needed since the icon-image doesn't display
      // anything if there isn't a relevant oneway value.
      "filter": combinedFilter,
    },
    {
      "id": "trails-labels",
      "source": "trails",
      "source-layer": "trail",
      "type": "symbol",
      "layout": {
        "text-field": getTrailLabelExpression(lens, travelMode),
        "text-font": ["Noto Sans Regular"],
        "text-size": 12,
        "symbol-placement": "line",
      },
      "paint": {
        "text-color": LABEL_COLOR,
        "text-halo-width": 1.5,
        "text-halo-color": LABEL_HALO_COLOR,
      },
      "filter": combinedFilter,
    },
    pointerTargets(combinedFilter),
  ];
}

export function generateStyle(baseStyleObj, travelMode, lens) {
  // deep-copy to avoid mutating the original
  const style = structuredClone(baseStyleObj);

  // copied, so that generated styles never share a mutable source object
  style.sources.trails = { ...TRAILS_SOURCE };

  // Hide the basemap's own trail layers to avoid double-rendering.
  for (const layer of style.layers) {
    if (BASEMAP_TRAIL_LAYER_IDS.includes(layer.id)) {
      layer.layout = { ...layer.layout, visibility: "none" };
    }
  }

  const ctx = overlayContext(travelMode, lens);
  const filters = trailFilters(ctx);
  const combinedFilter = ["any", ...Object.values(filters)];

  const layers = trailLayers(ctx, travelMode, lens, filters, combinedFilter).map((layer) => ({
    "minzoom": MIN_ZOOM,
    ...layer,
  }));

  const insertionIndex = style.layers.findIndex((l) => l.id === QA_INSERTION_POINT);
  if (insertionIndex < 0) {
    throw new Error(`Base style is missing its "${QA_INSERTION_POINT}" marker layer`);
  }
  style.layers.splice(insertionIndex, 0, ...layers);

  return style;
}
