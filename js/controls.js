import { lenses, lensOptionsByMode, travelModeOptions } from "./optionsData.js";
import { state } from "./state.js";
import { el } from "./utils.js";

function updateTravelModeControl() {
  const select = document.getElementById("travel-mode");
  select.replaceChildren(
    ...travelModeOptions.map((item) => {
      if (item.subitems) {
        return el(
          "optgroup",
          { label: item.label },
          ...item.subitems.map((sub) => el("option", { value: sub.value }, sub.label)),
        );
      }
      return el("option", { value: item.value }, item.label);
    }),
  );

  // state.travelMode may already be set from the URL hash before load fires
  select.value = state.travelMode;
}

function updateLensControl() {
  const select = document.getElementById("lens");
  select.replaceChildren(el("option", { value: "" }, "General"));

  const items = lensOptionsByMode[state.travelMode];
  items.forEach((item) => {
    select.append(
      el(
        "optgroup",
        { label: item.label },
        ...item.subitems.map((id) => el("option", { value: id }, lenses[id].label)),
      ),
    );
  });

  select.value = state.lens;
}

export function initControls() {
  updateTravelModeControl();
  updateLensControl();

  document.getElementById("travel-mode").addEventListener("change", (e) => {
    state.setTravelMode(e.target.value);
  });
  document.getElementById("lens").addEventListener("change", (e) => {
    state.setLens(e.target.value);
  });
  state.addEventListener("travelModeChange", () => {
    updateLensControl();
    document.getElementById("travel-mode").value = state.travelMode;
  });
  state.addEventListener("lensChange", () => {
    document.getElementById("lens").value = state.lens;
  });
}
