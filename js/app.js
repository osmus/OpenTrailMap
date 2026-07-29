import { initControls } from "./controls.js";
import { initHash } from "./hash.js";
import { initMap } from "./map.js";
import { initSidebar } from "./sidebar.js";

window.addEventListener("load", () => {
  initMap();
  initSidebar();
  initControls();
  initHash();
});
