"""
Since my LGBT dataset only includes Europe, and the current map is way too zoomed out, I have to remove the unnecessary points.
Benefits include:
    1) This is hardware intensive to run everytime, so pre-filtering avoids a slow load
    2) I understand python better than javascript, so I can code faster & better understand whatever ChatGPT throws at me
    3) Python is easier to debug and doesn't require me to create a webpage for something that doesn't need one
    4) I can manually parameterize the map limits using a console instead of digging through code
"""

from json import load, dump
import sys

def filter_coordinates_within_range(geojson_file, output_file, lat_range, lon_range):
    # Load the GeoJSON file
    with open(geojson_file, 'r') as file:
        geojson_data = load(file)

    # Create a list to hold the filtered features
    filtered_features = []

    # Iterate through the features in the GeoJSON
    for feature in geojson_data['features']:

        # Because Greenland's in the top-left, and its coords need to be anchored to the borders,
        # Ignore coord-culling for this nation only
        if feature['properties']['id'] == 'GL':
            filtered_features.append(feature)
            break


        # Get the geometry and coordinates
        if 'geometry' in feature and 'coordinates' in feature['geometry']:
            geometry = feature['geometry']
            coordinates = geometry['coordinates']
            
            if geometry['type'] in ['LineString']:
                coordinates = [
                    coord for coord in coordinates if is_within_range(coord, lat_range, lon_range)
                ]
                
            elif geometry['type'] in ['Polygon', 'MultiLineString']:
                # For Polygon: filter each ring of coordinates
                coordinates = [
                    [coord for coord in ring if is_within_range(coord, lat_range, lon_range)]
                    for ring in coordinates
                ]
            elif geometry['type'] in ['MultiPolygon']:
                # For MultiPolygon: filter each ring of each polygon
                newCoords = []
                for polygon in coordinates:
                    potentialNew = [
                        [coord for coord in ring if is_within_range(coord, lat_range, lon_range)]
                        for ring in polygon
                    ]
                    if has_valid_coordinates(potentialNew, 'Polygon'):
                        newCoords.append(potentialNew)
                coordinates = newCoords
            
            if has_valid_coordinates(coordinates, geometry['type']):
                # Only include the feature if it has valid coordinates left
                geometry['coordinates'] = coordinates
                filtered_features.append(feature)

    # Update the GeoJSON object with the filtered features
    geojson_data['features'] = filtered_features

    # Write the modified GeoJSON back to a new file
    with open(output_file, 'w') as file:
        dump(geojson_data, file, indent=4)


def is_within_range(coord, lat_range, lon_range):
    lat, lon = coord
    return lat_range[0] <= lat <= lat_range[1] and lon_range[0] <= lon <= lon_range[1]


def has_valid_coordinates(coordinates, type):
    """ Check if there are any valid coordinates left in the geometry. """
    isEmpty = True

    if type in ['LineString']:
        isEmpty = len(coordinates) == 0
    elif type in ["Polygon", 'MultiLineString']:
        for c in coordinates:
            isEmpty = isEmpty and len(c) == 0
    else:
        for co in coordinates:
            for c in co:
                isEmpty = isEmpty and len(c) == 0
    return not isEmpty

rightX = (float)(sys.argv[1])
leftX = (float)(sys.argv[2])
topY = (float)(sys.argv[3])
bottomY = (float)(sys.argv[4])

minX = 1909262
maxX = 7960335
minX, maxX = minX + (int)((maxX - minX) * rightX), minX + (int)((maxX - minX) * leftX)

maxY = 5855725
minY = 809432
maxY, minY = maxY - (int)((maxY - minY) * topY), maxY - (int)((maxY - minY) * bottomY)
lat_range = (minX, maxX)
lon_range = (minY, maxY)

# Example usage:
geojson_file = '../media/data_backup/countryrgbackup.geojson'
output_file = '../media/data/map/countryrg.geojson'
filter_coordinates_within_range(geojson_file, output_file, lat_range, lon_range)

geojson_file = '../media/data_backup/countrybnbackup.geojson'
output_file = '../media/data/map/countrybn.geojson'
filter_coordinates_within_range(geojson_file, output_file, lat_range, lon_range)

geojson_file = '../media/data_backup/grabackup.geojson'
output_file = '../media/data/map/gra.geojson'
filter_coordinates_within_range(geojson_file, output_file, lat_range, lon_range)
