# OpenTrailMap

_[opentrailmap.us](https://opentrailmap.us)_

This is a prototype web map application for viewing [OpenStreetMap](https://openstreetmap.org/about) (OSM) trail data. The tool is being developed in support of our [Trails Stewardship Initiative](https://openstreetmap.us/our-work/trails/), a community project to improve the quality of trail data in OSM. 

⚠️ This tool is still in early development and serves as a proof-of-concept. OpenStreetMap US is seeking funding partners to build out the tool as the primary app for visualizing, updating, validating, and maintaining OpenStreetMap trail data in the United States. The app will close the feedback loop between trail users, trail managers, and trail mappers. If you or your organization are interested in supporting this tool, please [contact us](https://openstreetmap.us/contact/) or consider [donating](https://openstreetmap.app.neoncrm.com/forms/trails-stewardship-initiative).

## Prototype functionality

### UI features
- Show maps for different travel modes ([`foot`](https://wiki.openstreetmap.org/wiki/Key:foot), [`wheelchair`](https://wiki.openstreetmap.org/wiki/Key:wheelchair), [`bicycle`](https://wiki.openstreetmap.org/wiki/Key:bicycle), [`horse`](https://wiki.openstreetmap.org/wiki/Key:horse), [`atv`](https://wiki.openstreetmap.org/wiki/Key:atv), [`canoe`](https://wiki.openstreetmap.org/wiki/Key:canoe), [`snowmobile`](https://wiki.openstreetmap.org/wiki/Key:snowmobile)).
- Show maps for the presence of various trail tags ([`operator`](https://wiki.openstreetmap.org/wiki/Key:operator)/[`informal`](https://wiki.openstreetmap.org/wiki/Key:informal), [`surface`](https://wiki.openstreetmap.org/wiki/Key:surface), [`smoothness`](https://wiki.openstreetmap.org/wiki/Key:smoothness), [`trail_visibility`](https://wiki.openstreetmap.org/wiki/Key:trail_visibility), [`width`](https://wiki.openstreetmap.org/wiki/Key:width), [`incline`](https://wiki.openstreetmap.org/wiki/Key:incline), [`fixme`](https://wiki.openstreetmap.org/wiki/Key:fixme), [`check_date`](https://wiki.openstreetmap.org/wiki/Key:check_date)/[`survey:date`](https://wiki.openstreetmap.org/wiki/Key:survey:date))
- Click a feature to view its current tags, relations, and metadata.
- Use quick links to open the feature on [openstreetmap.org](https://openstreetmap.org), iD, JOSM, and other viewers.

### Trails data
Trail vector tiles are currently generated courtesy of [@zelonewolf](https://github.com/zelonewolf) using the schema file [here](https://github.com/ZeLonewolf/planetiler-scripts/blob/main/layers/osmus_trails.yml). Tiles are currently updated manually. This will be automated in the future with target update frequency of <24 hours.

#### Legend
- Dark green lines are public paths.
- Pale green lines indicate the given travel mode is not allowed or not possible. There are a few factors:
  - [`access`](https://wiki.openstreetmap.org/wiki/Key:access) or the mode tag (like `foot`) is `no`/`private`/`discouraged`
  - The infrastructure is not sufficient, such as `smoothness=horrible` for `wheelchair`
- Dashed lines are `informal=yes`. Solid lines are `infomal=no` or `informal` not given.
- Purple lines don’t have enough access tags to indicate if the given travel mode is allowed or possible (great mapping opportunities!)

#### Points of interest
Some trail-related POIs are included on the map:
- [`amenity=ranger_station`](https://wiki.openstreetmap.org/wiki/Tag:amenity%3Dranger_station): ranger stations are generally public visitor centers where trail users can get info or seek help
- [`highway=trailhead`](https://wiki.openstreetmap.org/wiki/Tag:highway%3Dtrailhead): trailheads are access points to trail networks, often with various amenities

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
