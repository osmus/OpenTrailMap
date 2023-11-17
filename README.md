# OpenTrailMap

_[opentrailmap.us](https://opentrailmap.us)_

This is a web map application for viewing [OpenStreetMap](https://openstreetmap.org/about) trail data. The tool supports our [Trails Stewardship Initiative](https://openstreetmap.us/our-work/trails/), a community project to improve the quality of trail data in OpenStreetMap. The tool is still in early development, so now is a great time to get involved!

## UI features
- Select between different travel modes ([`foot`](https://wiki.openstreetmap.org/wiki/Key:foot)/[`wheelchair`](https://wiki.openstreetmap.org/wiki/Key:wheelchair)/[`bicycle`](https://wiki.openstreetmap.org/wiki/Key:bicycle)/[`horse`](https://wiki.openstreetmap.org/wiki/Key:horse)/[`atv`](https://wiki.openstreetmap.org/wiki/Key:atv)).
- Click a feature to view its current tags and metadata.
- Use quick links to open the feature on [openstreetmap.org](https://openstreetmap.org), iD, JOSM, and other viewers.

## Trails layer
Trail vector tiles are currently generated courtesy of [@zelonewolf](https://github.com/zelonewolf) using the schema file [here](https://github.com/ZeLonewolf/planetiler-scripts/blob/main/layers/osmus_trails.yml). Tiles are currently updated manually. This will be automated in the future with target update frequency of <24 hours.

### Legend
- Dark green lines are public paths.
- Pale green lines indicate the given travel mode is not allowed or not possible. There are a few factors:
  - [`access`](https://wiki.openstreetmap.org/wiki/Key:access) or the mode tag (like `foot`) is `no`/`private`/`discouraged`
  - The infrastructure is not sufficient, such as `smoothness=horrible` for `wheelchair`
- Dashed lines are `informal=yes`. Solid lines are `infomal=no` or `informal` not given.
- Purple lines don’t have enough access tags to indicate if the given travel mode is allowed or possible (great mapping opportunities!)

### Points of interest
Some trail-related POIs are included on the map:
- [`amenity=ranger_station`](https://wiki.openstreetmap.org/wiki/Tag:amenity%3Dranger_station): ranger stations are generally public visitor centers where trail users can get info or seek help
- [`highway=trailhead`](https://wiki.openstreetmap.org/wiki/Tag:highway%3Dtrailhead): trailheads are access points to trail networks, often with various amenities

## Get involved
- Join the [#opentrailmap](https://osmus.slack.com/archives/opentrailmap) channel on [OpenStreetMap US Slack](https://openstreetmap.us/slack).
- Browse or open an [issue](https://github.com/osmus/OpenTrailMap/issues) or [pull request](https://github.com/osmus/OpenTrailMap/pulls).

### Development setup
1. [Clone the repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository)
2. Open your terminal and `cd` into the repo's directory
3. Run `node serve.js` to start the development server
4. Visit [http://localhost:4001](http://localhost:4001) in your browser
5. That's it!

OpenTrailMap currently has no package dependencies.

### Code of Conduct

Participation in OpenTrailMap is subject to the [OpenStreetMap US Code of Conduct](https://wiki.openstreetmap.org/wiki/Foundation/Local_Chapters/United_States/Code_of_Conduct_Committee/OSM_US_Code_of_Conduct). Please take a moment to review the CoC prior to contributing, and remember to be nice :)

## License

The OpenTrailMap source code is distributed under the [MIT license](https://github.com/osmus/OpenTrailMap/blob/main/LICENSE). Dependencies are subject to their respective licenses.
