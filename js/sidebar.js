import { osm } from "./osm.js";
import { state } from "./state.js";
import { el } from "./utils.js";

function setSidebarOpen(open) {
  document.body.classList.toggle("sidebar-open", open);
}

function link(href, text) {
  return el("a", { target: "_blank", href }, text);
}

// Incremented on every selection, so responses for a previously selected
// entity can't overwrite the tables after the user has moved on.
let currentRequest = 0;

function tableError(tableId, heading, error) {
  const table = document.getElementById(tableId);
  if (!table) return;
  console.error(error);
  table.replaceChildren(
    el("tr", null, el("th", null, heading)),
    el("tr", null, el("td", null, el("i", null, "could not be loaded"))),
  );
}

function updateSidebar(entity) {
  const sidebarElement = document.getElementById("sidebar");
  if (!sidebarElement) return;

  const request = ++currentRequest;
  const isCurrent = () => request === currentRequest;

  if (!entity) {
    sidebarElement.replaceChildren("");
    return;
  }

  const type = entity.type;
  const entityId = entity.id;

  // non-breaking space for placeholder
  const nbsp = String.fromCharCode(160);

  const opQuery = encodeURIComponent(`${type}(${entityId});\n(._;>;);\nout;`);

  let xmlLink = `https://www.openstreetmap.org/api/0.6/${type}/${entityId}`;
  if (type === "way" || type === "relation") xmlLink += "/full";

  sidebarElement.replaceChildren(
    // placeholder layout, so transition is less jarring when data appears in a moment
    el(
      "table",
      { id: "tag-table" },
      el("tr", null, el("th", null, "Key"), el("th", null, "Value")),
      el("tr", null, el("td", null, nbsp), el("td", null, nbsp)),
    ),
    el(
      "table",
      { id: "relations-table" },
      el("tr", null, el("th", null, "Relations")),
      el("tr", null, el("td", null, nbsp)),
    ),
    el(
      "table",
      { id: "meta-table" },
      el("tr", null, el("th", null, "Meta")),
      el("tr", null, el("td", null, nbsp)),
    ),
    el("h3", null, "View"),
    el(
      "p",
      { class: "link-list" },
      link(`https://openstreetmap.org/${type}/${entityId}`, "osm.org"),
      " ",
      link(xmlLink, "XML"),
      " ",
      link(`https://pewu.github.io/osm-history/#/${type}/${entityId}`, "PeWu"),
      " ",
      link(`https://overpass-turbo.eu?Q=${opQuery}&R=`, "Overpass Turbo"),
      " ",
      type === "relation" &&
        link(
          `http://ra.osmsurround.org/analyzeRelation?relationId=${entityId}`,
          "Relation Analyzer",
        ),
    ),
    el("h3", null, "Edit"),
    el(
      "p",
      { class: "link-list" },
      link(`https://openstreetmap.org/edit?editor=id&${type}=${entityId}`, "iD"),
      " ",
      link(`https://openstreetmap.org/edit?editor=remote&${type}=${entityId}`, "JOSM"),
      " ",
      link(`https://level0.osmz.ru/?url=${type}/${entityId}`, "Level0"),
    ),
  );

  osm
    .fetchOsmEntity(type, entityId)
    .then((entity) => {
      if (!isCurrent() || !entity) return;
      if (entity.tags) updateTagsTable(entity.tags);

      return osm.fetchOsmChangeset(entity.changeset).then((changeset) => {
        if (isCurrent()) updateMetaTable(entity, changeset);
      });
    })
    .catch((error) => {
      if (!isCurrent()) return;
      tableError("tag-table", "Tags", error);
      tableError("meta-table", "Meta", error);
    });

  osm
    .fetchOsmEntityMemberships(type, entityId)
    .then((memberships) => {
      if (isCurrent()) updateMembershipsTable(memberships);
    })
    .catch((error) => {
      if (isCurrent()) tableError("relations-table", "Relations", error);
    });
}

function updateMetaTable(entity, changeset) {
  const table = document.getElementById("meta-table");
  if (!table) return;

  const formattedDate = getFormattedDate(new Date(entity.timestamp));
  const comment = changeset?.tags?.comment || "";
  const sources = changeset?.tags?.source || "";

  table.replaceChildren(
    el("tr", null, el("th", { colspan: "2" }, "Meta")),
    el(
      "tr",
      null,
      el("td", null, "ID"),
      el(
        "td",
        null,
        link(
          `https://www.openstreetmap.org/${entity.type}/${entity.id}`,
          `${entity.type}/${entity.id}`,
        ),
      ),
    ),
    el(
      "tr",
      null,
      el("td", null, "Version"),
      el(
        "td",
        null,
        link(`https://www.openstreetmap.org/${entity.type}/${entity.id}/history`, entity.version),
      ),
    ),
    el("tr", null, el("td", null, "Uploaded"), el("td", null, formattedDate)),
    el(
      "tr",
      null,
      el("td", null, "User"),
      el("td", null, link(`https://www.openstreetmap.org/user/${entity.user}`, entity.user)),
    ),
    el(
      "tr",
      null,
      el("td", null, "Changeset"),
      el(
        "td",
        null,
        link(`https://www.openstreetmap.org/changeset/${entity.changeset}`, entity.changeset),
        " (",
        link(`https://osmcha.org/changesets/${entity.changeset}`, "OSMCha"),
        ")",
      ),
    ),
    el("tr", null, el("td", null, "Comment"), el("td", null, comment)),
    el("tr", null, el("td", null, "Source"), el("td", null, sources)),
  );
}

const urlRegex =
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/i;
const qidRegex = /^Q\d+$/;
const wikipediaRegex = /^(.+):(.+)$/;
const nwisRegex = /^\d{8,15}$/;

function externalLinkForValue(key, value, tags) {
  if (urlRegex.test(value)) {
    return value;
  } else if ((key === "wikidata" || key.endsWith(":wikidata")) && qidRegex.test(value)) {
    return `https://www.wikidata.org/wiki/${value}`;
  } else if ((key === "wikipedia" || key.endsWith(":wikipedia")) && wikipediaRegex.test(value)) {
    const results = wikipediaRegex.exec(value);
    return `https://${results[1]}.wikipedia.org/wiki/${results[2]}`;
  } else if (
    key === "ref" &&
    tags.man_made === "monitoring_station" &&
    tags.operator === "United States Geological Survey" &&
    nwisRegex.test(value)
  ) {
    return `https://waterdata.usgs.gov/monitoring-location/${value}/`;
  }
  return null;
}

function updateTagsTable(tags) {
  const table = document.getElementById("tag-table");
  if (!table) return;

  table.replaceChildren(
    el("tr", null, el("th", null, "Key"), el("th", null, "Value")),
    ...Object.keys(tags)
      .sort()
      .map((key) => {
        const value = tags[key];
        const href = externalLinkForValue(key, value, tags);
        const valElement = href
          ? el("a", { target: "_blank", rel: "nofollow", href }, value)
          : value;

        return el(
          "tr",
          null,
          el("td", null, link(`https://wiki.openstreetmap.org/wiki/Key:${key}`, key)),
          el("td", null, valElement),
        );
      }),
  );
}

function updateMembershipsTable(memberships) {
  const table = document.getElementById("relations-table");
  if (!table) return;

  if (memberships.length) {
    table.replaceChildren(
      el("tr", null, el("th", null, "Relation"), el("th", null, "Type"), el("th", null, "Role")),
    );
    for (const membership of memberships) {
      const rel = osm.getCachedEntity(membership.type, membership.id);
      const label = rel.tags.name || rel.id;
      let relType = rel.tags.type || "";
      if ((relType === "route" || relType === "superroute") && rel.tags.route) {
        relType += ` (${rel.tags.route || rel.tags.superroute})`;
      }
      table.append(
        el(
          "tr",
          null,
          el(
            "td",
            null,
            el(
              "a",
              {
                href: "#",
                "data-type": membership.type,
                "data-id": membership.id,
                onclick: didClickEntityLink,
              },
              label,
            ),
          ),
          el("td", null, relType),
          el("td", null, membership.role),
        ),
      );
    }
  } else {
    table.replaceChildren(
      el("tr", null, el("th", null, "Relations")),
      el("tr", null, el("td", null, el("i", null, "none"))),
    );
  }
}

function didClickEntityLink(e) {
  e.preventDefault();
  state.selectEntity({
    type: e.target.getAttribute("data-type"),
    id: parseInt(e.target.getAttribute("data-id"), 10),
  });
}

function getFormattedDate(date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  const components = offsetDate.toISOString().split("T");
  return `${components[0]} ${components[1].split(".")[0]}`;
}

export function initSidebar() {
  document.getElementById("inspect-toggle").addEventListener("click", () => {
    state.selectEntity(null);
  });

  state.addEventListener("selectedEntityChange", () => {
    setSidebarOpen(!!state.selectedEntityInfo);
    updateSidebar(state.selectedEntityInfo);
  });
}
