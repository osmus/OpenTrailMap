import { osm } from "./osmController.js";
import { state } from "./stateController.js";
import { createElement } from "./utils.js";

function isSidebarOpen() {
  return document.getElementsByTagName('body')[0].classList.contains('sidebar-open');
}
function openSidebar() {
  if (!isSidebarOpen()) {
    document.getElementsByTagName('body')[0].classList.add('sidebar-open');
    updateSidebar(state.selectedEntityInfo);
  }
}
function closeSidebar() {
  if (isSidebarOpen()) {
    document.getElementsByTagName('body')[0].classList.remove('sidebar-open');
  }
}

function updateSidebar(entity) {

  let sidebarElement = document.getElementById('sidebar');
  if (!sidebarElement) return;

  if (!entity) {
    sidebarElement.innerHTML = "";
    return;
  }

  let type = entity.type;
  let entityId = entity.id;
  let focusLngLat = entity.focusLngLat;

  let bbox = focusLngLat && {
    left: focusLngLat.lng - 0.001,
    right: focusLngLat.lng + 0.001,
    bottom: focusLngLat.lat - 0.001,
    top: focusLngLat.lat + 0.001,
  };
  
  let opQuery = encodeURIComponent(`${type}(${entityId});\n(._;>;);\nout;`);

  let xmlLink = `https://www.openstreetmap.org/api/0.6/${type}/${entityId}`;
  if (type == 'way' || type == 'relation') xmlLink += '/full';
  
  let html = '';
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
  html += `<a href="${xmlLink}" target="_blank">XML</a> `;
  html += `<a href="https://pewu.github.io/osm-history/#/${type}/${entityId}" target="_blank">PeWu</a> `;
  html += `<a href="https://overpass-turbo.eu?Q=${opQuery}&R=" target="_blank">Overpass Turbo</a> `;
  html += `<a href="https://osmcha.org/changesets/${entity.changeset}" target="_blank">OSMCha</a> `;
  if (type === 'relation') {
    html += `<a href="http://ra.osmsurround.org/analyzeRelation?relationId=${entityId}" target="_blank">Relation Analyzer</a> `;
  }
  html += "</p>";
  html += "<h3>Edit</h3>";
  html += "<p class='link-list'>";
  html += `<a href="https://openstreetmap.org/edit?${type}=${entityId}" target="_blank">iD</a> `;
  if (bbox) html += `<a href="http://127.0.0.1:8111/load_and_zoom?left=${bbox.left}&right=${bbox.right}&top=${bbox.top}&bottom=${bbox.bottom}&select=${type}${entityId}" target="_blank">JOSM</a> `;
  html += `<a href="https://level0.osmz.ru/?url=${type}/${entityId}" target="_blank">Level0</a> `;
  html += "</p>";
  html += "</div>";

  sidebarElement.innerHTML = html;

  osm.fetchOsmEntity(type, entityId).then(function(entity) {
    if (entity) {
      osm.fetchOsmChangeset(entity.changeset).then(function(changeset) {
        updateMetaTable(entity, changeset);
      });
    }
    let tags = entity && entity.tags;
    if (tags) updateTagsTable(tags);
  });

  osm.fetchOsmEntityMemberships(type, entityId).then(function(memberships) {
    updateMembershipsTable(memberships);
  });
}

function updateMetaTable(entity, changeset) {
  const element = document.getElementById('meta-table');
  if (!element) return;

  let formattedDate = getFormattedDate(new Date(entity.timestamp));
  let comment = changeset && changeset.tags && changeset.tags.comment || '';
  let sources = changeset && changeset.tags && changeset.tags.source || '';
  let html = "";
  html += `<tr><th colspan='2'>Meta</th></tr>`;
  html += `<tr><td>ID</td><td><a href="https://www.openstreetmap.org/${entity.type}/${entity.id}" target="_blank">${entity.type}/${entity.id}</a></td></tr>`;
  html += `<tr><td>Version</td><td><a href="https://www.openstreetmap.org/${entity.type}/${entity.id}/history" target="_blank">${entity.version}</a></td></tr>`;
  html += `<tr><td>Uploaded</td><td>${formattedDate}</td></tr>`;
  html += `<tr><td>User</td><td><a href="https://www.openstreetmap.org/user/${entity.user}" target="_blank">${entity.user}</a></td></tr>`;
  html += `<tr><td>Changeset</td><td><a href="https://www.openstreetmap.org/changeset/${entity.changeset}" target="_blank">${entity.changeset}</a></td></tr>`;
  html += `<tr><td>Comment</td><td>${comment}</td></tr>`;
  html += `<tr><td>Source</td><td>${sources}</td></tr>`;
  element.innerHTML = html;
}

const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/i;
const qidRegex = /^Q\d+$/;
const wikipediaRegex = /^(.+):(.+)$/;
const nwisRegex = /^\d{8,15}$/;

function updateTagsTable(tags) {
  const element = document.getElementById('tag-table');
  if (!element) return;

  let html = "";
  html += `<tr><th>Key</th><th>Value</th></tr>`;
  let keys = Object.keys(tags).sort();
  for (let i in keys) {
    let key = keys[i];
    let value = tags[key];
    let element = value;
    if (urlRegex.test(value)) {
      element = `<a target="_blank" rel="nofollow" href="${value}">${value}</a>`;
    } else if ((key === 'wikidata' || key.endsWith(':wikidata')) && qidRegex.test(value)) {
      element = `<a target="_blank" rel="nofollow" href="https://www.wikidata.org/wiki/${value}">${value}</a>`;
    } else if ((key === 'wikipedia' || key.endsWith(':wikipedia')) && wikipediaRegex.test(value)) {
      let results = wikipediaRegex.exec(value);
      element = `<a target="_blank" rel="nofollow" href="https://${results[1]}.wikipedia.org/wiki/${results[2]}">${value}</a>`;
    } else if (key === 'ref' && tags.man_made === 'monitoring_station' && tags.operator === "United States Geological Survey" && nwisRegex.test(value)) {
      element = `<a target="_blank" rel="nofollow" href="https://waterdata.usgs.gov/monitoring-location/${value}/">${value}</a>`;
    }
    html += `<tr><td><a target="_blank" rel="nofollow" href="https://wiki.openstreetmap.org/wiki/Key:${key}">${key}</a></td><td>${element}</td></tr>`;
  }
  element.innerHTML = html;
}

function updateMembershipsTable(memberships) {
  const table = document.getElementById('relations-table');
  if (!table) return;
  table.innerHTML = "";
 
  if (memberships.length) {
    table.append(
      createElement('tr')
        .append(
          createElement('th')
            .append('Relation'),
          createElement('th')
            .append('Type'),
          createElement('th')
            .append('Role')
        )
    );
    for (let i in memberships) {
      let membership = memberships[i];
      let rel = osm.getCachedEntity(membership.type, membership.id);
      let label = rel.tags.name || rel.id;
      let relType = rel.tags.type || '';
      if ((relType === "route" || relType === "superroute") && rel.tags.route) {
        relType += " (" + (rel.tags.route || rel.tags.superroute) + ")";
      }
      table.append(
        createElement('tr')
          .append(
            createElement('td')
              .append(
                createElement('a')
                .setAttribute('href', '#')
                .setAttribute('type', membership.type)
                .setAttribute('id', membership.id)
                .addEventListener('click', didClickEntityLink)
                .append(label)
              ),
            createElement('td')
              .append(relType),
            createElement('td')
              .append(membership.role)
          )
      );
    }
  } else {
    let html = "";
    html += `<tr><th>Relations</th></tr>`;
    html += `<tr><td><i>none</i></td></tr>`;
    table.innerHTML = html;
  }
}

function didClickEntityLink(e) {
  e.preventDefault();
  state.selectEntity(osm.getCachedEntity(e.target.getAttribute("type"), e.target.getAttribute("id")));
}

function getFormattedDate(date) {
  let offsetDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60 * 1000));
  let components = offsetDate.toISOString().split('T')
  return components[0] + " " + components[1].split(".")[0];
}

window.addEventListener('load', function() {

  document.getElementById("inspect-toggle").addEventListener('click', function(e) {
    e.preventDefault();
    state.setInspectorOpen(!isSidebarOpen());
  });

  state.addEventListener('selectedEntityChange', function() {
    if (isSidebarOpen()) updateSidebar(state.selectedEntityInfo);
  });

  state.addEventListener('inspectorOpenChange', function() {
    if (state.inspectorOpen) {
      openSidebar();
    } else {
      closeSidebar();
    }
  });

});
