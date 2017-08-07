var mat4 = require('gl-matrix-mat4');

// expects a canvas element
var Render = function(canvas_el, opt) {
    this.zoom_step = opt.zoom_step;
    this.scale_factor_y = opt.scale_factor_y;
    this.scale = opt.scale;
    this.translation = opt.translation;
    this.gl = null;
    this.shaderProgram = null;
    this.vertices = [];
    this._initGL(canvas_el);
    this._createShaders();
    this._assignShaderVariables();
};

Render.prototype._initGL = function(canvas_el) {
    this.gl = canvas_el.getContext("webgl");
    this.gl.clearColor(1, 1, 1, 1);
};

Render.prototype._createShaders = function() {
    var vertexShader = this._getShader(this.gl, "shader-vs");
    var fragmentShader = this._getShader(this.gl, "shader-fs");

    this.shaderProgram = this.gl.createProgram();
    this.gl.attachShader(this.shaderProgram, vertexShader);
    this.gl.attachShader(this.shaderProgram, fragmentShader);
    this.gl.linkProgram(this.shaderProgram);
    this.gl.useProgram(this.shaderProgram);
};

Render.prototype._assignShaderVariables = function() {
    var color = this.gl.getUniformLocation(this.shaderProgram, "color");
    this.gl.uniform4f(color, 0, 0, 0, 1);
    var pointSize = this.gl.getAttribLocation(this.shaderProgram, "pointSize");
    this.gl.vertexAttrib1f(pointSize, 10);
};

function map(value, minSrc, maxSrc, minDst, maxDst) {
    return (value - minSrc) / (maxSrc - minSrc) * (maxDst - minDst) + minDst;
}

// html canvas has the origin in the upper left corner
// the down right corner is at (canvas width, canvas height)
// webgl has the origin in the center of the canvas
// x and y coordinates go from -1 to 1

// x is the X coordinate on a html canvas.
// It returns the x coordinate in a webGL canvas.
function mapX(x, canvas_width) {
    return map(x, 0, canvas_width, -1, 1);
}
// y is the Y coordinate on a html canvas.
// It returns the y coordinate in a webGL canvas.
function mapY(y, canvas_height) {
    return map(y, 0, canvas_height, 1, -1);
}

// Panning from (preX, preY) to (actualX, actualY)
// and redraw it
Render.prototype.pan = function(preX, preY, actualX, actualY) {
    preX = mapX(preX, this.gl.canvas.width);
    preY = mapY(preY, this.gl.canvas.height);
    actualX = mapX(actualX, this.gl.canvas.width);
    actualY = mapY(actualY, this.gl.canvas.height);
    var dX = this.translation[0] - (preX - actualX) / this.scale[0];
    var dY = this.translation[1] - (preY - actualY) / this.scale[1];
    this._translate(dX, dY);
};

// Zooming at panning at position (mouseX and mouseY)
// deltaY is positive if zooming out or negative if zooming in
Render.prototype.zoom = function(mouseX, mouseY, deltaY){
    mouseX = mapX(mouseX, this.gl.canvas.width);
    mouseY = mapY(mouseY, this.gl.canvas.height);

    // calculate the translation so the zoom can follow the
    // mouse position
    var trans_scaleX = mouseX / this.scale[0];
    var trans_scaleY = mouseY / this.scale[1];

    if (deltaY < 0) { // zoom in
        this._scale(this.zoom_step);
    } else { // zoom out
        if (this.scale[0] - this.zoom_step > 0) {
            this._scale(-this.zoom_step);
        } else { // do not zoom out too much
            return;
        }
    }

    trans_scaleX -= mouseX / this.scale[0];
    trans_scaleY -= mouseY / this.scale[1];

    var dX = this.translation[0] - trans_scaleX;
    var dY = this.translation[1] - trans_scaleY;
    this._translate(dX, dY);
};

// Draw `vertices` without cleaning the buffer.
Render.prototype.drawVertices = function(vertices) {
    this.vertices = this.vertices.concat(vertices);

    var coords = this.gl.getAttribLocation(this.shaderProgram, "coords");

    var buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices),
        this.gl.STATIC_DRAW);
    this.gl.vertexAttribPointer(coords, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(coords);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    this.draw(true);
};

// translate to position (x, y)
// and draw it
Render.prototype._translate = function(x, y) {
    this.translation = [x, y];
    this.draw();
};

// apply a scale with factor
// and draw it
Render.prototype._scale = function (factor) {
    var y_correction = this.scale[1] / this.scale[0];
    this.scale = [
        this.scale[0] + factor,
        this.scale[1] + factor * y_correction
    ];
    this.draw();
};

// Match the canvas dimensons with CSS dimensions
// and set the scale tranform to fix the aspect ratio of the canvas
Render.prototype._resize = function () {
    // Lookup the size the browser is displaying the canvas.
    var displayWidth  = this.gl.canvas.clientWidth;
    var displayHeight = this.gl.canvas.clientHeight;

    // Check if the canvas is not the same size.
    if (this.gl.canvas.width  !== displayWidth ||
        this.gl.canvas.height !== displayHeight) {

        // Make the canvas the same size
        this.gl.canvas.width  = displayWidth;
        this.gl.canvas.height = displayHeight;
    }
    this.scale[1] = this.scale[0] *
        (this.gl.canvas.width / this.gl.canvas.height) * this.scale_factor_y;
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this._setTransform(this.scale, this.translation);
};

// Set the translate and scale transform with `scale` and `translation` respectively
Render.prototype._setTransform = function(scale, translation) {
    var matrix = mat4.create();
    mat4.scale(matrix, matrix, [scale[0], scale[1], 0]);
    mat4.translate(matrix, matrix, [translation[0], translation[1], 0]);
    var transformMatrix = this.gl.getUniformLocation(this.shaderProgram, "transformMatrix");
    this.gl.uniformMatrix4fv(transformMatrix, false, matrix);
    this.scale = scale;
    this.translation = translation;
};

// Draw the buffer as GL_LINES. If no_clear is true, we don't clear the buffer
Render.prototype.draw = function(no_clear) {
    this._resize();
    if (no_clear !== true) {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }
    this.gl.drawArrays(this.gl.LINES, 0, this.vertices.length / 2);
};

// Get shader code from html script with and id: `id`
Render.prototype._getShader = function (gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var theSource = "";
    var currentChild = shaderScript.firstChild;

    while (currentChild) {
        if (currentChild.nodeType === 3) {
            theSource += currentChild.textContent;
        }
        currentChild = currentChild.nextSibling;
    }

    var shader;

    if (shaderScript.type === "x-shader/x-fragment") {
        shader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    } else if (shaderScript.type === "x-shader/x-vertex") {
        shader = this.gl.createShader(this.gl.VERTEX_SHADER);
    } else {
        return null;  // Unknown shader type
    }

    this.gl.shaderSource(shader, theSource);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
        alert("An error occurred compiling the shaders: " +
            this.gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
};

module.exports = Render;