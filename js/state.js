// Manages the state of the UI in a generalized sort of way.
// The various UI components can listen for state changes and
// update themselves accordingly.

import { lensOptionsByMode } from "./optionsData.js";

export const defaultTravelMode = "all";
export const defaultLens = "";

function lensesForMode(travelMode) {
  return lensOptionsByMode[travelMode].flatMap((item) => item.subitems);
}

class StateController extends EventTarget {
  travelMode = defaultTravelMode;
  lens = defaultLens;

  // The currently selected OSM entity, as { type, id }, or null
  selectedEntityInfo;

  selectEntity(entityInfo) {
    if (
      this.selectedEntityInfo?.id === entityInfo?.id &&
      this.selectedEntityInfo?.type === entityInfo?.type
    )
      return;

    this.selectedEntityInfo = entityInfo && { id: entityInfo.id, type: entityInfo.type };

    this.dispatchEvent(new Event("selectedEntityChange"));
  }

  setTravelMode(value) {
    if (value === null) value = defaultTravelMode;
    if (this.travelMode === value) return;
    this.travelMode = value;

    const lensChanged = !lensesForMode(value).includes(this.lens);
    if (lensChanged) this.lens = defaultLens;

    this.dispatchEvent(new Event("travelModeChange"));
    if (lensChanged) this.dispatchEvent(new Event("lensChange"));
  }

  setLens(value) {
    if (value === null) value = defaultLens;
    if (!lensesForMode(this.travelMode).includes(value)) value = defaultLens;

    if (this.lens === value) return;
    this.lens = value;

    this.dispatchEvent(new Event("lensChange"));
  }
}

export const state = new StateController();
