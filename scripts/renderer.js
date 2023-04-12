const LEFT = 32; // binary 100000
const RIGHT = 16; // binary 010000
const BOTTOM = 8;  // binary 001000
const TOP = 4;  // binary 000100
const FAR = 2;  // binary 000010
const NEAR = 1;  // binary 000001
const FLOAT_EPSILON = 0.000001;

// eslint-disable-next-line no-redeclare, no-unused-vars
class Renderer {
    // canvas:              object ({id: __, width: __, height: __})
    // scene:               object (...see description on Canvas)
    constructor(canvas, scene) {
        this.canvas = document.getElementById(canvas.id);
        this.canvas.width = canvas.width;
        this.canvas.height = canvas.height;
        this.ctx = this.canvas.getContext('2d');
        this.scene = this.processScene(scene);
        this.enable_animation = true;  // <-- disabled for easier debugging; enable for animation
        this.start_time = null;
        this.prev_time = null;
    }

    worldToLocal(point) {
        let prp = this.scene.view.prp;
        let srp = this.scene.view.srp;
        let vup = this.scene.view.vup;
        let translateMatrix = new Matrix(4, 4);
        mat4x4Translate(translateMatrix, -prp.x, -prp.y, -prp.z);
        point = Vector4(point.x, point.y, point.z, 1);
        let VRCRotateMatrix = VRCmatrix(prp, srp, vup).inverse();
        let vec4Point = Matrix.multiply([VRCRotateMatrix, translateMatrix, point]);
        return new Vector3(vec4Point.x, vec4Point.y, vec4Point.z);
    }

    localToWorld(point) {
        let prp = this.scene.view.prp;
        let srp = this.scene.view.srp;
        let vup = this.scene.view.vup;
        let translateMatrix = new Matrix(4, 4);
        mat4x4Translate(translateMatrix, prp.x, prp.y, prp.z);
        point = Vector4(point.x, point.y, point.z, 1);
        let VRCRotateMatrix = VRCmatrix(prp, srp, vup);
        let vec4Point = Matrix.multiply([translateMatrix, VRCRotateMatrix, point]);
        return new Vector3(vec4Point.x, vec4Point.y, vec4Point.z);
    }

    //
    updateTransforms(time, delta_time) {
        this.scene.models.forEach(model => {

            let xSpeed = 0;
            let ySpeed = 0;
            let zSpeed = 0;
            if (model.animation != null) {
                if (model.animation.axis === 'x') {
                    xSpeed = model.animation.rps;
                }
                if (model.animation.axis === 'y') {
                    ySpeed = model.animation.rps;
                }
                if (model.animation.axis === 'z') {
                    zSpeed = model.animation.rps;
                }
            }
            let rotateY = new Matrix(4, 4);
            mat4x4RotateY(rotateY, ySpeed * (delta_time / 1000));
            let rotateZ = new Matrix(4, 4);
            mat4x4RotateZ(rotateZ, zSpeed * (delta_time / 1000));
            let rotateX = new Matrix(4, 4);
            mat4x4RotateX(rotateX, xSpeed * (delta_time / 1000));
            let avg = Vector4(0, 0, 0, 0);
            let vertexAmt = model.vertices.length;
            model.vertices.forEach(vertex => {
                avg = avg.add(vertex);
            });
            avg.x = avg.x / vertexAmt;
            avg.y = avg.y / vertexAmt;
            avg.z = avg.z / vertexAmt;
            avg.w = 1;
            let toOrigin = new Matrix(4, 4);
            mat4x4Translate(toOrigin, -avg.x, -avg.y, -avg.z);
            let fromOrigin = new Matrix(4, 4);
            mat4x4Translate(fromOrigin, avg.x, avg.y, avg.z);
            for (let i = 0; i < model.vertices.length; i++) {
                model.vertices[i] = Matrix.multiply([fromOrigin, rotateZ, rotateX, rotateY, toOrigin, model.vertices[i]]);
                model.vertices[i] = new Vector4(model.vertices[i].x, model.vertices[i].y, model.vertices[i].z, 1);
            }
        });
        this.draw();
    }


    //
    rotateLeft() {
        let local = this.worldToLocal(this.scene.view.srp);
        let rotateMatrix = new Matrix(4, 4);
        mat4x4RotateY(rotateMatrix, -0.1);
        let point = Vector4(local.x, local.y, local.z, 1);
        point = Matrix.multiply([rotateMatrix, point]);
        point = new Vector3(point.x, point.y, point.z);
        let newSRP = this.localToWorld(point);
        this.scene.view.srp = newSRP;
        this.draw();
    }

    //
    rotateRight() {
        let local = this.worldToLocal(this.scene.view.srp);
        let rotateMatrix = new Matrix(4, 4);
        mat4x4RotateY(rotateMatrix, 0.1);
        let point = Vector4(local.x, local.y, local.z, 1);
        point = Matrix.multiply([rotateMatrix, point]);
        point = new Vector3(point.x, point.y, point.z);
        let newSRP = this.localToWorld(point);
        this.scene.view.srp = newSRP;

        console.log("test")
        console.log(this.worldToLocal(this.scene.view.srp));

        this.draw();
    }

    logVector() {
        print()
    }

    //
    moveLeft() {

        let local = this.worldToLocal(this.scene.view.prp);
        local.z += 1;
        let newPRP = this.localToWorld(local);

        local = this.worldToLocal(this.scene.view.srp);
        local.z += 1;
        let newSRP = this.localToWorld(local);

        this.scene.view.prp = newPRP;
        this.scene.view.srp = newSRP;
        this.draw();
    }

    //
    moveRight() {
        let local = this.worldToLocal(this.scene.view.prp);
        local.z -= 1;
        let newPRP = this.localToWorld(local);

        local = this.worldToLocal(this.scene.view.srp);
        local.z -= 1;
        let newSRP = this.localToWorld(local);

        this.scene.view.prp = newPRP;
        this.scene.view.srp = newSRP;
        this.draw();
    }

    //
    moveBackward() {
        let local = this.worldToLocal(this.scene.view.prp);
        local.x += 1;
        let newPRP = this.localToWorld(local);

        local = this.worldToLocal(this.scene.view.srp);
        local.x += 1;
        let newSRP = this.localToWorld(local);

        this.scene.view.prp = newPRP;
        this.scene.view.srp = newSRP;
        this.draw();
    }

    //
    moveForward() {
        let local = this.worldToLocal(this.scene.view.prp);
        local.x -= 1;
        let newPRP = this.localToWorld(local);

        local = this.worldToLocal(this.scene.view.srp);
        local.x -= 1;
        let newSRP = this.localToWorld(local);

        this.scene.view.prp = newPRP;
        this.scene.view.srp = newSRP;
        this.draw();
    }

    //
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        //this.drawLine(0, 0, 100, 100);
        //console.log('draw()');
        //console.log(this.scene)

        // TODO: implement drawing here!
        // For each model
        //   * For each vertex
        //     * transform endpoints to canonical view volume
        //   * For each line segment in each edge
        //     * clip in 3D
        //     * project to 2D
        //     * translate/scale to viewport (i.e. window)
        //     * draw line
        let transform = mat4x4Perspective(this.scene.view.prp, this.scene.view.srp, this.scene.view.vup, this.scene.view.clip);
        let clip = this.scene.view.clip;
        let left = clip[0];
        let right = clip[1];
        let bottom = clip[2];
        let top = clip[3];
        let near = clip[4];
        let far = clip[5];
        for (let i = 0; i < this.scene.models.length; i++) {
            const model = this.scene.models[i];
            let transformedVerticies = Array(model.vertices.length);
            for (let j = 0; j < model.vertices.length; j++) {
                transformedVerticies[j] = (
                    Matrix.multiply(
                        [
                            transform,
                            model.vertices[j]
                        ]
                    )
                );
            }
            let clippedEdges = this.clipTransformedLines(model, transformedVerticies);
            clippedEdges.forEach(edge => {
                let pt0 = Matrix.multiply([
                    mat4x4Viewport(this.canvas.width, this.canvas.height),
                    mat4x4MPer(),
                    edge.pt0
                ]);
                let pt1 = Matrix.multiply([
                    mat4x4Viewport(this.canvas.width, this.canvas.height),
                    mat4x4MPer(),
                    edge.pt1
                ]);
                this.drawLine(
                    parseInt(pt0.x / pt0.w),
                    parseInt(pt0.y / pt0.w),
                    parseInt(pt1.x / pt1.w),
                    parseInt(pt1.y / pt1.w)
                );
            });
            /*
            for (let j = 0; j < transformedVerticies.length; j++) {
                transformedVerticies[j] = Matrix.multiply([mat4x4Viewport(this.canvas.width, this.canvas.height),   mat4x4MPer(), transformedVerticies[j]]);
            }
            for (let j = 0; j < model.edges.length; j++) {
                const edges = model.edges[j]
                for (let k = 0; k < edges.length - 1; k++) {
                    let x1 = transformedVerticies[edges[k]].x / transformedVerticies[edges[k]].w;
                    let x2 = transformedVerticies[edges[k + 1]].x / transformedVerticies[edges[k + 1]].w;
                    let y1 = transformedVerticies[edges[k]].y / transformedVerticies[edges[k]].w;
                    let y2 = transformedVerticies[edges[k + 1]].y / transformedVerticies[edges[k + 1]].w;
                    this.drawLine(parseInt(x1), parseInt(y1), parseInt(x2), parseInt(y2));
                }
            }
            */
        }
    }

    // Get outcode for a vertex
    // vertex:       Vector4 (transformed vertex in homogeneous coordinates)
    // z_min:        float (near clipping plane in canonical view volume)
    outcodePerspective(vertex, z_min) {
        let outcode = 0;
        if (vertex.x < (vertex.z - FLOAT_EPSILON)) {
            outcode += LEFT;
        }
        else if (vertex.x > (-vertex.z + FLOAT_EPSILON)) {
            outcode += RIGHT;
        }
        if (vertex.y < (vertex.z - FLOAT_EPSILON)) {
            outcode += BOTTOM;
        }
        else if (vertex.y > (-vertex.z + FLOAT_EPSILON)) {
            outcode += TOP;
        }
        if (vertex.z < (-1.0 - FLOAT_EPSILON)) {
            outcode += FAR;
        }
        else if (vertex.z > (z_min + FLOAT_EPSILON)) {
            outcode += NEAR;
        }
        return outcode;
    }

    clipTransformedLines(model, transformedVerticies) {
        let clippedEdges = []
        for (let i = 0; i < transformedVerticies.length; i++) {
            for (let j = 0; j < model.edges.length; j++) {
                const edges = model.edges[j]
                for (let k = 0; k < edges.length - 1; k++) {
                    let vertex1 = transformedVerticies[edges[k]];
                    vertex1 = new Vector4(vertex1.x, vertex1.y, vertex1.z, vertex1.w);
                    let vertex2 = transformedVerticies[edges[k + 1]];
                    vertex2 = new Vector4(vertex2.x, vertex2.y, vertex2.z, vertex2.w);
                    let result = this.clipLinePerspective({ pt0: vertex1, pt1: vertex2 }, this.scene.view.clip[4]);
                    if(result == null){ 
                        continue;
                    }
                    result = this.clipLinePerspective({ pt0: result.pt1, pt1: result.pt0 }, this.scene.view.clip[4]);
                    if (result != null) {
                        clippedEdges.push(result);
                    }
                }
            }
        }
        return clippedEdges;
    }

    // Clip line - should either return a new line (with two endpoints inside view volume)
    //             or null (if line is completely outside view volume)
    // line:         object {pt0: Vector4, pt1: Vector4}
    // z_min:        float (near clipping plane in canonical view volume)
    clipLinePerspective(line, z_min) {
        let result = { pt0: null, pt1: null };
        let p0 = Vector4(line.pt0.x, line.pt0.y, line.pt0.z, 1);
        let p1 = Vector4(line.pt1.x, line.pt1.y, line.pt1.z, 1);
        let delta = p1.subtract(p0);
        let rawOutcode0 = this.outcodePerspective(p0, z_min);
        let rawOutcode1 = this.outcodePerspective(p1, z_min);

        let out0 = this.getOutcodeArray(rawOutcode0);
        let out1 = this.getOutcodeArray(rawOutcode1);
        //console.log(out0);
        //console.log(out1);

        if ((rawOutcode0 | rawOutcode1) === 0) {
            result.pt0 = new Vector4(p0.x, p0.y, p0.z, 1);
            result.pt1 = new Vector4(p1.x, p1.y, p1.z, 1);
            return result;
        }

        if ((rawOutcode0 & rawOutcode1) !== 0) {
            return null;
        }
        let newx = p0.x;
        let newy = p0.y;
        let newz = p0.z;
        let t = 0;
        while (t != 0) {
            t = 0;
            if (out0.left) {
                t = (-p0.x + p0.z) / (delta.x - delta.z);
            }
            else if (out0.right) {
                t = (p0.x + p0.z) / (-delta.x - delta.z);
            }
            else if (out0.bottom) {
                t = (-p0.y + p0.z) / (delta.y - delta.z)
            }
            else if (out0.top) {
                t = (p0.y + p0.z) / (-delta.y - delta.z)
            }
            else if (out0.near) {
                t = (p0.z - z_min) / -delta.z
            }
            else if (out0.far) {
                t = (-p0.z - 1) / delta.z
            }
            let x = p0.x + (t * delta.x);
            newx = x;
            let y = p0.y + (t * delta.y);
            newy = y;
            let z = p0.z + (t * delta.z);
            newz = z;
        }
        p0.x = newx;
        p0.y = newy;
        p0.z = newz;

        // TODO: implement clipping here!
        result.pt0 = new Vector4(p0.x, p0.y, p0.z, 1);
        result.pt1 = new Vector4(p1.x, p1.y, p1.z, 1);
        return result;
    }

    getOutcodeArray(outcode) {
        for (outcode = outcode.toString(2); outcode.length < 6; outcode = "0" + outcode);
        let outcodes = Array(6);
        for (let i = 0; i < 6; i++) {
            outcodes[i] = outcode[i] == "1" ? true : false;
        }
        let outcodeObj = {
            left: outcodes[0],
            right: outcodes[1],
            bottom: outcodes[2],
            top: outcodes[3],
            far: outcodes[4],
            near: outcodes[5],

        };
        return outcodeObj;
    }

    //
    animate(timestamp) {
        // Get time and delta time for animation
        if (this.start_time === null) {
            this.start_time = timestamp;
            this.prev_time = timestamp;
        }
        let time = timestamp - this.start_time;
        let delta_time = timestamp - this.prev_time;

        // Update transforms for animation
        this.updateTransforms(time, delta_time);

        // Draw slide
        this.draw();

        // Invoke call for next frame in animation
        if (this.enable_animation) {
            window.requestAnimationFrame((ts) => {
                this.animate(ts);
            });
        }

        // Update previous time to current one for next calculation of delta time
        this.prev_time = timestamp;
    }

    //
    updateScene(scene) {
        this.scene = this.processScene(scene);
        if (!this.enable_animation) {
            this.draw();
        }
    }

    //
    processScene(scene) {
        let processed = {
            view: {
                prp: Vector3(scene.view.prp[0], scene.view.prp[1], scene.view.prp[2]),
                srp: Vector3(scene.view.srp[0], scene.view.srp[1], scene.view.srp[2]),
                vup: Vector3(scene.view.vup[0], scene.view.vup[1], scene.view.vup[2]),
                clip: [...scene.view.clip]
            },
            models: []
        };

        for (let i = 0; i < scene.models.length; i++) {
            let model = { type: scene.models[i].type };
            model.vertices = [];
            model.edges = [];
            // eslint-disable-next-line no-prototype-builtins
            if (scene.models[i].hasOwnProperty('animation')) {
                model.animation = JSON.parse(JSON.stringify(scene.models[i].animation));
            }
            if (model.type === 'generic') {
                model.edges = JSON.parse(JSON.stringify(scene.models[i].edges));
                for (let j = 0; j < scene.models[i].vertices.length; j++) {
                    model.vertices.push(Vector4(scene.models[i].vertices[j][0],
                        scene.models[i].vertices[j][1],
                        scene.models[i].vertices[j][2],
                        1));
                    // eslint-disable-next-line no-prototype-builtins
                    if (scene.models[i].hasOwnProperty('animation')) {
                        model.animation = JSON.parse(JSON.stringify(scene.models[i].animation));
                    }
                }
            }
            else if (model.type === 'cube') {
                const center = scene.models[i].center;
                const width = scene.models[i].width;
                const height = scene.models[i].height;
                const depth = scene.models[i].depth;
                // Define the eight vertices of the cube
                let vertices = [
                    [center[0] - width / 2, center[1] - height / 2, center[2] - depth / 2],
                    [center[0] + width / 2, center[1] - height / 2, center[2] - depth / 2],
                    [center[0] + width / 2, center[1] + height / 2, center[2] - depth / 2],
                    [center[0] - width / 2, center[1] + height / 2, center[2] - depth / 2],
                    [center[0] - width / 2, center[1] - height / 2, center[2] + depth / 2],
                    [center[0] + width / 2, center[1] - height / 2, center[2] + depth / 2],
                    [center[0] + width / 2, center[1] + height / 2, center[2] + depth / 2],
                    [center[0] - width / 2, center[1] + height / 2, center[2] + depth / 2]
                ];

                // Add each vertex to the model's vertex list
                for (let j = 0; j < vertices.length; j++) {
                    model.vertices.push(Vector4(vertices[j][0], vertices[j][1], vertices[j][2], 1));
                }

                // Define the edges of the cube
                let edges = [
                    [0, 1], [1, 2], [2, 3], [3, 0],
                    [4, 5], [5, 6], [6, 7], [7, 4],
                    [0, 4], [1, 5], [2, 6], [3, 7]
                ];

                // Add each edge to the model's edge list
                for (let j = 0; j < edges.length; j++) {
                    model.edges.push(edges[j]);
                }
            }
            else if (model.type === 'cylinder') {
                const center = scene.models[i].center;
                const radius = scene.models[i].radius;
                const height = scene.models[i].height;
                const sides = scene.models[i].sides;
                for (let i = 0; i < sides; i++) {
                    let theta = (i / sides) * 2 * Math.PI;
                    let z = radius * Math.sin(theta);
                    let x = radius * Math.cos(theta);
                    model.vertices.push(new Vector4(x + center[0], height / 2 + center[1], z + center[2], 1));
                    model.vertices.push(new Vector4(x + center[0], -height / 2 + center[1], z + center[2], 1));
                    model.edges.push([i, i + 2]);
                    model.edges.push([(i*2) % (sides * 2), (i*2 + 2) % (sides *2)]);
                    model.edges.push([i * 2, i * 2 + 1]);
                }

            }
            else if (model.type === 'cone') {
                const center = scene.models[i].center;
                const radius = scene.models[i].radius;
                const height = scene.models[i].height;
                const sides = scene.models[i].sides;
                model.vertices.push(new Vector4(center[0], height / 2 + center[1], center[2], 1));
                for (let i = 1; i < sides + 1; i++) {
                    let theta = (i / sides) * 2 * Math.PI;
                    let z = radius * Math.sin(theta);
                    let x = radius * Math.cos(theta);
                    model.vertices.push(new Vector4(x + center[0], -height / 2 + center[1], z + center[2], 1));
                    model.edges.push([(i) % (sides+1), (i + 1) % (sides+1)]);
                    model.edges.push([0, i]);
                }

            } else if (model.type === 'sphere') {
                model.vertices = [];
                model.edges = [];

                // Define the parameters for the sphere
                const radius = scene.models[i].radius;
                const widthSegments = scene.models[i].slices;
                const heightSegments = scene.models[i].stacks;

                // Define the profile curve for the sphere
                let circle = (radius, t) => {
                    let x = radius * Math.cos(Math.PI * 2 * t);
                    let y = radius * Math.sin(Math.PI * 2 * t);
                    return [x, y];
                };
                //to define a circle define the radius and iterate t from 0 to 1
                //let [x, y] = curve(radius ,t);
                
            }
            else {
                model.center = Vector4(scene.models[i].center[0],
                    scene.models[i].center[1],
                    scene.models[i].center[2],
                    1);
                for (let key in scene.models[i]) {
                    // eslint-disable-next-line no-prototype-builtins
                    if (scene.models[i].hasOwnProperty(key) && key !== 'type' && key != 'center') {
                        model[key] = JSON.parse(JSON.stringify(scene.models[i][key]));
                    }
                }
            }

            model.matrix = new Matrix(4, 4);
            processed.models.push(model);
        }

        return processed;
    }

    // x0:           float (x coordinate of p0)
    // y0:           float (y coordinate of p0)
    // x1:           float (x coordinate of p1)
    // y1:           float (y coordinate of p1)
    drawLine(x0, y0, x1, y1) {
        this.ctx.strokeStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.moveTo(x0, y0);
        this.ctx.lineTo(x1, y1);
        this.ctx.stroke();

        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(x0 - 2, y0 - 2, 4, 4);
        this.ctx.fillRect(x1 - 2, y1 - 2, 4, 4);
    }
}
