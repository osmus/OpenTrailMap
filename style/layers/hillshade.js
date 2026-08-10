const hillshade = {
  "id": "hillshade",
  "type": "raster",
  "source": "hillshade",
  "paint": { "raster-opacity": ["interpolate", ["linear"], ["zoom"], 12, 0.35, 18, 0.1] },
};

// hillshade fades out at high zoom (to avoid pixelation); this layer
// compensates for that so that landuse fill layers under the hillshade
// don't begin to appear more vibrant at these high zooms
const hillshade_background = {
  "id": "hillshade-background",
  "type": "background",
  "paint": {
    "background-color": "#fff",
    "background-opacity": ["interpolate", ["linear"], ["zoom"], 12, 0.0, 18, 0.25],
  },
};

export const HILLSHADE = [hillshade_background, hillshade];
