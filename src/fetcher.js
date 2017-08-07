var BASE_URL = "https://rambo-test.carto.com/api/v2/sql?";
var COUNT_URL = BASE_URL + "q=select count(*) from public.mnmappluto";

var fetchChunks = function (opt, callback) {
    var GEOJSON_URL =
        BASE_URL
        + "format=GeoJSON&q=SELECT the_geom FROM public.mnmappluto LIMIT "
        + opt.chunk_size
        + " OFFSET ";

    function fetch(offset, total, p) {
        if (offset < total) {
            return fetch(offset + opt.chunk_size, total, p.then(function(geoJSON) {
                callback(parseVertices(geoJSON));
                return getJSON(GEOJSON_URL + offset);
            }));
        } else {
            return p.then(function(geoJSON) {
                callback(parseVertices(geoJSON));
            });
        }
    }

    // returns a chain of promises. One for each chunk
    return getJSON(COUNT_URL).then(function(json) {
        var rows_number = json.rows[0].count;
        return fetch(opt.chunk_size, rows_number, getJSON(GEOJSON_URL + 0));
    });
};

// We expect to have a GeoJSON with MultiPolygon features
// Features > MultiPolygon > Polygon > Linear Ring (From outer to inner) > Point
// It returns an array of points some of them duplicated to draw them with GL_LINES.
var parseVertices = function(geoJSON) {
    return geoJSON.features.reduce(function(acc, feature){
        feature.geometry.coordinates.forEach(function(polygon){
            polygon.forEach(function(linear_ring){
                linear_ring.forEach(function(point, idx, lr){
                    acc.push(point[0], point[1]);
                    // if we are not in the first or in the last point
                    // of the Linear Ring, then we duplicate it
                    if (idx !== 0 && idx !== lr.length - 1) {
                        acc.push(point[0], point[1]);
                    }
                });
            });
        });
        return acc;
    }, []);
};

var get = function (url) {
    return new Promise(function(succeed, fail) {
        var req = new XMLHttpRequest();
        req.open("GET", url, true);
        req.addEventListener("load", function() {
            if (req.status < 400)
                succeed(req.responseText);
            else
                fail(new Error("Request failed: " + req.statusText));
        });
        req.addEventListener("error", function() {
            fail(new Error("Network error"));
        });
        req.send(null);
    });
};

var getJSON = function (url) {
    return get(url).then(JSON.parse);
};

module.exports = {
    fetchChunks: fetchChunks,
    getJSON: getJSON, //testing
    parseVertices: parseVertices //testing
};