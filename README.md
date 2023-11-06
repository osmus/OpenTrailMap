# OpenTrailMap

_[opentrailmap.us](https://opentrailmap.us)_

This is a web map application for viewing trail data in OpenStreetMap. The tool supports our [Trails Stewardship Initiative](https://openstreetmap.us/our-work/trails/), a project to improve the quality of trail data in OpenStreetMap.

The tool is still in development and is subject to change. Have ideas? Please open an [issue](https://github.com/osmus/OpenTrailMap/issues) :)

## UI features
- Select between different travel modes (`foot`/`bicycle`/`horse`)
- Hover over features to see trail-related tags
- Click a feature to view or edit it on [openstreetmap.org](https://openstreetmap.org)

## Trails layer
- Trail vector tiles are currently generated courtesy of [@zelonewolf](https://github.com/zelonewolf) using the schema file [here](https://github.com/ZeLonewolf/planetiler-scripts/blob/main/layers/osmus_trails.yml)

### Legend
- Dark green lines are public
- Pale green lines are `access=no`/`private`/`discouraged` for the given travel mode
- Dashed lines are `informal=yes`. Solid lines are `infomal=no` or `informal` not given.
- Orange lines don’t have enough access tags to indicate if the given travel mode is allowed (great mapping opportunities!)
