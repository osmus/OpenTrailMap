const API_BASE = "https://api.openstreetmap.org/api/0.6";

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} fetching ${url}`);
  }
  return response.json();
}

export class OsmController {
  osmEntityCache = {};
  osmEntityMembershipCache = {};
  osmChangesetCache = {};

  // In-flight requests, so concurrent callers asking for the same thing share
  // one network request. Entries are removed once settled; a rejected request
  // is therefore retried rather than cached as a permanent failure.
  pendingRequests = {};

  cacheEntities(elements, full) {
    for (const element of elements) {
      const key = element.type[0] + element.id;
      this.osmEntityCache[key] = element;
      this.osmEntityCache[key].full = full;
    }
  }

  getCachedEntity(type, id) {
    return this.osmEntityCache[type[0] + id];
  }

  dedupe(key, load) {
    if (!this.pendingRequests[key]) {
      this.pendingRequests[key] = load().finally(() => {
        delete this.pendingRequests[key];
      });
    }
    return this.pendingRequests[key];
  }

  async fetchOsmEntity(type, id) {
    const key = type[0] + id;
    if (this.osmEntityCache[key]?.full) return this.osmEntityCache[key];

    return this.dedupe(`entity:${key}`, async () => {
      // `/full` also returns an entity's members, which we cache for free
      const url = `${API_BASE}/${type}/${id}${type === "node" ? "" : "/full"}.json`;
      const json = await getJson(url);
      this.cacheEntities(json.elements || [], true);
      return this.osmEntityCache[key];
    });
  }

  async fetchOsmEntityMemberships(type, id) {
    const key = type[0] + id;
    if (this.osmEntityMembershipCache[key]) return this.osmEntityMembershipCache[key];

    return this.dedupe(`memberships:${key}`, async () => {
      const json = await getJson(`${API_BASE}/${type}/${id}/relations.json`);
      const rels = json.elements || [];

      const memberships = [];
      for (const rel of rels) {
        for (const membership of rel.members) {
          if (membership.ref === id && membership.type === type) {
            memberships.push({
              type: rel.type,
              id: rel.id,
              role: membership.role,
            });
          }
        }
      }
      // response relations are fully defined entities so we can cache them for free
      this.cacheEntities(rels, false);

      this.osmEntityMembershipCache[key] = memberships;
      return memberships;
    });
  }

  async fetchOsmChangeset(id) {
    if (this.osmChangesetCache[id]) return this.osmChangesetCache[id];

    return this.dedupe(`changeset:${id}`, async () => {
      const json = await getJson(`${API_BASE}/changeset/${id}.json`);
      this.osmChangesetCache[id] = json.changeset;
      return json.changeset;
    });
  }
}

export const osm = new OsmController();
