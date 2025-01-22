import { state } from "./stateController.js";
import { lensOptionsByMode, lensStrings } from "./optionsData.js";

function updateLensControl() {
  let html = "";
  let items = lensOptionsByMode[state.travelMode];
  
  html += '<option value="">General</option>';
  items.forEach(function(item) {
    if (item.subitems) {
      html += '<optgroup label="' + item.label + '">';
      item.subitems.forEach(function(item) {
        let label = item.label ? item.label : lensStrings[item].label;
        html += '<option value="' + item + '">' + label + '</option>';
      })
      html += '</optgroup>';
    }
  });
  let lensElement =  document.getElementById("lens");
  lensElement.innerHTML = html;
  lensElement.value = state.lens;
}

window.addEventListener('load', function() {

  updateLensControl();

  document.getElementById("travel-mode").addEventListener('change', function(e) {
    state.setTravelMode(e.target.value);
  });
  document.getElementById("lens").addEventListener('change', function(e) {
    state.setLens(e.target.value);
  });
  document.getElementById("clear-focus").addEventListener('click', function(e) {
    e.preventDefault();
    state.focusEntity();
  });

  state.addEventListener('travelModeChange', function() {
    updateLensControl();
    document.getElementById("travel-mode").value = state.travelMode;
  });
  state.addEventListener('lensChange', function() {
    document.getElementById("lens").value = state.lens;
  });
});
