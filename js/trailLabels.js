// Builds the `text-field` expression for the QA overlay's trail labels.
//
// A label is a primary name plus, when a lens is active, a second line of
// "key=value" sublabels showing the tags that the lens cares about.

import { isWaterwayExpression } from "./accessExpressions.js";
import { keysForLens } from "./optionsData.js";

const NAME_FONT = "Noto Sans Bold";
const SUBLABEL_FONT = "Noto Sans Regular";

export function getTrailLabelExpression(lens, travelMode) {
  let sublabels = null;

  if (lens !== "") {
    const keys = keysForLens(lens, travelMode);
    sublabels = [
      {
        selector: ["any", ...keys.map((key) => ["has", key])],
        label: [
          "case",
          ...keys.flatMap((key) => {
            // name-like keys are their own label; showing "name=Foo Trail"
            // right after the name itself would be redundant
            let val = ["concat", key, "=", ["get", key]];
            if (key === "name" || key.endsWith(":name")) val = key;
            return [["has", key], val];
          }),
          "",
        ],
      },
    ];
  }

  return getLabelExpression([
    {
      caseSelector: isWaterwayExpression,
      selector: ["any", ["has", "name"], ["has", "waterbody:name"]],
      label: ["coalesce", ["get", "name"], ["get", "waterbody:name"]],
      sublabels: sublabels,
    },
    {
      selector: ["any", ["has", "name"], ["has", "mtb:name"]],
      label: ["coalesce", ["get", "name"], ["get", "mtb:name"]],
      sublabels: sublabels,
    },
  ]);
}

function getLabelExpression(items) {
  const filters = ["case"];
  for (const item of items) {
    if (item.caseSelector) filters.push(item.caseSelector);

    let filter = [
      "format",
      [
        "case",
        item.selector,
        item.sublabels
          ? [
              "concat",
              item.label,
              ["case", ["any", ...item.sublabels.map((item) => item.selector)], "\n", ""],
            ]
          : item.label,
        "",
      ],
      {
        "text-font": ["literal", [item.font ? item.font : NAME_FONT]],
      },
    ];

    if (item.sublabels) {
      filter = filter.concat(getSublabelExpressions(item.sublabels));
    }
    filters.push(filter);
  }
  return filters;
}

function getSublabelExpressions(items) {
  const filters = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    let sublabelsFilter = [];
    if (item.sublabels) {
      sublabelsFilter = [["any", ...item.sublabels.map((item) => item.selector)], "\n"];
    }
    filters.push([
      "case",
      item.selector,
      [
        "concat",
        item.label,
        [
          "case",
          [
            "any",
            ...items
              .slice(i + 1)
              .filter((item) => !item.conjoined)
              .map((item) => item.selector),
          ],
          " · ",
          ...sublabelsFilter,
          "",
        ],
      ],
      "",
    ]);
    filters.push({
      "text-font": ["literal", [item.font ? item.font : SUBLABEL_FONT]],
    });
  }
  return filters;
}
