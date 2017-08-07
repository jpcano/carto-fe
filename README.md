# carto-fe

[![Travis](https://img.shields.io/travis/jpcano/carto-fe.svg)](https://travis-ci.org/jpcano/carto-fe)

My solution to [Carto FE Test 1](CHALLENGE.md). There is a demo [here](http://jesus.engineer/carto-fe1).

## How to build

- Install [Node.js](http://nodejs.org/download/) (I tested it in node v6 and v7)
- Install Node.js dependencies: `npm install`.
- Build the app: `npm build`.
- Open the example in a browser: `examples/index.html`.

## How to test

- A battery of Karma unit tests can be started with: `npm test`.

## How to use

The manhattan function renders the map on the canvas ID passed as the first argument.

 ```html

       <script type="text/javascript" src="../dist/manhattan.js"></script>

       <script>
           function main() {
               manhattan("canvas", {}).then(function(){

               }).catch(function(error) {
                   console.log(error);
               });
           }
           window.onload = main;
       </script>
 ```

The second argument in manhattan function is the options. All options have a default value and are optional:

```javascript
       {

         // The number of rows to request to the server each time
         // DEFAULT: 5000
         chunk_size: 10000

         // The zoom step for the mouse wheel
         // DEFAULT: 4
         zoom_step: 5,

         // This is the correction to render the points expressed in geographical
         // coordinates in a cartesian plane. You can use 1 / cos(lat) as an aproximation
         // DEFAULT: 1.305407 (For Manhattan)
         scale_factor_y: 1.6,

         // The default zoom for the X and Y axis
         // DEFAULT: [30.0, 30.0]
         scale: [20.0, 20.0],

         // The dafault tranlation for the X and Y axis
         // DEFAULT: [74.000118, -40.722933]
         translation: [75.00, -40.4]
       }
  ```



## Decisions taken

### Loading time

Fetching the whole geoJSON takes a lot of time using a low speed internet connection (it is ~10 MB). To improve the user experience in this scenario, we request small chunks of 5000 rows from the server and it renders them on the fly.

Also, to improve the loading time I used the minimum number of dependencies. Just JQuery for better cross browser compatibility for event handling but a version without JQuery is also developed (it is commented on the code).

### Rendering time

From the three rendering options I considered (SVG, HTML 5 Canvas and WebGL). I chose WebGL to improve the rendering time.

The key factor for this decision is the zooming and panning actions which can be be benefited from the WebGL speed for matrix computations.

## Issues

### Mercator projection

I have use the scale factor `1 / cos(latitude)` to render the points in geographical coordinates on a cartesian plane. It is not the most accurate scale factor but I think it works reasonably well on Manhattan because the distances in the island are small and it is not located at very low or high latitudes.

### Precision

When zooming very deep there are issues with the precision of how points are drawn.

### Canvas testing

Karma test all the functions in the fetcher module and if the geoJSON is correctly parsed to draw it as GL_LINES.
I did not test if the map is drawn correctly and responds to mouse actions. But it is something interesting to implement in the future.