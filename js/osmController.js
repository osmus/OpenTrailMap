export class OsmController {

  osmEntityCache = {};
  osmEntityMembershipCache = {};
  osmChangesetCache = {};

  cacheEntities(elements, full) {
    for (let i in elements) {
      let element = elements[i];
      let type = element.type;
      let id = element.id;
      let key = type[0] + id;
      
      this.osmEntityCache[key] = element;
      this.osmEntityCache[key].full = full;
    }
  }

  getCachedEntity(type, id) {
    return this.osmEntityCache[type[0] + id];
  }

  async fetchOsmEntity(type, id) {
    let key = type[0] + id;
    if (!this.osmEntityCache[key] || !this.osmEntityCache[key].full) {
      let url = `https://api.openstreetmap.org/api/0.6/${type}/${id}`;
      if (type !== 'node') {
        url += '/full';
      }
      url += '.json';
      let response = await fetch(url);
      let json = await response.json();
      this.cacheEntities(json && json.elements || [], true);
    }
    return this.osmEntityCache[key];
  }

  async fetchOsmEntityMemberships(type, id) {
    let key = type[0] + id;

    if (!this.osmEntityMembershipCache[key]) {
      let response = await fetch(`https://api.openstreetmap.org/api/0.6/${type}/${id}/relations.json`);
      let json = await response.json();
      let rels = json && json.elements || [];

      this.osmEntityMembershipCache[key] = [];
      for (let i in rels) {
        let rel = rels[i];
        for (let j in rel.members) {
          let membership = rel.members[j];
          if (membership.ref === id && membership.type === type) {
            this.osmEntityMembershipCache[key].push({
              type: rel.type,
              id: rel.id,
              role: membership.role,
            });
          }
        }
      }
      // response relations are fully defined entities so we can cache them for free
      this.cacheEntities(rels, false);
    }

    return this.osmEntityMembershipCache[key];
  }

  async fetchOsmChangeset(id) {
    if (!this.osmChangesetCache[id]) {
      let url = `https://api.openstreetmap.org/api/0.6/changeset/${id}.json`;
      let response = await fetch(url);
      let json = await response.json();
      this.osmChangesetCache[id] = json && json.changeset;
    }
    return this.osmChangesetCache[id];
  }

}

export const osm = new OsmController();