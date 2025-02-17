import { state } from "./stateController.js";
import { lensOptionsByMode, lensStrings } from "./optionsData.js";
import { createElement, getElementById } from "./utils.js";

function updateLensControl() {
  let select = getElementById("lens")
    .replaceChildren(
      createElement('option')
        .setAttribute('value', '')
        .append('General')
    );

  let items = lensOptionsByMode[state.travelMode];
  items.forEach(function(item) {
    if (!item.subitems) return;
    let group = createElement('optgroup')
      .setAttribute('label', item.label)
      .append('General');
    group.append(
      ...item.subitems.map(function(item) {
        let label = item.label ? item.label : lensStrings[item].label;
        return createElement('option')
          .setAttribute('value', item)
          .append(label)
      })
    );
    select.append(group);
  });

  select.value = state.lens;
}

window.addEventListener('load', function() {

  updateLensControl();

  getElementById("travel-mode").addEventListener('change', function(e) {
    state.setTravelMode(e.target.value);
  });
  getElementById("lens").addEventListener('change', function(e) {
    state.setLens(e.target.value);
  });
  getElementById("clear-focus").addEventListener('click', function(e) {
    e.preventDefault();
    state.focusEntity();
  });

  state.addEventListener('travelModeChange', function() {
    updateLensControl();
    getElementById("travel-mode").value = state.travelMode;
  });
  state.addEventListener('lensChange', function() {
    getElementById("lens").value = state.lens;
  });
});
