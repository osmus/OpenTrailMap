const other = {
  "id": "places_other",
  "type": "symbol",
  "source": "sourdough",
  "source-layer": "places",
  "minzoom": 12,
  "maxzoom": 16,
  "filter": ["in", ["get", "place"], ["literal", ["hamlet", "island", "islet", "neighbourhood"]]],
  "layout": {
    "text-field": ["get", "name"],
    "text-font": ["Noto Sans Regular"],
    "text-letter-spacing": 0.1,
    "text-max-width": 9,
    "text-size": 10,
    "text-transform": "uppercase",
  },
  "paint": {
    "text-color": "#444",
    "text-halo-color": "rgba(255,255,255,0.8)",
    "text-halo-width": 1.5,
  },
};

const suburbs = {
  "id": "places_suburbs",
  "type": "symbol",
  "source": "sourdough",
  "source-layer": "places",
  "minzoom": 11,
  "filter": ["in", ["get", "place"], ["literal", ["quarter", "suburb"]]],
  "layout": {
    "text-field": ["get", "name"],
    "text-font": ["Noto Sans Regular"],
    "text-letter-spacing": 0.1,
    "text-max-width": 9,
    "text-size": 10,
    "text-transform": "uppercase",
  },
  "paint": {
    "text-color": "#444",
    "text-halo-color": "rgba(255,255,255,0.8)",
    "text-halo-width": 1.5,
  },
};

const villages = {
  "id": "places_villages",
  "type": "symbol",
  "source": "sourdough",
  "source-layer": "places",
  "filter": ["==", ["get", "place"], "village"],
  "layout": {
    "text-field": ["get", "name"],
    "text-font": ["Noto Sans Regular"],
    "text-max-width": 8,
    "text-size": ["interpolate", ["linear"], ["zoom"], 10, 7, 14, 15],
  },
  "paint": {
    "text-color": "#333",
    "text-halo-color": "rgba(255,255,255,0.8)",
    "text-halo-width": 1.5,
  },
};

const cities = {
  "id": "places_cities",
  "type": "symbol",
  "source": "sourdough",
  "source-layer": "places",
  // "minzoom": 5,
  "filter": ["in", ["get", "place"], ["literal", ["city", "town"]]],
  "layout": {
    "text-field": ["get", "name"],
    "text-font": [
      "match",
      ["get", "place"],
      "city",
      ["literal", ["Noto Sans Bold"]],
      ["literal", ["Noto Sans Regular"]],
    ],
    "text-size": [
      "let",
      "factor",
      [
        "case",
        [">", ["coalesce", ["get", "population"], 0], 500_000],
        1.6,
        [">", ["coalesce", ["get", "population"], 0], 150_000],
        1.2,
        1.0,
      ],
      [
        "interpolate",
        ["linear"],
        ["zoom"],
        2,
        8,
        6,
        ["*", 9, ["+", 1, ["*", 0.5, ["-", ["var", "factor"], 1]]]],
        14,
        ["*", 16, ["var", "factor"]],
      ],
    ],
  },
  "paint": {
    "text-color": "#333",
    "text-halo-color": "rgba(255,255,255,1.0)",
    "text-halo-width": 1.5,
    "text-halo-blur": 0.5,
  },
};

export const PLACES = [other, suburbs, villages, cities];
