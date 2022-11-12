import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../libs/utils.js";
import { ortho, lookAt, flatten, vec3, scale, rotateZ } from "../libs/MV.js";
import { modelView, loadMatrix, multRotationY, multScale, multRotationX, multRotationZ, pushMatrix, popMatrix, multTranslation } from "../libs/stack.js";

import * as CYLINDER from '../libs/objects/cylinder.js';
import * as SPHERE from '../libs/objects/sphere.js';
import * as CUBE from '../libs/objects/cube.js';
import { rotateX, rotateY } from "./libs/MV.js";

const LANDING_PA_SKIDS_COLOR = vec3(1, 1, 0.35);
const LANDING_PE_SKIDS_COLOR = vec3(0.5, 0.5, 0.5);
const CABINE_COLOR = vec3(1, 0, 0);
const BLADE_COLOR = vec3(0, 0, 1);
const ROTOR_COLOR = vec3(1, 1, 0.35);
const GROUND_COLOR = vec3(0.7, 0.7, 0.7);
/** @type WebGLRenderingContext */
let gl;

let time = 0;           // Global simulation time in days
//let speed = 1 / 60.0;     // Speed (how many days added to time on each render pass
let mode;               // Drawing mode (gl.LINES or gl.TRIANGLES)
let animation = true;   // Animation is running
const VP_DISTANCE = 4;
let uColor;

//helicopter position
let heliPosition = [0.0, 0.0, 0.0];


function setup(shaders) {
    let canvas = document.getElementById("gl-canvas");
    let aspect = canvas.width / canvas.height;

    gl = setupWebGL(canvas);

    let program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);
    uColor = gl.getUniformLocation(program, "uColor")
    let mProjection = ortho(-VP_DISTANCE * aspect, VP_DISTANCE * aspect, -VP_DISTANCE, VP_DISTANCE, -3 * VP_DISTANCE, 3 * VP_DISTANCE);

    mode = gl.LINES;


    resize_canvas();
    window.addEventListener("resize", resize_canvas);
    document.onkeydown = function (event) {
        switch (event.key) {
            case 'w':
                mode = gl.LINES;
                break;
            case 's':
                mode = gl.TRIANGLES;
                break;
            case 'p':
                animation = !animation;
                break;
            /* case '+':
                 if (animation) speed *= 1.1;
                 break;
             case '-':
                 if (animation) speed /= 1.1;
                 break;*/
        }
    }
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    CYLINDER.init(gl);
    SPHERE.init(gl);
    CUBE.init(gl);
    gl.enable(gl.DEPTH_TEST);   // Enables Z-buffer depth test

    window.requestAnimationFrame(render);


    function resize_canvas(event) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        aspect = canvas.width / canvas.height;

        gl.viewport(0, 0, canvas.width, canvas.height);
        mProjection = ortho(-VP_DISTANCE * aspect, VP_DISTANCE * aspect, -VP_DISTANCE, VP_DISTANCE, -3 * VP_DISTANCE, 3 * VP_DISTANCE);
    }

    function uploadModelView() {

        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(modelView()));
    }

    function drawBaseLeft(x, y, z) {
        pushMatrix();
        multTranslation([x + 0, y - 0.83, z + 0.25]);
        multRotationZ(90);
        multScale([0.1, 2.0, 0.1]);
        changeColor(LANDING_PA_SKIDS_COLOR);
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([x + 0.7, y - 0.59, z + 0.25]);
        multRotationZ(20);
        multScale([0.1, 0.5, 0.05]);
        changeColor(LANDING_PE_SKIDS_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        multTranslation([x - 0.7, y - 0.59, z + 0.25]);
        multRotationZ(-20);
        multScale([0.1, 0.5, 0.05]);
        changeColor(LANDING_PE_SKIDS_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);

    }

    function drawBaseRight(x, y, z) {
        pushMatrix();
        multTranslation([x + 0, y - 0.83, z - 0.25]);
        multRotationZ(90);
        multScale([0.1, 2.0, 0.1]);
        changeColor(LANDING_PA_SKIDS_COLOR);
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([x + 0.7, y - 0.59, z - 0.25]);
        multRotationZ(20);
        multScale([0.1, 0.5, 0.05]);
        changeColor(LANDING_PE_SKIDS_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        multTranslation([x - 0.7, y - 0.59, z - 0.25]);
        multRotationZ(-20);
        multScale([0.1, 0.5, 0.05]);
        changeColor(LANDING_PE_SKIDS_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);


    }
    function drawCockpit(x, y, z) {
        multScale([2, 1, 1.3])
        changeColor(CABINE_COLOR);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
    }

    function drawTailBoom(x, y, z) {
        multScale([2.2, 0.3, 0.1])
        multTranslation([x + 0.7, y + 0.7, z + 0]);
        gl.uniform3fv(uColor, CABINE_COLOR);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
    }

    function drawTailRotor(x, y, z, r) {

        multTranslation([x + 2.65, y + 0.45, z + 0]);
        pushMatrix();
        multRotationZ(-15);
        multScale([0.25, 0.6, 0.3])
        gl.uniform3fv(uColor, CABINE_COLOR);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
        popMatrix();
        multTranslation([0, 0, 0.2]);
        multRotationZ(r);
        pushMatrix();
        multTranslation([-0.3, 0, 0]);
        multRotationZ(90)
        multScale([0.1, 0.5, 0.1]);
        gl.uniform3fv(uColor, BLADE_COLOR);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([0.3, 0, 0]);
        multRotationZ(90)
        multScale([0.1, 0.5, 0.1]);
        gl.uniform3fv(uColor, BLADE_COLOR);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
        popMatrix();
        multRotationX(90);
        multScale([0.1, 0.1, 0.1]);
        gl.uniform3fv(uColor, ROTOR_COLOR);
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
    }

    function drawMainRotor(x, y, z, r) {
        multTranslation([x + 0, y + 0.7, z + 0])
        multRotationY(r);
        pushMatrix();
        multScale([0.1, 0.4, 0.1]);
        gl.uniform3fv(uColor, ROTOR_COLOR);
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([-1, 0.05, 0]);
        multScale([2, 0.1, 0.3])
        gl.uniform3fv(uColor, BLADE_COLOR);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([0.48, 0.05, 0.85]);
        multRotationY(120);
        multScale([2, 0.1, 0.3])
        gl.uniform3fv(uColor, BLADE_COLOR);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
        popMatrix();
        multTranslation([0.48, 0.04, -0.85]);
        multRotationY(240);
        multScale([2, 0.1, 0.3])
        gl.uniform3fv(uColor, BLADE_COLOR);
        uploadModelView();
        SPHERE.draw(gl, program, mode);

    }

    function changeColor(color) {
        gl.uniform3fv(uColor, color);
    }

    function drawHelicopter(x, y, z, r) {
        pushMatrix();
        pushMatrix();
        pushMatrix();
        drawBaseLeft(x, y, z);
        popMatrix();
        drawBaseRight(x, y, z);
        popMatrix();
        pushMatrix();
        pushMatrix();
        drawCockpit(x, y, z);
        popMatrix();
        pushMatrix();
        drawTailBoom(x, y, z);
        popMatrix();
        drawTailRotor(x, y, z, r);
        popMatrix();
        drawMainRotor(x, y, z, r);
    }

    function drawGround() {
        multRotationY(45)
        multScale([8, 0.1, 8]);
        changeColor(LANDING_PE_SKIDS_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
    }

    function drawCity() {
        pushMatrix();
        drawGround();
        popMatrix();
    }
    let r = 40;
    function render() {
        //if (animation) time += speed;
        r += 3;
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(program);

        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));

        loadMatrix(lookAt([0, VP_DISTANCE, VP_DISTANCE], [0, 0, 0], [0, 1, 0]));

        //drawCity();
        drawHelicopter(heliPosition[0], heliPosition[1], heliPosition[2],r);
    }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))