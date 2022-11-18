import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "./libs/utils.js";
import { ortho, lookAt, flatten, vec3, scale, rotateZ, mult, rotateY, subtract, add, scalem, translate, perspective } from "./libs/MV.js";
import { modelView, loadMatrix, multRotationY, multScale, multRotationX, multRotationZ, pushMatrix, popMatrix, multTranslation } from "./libs/stack.js";
import * as CYLINDER from './libs/objects/cylinder.js';
import * as SPHERE from './libs/objects/sphere.js';
import * as CUBE from './libs/objects/cube.js';
import * as CONE from './libs/objects/cone.js';


const LANDING_PA_SKIDS_COLOR = vec3(1, 1, 0.35);
const LANDING_PE_SKIDS_COLOR = vec3(0.5, 0.5, 0.5);
const CABINE_COLOR = vec3(1, 0, 0);
const BLADE_COLOR = vec3(0, 0, 1);
const ROTOR_COLOR = vec3(1, 1, 0.35);
const GROUND_COLOR = vec3(0.3, 0.5, 0.2);
const BUILDING_COLOR = vec3(0.90, 0.90, 0.90);
const WINDOW_COLOR = vec3(0.28, 0.71, 0.88);
const BOX_COLOR = vec3(0.6, 0.37, 0.18);
const HELIPORT_COLOR = vec3(0.6, 0.2, 0);
const H_HELIPORT_COLOR = vec3(1, 0, 0);
const BOLE_TREE_COLOR = vec3(0.5, 0.27, 0.08);
const TREE_LEAVES_COLOR1 = vec3(0, 0.25, 0);
const TREE_LEAVES_COLOR2 = vec3(0, 0.3, 0);
const TREE_LEAVES_COLOR3 = vec3(0, 0.35, 0);
const H_HOSPITAL_COLOR = vec3(1, 0,);
const ROAD_COLOR = vec3(0.3, 0.3, 0.3);
const ROAD_LINES_COLOR = vec3(1, 1, 1);
const HOSPITAL_DOOR_COLOR = vec3(0.28, 0.71, 0.88);
const AMBULANCE_COLOR = vec3(0.8, 0, 0.2);
const WINDOW_AMBULANCE_COLOR = vec3(0.68, 0.85, 0.9);
const AMBULANCE_WHEELS_COLOR = vec3(0, 0, 0);
const AMBULANCE_CROSS_COLOR = vec3(1, 1, 1);
const STAKE_LIGHT_COLOR = vec3(0, 0, 0);
const LIGHT_COLOR = vec3(1, 1, 0);
const O_OF_HELIPORT = vec3(1, 1, 1);
let alertLightColor = vec3(1, 0, 0);
/** @type WebGLRenderingContext */
let gl;
let time = 0;
let mode;               // Drawing mode (gl.LINES or gl.TRIANGLES)
const VP_DISTANCE = 60;
let uColor;
let heliCam = false;
let heli = {
    position: [-22, 1, 22], rotationV: 0,
    onGround: true, inclinationAngle: 0,
    maxInclinationAngle: 30, velocity: 0,
    rotationAngle: 135
};

const RADIUS = Math.sqrt(heli.position[0] ** 2 + heli.position[1] ** 2 + heli.position[2] ** 2);
let forward = false;
let sceneR = 150;
let heliportPos = structuredClone([heli.position[0], 0, heli.position[2]]);
let boxes = [];

let x = document.getElementById('x');
let y = document.getElementById('y');
let mView;
function setup(shaders) {
    let canvas = document.getElementById("gl-canvas");
    let aspect = canvas.width / canvas.height;

    gl = setupWebGL(canvas);

    let program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);
    uColor = gl.getUniformLocation(program, "uColor")
    let mProjection = ortho(-VP_DISTANCE * aspect, VP_DISTANCE * aspect, -VP_DISTANCE, VP_DISTANCE, -3 * VP_DISTANCE, 3 * VP_DISTANCE);
    mView = lookAt([0, VP_DISTANCE / 4, VP_DISTANCE], [0, 0, 0], [0, 1, 0]);
    loadMatrix(mView);
    mode = gl.TRIANGLES;

    resize_canvas();
    window.addEventListener("resize", resize_canvas);
    document.onkeyup = function () {
        forward = false;
    }
    document.onkeydown = function (event) {
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
            case '1':
                enableSliders();
                break;
            case '2':
                setFrontView();
                break;
            case '3':
                setUpView();
                break;
            case '4':
                setRightView();
                break;
            case '5':
                if (heliCam) {
                    enableSliders();
                    mProjection = ortho(-VP_DISTANCE * aspect, VP_DISTANCE * aspect, -VP_DISTANCE, VP_DISTANCE, -3 * VP_DISTANCE, 3 * VP_DISTANCE);
                    mView = lookAt([0, VP_DISTANCE / 4, VP_DISTANCE], [0, 0, 0], [0, 1, 0]);
                } else
                    disableSliders();
                heliCam = !heliCam;
                break;
        }
    }
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    CYLINDER.init(gl);
    SPHERE.init(gl);
    CUBE.init(gl);
    CONE.init(gl);
    gl.enable(gl.DEPTH_TEST);   // Enables Z-buffer depth test

    window.requestAnimationFrame(render);


    /*
    let camX = VP_DISTANCE * Math.sin(x.value * 2 * Math.PI / 360)
            * Math.cos(y.value * 2 * Math.PI / 360);
        let camY = VP_DISTANCE * Math.sin(y.value * 2 * Math.PI / 360);
        let camZ = VP_DISTANCE * Math.cos(x.value * 2 * Math.PI / 360)
            * Math.cos(y.value * 2 * Math.PI / 360);

    */
    function setFrontView() {
        disableSliders();
        let sR = sceneR * 2 * Math.PI / 360;
        let camX = VP_DISTANCE * Math.sin(sR)
            * Math.cos(0);
        let camY = VP_DISTANCE * Math.sin(0);
        let camZ = VP_DISTANCE * Math.cos(sR)
            * Math.cos(0);
        mView = lookAt([camX, camY, camZ], [0, 0, 0], [0, 1, 0]);
    }

    function setUpView() {
        disableSliders();
        let sR = sceneR * 2 * Math.PI / 360;
        let camX = VP_DISTANCE * Math.sin(sR)
            * Math.cos(Math.PI / 2);
        let camY = VP_DISTANCE * Math.sin(Math.PI / 2);
        let camZ = VP_DISTANCE * Math.cos(sR)
            * Math.cos(Math.PI / 2);
        mView = lookAt([camX, camY, camZ], [0, 0, 0], [0, 1, 0]);
    }

    function setRightView() {
        disableSliders();
        let sR = sceneR * 2 * Math.PI / 360;
        let camX = VP_DISTANCE * Math.sin(sR - 3 * Math.PI / 2)
            * Math.cos(0);
        let camY = VP_DISTANCE * Math.sin(0);
        let camZ = VP_DISTANCE * Math.cos(sR - 3 * Math.PI / 2)
            * Math.cos(0);
        mView = lookAt([camX, camY, camZ], [0, 0, 0], [0, 1, 0]);
    }

    function disableSliders() {
        document.getElementById("x-div").style.display = "none";
        document.getElementById("y-div").style.display = "none";
    }
    function enableSliders() {
        document.getElementById("x-div").style.display = "block";
        document.getElementById("y-div").style.display = "block";
    }

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
        let pos = [];
        let length = Math.sqrt(heli.position[2] ** 2 + heli.position[0] ** 2)
        let tV = [heli.position[2] / length, -heli.position[0] / length]
        pos[0] = heli.position[0] + tV[0] * heli.velocity;
        pos[1] = heli.position[1] - 0.9;
        pos[2] = heli.position[2] + tV[1] * heli.velocity;
        let box = {
            time: new Date().getTime(), pos: structuredClone(pos),
            velocity: [tV[0] * heli.velocity, -0.3, tV[1] * heli.velocity]
        };
        boxes.push(box)
    }

    function moveHelicopeterFront() {
        if (!heli.onGround) {
            forward = true;
            if (heli.velocity + 0.02 <= 0.5)
                heli.velocity += 0.02;
            if (heli.inclinationAngle + 1.2 <= heli.maxInclinationAngle)
                heli.inclinationAngle += 1.2;
        }

    }

    function moveHelicopeterBack() {
        if (!heli.onGround && !forward) {
            if (heli.velocity - 0.01 >= 0)
                heli.velocity -= 0.01;
            else heli.velocity = 0;
            if (heli.inclinationAngle - 0.6 >= 0)
                heli.inclinationAngle -= 0.6
        }

    }

    function moveHelicopeterUP() {
        if (heli.rotationV > 100 && heli.position[1] < 60)
            heli.position[1] += 0.1;
        heli.onGround = false;
    }

    function moveHelicopeterDown() {
        // console.log(heli.inclinationAngle)
        if (0 <= heli.inclinationAngle && heli.inclinationAngle <= 1.5) {
            if (!heli.onGround)
                heli.position[1] -= 0.1;
            if (heli.position[1] <= 0.9)
                heli.onGround = true;
        }
    }


    function drawBaseLeft() {
        pushMatrix();
        multTranslation([0, - 0.83, 0.5]);
        multRotationZ(90);
        multScale([0.2, 5.0, 0.2]);
        changeColor(LANDING_PA_SKIDS_COLOR);
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([1.5, - 0.4, 0.5]);
        multRotationZ(20);
        multScale([0.1, 1, 0.05]);
        changeColor(LANDING_PE_SKIDS_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([-1.5, -0.4, 0.5]);
        multRotationZ(-20);
        multScale([0.1, 1, 0.05]);
        changeColor(LANDING_PE_SKIDS_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
    }

    function drawBaseRight() {
        pushMatrix();
        multTranslation([0, -0.83, -0.5]);
        multRotationZ(90);
        multScale([0.2, 5.0, 0.2]);
        changeColor(LANDING_PA_SKIDS_COLOR);
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([1.5, 0, - 0.5]);
        multRotationZ(20);
        multScale([0.1, 1.5, 0.05]);
        changeColor(LANDING_PE_SKIDS_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([- 1.5, 0, - 0.5]);
        multRotationZ(-20);
        multScale([0.1, 1.5, 0.05]);
        changeColor(LANDING_PE_SKIDS_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
    }

    function drawCockpit() {
        multTranslation([0, 0.8, 0])
        multScale([5, 2.5, 2.5])
        changeColor(CABINE_COLOR);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
    }

    function drawTailBoom() {
        multScale([5, 1, 0.7])
        multTranslation([0.7, 0.7, 0]);
        gl.uniform3fv(uColor, CABINE_COLOR);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
    }

    function drawTailRotor(r) {

        pushMatrix();
        multTranslation([6.1, 1.2, 0])
        multRotationZ(45);
        multScale([2, 0.7, 0.6])
        gl.uniform3fv(uColor, CABINE_COLOR);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([6.4, 1.4, 0.4])
        multRotationZ(r);
        pushMatrix();
        multTranslation([-0.6, 0, 0]);
        multRotationZ(90)
        multScale([0.3, 1.5, 0.1]);
        gl.uniform3fv(uColor, BLADE_COLOR);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([0.6, 0, 0]);
        multRotationZ(90)
        multScale([0.3, 1.5, 0.1]);
        gl.uniform3fv(uColor, BLADE_COLOR);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
        popMatrix();
        multRotationX(90);
        multScale([0.2, 0.3, 0.2]);
        gl.uniform3fv(uColor, ROTOR_COLOR);
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
        popMatrix();
    }

    function drawMainRotor(r) {
        multTranslation([0, 2.2, 0])
        multRotationY(r);
        pushMatrix();
        multScale([0.2, 0.5, 0.2]);
        gl.uniform3fv(uColor, ROTOR_COLOR);
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([-2, 0.05, 0]);
        multScale([4, 0.1, 0.5])
        gl.uniform3fv(uColor, BLADE_COLOR);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([1, 0.05, 1.7]);
        multRotationY(120);
        multScale([4, 0.1, 0.5])
        gl.uniform3fv(uColor, BLADE_COLOR);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([1, 0.05, -1.7]);
        multRotationY(240);
        multScale([4, 0.1, 0.5])
        gl.uniform3fv(uColor, BLADE_COLOR);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
        popMatrix();

    }

    function changeColor(color) {
        gl.uniform3fv(uColor, color);
    }

    function drawHelicopter(r) {
        heli.position[0] = RADIUS * Math.cos(heli.rotationAngle * 2 * Math.PI / 360);
        heli.position[2] = RADIUS * Math.sin(heli.rotationAngle * 2 * Math.PI / 360);
        multTranslation(heli.position);
        multRotationY(90)//TODO
        multRotationY(-heli.rotationAngle)
        multRotationZ(heli.inclinationAngle)
        pushMatrix();
        pushMatrix();
        drawBaseLeft();
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

    }

    function drawGround() {
        // multRotationY(45)
        multTranslation([0, -0.5, 0])
        multScale([100, 1, 100]);
        changeColor(GROUND_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
    }

    function drawLeftWindows(h) {
        multTranslation([0, h, 0])
        pushMatrix();
        multTranslation([-0.1, 2, 3])
        // multRotationY(45)
        multScale([16.5, 2, 2])
        changeColor(WINDOW_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([-0.1, 2, -3])
        // multRotationY(45)
        multScale([16.5, 2, 2])
        changeColor(WINDOW_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([-0.1, 8, 3])
        multScale([16.5, 2, 2])
        changeColor(WINDOW_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([-0.1, 8, -3])
        multScale([16.5, 2, 2])
        changeColor(WINDOW_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
    }
    // function drawLeftWindowsOneSide(h) {
    //     pushMatrix()
    //     multTranslation([0, h, 0])
    //     pushMatrix();
    //     multTranslation([1.6, 2, 1])
    //     changeColor(WINDOW_COLOR);
    //     uploadModelView();
    //     CUBE.draw(gl, program, mode);
    //     popMatrix();
    //     pushMatrix();
    //     multTranslation([1.6, 2, -1])
    //     changeColor(WINDOW_COLOR);
    //     uploadModelView();
    //     CUBE.draw(gl, program, mode);
    //     popMatrix();
    //     pushMatrix();
    //     multTranslation([1.6, 0.5, 1])
    //     changeColor(WINDOW_COLOR);
    //     uploadModelView();
    //     CUBE.draw(gl, program, mode);
    //     popMatrix();
    //     pushMatrix();
    //     multTranslation([1.6, 0.5, -1])
    //     changeColor(WINDOW_COLOR);
    //     uploadModelView();
    //     CUBE.draw(gl, program, mode);
    //     popMatrix();
    //     popMatrix();
    // }

    function drawRightWindows(h) {
        multTranslation([0, h, 0])
        pushMatrix();
        multTranslation([-3, 8, 0])
        // multRotationY(90)
        multScale([2, 2, 16.5])
        changeColor(WINDOW_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([-3, 2, 0])
        //multRotationY(-45)
        multScale([2, 2, 16.5])
        changeColor(WINDOW_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([3, 2, 0])
        //multTranslation([1.5, 0.5, 0.7])
        // multRotationY(-45)
        multScale([2, 2, 16.5])
        changeColor(WINDOW_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([3, 8, 0])
        //multRotationY(-45)
        multScale([2, 2, 16.5])
        changeColor(WINDOW_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
    }

    function drawDor() {
        //multRotationY(45);
        multTranslation([-7.7, -1, -0.1])
        multScale([1, 5, 3.5])
        changeColor(HOSPITAL_DOOR_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
    }

    function drawBuildType1() {
        //multTranslation([0, 1.5, -8]);
        pushMatrix();
        multTranslation([0, 18, 0])
        //multRotationY(45);
        multScale([16, 44, 16])
        changeColor(BUILDING_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        drawDor();
        popMatrix();
        pushMatrix();
        drawLeftWindows(29);
        popMatrix();
        pushMatrix();
        drawLeftWindows(17);
        popMatrix();
        pushMatrix();
        drawLeftWindows(5);
        popMatrix();
        pushMatrix();
        drawRightWindows(29);
        popMatrix();
        pushMatrix();
        drawRightWindows(17);
        popMatrix();
        pushMatrix();
        drawRightWindows(5);
        popMatrix();
        //drawLeftWindowsOneSide(-3);
        pushMatrix();
        drawAlertLight();
        popMatrix();

    }

    function drawBridgeWindow(z) {
        pushMatrix()
        multTranslation([40, 20.4, z])
        //multRotationY(45)
        multScale([16, 2, 2])
        changeColor(WINDOW_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix()
    }
    function drawHospitalBridge() {
        //pushMatrix()
        //multTranslation([0, 0.5, 0])
        pushMatrix();
        multTranslation([40, 20.3, 0])
        multRotationY(90)
        multScale([25, 13.6, 15])
        changeColor(BUILDING_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([32.7, 20.4, 0])
        pushMatrix();
        multTranslation([0, 0, -2.2])
        //multRotationY(45)
        multScale([1, 4.2, 1])
        changeColor(H_HOSPITAL_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([0, 0, 2.2])
        //multRotationY(45)
        multScale([1, 4.2, 1])
        changeColor(H_HOSPITAL_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        multTranslation([0, 0, 0])
        //multRotationY(45)
        multScale([1, 1, 3.2])
        changeColor(H_HOSPITAL_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        drawBridgeWindow(-10);
        drawBridgeWindow(-5);
        drawBridgeWindow(10);
        drawBridgeWindow(5);
        //popMatrix();

    }

    function drawHospital() {
        multTranslation([1, 0, 0])
        pushMatrix();
        multTranslation([40, 4, -20]);
        drawBuildType1();
        popMatrix();
        pushMatrix();
        multTranslation([40, 4, 20])
        drawBuildType1();
        popMatrix();
        drawHospitalBridge();

    }

    function drawHeliport() {
        multTranslation(heliportPos)
        pushMatrix();
        multScale([20, 0.15, 20])
        changeColor(HELIPORT_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multScale([15, 0.2, 15])
        changeColor(O_OF_HELIPORT);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([0.1, 0, 2])
        multRotationY(90)
        multScale([0.3, 0.25, 7])
        changeColor(H_HELIPORT_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([0.1, 0, -2])
        multRotationY(90)
        multScale([0.3, 0.25, 7])
        changeColor(H_HELIPORT_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        multTranslation([0.1, 0, -0.1])
        multRotationY(0)
        multScale([0.5, 0.25, 3.3])
        changeColor(H_HELIPORT_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);

    }

    function drawTreeType1() {
        pushMatrix();
        multTranslation([0, 3.5, 0])
        multScale([1, 7, 1])
        changeColor(BOLE_TREE_COLOR);
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([0, 7, 0])
        multScale([4, 6, 4])
        changeColor(TREE_LEAVES_COLOR1);
        uploadModelView();
        CONE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([0, 9, 0])
        multScale([3.3, 6, 3.3])
        changeColor(TREE_LEAVES_COLOR2);
        uploadModelView();
        CONE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([0, 11, 0])
        multScale([2.8, 6, 2.8])
        changeColor(TREE_LEAVES_COLOR3);
        uploadModelView();
        CONE.draw(gl, program, mode);
        popMatrix();
    }

    function putTrees() {
        let theta = 0;
        for (let i = 0; i < 9; i++) {
            let x = heliportPos[0] + 20 * Math.cos(theta);
            let z = heliportPos[2] + 20 * Math.sin(theta);
            if (theta <= 70 || theta > 105) {
                pushMatrix();
                multTranslation([x, 0, z])
                drawTreeType1();
                popMatrix();
            }
            theta += 45;
        }

        theta = 0;
        for (let i = 0; i < 11; i++) {
            let x = heliportPos[0] + 25 * Math.cos(theta);
            let z = heliportPos[2] + 25 * Math.sin(theta);
            if ((theta <= 0 || theta > 30) && theta != 300) {
                pushMatrix();
                multTranslation([x, 0, z])
                drawTreeType1();
                popMatrix();
            }
            theta += 30;
        }
    }

    function drawRoad() {
        pushMatrix();
        multTranslation([6.5, 0.01, -20])
        multScale([53, 0.1, 6])
        changeColor(ROAD_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([-22, 0.01, -3])
        multScale([6, 0.1, 40])
        changeColor(ROAD_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([5.8, 0.01, -20])
        multScale([55, 0.101, 0.4])
        changeColor(ROAD_LINES_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        multTranslation([-22, 0.01, -1.9])
        multScale([0.4, 0.101, 37])
        changeColor(ROAD_LINES_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
    }

    function drawStreetLamp() {
        pushMatrix();
        multTranslation([20, 5, -25]);
        multScale([2, 10, 1]);
        changeColor(STAKE_LIGHT_COLOR);
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([20, 9, -25]);
        multRotationX(90);
        multScale([1, 3, 1]);
        changeColor(STAKE_LIGHT_COLOR);
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([20, 11, -25]);
        multScale([2, 2, 2]);
        changeColor(LIGHT_COLOR);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([20, 9, -23]);
        multScale([2, 2, 2]);
        changeColor(LIGHT_COLOR);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
        popMatrix();
        multTranslation([20, 9, -27]);
        multScale([2, 2, 2]);
        changeColor(LIGHT_COLOR);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
    }

    function putStreetLamps() {
        pushMatrix();
        drawStreetLamp();
        popMatrix();
        pushMatrix();
        multTranslation([-25, 0, 0]);
        drawStreetLamp();
        popMatrix();
        multTranslation([-50, 0, 25]);
        drawStreetLamp();
    }

    function drawAmbulance() {
        multTranslation([-20, 0, -20]);
        multScale([0.5, 0.5, 0.5]);
        pushMatrix();
        multTranslation([-40, 7, -40]);
        multScale([10, 10, 18]);
        changeColor(AMBULANCE_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([-40, 4, -30]);
        multScale([10, 4, 5]);
        changeColor(AMBULANCE_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([-40, 1, -32]);
        multRotationZ(90);
        multScale([3, 9, 3]);
        changeColor(AMBULANCE_WHEELS_COLOR);
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([-40, 1, -45]);
        multRotationZ(90);
        multScale([3, 9, 3]);
        changeColor(AMBULANCE_WHEELS_COLOR);
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([-40, 8, -32]);
        multScale([10, 4, 4]);
        changeColor(WINDOW_AMBULANCE_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        drawRedCross();
    }

    function drawRedCross() {
        pushMatrix();
        multTranslation([-45, 9, -45]);
        multScale([1, 4, 1]);
        changeColor(AMBULANCE_CROSS_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        multTranslation([-45, 9, -45]);
        multRotationX(90);
        multScale([1, 4, 1]);
        changeColor(AMBULANCE_CROSS_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
    }

    function drawCity() {
        pushMatrix();
        multRotationY(sceneR);
        pushMatrix();
        drawGround();
        popMatrix();
        pushMatrix();
        drawHospital();
        popMatrix();
        pushMatrix();
        drawHeliport();
        popMatrix();
        pushMatrix();
        drawHelicopter(heli.rotationV);
        popMatrix();
        putTrees();
        pushMatrix();
        drawRoad();
        popMatrix();
        pushMatrix();
        putStreetLamps();
        popMatrix();
        pushMatrix();
        drawAmbulance();
        popMatrix();
        renderBoxes();
        popMatrix();
    }


    function renderBoxes() {
        for (let i = 0; i < boxes.length; i++) {
            let deltaTime = (new Date().getTime() - boxes[i].time) / 1000;
            let velocity = boxes[i].velocity;
            if (boxes[i].pos[1] >= 0.5) {
                boxes[i].pos[0] += velocity[0] * deltaTime / 8;
                boxes[i].pos[1] += velocity[1];
                boxes[i].pos[2] += velocity[2] * deltaTime / 8;
            }
            if (deltaTime < 5) {
                pushMatrix();
                multTranslation(boxes[i].pos);
                multScale([2, 2, 2])
                changeColor(BOX_COLOR);
                uploadModelView();
                CUBE.draw(gl, program, mode);
                popMatrix();
            }
            boxes.slice(i, 1);
        }
    }


    function drawAlertLight() {
        alertLightColor[0] -= 0.008;
        if (alertLightColor[0] < 0)
            alertLightColor[0] = 1;
        multTranslation([0, 40, 0])
        multScale([1.2, 1.2, 1.2]);
        changeColor(alertLightColor);
        uploadModelView();
        CUBE.draw(gl, program, mode);


    }
    function normalize(vec3) {
        let length_of_v = Math.sqrt((vec3[0] ** 2) + (vec3[1] ** 2) + (vec3[2] ** 2));
        return [vec3[0] / length_of_v, vec3[1] / length_of_v, vec3[2] / length_of_v];
    }

    function render() {
        time++;
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(program);

        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));
        if (heli.onGround) {
            heli.rotationV /= 1.05;
        } else {
            heli.rotationV = 10 * time;
            heli.rotationAngle += heli.velocity;
        }

        moveHelicopeterBack()

        drawCity();
        if (heliCam) {
            let eyeX = heli.position[0];
            let eyeY = heli.position[1];
            let eyeZ = heli.position[2];
            let cV = [eyeX, eyeZ]
            let tV = [-cV[1], cV[0]]
            let at = [eyeX + tV[0], eyeY - RADIUS * Math.sin(heli.inclinationAngle * 2 * Math.PI / 360), eyeZ + tV[1]]
            mView = lookAt(heli.position, at, [0, 1, 0]);
            mProjection = perspective(30, aspect, 3, 2 * VP_DISTANCE);
            mView = mult(mView, rotateY(-sceneR))

        }
        loadMatrix(mView)
    }

    x.addEventListener('input', function () {
        let camX = VP_DISTANCE * Math.sin(x.value * 2 * Math.PI / 360)
            * Math.cos(y.value * 2 * Math.PI / 360);
        let camY = VP_DISTANCE * Math.sin(y.value * 2 * Math.PI / 360);
        let camZ = VP_DISTANCE * Math.cos(x.value * 2 * Math.PI / 360)
            * Math.cos(y.value * 2 * Math.PI / 360);
        console.log(x.value, camX, camY, camZ)
        mView = lookAt([camX, camY, camZ], [0, 0, 0], [0, 1, 0]);
    })
    y.addEventListener('input', function () {
        let camX, camY, camZ;
        camX = VP_DISTANCE * Math.sin(x.value * 2 * Math.PI / 360)
            * Math.cos(y.value * 2 * Math.PI / 360);
        camY = VP_DISTANCE * Math.sin(y.value * 2 * Math.PI / 360);
        camZ = VP_DISTANCE * Math.cos(x.value * 2 * Math.PI / 360)
            * Math.cos(y.value * 2 * Math.PI / 360);
        mView = lookAt([camX, camY, camZ], [0, 0, 0], [0, 1, 0]);
    })

}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))
