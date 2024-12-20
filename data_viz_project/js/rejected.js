

function extractCoordinates(coords, minX, maxX, minY, maxY) {
    coords.forEach(coord => {
        if (Array.isArray(coord[0])) {
            // If it's a nested array (MultiPolygon or nested Polygon), recurse
            const [newMinX, newMaxX, newMinY, newMaxY] = extractCoordinates(coord, minX, maxX, minY, maxY);
            minX = newMinX;
            maxX = newMaxX;
            minY = newMinY;
            maxY = newMaxY;
        } else {
            const x = coord[0];
            const y = coord[1];
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }
    });

    return [minX, maxX, minY, maxY];
}

function filterCoordinates(coords, boundbox) {
    minX = boundbox[0];
    maxX = boundbox[1];
    minY = boundbox[2];
    maxY = boundbox[3];
    let keep = true;
    coords.forEach(coord => {
        if (Array.isArray(coord[0])) {
            // If it's a nested array (MultiPolygon or nested Polygon), recurse
            keep =  filterCoordinates(coord, minX, maxX, minY, maxY);
        } else {
            const x = coord[0];
            const y = coord[1];

            //console.log(`${minX} <= ${x} <= ${maxX} && ${minY} <= ${y} <= ${maxY}`);
            //console.log(`${minX} <= ${x} <= ${maxX} && ${minY} <= ${y} <= ${maxY}`);
            keep = (minX <= x && x <= maxX) && (minY <= y && y <= maxY);
        }
    });
    return keep;
}

function filterCoords(coords, boundbox)
{
    if (Array.isArray(coords))
    {
        let filteredCoords = [];

        coords.forEach(coordPotential => {
            //console.log(coordPotential);

            if (Array.isArray(coordPotential) && typeof coordPotential[0] === "number") {
                let [x, y] = coordPotential;

                // Filter based on boundbox: check if the coordinate is within bounds
                if (x >= boundbox[0] && x <= boundbox[1] && y >= boundbox[2] && y <= boundbox[3]) {
                    coordPotential = [x * 1, y ];
                    filteredCoords.push(coordPotential); // Keep it if within bounds
                }
            } else {
                // Recursive call if coordPotential is an array of coordinates
                filteredCoords.push(filterCoords(coordPotential, boundbox));
            }
        });

        if(filteredCoords == []) return;

        return filteredCoords; // Return the filtered array of coordinates
    }

    return coords;
}

function transformData(data) {
    //let dataSublist = data[1];
    //dataSublist.features = dataSublist.features.filter((d) => (countries.includes(d.properties.na)));
    //let featureList = dataSublist.features;
    //const nbFeatures = featureList.length;

    let minX = minY = Infinity;
    let maxX = maxY = -Infinity;
    data[1].features.forEach(feature => {
        const coordinates = feature.geometry.coordinates;
        [minX, maxX, minY, maxY] = extractCoordinates(coordinates, minX, maxX, minY, maxY);
    });
    console.log(`${minX}, ${maxX}, ${minY}, ${maxY}`);

    // TODO: Right now, it's removing everything, not just the limit
    let rightEdge = minX + (maxX - minX)*0.7;
    let bottomEdge = minY + (maxY - minY)*0.12;
    let boundbox = [minX, rightEdge, bottomEdge, maxY];

    data[1].features.forEach(feature => {
        feature.geometry.coordinates = filterCoords(feature.geometry.coordinates, boundbox);
    });
    data[2].features.forEach(feature => {
        feature.geometry.coordinates = filterCoords(feature.geometry.coordinates, boundbox);
    });

    //data[1].features = data[1].features.filter((feature) => (filterCoordinates(feature.geometry.coordinates, minX, leftLimit, downLimit, maxY)));
    //data[2].features = data[2].features.filter((feature) => (filterCoordinates(feature.geometry.coordinates, minX, leftLimit, downLimit, maxY)));

    return data;
}

/**
 * Unused function that calculates the ratio between the width and height of the map.
 * @param {object} data The JSON elements
 */
function calculateRatio(data) {
    let minX = minY = Infinity;
    let maxX = maxY = -Infinity;
    data[1].features.forEach(feature => {
        const coordinates = feature.geometry.coordinates;

        // Function to recursively extract coordinates from nested arrays
        function extractCoordinates(coords) {
            coords.forEach(coord => {
                if (Array.isArray(coord[0])) {
                    // If it's a nested array (MultiPolygon or nested Polygon), recurse
                    extractCoordinates(coord);
                } else {
                    const x = coord[0];
                    const y = coord[1];
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                }
            });
        }
        extractCoordinates(coordinates);
    });
    maxX = minX + (maxX - minX)*0.7;
    minY = minY + (maxY - minY)*0.12;
    
    console.log(minX, " -> ", maxX, "; ", minY, " -> ", maxY);
    console.log((maxY - minY) / (maxX - minX));
    ctx.RATIO = (maxY - minY) / (maxX - minX);
}