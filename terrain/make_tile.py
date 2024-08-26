"""
Handles building a contour and hillshade tile for a single Z/X/Y tile ID.

Usage: python make_tile.py SOURCE_DEM Z X Y
"""

import json
import os
import sys
import tempfile
import subprocess
import shutil

# non-stdlib dependencies
import mercantile

# buffer controls how much margin around the tile region will be added when fetching
# DEM data. a one-pixel margin is required for hillshades to avoid edge artifacts.
# this margin also affects how far the contour line vectors extend beyond the edges
# of the MVT tile. having a bit of margin here helps avoid both rendering artifacts
# and issues where line simplification causes contour lines to be disconnected at
# tile boundaries
BUFFER = 0.01

# controls the width/height of the hillshade tiles. also affects the size of DEM
# data that is fetched to build the tile. these could be decoupled but in practice
# it makes sense to have them be the same (there's no reason to fetch more pixels of
# DEM data, it doesn't improve the hillshade or contour line quality).
RESOLUTION = 512

# controls compression of hillshade JPEG images; 0-100, higher means bigger filesize
# but fewer artifacts in the images.
JPEG_QUALITY = 75

# sets the contour interval for each zoom level.
# only zoom levels in this dict will have contour tiles built! if make_tile.py is
# called with a zoom level that's not in this dict, it will only build a hillshade
# tile (useful for low zooms where contours aren't needed).
CONTOUR_INTERVALS = {
    # zoom level : (major, minor) contour interval
    8: (4000, 800),
    9: (2000, 400),
    10: (2000, 400),
    11: (800, 160),
    12: (800, 160),
}

SIMPLIFICATION_TOLERANCE = 3

# Read CLI args
source_dem = os.path.abspath(sys.argv[1])
z, x, y = [int(v) for v in sys.argv[2:]]

# Compute both an exact bbox and buffered bbox for the given tile (in EPSG:3857)
bounds = mercantile.xy_bounds(x, y, z)
size = abs(bounds[2] - bounds[0])
shift = size * BUFFER
buffered_bounds = mercantile.Bbox(bounds.left - shift, bounds.bottom - shift, bounds.right + shift, bounds.top + shift)
buffered_resolution = round(RESOLUTION * (1.0 + BUFFER))

def run(argv, *args, **kwargs):
    """Wrapper around subprocess.run() which prints its arguments first"""
    print(" ".join(argv), file=sys.stderr)
    return subprocess.run(argv, *args, **kwargs)

# Make a temporary directory in which all intermediate files are placed.
# It'll be deleted when the `with` block closes, so be sure to move final
# artifacts out first.
with tempfile.TemporaryDirectory() as tmpdir:
    old_cwd = os.getcwd()
    os.chdir(tmpdir)
    print(tmpdir)

    ### Build the hillshade raster tile ###
    
    # fetch the DEM data for the tile
    run([
        "gdalwarp",
        "-te_srs", "EPSG:3857", "-te", *[str(v) for v in buffered_bounds],
        "-ts", str(buffered_resolution), str(buffered_resolution),
        "-r", "cubic",
        "-overwrite", source_dem, "dem.tif"
     ])
   
    # create a hillshade from the fetched data
    run(["gdaldem", "hillshade", "-igor", "dem.tif", "hillshade.tif"])
    
    # trim the margin from the hillshade tile and convert to JPEG
    run([
        "gdalwarp",
        "-te_srs", "EPSG:3857", "-te", *[str(v) for v in bounds],
        "-ts", str(RESOLUTION), str(RESOLUTION),
        "-r", "cubic",
        "-co", f"JPEG_QUALITY={JPEG_QUALITY}",
        "hillshade.tif", "hillshade.jpg"
    ])
    
    # put the hillshade tile in the output directory
    os.makedirs(os.path.join(old_cwd, "hillshade", str(z), str(x)), exist_ok=True)
    shutil.move("hillshade.jpg", os.path.join(old_cwd, "hillshade", str(z), str(x), str(y) + ".jpg"))
    
    ### Build the contour vector tile ###

    if z in CONTOUR_INTERVALS:
        major_interval, minor_interval = CONTOUR_INTERVALS[z]

        # create a version of the DEM in WGS 84 (EPGS:4326)
        # note: this needs to be real, not a VRT, because gdal_contour doesn't
        # understand scale factors in VRT datasets.
        run(["gdalwarp", "-t_srs", "EPSG:4326", "-r", "cubic", "dem.tif", "dem.4326.vrt"])

        # input DEM is in meters but we need feet, so apply a scale factor
        run(["gdal_translate", "-scale", *[str(v) for v in [0, 0.3048, 0, 1]], "dem.4326.vrt", "dem.4326.ft.tif"])

        # compute the contours
        run(["gdal_contour", "-a", "ele", "-i", str(minor_interval), "dem.4326.ft.tif", "contours-raw.geojson"])
        # add 'idx' bool property and filter out contours at or below sea level
        res = run([
            "jq", "-c",
            f"(.features[].properties |= (.idx = (fmod(.ele; {major_interval}) == 0))) | .features[] |= select(.properties.ele > 0)",
            "contours-raw.geojson",
        ], capture_output=True)
        # jq can only write to stdout, so manually write its output to a file
        with open("contours.geojson", "wb") as f:
            f.write(res.stdout)

        simplification_tolerance = 1 if z == max(CONTOUR_INTERVALS.keys()) else SIMPLIFICATION_TOLERANCE
        run([
            "tippecanoe",
            "-e", "contours", # output directory name
            "-l", "contours", # layer name in encoded MVT
            "--minimum-zoom", str(z), "--maximum-zoom", str(z),
            "--buffer", "1", # units are "screen pixels" i.e. 1/256 of tile width
            "--simplification", str(simplification_tolerance),
            "-y", "ele", "-y", "idx", # include only these two attributes
            "--no-tile-compression",
            "contours.geojson"
        ])

        # put the contour tile in the output directory
        os.makedirs(os.path.join(old_cwd, "contours", str(z), str(x)), exist_ok=True)
        shutil.move(
            os.path.join("contours", str(z), str(x), str(y) + ".pbf"),
            os.path.join(old_cwd, "contours", str(z), str(x), str(y) + ".mvt"),
        )

