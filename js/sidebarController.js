
function updateSidebar(entity) {

  if (!entity) {
    document.getElementById('sidebar').innerHTML = "";
    return;
  }

  var type = entity.type;
  var entityId = entity.id;
  var focusLngLat = entity.focusLngLat;

  var bbox = focusLngLat && {
    left: left = focusLngLat.lng - 0.001,
    right: right = focusLngLat.lng + 0.001,
    bottom: left = focusLngLat.lat - 0.001,
    top: right = focusLngLat.lat + 0.001,
  };
  
  var opQuery = encodeURIComponent(`${type}(${entityId});\n(._;>;);\nout;`);
  
  var html = '';
  html += "<div class='body'>";
  html += "<table id='tag-table'>";
  html += `<tr><th>Key</th><th>Value</th></tr><tr><td>&nbsp;</td><td>&nbsp;</td></tr>`;
  html += "</table><br/>";
  html += "<table id='relations-table'>";
  html += `<tr><th>Relation</th><th>Type</th><th>Route</th><th>Role</th></tr><tr><td>&nbsp;</td><td>&nbsp;</td></tr>`;
  html += "</table><br/>";
  html += "<table id='meta-table'>";
  html += `<tr><th colspan='2'>Meta</th></tr><tr><td>&nbsp;</td><td>&nbsp;</td></tr>`;
  html += "</table><br/>";
  html += "<h3>View</h3>";
  html += "<p class='link-list'>";
  html += `<a href="https://openstreetmap.org/${type}/${entityId}" target="_blank">osm.org</a> `;
  html += `<a href="https://www.openstreetmap.org/api/0.6/${type}/${entityId}" target="_blank">XML</a> `;
  html += `<a href="https://pewu.github.io/osm-history/#/${type}/${entityId}" target="_blank">PeWu</a> `;
  html += `<a href="https://overpass-turbo.eu?Q=${opQuery}&R=" target="_blank">Overpass Turbo</a> `;
  html += "</p>";
  html += "<h3>Edit</h3>";
  html += "<p class='link-list'>";
  html += `<a href="https://openstreetmap.org/edit?${type}=${entityId}" target="_blank">iD</a> `;
  if (bbox) html += `<a href="http://127.0.0.1:8111/load_and_zoom?left=${bbox.left}&right=${bbox.right}&top=${bbox.top}&bottom=${bbox.bottom}&select=${type}${entityId}" target="_blank">JOSM</a> `;
  html += `<a href="https://level0.osmz.ru/?url=${type}/${entityId}" target="_blank">Level0</a> `;
  html += "</p>";
  html += "</div>";

  document.getElementById('sidebar').innerHTML = html;
}

function updateMetaTable(entity, changeset) {
  var formattedDate = getFormattedDate(new Date(entity.timestamp));
  var comment = changeset && changeset.tags && changeset.tags.comment || '';
  var html = "";
  html += `<tr><th colspan='2'>Meta</th></tr>`;
  html += `<tr><td>ID</td><td><a href="https://www.openstreetmap.org/${entity.type}/${entity.id}" target="_blank">${entity.type}/${entity.id}</a></td></tr>`;
  html += `<tr><td>Version</td><td><a href="https://www.openstreetmap.org/${entity.type}/${entity.id}/history" target="_blank">${entity.version}</a></td></tr>`;
  html += `<tr><td>Changeset</td><td><a href="https://www.openstreetmap.org/changeset/${entity.changeset}" target="_blank">${entity.changeset}</a></td></tr>`;
  html += `<tr><td>Comment</td><td>${comment}</td></tr>`;
  html += `<tr><td>Uploaded</td><td>${formattedDate}</td></tr>`;
  html += `<tr><td>User</td><td><a href="https://www.openstreetmap.org/user/${entity.user}" target="_blank">${entity.user}</a></td></tr>`;
  document.getElementById('meta-table').innerHTML = html;
}

function updateTagsTable(tags) {
  var html = "";
  html += `<tr><th>Key</th><th>Value</th></tr>`;
  var keys = Object.keys(tags).sort();
  for (var i in keys) {
    var key = keys[i];
    html += `<tr><td>${key}</td><td>${tags[key]}</td></tr>`;
  }
  document.getElementById('tag-table').innerHTML = html;
}

function updateMembershipsTable(memberships) {
  var html = "";
 
  if (memberships.length) {
    html += `<tr><th>Relation</th><th>Type</th><th>Role</th></tr>`;
    for (var i in memberships) {
      var membership = memberships[i];
      var rel = osmEntityCache[membership.key];
      var label = rel.tags.name || rel.id;
      var relType = rel.tags.type || '';
      if ((relType === "route" || relType === "superroute") && rel.tags.route) {
        relType += " (" + (rel.tags.route || rel.tags.superroute) + ")";
      }
      html += `<tr><td><a href="#" onclick="didClickEntityLink(event);" key="${membership.key}">${label}</a></td><td>${relType}</td><td>${membership.role}</td></tr>`;
    }
  } else {
    html += `<tr><th>Relations</th></tr>`;
    html += `<tr><td><i>none</i></td></tr>`;
  }
  document.getElementById('relations-table').innerHTML = html;
}

function didClickEntityLink(e) {
  e.preventDefault();
  selectEntity(osmEntityCache[e.target.getAttribute("key")]);
}

function getFormattedDate(date) {
  var offsetDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60 * 1000));
  var components = offsetDate.toISOString().split('T')
  return components[0] + " " + components[1].split(".")[0];
}