function getMaxArrayDepth(value) {
    return Array.isArray(value) ? 
        1 + Math.max(0, ...value.map(getMaxArrayDepth)) :
        0;
}

function bboxOfGeoJson(geojson) {

    if (!geojson?.geometry?.coordinates?.length) return;
  
    var depth = getMaxArrayDepth(geojson.geometry.coordinates);
    var coords = geojson.geometry.coordinates.flat(depth - 2);
    var bbox = [ Infinity, Infinity, -Infinity, -Infinity];
  
    bbox = coords.reduce(function(prev, coord) {
      return [
        Math.min(coord[0], prev[0]),
        Math.min(coord[1], prev[1]),
        Math.max(coord[0], prev[2]),
        Math.max(coord[1], prev[3])
      ];
    }, bbox);
    if (bbox[0].isNaN) return;
    return bbox;
};

function extendBbox(bbox, buffer) {
    bbox = bbox.slice();
    bbox[0] -= buffer; // west
    bbox[1] -= buffer; // south
    bbox[2] += buffer; // east
    bbox[3] += buffer; // north
    return bbox;
}