# OpenTrailMap

_[opentrailmap.us](https://opentrailmap.us)_

This is a prototype web map application for viewing [OpenStreetMap](https://openstreetmap.org/about) (OSM) trail data. The tool is being developed in support of our [Trails Stewardship Initiative](https://openstreetmap.us/our-work/trails/), a community project to improve the quality of trail data in OSM. 

⚠️ This tool is still in early development and serves as a proof-of-concept. OpenStreetMap US is seeking funding partners to build out the tool as the primary app for visualizing, updating, validating, and maintaining OpenStreetMap trail data in the United States. The app will close the feedback loop between trail users, trail managers, and trail mappers. If you or your organization are interested in supporting this tool, please [contact us](https://openstreetmap.us/contact/) or consider [donating](https://openstreetmap.app.neoncrm.com/forms/trails-stewardship-initiative).

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
- Bicycle Trails ([`bicycle`](https://wiki.openstreetmap.org/wiki/Key:bicycle) access)
- Horseback Riding Trails ([`horse`](https://wiki.openstreetmap.org/wiki/Key:horse) access)
- ATV Trails ([`atv`](https://wiki.openstreetmap.org/wiki/Key:atv) access)
- Snowmobile Trails ([`snowmobile`](https://wiki.openstreetmap.org/wiki/Key:snowmobile) access)

The following styles highlight the presence and values of trail attribute tags. Purple lines mean an attribute is missing, incomplete, or needs review, while teal lines indicate the attribute is good to go.

- [`operator`](https://wiki.openstreetmap.org/wiki/Key:operator)/[`informal`](https://wiki.openstreetmap.org/wiki/Key:informal)
- [`name`](https://wiki.openstreetmap.org/wiki/Key:name)/[`noname`](https://wiki.openstreetmap.org/wiki/Key:noname)
- [`surface`](https://wiki.openstreetmap.org/wiki/Key:surface)
- [`smoothness`](https://wiki.openstreetmap.org/wiki/Key:smoothness)
- [`trail_visibility`](https://wiki.openstreetmap.org/wiki/Key:trail_visibility)
- [`width`](https://wiki.openstreetmap.org/wiki/Key:width)
- [`incline`](https://wiki.openstreetmap.org/wiki/Key:incline)
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

### Map tiles
Trail vector tiles are rendered and hosted by OpenStreetMap US using the schema files [here](https://github.com/osmus/tileservice/blob/main/renderer/layers). Thank you to [@zelonewolf](https://github.com/zelonewolf) for setting up the vector tile pipeline. Render time is currently about 4 hours, so any changes you make will take 4 to 8 hours to appear on the map. Map tiles are not available for public use at this time.

The trail vector tilesets are segmented so you do not have to download data that you're not viewing. Namely, the water trail tiles are distinct from the land trail tiles.

## Get involved

### Code of Conduct
Participation in OpenTrailMap is subject to the [OpenStreetMap US Code of Conduct](https://wiki.openstreetmap.org/wiki/Foundation/Local_Chapters/United_States/Code_of_Conduct_Committee/OSM_US_Code_of_Conduct). Please take a moment to review the CoC prior to contributing, and remember to be nice :)

### Contributing

You can open an [issue](https://github.com/osmus/OpenTrailMap/issues) in this repository if you have a question or comment. Please search existing issues first in case someone else had the same thought. [Pull request](https://github.com/osmus/OpenTrailMap/pulls) are public, but we recommend opening or commenting on an issue before writing any code so that we can make sure your work is aligned with the goals of the project.

We also collaborate via the [#opentrailmap](https://osmus.slack.com/archives/opentrailmap) channel on [OpenStreetMap US Slack](https://openstreetmap.us/slack). Anyone is free to join.

### Development setup
1. [Clone the repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository)
2. Open your terminal and `cd` into the repo's directory
3. Run `node serve.js` to start the development server
4. Visit [http://localhost:4001](http://localhost:4001) in your browser
5. That's it!

OpenTrailMap currently has no package dependencies.

## License

The OpenTrailMap source code is distributed under the [MIT license](https://github.com/osmus/OpenTrailMap/blob/main/LICENSE). Dependencies are subject to their respective licenses.
