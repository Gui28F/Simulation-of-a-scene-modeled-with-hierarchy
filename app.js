import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../libs/utils.js";
import { ortho, lookAt, flatten, vec3, scale, rotateZ, mult, rotateY, subtract, add, scalem, translate } from "../libs/MV.js";
import { modelView, loadMatrix, multRotationY, multScale, multRotationX, multRotationZ, pushMatrix, popMatrix, multTranslation } from "../libs/stack.js";
import * as CYLINDER from '../libs/objects/cylinder.js';
import * as SPHERE from '../libs/objects/sphere.js';
import * as CUBE from '../libs/objects/cube.js';
import * as CONE from '../libs/objects/cone.js';


const LANDING_PA_SKIDS_COLOR = vec3(1, 1, 0.35);
const LANDING_PE_SKIDS_COLOR = vec3(0.5, 0.5, 0.5);
const CABINE_COLOR = vec3(1, 0, 0);
const BLADE_COLOR = vec3(0, 0, 1);
const ROTOR_COLOR = vec3(1, 1, 0.35);
const GROUND_COLOR = vec3(0, 0.5, 0);
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
let alertLightColor = vec3(1, 0, 0);
/** @type WebGLRenderingContext */
let gl;

let mode;               // Drawing mode (gl.LINES or gl.TRIANGLES)
const VP_DISTANCE = 60;
let uColor;
let heliCam = false;
let heli = {
    position: [-22, 1, 22], rotationV: 0,
    onGround: true, inclinationAngle: 0,
    maxInclinationAngle: 30, velocity: 0,
    r: 135
};

let sceneR = 60;
let heliportPos = structuredClone([heli.position[0], 0, heli.position[2]]);
let boxes = [];

let x = document.getElementById('x');
let y = document.getElementById('y');

function setup(shaders) {
    let canvas = document.getElementById("gl-canvas");
    let aspect = canvas.width / canvas.height;

    gl = setupWebGL(canvas);

    let program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);
    uColor = gl.getUniformLocation(program, "uColor")
    let mProjection = ortho(-VP_DISTANCE * aspect, VP_DISTANCE * aspect, -VP_DISTANCE, VP_DISTANCE, -3 * VP_DISTANCE, 3 * VP_DISTANCE);
    loadMatrix(lookAt([0, VP_DISTANCE / 4, VP_DISTANCE], [0, 0, 0], [0, 1, 0]));
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
                    loadMatrix(lookAt([0, VP_DISTANCE / 4, VP_DISTANCE], [0, 0, 0], [0, 1, 0]));
                } else
                    disableSliders();
                heliCam = !heliCam;
                break
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
        loadMatrix(lookAt([camX, camY, camZ], [0, 0, 0], [0, 1, 0]));
    }

    function setUpView() {
        disableSliders();
        let sR = sceneR * 2 * Math.PI / 360;
        let camX = VP_DISTANCE * Math.sin(sR)
            * Math.cos(Math.PI / 2);
        let camY = VP_DISTANCE * Math.sin(Math.PI / 2);
        let camZ = VP_DISTANCE * Math.cos(sR)
            * Math.cos(Math.PI / 2);
        loadMatrix(lookAt([camX, camY, camZ], [0, 0, 0], [0, 1, 0]));
    }

    function setRightView() {
        disableSliders();
        let sR = sceneR * 2 * Math.PI / 360;
        let camX = VP_DISTANCE * Math.sin(sR - 3 * Math.PI / 2)
            * Math.cos(0);
        let camY = VP_DISTANCE * Math.sin(0);
        let camZ = VP_DISTANCE * Math.cos(sR - 3 * Math.PI / 2)
            * Math.cos(0);
        loadMatrix(lookAt([camX, camY, camZ], [0, 0, 0], [0, 1, 0]));
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
        let box = { time: new Date().getTime(), pos: structuredClone([heli.position[0], heli.position[1] - 0.9, heli.position[2]]), r: JSON.parse(JSON.stringify(heli.r)) };
        boxes.push(box)
    }

    function dist(pos1, pos2) {
        return Math.sqrt((pos1[0] - pos2[0]) ** 2 + (pos1[1] - pos2[1]) ** 2)
    }

    function moveHelicopeterFront() {
        if (!heli.onGround) {
            if (heli.velocity + 0.05 <= 1)
                heli.velocity += 0.05;
            if (heli.inclinationAngle + 1.5 <= heli.maxInclinationAngle)
                heli.inclinationAngle += 1.5;
        }

    }

    function moveHelicopeterBack() {
        if (!heli.onGround) {
            if (heli.velocity - 0.05 >= -1)
                heli.velocity -= 0.05;
            if (heli.inclinationAngle - 1.5 >= -30)
                heli.inclinationAngle -= 1.5;
        }

    }

    function moveHelicopeterUP() {
        if (heli.rotationV > 100 && heli.position[1] < 80)
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

    function drawHelicopter(x, y, z, r) {

        if (!heli.onGround) {
            heli.position[0] = 30 * Math.cos(heli.r * 2 * Math.PI / 360);
            heli.position[2] = 30 * Math.sin(heli.r * 2 * Math.PI / 360);
        }


        multTranslation([x, y, z]);
        multRotationY(90)//TODO
        multRotationY(-heli.r)
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
   /* function drawLeftWindowsOneSide(h) {
        pushMatrix()
        multTranslation([0, h, 0])
        pushMatrix();
        multTranslation([1.6, 2, 1])
        changeColor(WINDOW_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([1.6, 2, -1])
        changeColor(WINDOW_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([1.6, 0.5, 1])
        changeColor(WINDOW_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
        multTranslation([1.6, 0.5, -1])
        changeColor(WINDOW_COLOR);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();
        popMatrix();
    }*/

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
            pushMatrix();
                multTranslation([32.7, 20.4, -2.2])
                //multRotationY(45)
                multScale([1, 4.2, 1])
                changeColor(H_HOSPITAL_COLOR);
                uploadModelView();
                CUBE.draw(gl, program, mode);
            popMatrix();
            pushMatrix();
                multTranslation([32.7, 20.4, 2.2])
                //multRotationY(45)
                multScale([1, 4.2, 1])
                changeColor(H_HOSPITAL_COLOR);
                uploadModelView();
                CUBE.draw(gl, program, mode);
            popMatrix();
            multTranslation([32.7, 20.4, 0])
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
        multTranslation([2, 0, -4])//TODO alterei os valores
        multScale([1, 0.8, 0.8])//TODO
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
            multScale([10, 0.15, 10])
            changeColor(HELIPORT_COLOR);
            uploadModelView();
            CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
            multTranslation([0.1, 0, 2])
            multRotationY(90)
            multScale([0.5, 0.151, 7])
            changeColor(H_HELIPORT_COLOR);
            uploadModelView();
            CUBE.draw(gl, program, mode);
        popMatrix();    
        pushMatrix();
            multTranslation([0.1, 0, -2])
            multRotationY(90)
            multScale([0.5, 0.151, 7])
            changeColor(H_HELIPORT_COLOR);
            uploadModelView();
            CUBE.draw(gl, program, mode);
        popMatrix();
            multTranslation([0.1, 0, 0])//TODO
            multRotationY(0)
            multScale([0.5, 0.151, 3.3])
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
            let x = heliportPos[0] + 10 * Math.cos(theta);
            let z = heliportPos[2] + 10 * Math.sin(theta);
            if (theta <= 70 || theta > 105){
                pushMatrix();
                    multTranslation([x, 0, z])
                    drawTreeType1();
                popMatrix();
            }        
            theta += 35;
        }

        theta = 0;
        for (let i = 0; i < 11; i++) {
            let x = heliportPos[0] + 20 * Math.cos(theta);
            let z = heliportPos[2] + 20 * Math.sin(theta);
            if ((theta <= 0 || theta > 30) && theta != 300){
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
            multTranslation([7, 0.01, -20])//TODO
            multScale([54, 0.1, 6])//TODO
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
            multTranslation([6.3, 0.01, -20.2])//TODO
            multScale([57, 0.101, 0.4])//TODO
            changeColor(ROAD_LINES_COLOR);
            uploadModelView();
            CUBE.draw(gl, program, mode);
        popMatrix();
        pushMatrix();
            multTranslation([-22, 0.01, -1.9])
            multScale([0.4, 0.101, 37])
            changeColor(ROAD_LINES_COLOR);
            uploadModelView();
            CUBE.draw(gl, program, mode);
        popMatrix();


    }

    function drawCity() {
        pushMatrix();
            multRotationY(60);
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
            drawHelicopter(heli.position[0], heli.position[1], heli.position[2], heli.rotationV);
        popMatrix();
    
        putTrees();
   
        pushMatrix();
            drawRoad();
        popMatrix();    
            renderBoxes();
        popMatrix();
    }


    function renderBoxes() {
        for (let i = 0; i < boxes.length; i++) {
            if (boxes[i].pos[1] >= 0.5)
                boxes[i].pos[1] -= 0.3;
            if (new Date().getTime() - boxes[i].time < 5000) {
                pushMatrix();
                //multRotationY(boxes[i].r)//TODO

                //console.log(3*Math.cos(heli.r))
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

        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(program);

        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));
        if (heli.onGround) {
            heli.rotationV /= 1.05;
        } else {
            heli.rotationV += 10;
            heli.r += Math.max(-0.2, Math.min(heli.velocity, 0.2));
        }

        drawCity();
        if (heliCam) {
            let eyeX = (heli.position[0]) ;
            let eyeY = heli.position[1];
            let eyeZ = (heli.position[2]);
            //let m = lookAt([eyeX, eyeY, eyeZ], [eyeX+1 , eyeY, eyeZ], [0, 1, 0]);
            console.log(heli.position)
            let cV = [eyeX, eyeZ]
            let tV = [-cV[1], cV[0]]
            let at = ([tV[0], eyeY, tV[1]]);
            
            // console.log(at)
            let m = lookAt([eyeX, eyeY, eyeZ], at, [0, 1, 0]);
            mProjection = ortho((eyeX - 1), (eyeX + 1), (eyeY - 1), (eyeY + 1), 50, VP_DISTANCE);
            //m = mult(rotateY(heli.r), m)
            loadMatrix(m)
        }

    }

    x.addEventListener('input', function () {
        let camX = VP_DISTANCE * Math.sin(x.value * 2 * Math.PI / 360)
            * Math.cos(y.value * 2 * Math.PI / 360);
        let camY = VP_DISTANCE * Math.sin(y.value * 2 * Math.PI / 360);
        let camZ = VP_DISTANCE * Math.cos(x.value * 2 * Math.PI / 360)
            * Math.cos(y.value * 2 * Math.PI / 360);
        console.log(x.value, camX, camY, camZ)
        loadMatrix(lookAt([camX, camY, camZ], [0, 0, 0], [0, 1, 0]));
    })
    y.addEventListener('input', function () {
        let camX, camY, camZ;
        camX = VP_DISTANCE * Math.sin(x.value * 2 * Math.PI / 360)
            * Math.cos(y.value * 2 * Math.PI / 360);
        camY = VP_DISTANCE * Math.sin(y.value * 2 * Math.PI / 360);
        camZ = VP_DISTANCE * Math.cos(x.value * 2 * Math.PI / 360)
            * Math.cos(y.value * 2 * Math.PI / 360);
        loadMatrix(lookAt([camX, camY, camZ], [0, 0, 0], [0, 1, 0]));
    })

}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))
