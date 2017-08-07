var Render = require("./render");
var fetchChunks = require("./fetcher").fetchChunks;
require('jquery-mousewheel');

var manhattan = function(el, opt) {
    if (typeof el === 'string') {
        var canvas = document.getElementById(el);
    }

    if (!el) {
        throw new TypeError('a valid canvas id must be provided');
    }

    var render_opt = {
        zoom_step: opt.zoom_step || 4,
        scale_factor_y: opt.scale_factor_y || 1.305407,
        scale: opt.initial_scale || [30.0, 30.0],
        translation: opt.translation || [74.000118, -40.722933]
    };

    var fetcher_opt = {
        chunk_size: opt.chunk_size || 5000
    };

    var c = new Render(canvas, render_opt);
    addEventListeners(canvas, c);
    return fetchChunks(fetcher_opt, function(vertices){
        c.drawVertices(vertices);
    });
};

function addEventListeners(el, render) {

    // Pan

    var clicking = false;

    $(el).mousedown(function(e){
        preX = e.pageX;
        preY = e.pageY;
        clicking = true;
    });

    $(el).mouseup(function(e){
        clicking = false;
    });

    $(el).mousemove(function(e){
        if(clicking === false) return;
        actualX = e.pageX;
        actualY = e.pageY;
        render.pan(preX, preY, actualX, actualY);
        preX = actualX;
        preY = actualY;
    });

    // Zoom

    $(el).mousewheel(function(e) {
        render.zoom(e.pageX, e.pageY, -e.deltaY);
    });

    // Resize

    $(window).resize(function(e) {
        render.draw();
    });
}

//
// - Event listeners without JQuery -
// Mouse wheel probably has some cross-browser compatibility issues.
// That is why I use JQuery.
//
// function addEventListeners() {
//
//     // Pan
//     var preX, preY;
//     var actualX, actualY;
//     var down;
//
//     canvas.addEventListener("mousedown", function (e) {
//         preX = e.clientX;
//         preY = e.clientY;
//         down = true;
//     });
//
//     canvas.addEventListener("mouseup", function (e) {
//         down = false;
//     });
//
//     canvas.addEventListener("mousemove", function (e) {
//         if (down) {
//             actualX = e.clientX;
//             actualY = e.clientY;
//             c.pan(preX, preY, actualX, actualY);
//             preX = actualX;
//             preY = actualY;
//         }
//     });
//
//     // Zoom
//     canvas.addEventListener("wheel", function (e) {
//         c.zoom(e.clientX, e.clientY, e.deltaY);
//     });
//
//     // Resize window
//     window.onresize = function () {
//         c.draw();
//     }
// }

module.exports = manhattan;