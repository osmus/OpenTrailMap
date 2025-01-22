// Data objects for the options shown in the UI.

export const lensStrings = {
  access: {
    label: "Access"
  },
  covered: {
    label: "Covered"
  },
  dog: {
    label: "Dog Access"
  },
  incline: {
    label: "Incline"
  },
  lit: {
    label: "Lit"
  },
  maxspeed: {
    label: "Speed Limit"
  },
  name: {
    label: "Name"
  },
  oneway: {
    label: "Oneway"
  },
  operator: {
    label: "Operator"
  },
  sac_scale: {
    label: "SAC Hiking Scale"
  },
  smoothness: {
    label: "Smoothness"
  },
  surface: {
    label: "Surface"
  },
  trail_visibility: {
    label: "Trail Visibility"
  },
  width: {
    label: "Width"
  },
  fixme: {
    label: "Fixme Requests"
  },
  check_date: {
    label: "Last Checked Date"
  },
  OSM_TIMESTAMP: {
    label: "Last Edited Date"
  },
  intermittent: {
    label: "Intermittent"
  },
  open_water: {
    label: "Open Water"
  },
  rapids: {
    label: "Rapids"
  },
  tidal: {
    label: "Tidal"
  },
  hand_cart: {
    label: "Hand Cart"
  },
};

export const metadataLenses = {
  label: "Metadata",
  subitems: [
    "fixme",
    "check_date",
    "OSM_TIMESTAMP",
  ]
};

export const allLensOptions = [
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
    subitems: [
      "intermittent",
      "open_water",
      "rapids",
      "tidal",
    ]
  },
  metadataLenses,
];

export const basicLensOptions = [
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
    ]
  },
  metadataLenses,
];

export const vehicleLensOptions = [
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
    ]
  },
  metadataLenses,
];

export const hikingLensOptions = [
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
    ]
  },
  metadataLenses,
];

export const canoeLensOptions = [
  {
    label: "Attributes",
    subitems: [
      "access",
      "covered",
      "dog",
      "name",
      "oneway",
      "width",
    ]
  },
  {
    label: "Waterway Attributes",
    subitems: [
      "intermittent",
      "open_water",
      "rapids",
      "tidal",
    ]
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
    ]
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
