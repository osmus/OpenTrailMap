// Manages the state of the UI in a generalized sort of way.
// The various UI components can listen for state changes and
// update themselves accordingly.

import { lensOptionsByMode } from "./optionsData.js";

const defaultTravelMode = "all";
const defaultLens = "";

function isValidEntityInfo(entityInfo) {
  return ["node", "way", "relation"].includes(entityInfo?.type) &&
    entityInfo?.id > 0;
}

function lensesForMode(travelMode) {
  return lensOptionsByMode[travelMode].flatMap(function(item) {
    return item.subitems;
  });
}

class StateController extends EventTarget {

  defaultTravelMode = defaultTravelMode
  defaultLens = defaultLens;
  travelMode = defaultTravelMode;
  lens = defaultLens;

  inspectorOpen = false;

  focusedEntityInfo;
  selectedEntityInfo;

  focusEntity(entityInfo) {
    if (!isValidEntityInfo(entityInfo)) entityInfo = null;

    if (this.focusedEntityInfo?.id === entityInfo?.id &&
      this.focusedEntityInfo?.type === entityInfo?.type
    ) return;

    this.focusedEntityInfo = entityInfo;

    let bodyElement = document.getElementsByTagName('body')[0];
    this.focusedEntityInfo ? bodyElement.classList.add('area-focused') : bodyElement.classList.remove('area-focused');

    this.dispatchEvent(new Event('focusedEntityChange'));
  }

  selectEntity(entityInfo) {

    if (this.selectedEntityInfo?.id === entityInfo?.id &&
      this.selectedEntityInfo?.type === entityInfo?.type
    ) return;

    this.selectedEntityInfo = entityInfo;

    this.dispatchEvent(new Event('selectedEntityChange'));
  }

  setTravelMode(value) {
    if (value === null) value = defaultTravelMode;
    if (this.travelMode === value) return;
    this.travelMode = value;
    if (!lensesForMode(value).includes(this.lens)) this.setLens(defaultLens);

    this.dispatchEvent(new Event('travelModeChange'));
  }

  setLens(value) {
    if (value === null) value = defaultLens;
    if (!lensesForMode(this.travelMode).includes(value)) value = defaultLens;

    if (this.lens === value) return;
    this.lens = value;

    this.dispatchEvent(new Event('lensChange'));
  }

  setInspectorOpen(value) {
    value = !!value;
    if (this.inspectorOpen === value) return;
    this.inspectorOpen = value;

    this.dispatchEvent(new Event('inspectorOpenChange'));
  }
}

export const state = new StateController();
