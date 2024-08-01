let osmEntityCache = {};
let osmEntityMembershipCache = {};
let osmChangesetCache = {};

function cacheEntities(elements, full) {
  for (let i in elements) {
    let element = elements[i];
    let type = element.type;
    let id = element.id;
    let key = type[0] + id;
    
    osmEntityCache.full = full;

    osmEntityCache[key] = element;
  }
}

async function fetchOsmEntity(type, id) {
  let key = type[0] + id;
  if (!osmEntityCache[key] || !osmEntityCache[key].full) {
    let url = `https://api.openstreetmap.org/api/0.6/${type}/${id}`;
    if (type !== 'node') {
      url += '/full';
    }
    url += '.json';
    let response = await fetch(url);
    let json = await response.json();
    cacheEntities(json && json.elements || [], true);
  }
  return osmEntityCache[key];
}

async function fetchOsmEntityMemberships(type, id) {
  let key = type[0] + id;

  if (!osmEntityMembershipCache[key]) {
    let response = await fetch(`https://api.openstreetmap.org/api/0.6/${type}/${id}/relations.json`);
    let json = await response.json();
    let rels = json && json.elements || [];

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
    let url = `https://api.openstreetmap.org/api/0.6/changeset/${id}.json`;
    let response = await fetch(url);
    let json = await response.json();
    osmChangesetCache[id] = json && json.elements && json.elements.length && json.elements[0];
  }
  return osmChangesetCache[id];
}