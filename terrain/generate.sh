#!/bin/bash

# This script generates hillshade and contour line tiles from Mapzen's DEM dataset

### Configuration parameters

SOURCE_DATASET=mapzen-dem.wms.xml
MINZOOM=4
MAXZOOM=12
BOUNDS="[-124.73460, 45.56631, -116.87882, 48.99251]" # US-WA

### GDAL settings (these make fetching and reprojecting data faster)

export GDAL_CACHEMAX=1024
export GDAL_MAX_CONNECTIONS=8 # make GDAL use more parallelism when fetching (default is 2)

for zoom in $(seq $MINZOOM $MAXZOOM); do
  echo $BOUNDS \
  | mercantile tiles $zoom \
  | jq -r '[.[2], .[0], .[1]] | join(" ")' \
  | xargs --verbose -d '\n' -n 1 -P 16 sh -c "python make_tile.py $SOURCE_DATASET \$0 >/dev/null 2>&1"
done

