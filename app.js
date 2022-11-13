import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../libs/utils.js";
import { ortho, lookAt, flatten, vec3, scale, rotateZ, mult } from "../libs/MV.js";
import { modelView, loadMatrix, multRotationY, multScale, multRotationX, multRotationZ, pushMatrix, popMatrix, multTranslation } from "../libs/stack.js";

import * as CYLINDER from '../libs/objects/cylinder.js';
import * as SPHERE from '../libs/objects/sphere.js';
import * as CUBE from '../libs/objects/cube.js';
import * as CONE from '../libs/objects/cone.js';
import { rotateX, rotateY } from "./libs/MV.js";

const LANDING_PA_SKIDS_COLOR = vec3(1, 1, 0.35);
const LANDING_PE_SKIDS_COLOR = vec3(0.5, 0.5, 0.5);
const CABINE_COLOR = vec3(1, 0, 0);
const BLADE_COLOR = vec3(0, 0, 1);
const ROTOR_COLOR = vec3(1, 1, 0.35);
const GROUND_COLOR = vec3(0.7, 0.7, 0.7);
const BUILDING_COLOR = vec3(0.3, 0.3, 0.3);
const WINDOW_COLOR = vec3(0.7, 0.7, 0);
const BOX_COLOR = vec3(0.6, 0.37, 0.18);
const HELIPORT_COLOR = vec3(0.6, 0.2, 0);
const H_HELIPORT_COLOR = vec3(1, 1, 1);
const BOLE_TREE_COLOR = vec3(0.5, 0.27, 0.08);
const TREE_LEAVES_COLOR1 = vec3(0, 0.25, 0);
const TREE_LEAVES_COLOR2 = vec3(0, 0.3, 0);
const TREE_LEAVES_COLOR3 = vec3(0, 0.35, 0);
const H_HOSPITAL_COLOR = vec3(1, 1, 1);
const ROAD_COLOR = vec3(0, 0, 0);
const ROAD_LINES_COLOR = vec3(1, 1, 1);
const HOSPITAL_DOOR_COLOR = vec3(0, 0, 0.5);
/** @type WebGLRenderingContext */
let gl;

let time = 0;           // Global simulation time in days
let mode;               // Drawing mode (gl.LINES or gl.TRIANGLES)
let animation = true;   // Animation is running
const VP_DISTANCE = 20;
let uColor;

//helicopter position
let heli = {
    position: [0.0, 0.9, 7.0], rotationV: 0,
    onGround: true, inclinationAngle: 0,
    maxInclinationAngle: 30, velocity: 0,
    r: 0
};
let heliportPos = structuredClone([heli.position[0], 0, heli.position[2]]);
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
        // console.log(event.key)
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
    CONE.init(gl);
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
        let box = { time: new Date().getTime(), pos: structuredClone([heli.position[0], heli.position[1]-0.9, heli.position[2]]), r: JSON.parse(JSON.stringify(heli.r)) };
        boxes.push(box)
    }
    function moveHelicopeterFront() {
        if (!heli.onGround) {
            if (heli.velocity + 0.1 <= 1)
                heli.velocity += 0.1;
            if (heli.inclinationAngle + 3 <= heli.maxInclinationAngle)
                heli.inclinationAngle += 3;
        }

    }

    function moveHelicopeterBack() {
        if (!heli.onGround) {
            if (heli.velocity - 0.1 >= -1)
                heli.velocity -= 0.1;
            if (heli.inclinationAngle - 3 >= -30)
                heli.inclinationAngle -= 3;
        }

    }

    function moveHelicopeterUP() {
        if (heli.rotationV > 100 && heli.position[1] < 15)
            heli.position[1] += 0.05;
        heli.onGround = false;
    }

    function moveHelicopeterDown() {
        if (0 <= heli.inclinationAngle && heli.inclinationAngle <= 1) {
            if (!heli.onGround)
                heli.position[1] -= 0.05;
            if (heli.position[1] <= 0.9)
                heli.onGround = true;
        }
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
        multScale([30, 0., 30]);
        changeColor(GROUND_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
    }

    function drawLeftWindows(h) {
        pushMatrix()
        multTranslation([0, h, 0])
        pushMatrix();
        multTranslation([0.6, 2, 0.6])
        multRotationY(45)
        multScale([4.1, 1, 1])
        changeColor(WINDOW_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([-0.8, 2, -0.8])
        multRotationY(45)
        multScale([4.1, 1, 1])
        changeColor(WINDOW_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([0.6, 0.5, 0.6])
        multRotationY(45)
        multScale([4.1, 1, 1])
        changeColor(WINDOW_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([-0.8, 0.5, -0.8])
        multRotationY(45)
        multScale([4.1, 1, 1])
        changeColor(WINDOW_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        popMatrix();
    }

    function drawRightWindows(h) {
        pushMatrix()
        multTranslation([0, h, 0])
        pushMatrix();
        multTranslation([0.6, 2, -0.6])
        multRotationY(-45)
        multScale([4.1, 1, 1])
        changeColor(WINDOW_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([-0.8, 2, 0.8])
        multRotationY(-45)
        multScale([4.1, 1, 1])
        changeColor(WINDOW_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([0.6, 0.5, -0.6])
        //multTranslation([1.5, 0.5, 0.7])
        multRotationY(-45)
        multScale([4.1, 1, 1])
        changeColor(WINDOW_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([-0.8, 0.5, 0.8])
        multRotationY(-45)
        multScale([4.1, 1, 1])
        changeColor(WINDOW_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        popMatrix();
    }

    function drawDor() {
        pushMatrix();
           multRotationY(45);
            multTranslation([-1.6,-4,-0.1])
            multScale([1, 1.6 , 1.5])
            changeColor(HOSPITAL_DOOR_COLOR);
            uploadModelView();
            CUBE.draw(gl, program, mode);
        popMatrix();
    }
    function drawBuildType1() {
        multTranslation([0, 1, -8]);
        pushMatrix();
        multRotationY(45);
        multScale([4, 11, 4])
        changeColor(BUILDING_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        drawDor();
        drawLeftWindows(1.5);
        drawRightWindows(1.5);
        drawLeftWindows(-1.5);
        drawRightWindows(-1.5);
        drawLeftWindows(-3);
        drawRightWindows(-3);

    }

    function drawBridgeWindow(x, y, z) {
        pushMatrix()
        multTranslation([x,y,z])
        multRotationY(45)
        multScale([4.1, 1, 1])
        changeColor(WINDOW_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix()
    }
    function drawHospitalBridge() {
        pushMatrix();
        multTranslation([7.7, 4.8, -6.2])
        multRotationY(-45)
        multScale([18, 2.5, 3.85])
        changeColor(BUILDING_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([4.2, 4.9, -7.3])
        multRotationY(45)
        multScale([0.5, 2.2, 0.5])
        changeColor(H_HOSPITAL_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([6.4, 4.9, -5.1])
        multRotationY(45)
        multScale([0.5, 2.2, 0.5])
        changeColor(H_HOSPITAL_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([5.4, 4.9, -6.1])
        multRotationY(45)
        multScale([0.5, 0.5, 3])
        changeColor(H_HOSPITAL_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        drawBridgeWindow(4.1, 4.9, -9.7);
        popMatrix()
        pushMatrix();
        drawBridgeWindow(2.2, 4.9, -11.6);
        popMatrix()
        pushMatrix();
        drawBridgeWindow(10.7, 4.9, -3.2);
        popMatrix()
        drawBridgeWindow(8.9, 4.9, -4.9);
       
    }

    function drawHospital() {
        pushMatrix();
        multTranslation([1,0,0])
        pushMatrix();
        multTranslation([0, 4, -6])
        drawBuildType1();
        popMatrix();
        pushMatrix();
        multTranslation([13, 4, 7])
        drawBuildType1();
        popMatrix();
        pushMatrix();
        drawHospitalBridge();
        popMatrix();
        popMatrix()
    }

    function drawHeliport() {
        multTranslation(heliportPos)
        pushMatrix();
        multScale([4, 0.11, 4])
        changeColor(HELIPORT_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([0.1, 0, 1])
        multRotationY(90)
        multScale([0.2, 0.111, 3])
        changeColor(H_HELIPORT_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([0.1, 0, -1])
        multRotationY(90)
        multScale([0.2, 0.111, 3])
        changeColor(H_HELIPORT_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([0.1, 0, -0.1])
        multRotationY(0)
        multScale([0.2, 0.111, 2])
        changeColor(H_HELIPORT_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
    }

    function drawTreeType1() {
        pushMatrix();
        multTranslation([0, 0.9, 0])
        multScale([0.6, 2, 0.6])
        changeColor(BOLE_TREE_COLOR);
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([0, 2, 0])
        multScale([2.5, 1.5, 2.5])
        changeColor(TREE_LEAVES_COLOR1);
        uploadModelView();
        CONE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([0, 2.6, 0])
        multScale([2.2, 1.5, 2.2])
        changeColor(TREE_LEAVES_COLOR2);
        uploadModelView();
        CONE.draw(gl, program, mode);
        popMatrix();
        multTranslation([0, 3.2, 0])
        multScale([1.7, 1.5, 1.7])
        changeColor(TREE_LEAVES_COLOR3);
        uploadModelView();
        CONE.draw(gl, program, mode);
    }

    function putTreeType1(x, z) {
        pushMatrix();
        multTranslation([x, 0, z])
        drawTreeType1();
        popMatrix();
    }

    function drawRoad() {
        pushMatrix();
        multTranslation([-5,0,-8])
        multRotationY(-45)
        multScale([2, 0.1, 13.3])        
        changeColor(ROAD_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([-4,0,1])
        multRotationY(45)
        multScale([2, 0.1, 13])        
        changeColor(ROAD_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([-4,0,1])
        multRotationY(45)
        multScale([0.2, 0.101, 14.2])        
        changeColor(ROAD_LINES_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([-4.8,0,-8.2])
        multRotationY(-45)
        multScale([0.2, 0.101, 12])        
        changeColor(ROAD_LINES_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();

    }

    function drawCity() {
        pushMatrix();
        drawGround();
        popMatrix();
        drawHospital();
        pushMatrix();
        drawHeliport();
        popMatrix();
        pushMatrix();
        drawHelicopter(heli.position[0], heli.position[1], heli.position[2], heli.rotationV);
        popMatrix();
        let theta = 0;
        for (let i = 0; i < 9; i++) {
            let x = heliportPos[0] + 6 * Math.cos(theta);
            let z = heliportPos[2] + 6 * Math.sin(theta);
            putTreeType1(x, z);
            theta += 35;
        }

        theta = 0;
        for (let i = 0; i < 11; i++) {
            let x = heliportPos[0] + 9 * Math.cos(theta);
            let z = heliportPos[2] + 9 * Math.sin(theta);
            if(theta != 180)
                putTreeType1(x, z);
            theta += 30;
        }
        drawRoad();

    }


    function renderBoxes() {
        for (let i = 0; i < boxes.length; i++) {
            if (boxes[i].pos[1] >= 0.5)
                boxes[i].pos[1] -= 0.1;
            if (new Date().getTime() - boxes[i].time < 5000) {
                pushMatrix();
                multRotationY(boxes[i].r)
                multTranslation(boxes[i].pos);

                changeColor(BOX_COLOR);
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

        loadMatrix(lookAt([0, VP_DISTANCE , VP_DISTANCE], [0, 0, 0], [0, 1, 0]));
        //loadMatrix(lookAt([-20, VP_DISTANCE/2, VP_DISTANCE], [0, 0, 0], [0, 1, 0]));

        if (heli.onGround) {
            heli.rotationV /= 1.05;
        } else {
            heli.rotationV += 10;
            heli.r -= heli.velocity;
        }

        drawCity();
        //drawHelicopter(heli.position[0], heli.position[1], heli.position[2], heli.rotationV);
        renderBoxes();


    }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))