The scripts in this directory can be used to generate the hillshade and contour line tilesets used by OpenTrailMap.

The main entrypoint is `generate.sh` which builds all tiles in both tilesets. Edit the variables at the top of this script to change the min and max zoom and the bounding box for which tiles are built.

Internally, `generate.sh` calls `make_tile.py` repeatedly. `make_tile.py` takes a tile ID, fetches the required DEM data for that region, and builds a hillshade tile and contour tile. There are variables at the top of this file that can be changed to configure how tiles are built (e.g. contour intervals and simplification threshold).

DEM data is fetched from Mapzen's global DEM dataset, hosted on AWS. The file `mapzen-dem.wms.xml` describes how to read this dataset in a format that GDAL tools such as `gdalwarp` understand. `make_tile.py` uses this to fetch the DEM data for a single-tile region (plus required buffer) on the fly, and discards the data once it builds the output tiles. This reduces the disk space required to build tiles.

The scripts have the following dependencies:
- gdal
- tippecanoe
- mercantile
- jq
- python

You can install these dependencies yourself, or use the provided Dockerfile to build a container that has them all.

Running `generate.sh` will produce two tilesets in the working directory called `contours` and `hillshade`, which are directory trees. If desired, these directory trees can be converted to MBTiles or PMTiles archives using a variety of tools, but this is not handled automatically by the scripts in this repository.

Tip: building the tiles creates a lot of intermediate artifacts on disk. These are created in temporary directories and automatically cleaned up afterwards. But you can speed up the process significantly by ensuring that they are written to an in-memory 'ramfs' rather than disk. By default tempdirs are created in `/tmp`, but if that directory isn't a ramfs on your machine (e.g. macOS), you can set the `TMPDIR` environment variable to somewhere else before running `generate.sh`, and tempdirs will be created there instead.
