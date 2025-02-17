import { osm } from "./osmController.js";
import { state } from "./stateController.js";
import { createElement, getElementById } from "./utils.js";

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

  let sidebarElement = getElementById('sidebar');
  if (!sidebarElement) return;

  if (!entity) {
    sidebarElement.replaceChildren('');
    return;
  }

  let type = entity.type;
  let entityId = entity.id;

  // non-breaking space for placeholder
  let nbsp = String.fromCharCode(160);
  
  let opQuery = encodeURIComponent(`${type}(${entityId});\n(._;>;);\nout;`);

  let xmlLink = `https://www.openstreetmap.org/api/0.6/${type}/${entityId}`;
  if (type == 'way' || type == 'relation') xmlLink += '/full';

  sidebarElement.replaceChildren(
    createElement('table')
      .setAttribute('id', 'tag-table')
      .append(
        // placeholder layout, so transition is less jarring when data appears in a moment
        createElement('tr').append(
          createElement('th').append('Key'),
          createElement('th').append('Value')
        ),
        createElement('tr').append(
          createElement('td').append(nbsp),
          createElement('td').append(nbsp)
        )
      ),
    createElement('table')
      .setAttribute('id', 'relations-table')
      .append(
        createElement('tr').append(createElement('th').append('Relations')),
        createElement('tr').append(createElement('td').append(nbsp))
      ),
    createElement('table')
      .setAttribute('id', 'meta-table')
      .append(
        createElement('tr').append(createElement('th').append('Meta')),
        createElement('tr').append(createElement('td').append(nbsp))
      ),
    createElement('h3').append('View'),
    createElement('p')
      .setAttribute('class', 'link-list')
      .append(
        ...[
          createElement('a').setAttribute('target', '_blank').setAttribute('href', `https://openstreetmap.org/${type}/${entityId}`).append('osm.org'), ' ',
          createElement('a').setAttribute('target', '_blank').setAttribute('href', xmlLink).append('XML'), ' ',
          createElement('a').setAttribute('target', '_blank').setAttribute('href', `https://pewu.github.io/osm-history/#/${type}/${entityId}`).append('PeWu'), ' ',
          createElement('a').setAttribute('target', '_blank').setAttribute('href', `https://overpass-turbo.eu?Q=${opQuery}&R=`).append('Overpass Turbo'), ' ',
          createElement('a').setAttribute('target', '_blank').setAttribute('href', `https://osmcha.org/changesets/${entity.changeset}`).append('OSMCha'), ' ',
          type === 'relation' ? createElement('a').setAttribute('target', '_blank').setAttribute('href', `http://ra.osmsurround.org/analyzeRelation?relationId=${entityId}`).append('Relation Analyzer') : undefined
        ].filter(i => i)
      ),
    createElement('h3').append('Edit'),
    createElement('p')
      .setAttribute('class', 'link-list')
      .append(
        createElement('a').setAttribute('target', '_blank').setAttribute('href', `https://openstreetmap.org/edit?editor=id&${type}=${entityId}`).append('iD'), ' ',
        createElement('a').setAttribute('target', '_blank').setAttribute('href', `https://openstreetmap.org/edit?editor=remote&${type}=${entityId}`).append('JOSM'), ' ',
        createElement('a').setAttribute('target', '_blank').setAttribute('href', `https://level0.osmz.ru/?url=${type}/${entityId}`).append('Level0')
      ),
  );

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

  const table = getElementById('meta-table');
  if (!table) return;

  let formattedDate = getFormattedDate(new Date(entity.timestamp));
  let comment = changeset && changeset.tags && changeset.tags.comment || '';
  let sources = changeset && changeset.tags && changeset.tags.source || '';

  table.replaceChildren(
    createElement('tr').append(
      createElement('th')
        .setAttribute('colspan', '2')
        .append('Meta')
    ),
    createElement('tr').append(
      createElement('td').append('ID'),
      createElement('td').append(
        createElement('a').setAttribute('target', '_blank').setAttribute('href', `https://www.openstreetmap.org/${entity.type}/${entity.id}`).append(`${entity.type}/${entity.id}`)
      )
    ),
    createElement('tr').append(
      createElement('td').append('Version'),
      createElement('td').append(
        createElement('a').setAttribute('target', '_blank').setAttribute('href', `https://www.openstreetmap.org/${entity.type}/${entity.id}/history`).append(entity.version)
      )
    ),
    createElement('tr').append(
      createElement('td').append('Uploaded'),
      createElement('td').append(formattedDate)
    ),
    createElement('tr').append(
      createElement('td').append('User'),
      createElement('td').append(
        createElement('a').setAttribute('target', '_blank').setAttribute('href', `https://www.openstreetmap.org/user/${entity.user}`).append(entity.user)
      )
    ),
    createElement('tr').append(
      createElement('td').append('Changeset'),
      createElement('td').append(
        createElement('a').setAttribute('target', '_blank').setAttribute('href', `https://www.openstreetmap.org/changeset/${entity.changeset}`).append(entity.changeset)
      )
    ),
    createElement('tr').append(
      createElement('td').append('Comment'),
      createElement('td').append(comment)
    ),
    createElement('tr').append(
      createElement('td').append('Source'),
      createElement('td').append(sources)
    ),
  );
}

const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/i;
const qidRegex = /^Q\d+$/;
const wikipediaRegex = /^(.+):(.+)$/;
const nwisRegex = /^\d{8,15}$/;

function externalLinkForValue(key, value, tags) {
  if (urlRegex.test(value)) {
    return value;
  } else if ((key === 'wikidata' || key.endsWith(':wikidata')) && qidRegex.test(value)) {
    return `https://www.wikidata.org/wiki/${value}`;
  } else if ((key === 'wikipedia' || key.endsWith(':wikipedia')) && wikipediaRegex.test(value)) {
    let results = wikipediaRegex.exec(value);
    return `https://${results[1]}.wikipedia.org/wiki/${results[2]}`;
  } else if (key === 'ref' && tags.man_made === 'monitoring_station' && tags.operator === "United States Geological Survey" && nwisRegex.test(value)) {
    return `https://waterdata.usgs.gov/monitoring-location/${value}/`;
  }
  return null;
}

function updateTagsTable(tags) {
  const table = getElementById('tag-table');
  if (!table) return;

  table.replaceChildren(
    createElement('tr')
      .append(
        createElement('th')
          .append('Key'),
        createElement('th')
          .append('Value'),
      ),
    ...Object.keys(tags).sort().map(key => {
      let value = tags[key];
      let href = externalLinkForValue(key, value, tags);
      let valElement = href ? createElement('a')
          .setAttribute('target', '_blank')
          .setAttribute('rel', 'nofollow')
          .setAttribute('href', href)
          .append(value) : value;
  
      return createElement('tr')
        .append(
          createElement('td')
            .append(
              createElement('a')
                .setAttribute('target', '_blank')
                .setAttribute('href', `https://wiki.openstreetmap.org/wiki/Key:${key}`)
                .append(key)
            ),
          createElement('td')
            .append(valElement)
        );
    })
  );
}

function updateMembershipsTable(memberships) {
  const table = getElementById('relations-table');
  if (!table) return;

  if (memberships.length) {
    table.replaceChildren(
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
    table.replaceChildren(
      createElement('tr')
        .append(
          createElement('th')
            .append('Relations')
        ),
      createElement('tr')
        .append(
          createElement('td')
            .append(
              createElement('i')
                .append('none')
            )
        )
    );
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

  getElementById("inspect-toggle").addEventListener('click', function(e) {
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
