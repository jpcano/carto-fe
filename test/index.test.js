var expect = require('chai').expect;
var fetcher = require('../src/fetcher');
var getJSON = fetcher.getJSON;
var parseVertices = fetcher.parseVertices;

var GEOJSON_TEST_URL = "https://rambo-test.carto.com/api/v2/sql?format=GeoJSON&q=SELECT the_geom FROM public.mnmappluto LIMIT 1";

// var sinon = require('sinon');
// var FakeXMLHTTPRequests = require('fakexmlhttprequest');

describe('carto-fe', function() {

    describe('fetcher', function () {

        it('should get correctly a geoJSON object', function (done) {
            getJSON(GEOJSON_TEST_URL)
                .then(function (geoJSON) {
                    expect(geoJSON).to.be.an("object");
                    done();
                })
                .catch(function (error) {
                    console.log(error);
                    done();
                });
        });

        it('should parse correctly the vertices in a geoJSON', function (done) {
            getJSON(GEOJSON_TEST_URL)
                .then(function (geoJSON) {
                    var vertices = parseVertices(geoJSON);
                    for(var i = 2; i < vertices.length - 2; i = i + 2) {
                        var last = vertices.slice(i, 2);
                        var first = vertices.slice(i+2, 2);
                        expect(last).to.have.same.members(first);
                    }
                    done();
                })
                .catch(function (error) {
                    console.log(error);
                    done();
                });
        });
    });
});