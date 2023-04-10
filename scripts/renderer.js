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
        this.enable_animation = false;  // <-- disabled for easier debugging; enable for animation
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
        // TODO: update any transformations needed for animation
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
        console.log(this.worldToLocal(this.localToWorld((this.worldToLocal(this.scene.view.srp)))))

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        //this.drawLine(0, 0, 100, 100);
        console.log('draw()');
        console.log(this.scene)

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
                        [mat4x4MPer(),
                            transform,
                        model.vertices[j]]
                    )
                );
            }
            this.clipTransformedLines(model, transformedVerticies);
            for (let j = 0; j < transformedVerticies.length; j++) {
                transformedVerticies[j] = Matrix.multiply([mat4x4Viewport(this.canvas.width, this.canvas.height), transformedVerticies[j]]);
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
        for (let i = 0; i < transformedVerticies.length; i++) {
            for (let j = 0; j < model.edges.length; j++) {
                const edges = model.edges[j]
                for (let k = 0; k < edges.length - 1; k++) {
                    let vertex1 = transformedVerticies[edges[k]];
                    let vertex2 = transformedVerticies[edges[k+1]];
                    this.clipLinePerspective({pt0: vertex1, pt1: vertex2}, 0);
                    //transformedVerticies[i] = this.clipLinePerspective({pt0: vertex1, pt1: vertex2}, this.scene.view.clip.z_min);
                }
            }
        }
    }

    // Clip line - should either return a new line (with two endpoints inside view volume)
    //             or null (if line is completely outside view volume)
    // line:         object {pt0: Vector4, pt1: Vector4}
    // z_min:        float (near clipping plane in canonical view volume)
    clipLinePerspective(line, z_min) {
        let result = null;
        let p0 = Vector3(line.pt0.x, line.pt0.y, line.pt0.z);
        let p1 = Vector3(line.pt1.x, line.pt1.y, line.pt1.z);
        let delta = p1.subtract(p0);
        let out0 = this.outcodePerspective(p0, z_min);
        let out1 = this.outcodePerspective(p1, z_min);

        //left
        //let t = (-p0.x + p0.z)/(delta.x - delta.z);
        //let x = p0.x + (t * delta.x);

        //right
        //let t = (-p0.x + p0.z)/(-delta.x - delta.z);
        //let x = p0.x + (t * delta.x);

        //bottom
        //let t = (-p0.y + p0.z)/(delta.y - delta.z)
        //let y = p0.y + (t * delta.y);

        //top
        //let t = (p0.y + p0.z)/(-delta.y - delta.z)
        //let y = p0.y + (t * delta.y);

        //near
        //let t = (p0.z - z_min)/-delta.z
        //let z = p0.z + (t * delta.z);

        //far
        //let t = (-p0.z - 1)/delta.z
        //let z = p0.z + (t * delta.z);

        console.log(this.getOutcodeArray(out0));
        console.log(out0.toString(2));
        console.log(out1.toString(2));

        // TODO: implement clipping here!

        return result;
    }

    getOutcodeArray(outcode){
        for(outcode = outcode.toString(2); outcode.length < 6; outcode = "0" + outcode);
        let outcodes = new Array[6];
        for (let i = 0; i < 6; i++) {
            outcodes[i] = outcode[i] == "1" ? true : false;
        }
        let outcodeObj = {
            left: outcodes[0],
            right: outcodes[1],
            bottom: outcodes[2],
            top: outcodes[3],
            near: outcodes[4],
            far: outcodes[5],
        };
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
            if (model.type === 'generic') {
                model.vertices = [];
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
