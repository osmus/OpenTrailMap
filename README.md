# OpenTrailMap

_[opentrailmap.us](https://opentrailmap.us)_

This is a prototype web map application for viewing [OpenStreetMap](https://openstreetmap.org/about) (OSM) trail data. The tool is being developed in support of our [Trails Stewardship Initiative](https://openstreetmap.us/our-work/trails/), a community project to improve the quality of trail data in OSM. 

> [!WARNING]
> This tool is still in early development and serves as a proof-of-concept. OpenStreetMap US is seeking funding partners to build out the tool as the primary app for visualizing, updating, validating, and maintaining OpenStreetMap trail data in the United States. The app will close the feedback loop between trail users, trail managers, and trail mappers. If you or your organization are interested in supporting this tool, please [contact us](https://openstreetmap.us/contact/) or consider [donating](https://openstreetmap.app.neoncrm.com/forms/trails-stewardship-initiative).

## Prototype functionality

### UI features

- View OpenStreetMap trail data using various map styles.
- Click a feature to view its current tags, relations, and metadata.
- Use quick links to open the feature on [openstreetmap.org](https://openstreetmap.org), iD, JOSM, and other viewers.

### Map styles

OpenTrailMap aims to display all land trails, snow trails, and water trails present in OpenStreetMap.

#### Land and snow trails

The following styles show allowed trail access for different travel modes. Dark green lines are public paths, while striped pale green lines are restricted or infeasible for the given travel mode. Dashed lines are `informal=yes`, while solid lines are `infomal=no` or `informal` not given.

- Hiking & Walking Trails ([`foot`](https://wiki.openstreetmap.org/wiki/Key:foot) access)
- Wheelchair Trails ([`wheelchair`](https://wiki.openstreetmap.org/wiki/Key:wheelchair) access)
- Biking Trails ([`bicycle`](https://wiki.openstreetmap.org/wiki/Key:bicycle) access)
- Mountain Biking Trails ([`mtb`](https://wiki.openstreetmap.org/wiki/Key:mtb) access)
- Inline Skating Trails ([`inline_skates`](https://wiki.openstreetmap.org/wiki/Key:inline_skates) access)
- Horseback Riding Trails ([`horse`](https://wiki.openstreetmap.org/wiki/Key:horse) access)
- ATV Trails ([`atv`](https://wiki.openstreetmap.org/wiki/Key:atv) access)
- Cross-Country Ski Trails ([`ski:nordic`](https://wiki.openstreetmap.org/wiki/Key:ski:nordic) access)
- Snowmobile Trails ([`snowmobile`](https://wiki.openstreetmap.org/wiki/Key:snowmobile) access)

Selecting a _lens_ highlights the presence and values of a single trail attribute tag. Purple lines mean an attribute is missing, incomplete, or needs review, while teal lines indicate the attribute is good to go. The set of lenses offered depends on the selected travel mode.

- [`operator`](https://wiki.openstreetmap.org/wiki/Key:operator)/[`informal`](https://wiki.openstreetmap.org/wiki/Key:informal)
- [`name`](https://wiki.openstreetmap.org/wiki/Key:name)/[`noname`](https://wiki.openstreetmap.org/wiki/Key:noname)
- [`surface`](https://wiki.openstreetmap.org/wiki/Key:surface)
- [`smoothness`](https://wiki.openstreetmap.org/wiki/Key:smoothness)
- [`trail_visibility`](https://wiki.openstreetmap.org/wiki/Key:trail_visibility)
- [`sac_scale`](https://wiki.openstreetmap.org/wiki/Key:sac_scale) (hiking only)
- [`width`](https://wiki.openstreetmap.org/wiki/Key:width)
- [`incline`](https://wiki.openstreetmap.org/wiki/Key:incline)
- [`covered`](https://wiki.openstreetmap.org/wiki/Key:covered)/[`tunnel`](https://wiki.openstreetmap.org/wiki/Key:tunnel)
- [`lit`](https://wiki.openstreetmap.org/wiki/Key:lit)
- [`dog`](https://wiki.openstreetmap.org/wiki/Key:dog)
- [`maxspeed`](https://wiki.openstreetmap.org/wiki/Key:maxspeed) (wheeled modes only)
- [`oneway`](https://wiki.openstreetmap.org/wiki/Key:oneway)
- [`fixme`](https://wiki.openstreetmap.org/wiki/Key:fixme)/[`todo`](https://wiki.openstreetmap.org/wiki/Key:todo)
- [`check_date`](https://wiki.openstreetmap.org/wiki/Key:check_date)/[`survey:date`](https://wiki.openstreetmap.org/wiki/Key:survey:date)
- Last Edited Date: the timestamp of the latest version of the feature

In all the land and snow styles, some trail-related points of interest are included on the map:

- [`amenity=ranger_station`](https://wiki.openstreetmap.org/wiki/Tag:amenity%3Dranger_station): ranger stations are generally public visitor centers where trail users can get info or seek help
- [`highway=trailhead`](https://wiki.openstreetmap.org/wiki/Tag:highway%3Dtrailhead): trailheads are access points to trail networks, often with various amenities
- [`information=guidepost`](https://wiki.openstreetmap.org/wiki/Tag:information%3Dguidepost): signage marking the direction of one or more trails, typically at a trailhead or junction
- [`information=route_marker`](https://wiki.openstreetmap.org/wiki/Tag:information%3Droute_marker): signage marking the route of a trail

#### Water trails

Currently, just one marine travel mode is supported:

- Canoe & Kayak Trails ([`canoe`](https://wiki.openstreetmap.org/wiki/Key:canoe)/[`portage`](https://wiki.openstreetmap.org/wiki/Key:portage) access)

The following water trail attribute styles are supported:

- [`name`](https://wiki.openstreetmap.org/wiki/Key:name)/[`noname`](https://wiki.openstreetmap.org/wiki/Key:noname)/[`waterbody:name`](https://wiki.openstreetmap.org/wiki/Key:waterbody:name)
- [`tidal`](https://wiki.openstreetmap.org/wiki/Key:tidal)
- [`intermittent`](https://wiki.openstreetmap.org/wiki/Key:intermittent)
- [`rapids`](https://wiki.openstreetmap.org/wiki/Key:rapids)
- [`open_water`](https://wiki.openstreetmap.org/wiki/Key:open_water)
- [`oneway:canoe`](https://wiki.openstreetmap.org/wiki/Key:oneway:canoe)/[`oneway:boat`](https://wiki.openstreetmap.org/wiki/Key:oneway:boat)
- [`width`](https://wiki.openstreetmap.org/wiki/Key:width)
- [`fixme`](https://wiki.openstreetmap.org/wiki/Key:fixme)/[`todo`](https://wiki.openstreetmap.org/wiki/Key:todo)
- [`check_date`](https://wiki.openstreetmap.org/wiki/Key:check_date)/[`survey:date`](https://wiki.openstreetmap.org/wiki/Key:survey:date)
- Last Edited Date: the timestamp of the latest version of the feature

### Static stylesheet

The basemap is a general-purpose trail map in its own right, independent of the QA overlay. `npm run build` writes it to `dist/style.json` as a plain MapLibre stylesheet, published at [opentrailmap.us/style.json](https://opentrailmap.us/style.json), for use in other applications. The stylesheet is subject to the same license as the rest of OpenTrailMap (see below), but note that the tiles it points at are not currently available for public use.

### Embedding

An embeddable version of the basemap is served from [opentrailmap.us/embed.html](https://opentrailmap.us/embed.html), intended for use in an `<iframe>`. It accepts two parameters:

- `#map=zoom/lat/lon` sets the initial camera position.
- `?highlight=relation/123` highlights one or more parks or protected areas, as a comma-separated list of OSM element IDs.

## Get involved

### Code of Conduct
Participation in OpenTrailMap is subject to the [OpenStreetMap US Code of Conduct](https://wiki.openstreetmap.org/wiki/Foundation/Local_Chapters/United_States/Code_of_Conduct_Committee/OSM_US_Code_of_Conduct). Please take a moment to review the CoC prior to contributing, and remember to be nice :)

### Contributing

You can open an [issue](https://github.com/osmus/OpenTrailMap/issues) in this repository if you have a question or comment. Please search existing issues first in case someone else had the same thought. [Pull request](https://github.com/osmus/OpenTrailMap/pulls) are public, but we recommend opening or commenting on an issue before writing any code so that we can make sure your work is aligned with the goals of the project.

We also collaborate via the [#opentrailmap](https://osmus.slack.com/archives/opentrailmap) channel on [OpenStreetMap US Slack](https://openstreetmap.us/slack). Anyone is free to join.

### Development setup

Requires Node.js 22 or newer.

1. [Clone the repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository)
2. Open your terminal and `cd` into the repo's directory
3. Run `npm install` (first-time setup only)
4. Run `npm run dev` to start the development server
5. Visit [http://localhost:5173](http://localhost:5173) in your browser
6. That's it!

#### Building sprites

Source vector images for use in the map are located at [/style/sprites/icons/](/style/sprites/icons/). Most are vendored from the CC0-licensed Pinhead icon library. Each icon is composited into plain, rounded-rectangle and circular variants, then packed into SDF sprite sheets under `public/sprites/`, which are committed to the repository. If you add or change any icon, you'll need to rebuild the sheets.

1. Install the [spreet](https://github.com/flother/spreet) command line tool
2. Run `npm run sprites`
3. Commit the regenerated files in `public/sprites/`

## License

The OpenTrailMap source code is distributed under the [MIT license](./LICENSE). Dependencies are subject to their respective licenses.

The icons used in OpenTrailMap are available under the CC0 license and are in the public domain. See [style/sprites/LICENSE](./style/sprites/LICENSE) for details.
