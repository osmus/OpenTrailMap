var osmEntityCache = {};
var osmEntityMembershipCache = {};
var osmChangesetCache = {};

function cacheEntities(elements, full) {
  for (var i in elements) {
    var element = elements[i];
    var type = element.type;
    var id = element.id;
    var key = type[0] + id;
    
    osmEntityCache.full = full;

    osmEntityCache[key] = element;
  }
}

async function fetchOsmEntity(type, id) {
  var key = type[0] + id;
  if (!osmEntityCache[key] || !osmEntityCache[key].full) {
    var url = `https://api.openstreetmap.org/api/0.6/${type}/${id}`;
    if (type !== 'node') {
      url += '/full';
    }
    url += '.json';
    var response = await fetch(url);
    var json = await response.json();
    cacheEntities(json && json.elements || [], true);
  }
  return osmEntityCache[key];
}

async function fetchOsmEntityMemberships(type, id) {
  var key = type[0] + id;

  if (!osmEntityMembershipCache[key]) {
    var response = await fetch(`https://api.openstreetmap.org/api/0.6/${type}/${id}/relations.json`);
    var json = await response.json();
    var rels = json && json.elements || [];

    osmEntityMembershipCache[key] = [];
    rels.forEach(function(rel) {
      rel.members.forEach(function(membership) {
        if (membership.ref === id && membership.type === type) {
          osmEntityMembershipCache[key].push({
            key: rel.type[0] + rel.id,
            role: membership.role,
          });
        }
      });
    });
    
    // response relations are fully defined entities so we can cache them for free
    cacheEntities(rels, false);
  }

  return osmEntityMembershipCache[key];
}

async function fetchOsmChangeset(id) {
  if (!osmChangesetCache[id]) {
    var url = `https://api.openstreetmap.org/api/0.6/changeset/${id}.json`;
    var response = await fetch(url);
    var json = await response.json();
    osmChangesetCache[id] = json && json.elements && json.elements.length && json.elements[0];
  }
  return osmChangesetCache[id];
}