// MapLibre expression builders and static data describing which travel modes
// are allowed on a feature.

export const noaccessValsLiteral = ["literal", ["no", "private", "discouraged", "limited"]]; // `limited` for `wheelchair`

export const isWaterwayExpression = [
  "in",
  ["get", "waterway"],
  [
    "literal",
    [
      "river",
      "stream",
      "tidal_channel",
      "canal",
      "drain",
      "ditch",
      "canoe_pass",
      "fairway",
      "link",
      "flowline",
    ],
  ],
];

export const isHighwayExpression = ["any", ["has", "highway"], ["==", ["get", "route"], "ferry"]];

const isNotHighwayExpression = ["!", isHighwayExpression];

export const accessHierarchy = {
  all: [],
  atv: ["vehicle", "motor_vehicle", "atv"],
  bicycle: ["vehicle", "bicycle"],
  canoe: ["boat", "canoe"],
  foot: ["foot"],
  horse: ["horse"],
  inline_skates: ["foot", "inline_skates"],
  mtb: ["vehicle", "bicycle", "mtb"],
  portage: ["foot", "portage"],
  "ski:nordic": ["foot", "ski", "ski:nordic"],
  snowmobile: ["vehicle", "motor_vehicle", "snowmobile"],
  wheelchair: ["foot", "wheelchair"],
};

const impliedYesExpression = {
  bicycle: [
    "in",
    ["get", "highway"],
    [
      "literal",
      [
        "cycleway",
        "service",
        "unclassified",
        "residential",
        "tertiary",
        "secondary",
        "primary",
        "tertiary_link",
        "secondary_link",
        "primary_link",
      ],
    ],
  ],
  foot: [
    "in",
    ["get", "highway"],
    [
      "literal",
      [
        "path",
        "footway",
        "steps",
        "service",
        "unclassified",
        "residential",
        "tertiary",
        "secondary",
        "primary",
        "tertiary_link",
        "secondary_link",
        "primary_link",
      ],
    ],
  ],
  horse: ["==", ["get", "highway"], "bridleway"],
  inline_skates: [
    "all",
    // cycleways commonly allow skating
    ["==", ["get", "highway"], "cycleway"],
    // as long as they're multi-use
    ["in", ["get", "foot"], ["literal", ["yes", "designated", "permissive"]]],
    // and have the highest smoothness
    ["==", ["get", "smoothness"], "excellent"],
    // and are properly paved (redundant to smoothness but the additional check is nice)
    ["in", ["get", "surface"], ["literal", ["paved", "asphalt", "concrete"]]],
  ],
};

const impliedNoExpression = {
  atv: [
    "any",
    ["in", ["get", "highway"], ["literal", ["footway", "steps"]]],
    ["in", ["get", "vehicle"], noaccessValsLiteral],
    ["in", ["get", "motor_vehicle"], noaccessValsLiteral],
    isNotHighwayExpression,
  ],
  bicycle: [
    "any",
    ["all", ["==", ["get", "highway"], "steps"], ["!=", ["get", "ramp:bicycle"], "yes"]],
    ["in", ["get", "vehicle"], noaccessValsLiteral],
    isNotHighwayExpression,
  ],
  canoe: ["!", ["has", "canoe"]],
  foot: isNotHighwayExpression,
  horse: ["any", ["==", ["get", "highway"], "steps"], isNotHighwayExpression],
  inline_skates: [
    "any",
    [
      "all",
      ["has", "smoothness"],
      ["!", ["in", ["get", "smoothness"], ["literal", ["excellent", "good", "intermediate"]]]],
    ],
    [
      "all",
      ["has", "surface"],
      [
        "in",
        ["get", "surface"],
        [
          "literal",
          [
            "dirt",
            "grass",
            "sand",
            "sett",
            "cobblestone",
            "clay",
            "unhewn_cobblestone",
            "pebblestone",
            "grass_paver",
            "earth",
            "ground",
            "artificial_turf",
            "mud",
            "rock",
            "stone",
            "woodchips",
          ],
        ],
      ],
    ],
    isNotHighwayExpression,
  ],
  mtb: [
    "any",
    ["in", ["get", "vehicle"], noaccessValsLiteral],
    ["in", ["get", "bicycle"], noaccessValsLiteral],
    isNotHighwayExpression,
  ],
  portage: ["!", ["has", "portage"]],
  "ski:nordic": ["any", ["in", ["get", "ski"], noaccessValsLiteral], isNotHighwayExpression],
  snowmobile: [
    "any",
    ["in", ["get", "highway"], ["literal", ["footway", "steps"]]],
    ["in", ["get", "vehicle"], noaccessValsLiteral],
    ["in", ["get", "motor_vehicle"], noaccessValsLiteral],
    isNotHighwayExpression,
  ],
  wheelchair: [
    "any",
    ["==", ["get", "highway"], "steps"],
    ["all", ["has", "sac_scale"], ["!=", ["get", "sac_scale"], "hiking"]],
    [
      "all",
      ["has", "smoothness"],
      [
        "!",
        [
          "in",
          ["get", "smoothness"],
          ["literal", ["excellent", "very_good", "good", "intermediate"]],
        ],
      ],
    ],
    isNotHighwayExpression,
  ],
};

export function onewayKeysForMode(mode) {
  // basic `oneway` tag is ambiguous on waterways
  const baseKeys = mode === "canoe" ? [] : ["oneway"];
  return baseKeys.concat(accessHierarchy[mode].map((val) => `oneway:${val}`));
}

export function maxspeedKeysForMode(mode) {
  return ["maxspeed"].concat(accessHierarchy[mode].map((val) => `maxspeed:${val}`));
}

export function attributeIsSpecifiedExpression(keys) {
  return ["any", ...keys.map((key) => ["all", ["has", key], ["!=", ["get", key], "unknown"]])];
}

function notNoAccessExpression(mode) {
  return ["!", ["in", ["get", mode], noaccessValsLiteral]];
}

export function modeIsAllowedExpression(mode) {
  const allowedAccessExpression = [
    "all",
    [
      "any",
      ["all", ["!", ["has", mode]], notNoAccessExpression("access")],
      ["all", ["has", mode], notNoAccessExpression(mode)],
    ],
  ];
  if (impliedNoExpression[mode]) {
    allowedAccessExpression.push(["any", ["has", mode], ["!", impliedNoExpression[mode]]]);
  }
  return allowedAccessExpression;
}

// returns a filter that evaluates to true for features with enough tags to positively
// determine whether access is allowed or not allowed
export function accessIsSpecifiedExpression(mode) {
  let filter = [
    "!",
    [
      "any",
      [
        "all",
        ["!", ["has", mode]],
        notNoAccessExpression("access"),
        ...(impliedYesExpression[mode] ? [["!", impliedYesExpression[mode]]] : []),
        ...(impliedNoExpression[mode] ? [["!", impliedNoExpression[mode]]] : []),
      ],
      // access if always unspecified if mode is explicitly set to `unknown`
      ["==", ["get", mode], "unknown"],
    ],
  ];
  if (mode === "canoe") {
    filter = [
      "any",
      ["all", filter, isWaterwayExpression],
      ["all", accessIsSpecifiedExpression("portage"), ["!", isWaterwayExpression]],
    ];
  }
  return filter;
}

export function onewayArrowsIconImageExpression(mode, skipPortageFallback) {
  let expression = ["case"];
  onewayKeysForMode(mode)
    .reverse()
    .forEach((key) => {
      expression = expression.concat([
        ["has", key],
        [
          "case",
          ["==", ["get", key], "yes"],
          ["image", "oneway-arrow-right"],
          ["==", ["get", key], "-1"],
          ["image", "oneway-arrow-left"],
          ["in", ["get", key], ["literal", ["alternating", "reversible"]]],
          ["image", "oneway-arrows-leftright"],
          "",
        ],
      ]);
    });
  if (mode === "canoe") {
    expression = expression.concat([
      [
        "all",
        // assume features with current are oneway
        [
          "in",
          ["get", "waterway"],
          ["literal", ["river", "stream", "canal", "drain", "ditch", "canoe_pass"]],
        ],
        // unless they're tidal
        ["!=", ["get", "tidal"], "yes"],
      ],
      ["image", "oneway-arrow-right"],
      "",
    ]);

    if (!skipPortageFallback) {
      expression = [
        "case",
        isWaterwayExpression,
        expression,
        onewayArrowsIconImageExpression("portage"),
      ];
    }
  } else {
    expression.push("");
  }

  if (mode === "all") {
    expression = [
      "case",
      isWaterwayExpression,
      onewayArrowsIconImageExpression("canoe", true),
      expression,
    ];
  }

  return expression;
}
