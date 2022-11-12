import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../libs/utils.js";
import { ortho, lookAt, flatten, vec3, scale, rotateZ, mult } from "../libs/MV.js";
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
const BUILDING_COLOR = vec3(0.3, 0.3, 0.3);
const WINDOW_COLOR = vec3(0.7, 0.7, 0);
/** @type WebGLRenderingContext */
let gl;

let time = 0;           // Global simulation time in days
let mode;               // Drawing mode (gl.LINES or gl.TRIANGLES)
let animation = true;   // Animation is running
const VP_DISTANCE = 10;
let uColor;

//helicopter position
let heli = {
    position: [0.0, 0.9, 3.0], rotationV: 40,
    onGround: true, inclinationAngle: 0,
    maxInclinationAngle: 30, velocity: 0,
    r: 0
};
let boxes = [];

function setup(shaders) {
    let canvas = document.getElementById("gl-canvas");
    let aspect = canvas.width / canvas.height;

    gl = setupWebGL(canvas);

    let program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);
    uColor = gl.getUniformLocation(program, "uColor")
    let mProjection = ortho(-VP_DISTANCE * aspect, VP_DISTANCE * aspect, -VP_DISTANCE, VP_DISTANCE, -3 * VP_DISTANCE, 3 * VP_DISTANCE);

    mode = gl.TRIANGLES;


    resize_canvas();
    window.addEventListener("resize", resize_canvas);
    document.onkeydown = function (event) {
        console.log(event.key)
        switch (event.key) {
            case 'w':
                mode = gl.LINES;
                break;
            case 's':
                mode = gl.TRIANGLES;
                break;
            case 'ArrowUp':
                moveHelicopeterUP();
                break;
            case 'ArrowDown':
                moveHelicopeterDown();
                break;
            case 'ArrowLeft':
                moveHelicopeterFront();
                break;
            case 'ArrowRight':
                moveHelicopeterBack();
                break;
            case ' ':
                dropBox();
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

    function dropBox() {
        let x = heli.position[0];
        let y = heli.position[1];
        let z = heli.position[2];
        let box = { time: new Date().getTime(), pos: [x, y, z] };
        boxes.push(box)
    }
    function moveHelicopeterFront() {
        if (!heli.onGround) {
            if (heli.velocity + 0.1 <= 2)
                heli.velocity += 0.1;
            if (heli.inclinationAngle + 2 <= heli.maxInclinationAngle)
                heli.inclinationAngle += 2;
        }

    }

    function moveHelicopeterBack() {
        if (!heli.onGround) {
            if (heli.velocity - 0.1 >= -2)
                heli.velocity -= 0.1;
            if (heli.inclinationAngle - 2 >= -30)
                heli.inclinationAngle -= 2;
        }

    }

    function moveHelicopeterUP() {
        if (heli.rotationV > 100 && heli.position[1] < 10)
            heli.position[1] += 0.05;
        heli.onGround = false;
    }

    function moveHelicopeterDown() {
        if (!heli.onGround)
            heli.position[1] -= 0.05;
        if (heli.position[1] <= 0.9)
            heli.onGround = true;
    }

    function drawBaseLeft() {
        pushMatrix();
        multTranslation([0, - 0.83, 0.25]);
        multRotationZ(90);
        multScale([0.1, 2.0, 0.1]);
        changeColor(LANDING_PA_SKIDS_COLOR);
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([0.7, - 0.59, 0.25]);
        multRotationZ(20);
        multScale([0.1, 0.5, 0.05]);
        changeColor(LANDING_PE_SKIDS_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        multTranslation([-0.7, -0.59, 0.25]);
        multRotationZ(-20);
        multScale([0.1, 0.5, 0.05]);
        changeColor(LANDING_PE_SKIDS_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);

    }

    function drawBaseRight() {
        pushMatrix();
        multTranslation([0, -0.83, -0.25]);
        multRotationZ(90);
        multScale([0.1, 2.0, 0.1]);
        changeColor(LANDING_PA_SKIDS_COLOR);
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([0.7, - 0.59, - 0.25]);
        multRotationZ(20);
        multScale([0.1, 0.5, 0.05]);
        changeColor(LANDING_PE_SKIDS_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        multTranslation([- 0.7, - 0.59, - 0.25]);
        multRotationZ(-20);
        multScale([0.1, 0.5, 0.05]);
        changeColor(LANDING_PE_SKIDS_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);


    }
    function drawCockpit() {
        multScale([2, 1, 1.3])
        changeColor(CABINE_COLOR);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
    }

    function drawTailBoom() {
        multScale([2.2, 0.3, 0.1])
        multTranslation([0.7, 0.7, 0]);
        gl.uniform3fv(uColor, CABINE_COLOR);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
    }

    function drawTailRotor(r) {

        multTranslation([2.65, 0.45, 0]);
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

    function drawMainRotor(r) {
        multTranslation([0, 0.7, 0])
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
        //heli.position[0] = -4 * Math.cos(heli.velocity);
        //heli.position[2] = -4 * Math.sin(heli.velocity);
        multRotationY(heli.r)
        multRotationZ(heli.inclinationAngle)
        multTranslation([x, y, z]);
        pushMatrix();
        pushMatrix();
        pushMatrix();
        drawBaseLeft();
        popMatrix();
        drawBaseRight();
        popMatrix();
        pushMatrix();
        pushMatrix();
        drawCockpit();
        popMatrix();
        pushMatrix();
        drawTailBoom();
        popMatrix();
        drawTailRotor(r);
        popMatrix();
        drawMainRotor(r);
        popMatrix();
        popMatrix();
    }

    function drawGround() {
        multRotationY(45)
        multScale([15, 0.1, 15]);
        changeColor(GROUND_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
    }

    function drawLeftWindows() {
        pushMatrix();
        multTranslation([-0.9, 1, 0.2])
        multRotationY(45)
        multScale([0.5, 0.5, 0.5])
        changeColor(WINDOW_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([-0.2, 1, 0.9])
        multRotationY(45)
        multScale([0.5, 0.5, 0.5])
        changeColor(WINDOW_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([-0.9, 0.3, 0.2])
        multRotationY(45)
        multScale([0.5, 0.5, 0.5])
        changeColor(WINDOW_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([-0.2, 0.3, 0.9])
        multRotationY(45)
        multScale([0.5, 0.5, 0.5])
        changeColor(WINDOW_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
    }

    function drawRightWindows() {
        pushMatrix();
        multTranslation([0.9, 1, 0.2])
        multRotationY(-45)
        multScale([0.5, 0.5, 0.5])
        changeColor(WINDOW_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([0.2, 1, 0.9])
        multRotationY(-45)
        multScale([0.5, 0.5, 0.5])
        changeColor(WINDOW_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([0.9, 0.3, 0.2])
        multRotationY(-45)
        multScale([0.5, 0.5, 0.5])
        changeColor(WINDOW_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([0.2, 0.3, 0.9])
        multRotationY(-45)
        multScale([0.5, 0.5, 0.5])
        changeColor(WINDOW_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
    }

    function drawBuildType1() {
        multTranslation([0, 2, -8]);
        pushMatrix();
        multRotationY(45);
        multScale([2, 4, 2])
        changeColor(BUILDING_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        drawLeftWindows();
        drawRightWindows();

    }
    function drawCity() {
        pushMatrix();
        drawGround();
        popMatrix();
        pushMatrix();
        drawBuildType1();
        popMatrix();
    }


    function renderBoxes() {
        for (let i = 0; i < boxes.length; i++) {
            if (boxes[i].pos[1] >= 0)
                boxes[i].pos[1] -= 0.1;
            console.log(boxes[i].time)
            if (new Date().getTime() - boxes[i].time < 5000) {
                pushMatrix();
                multRotationY(heli.r)
                multTranslation(boxes[i].pos);

                changeColor(BUILDING_COLOR);
                uploadModelView();
                CUBE.draw(gl, program, mode);
                popMatrix();
            }
            boxes.slice(i, 1);
        }
    }
    function render() {

        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(program);

        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));

        loadMatrix(lookAt([0, VP_DISTANCE, VP_DISTANCE], [0, 0, 0], [0, 1, 0]));
        if (heli.onGround) {
            heli.rotationV /= 1.01;
        } else {
            heli.rotationV += 10;
            heli.r -= heli.velocity;
        }
        drawCity();
        drawHelicopter(heli.position[0], heli.position[1], heli.position[2], heli.rotationV);
        renderBoxes();
    }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))