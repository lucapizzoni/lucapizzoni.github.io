/**
 * Practica #3 GPC
 * 
 * @author <lpizzon@ade.upv.es>, 2023
 */

// Modulos necesarios
import * as THREE from "../lib/three.module.js"
import { OrbitControls } from "../../lib/OrbitControls.module.js";
import {GUI} from "../lib/lil-gui.module.min.js";

// Variables de consenso
let renderer, scene, camera;

// Otras globales
let robot;
let brazo;
let antebrazo;
let nervios;
let manoObject;
let pinzaIzObject;
let pinzaDeObject;


let effectController;


let planta;
const L = 90;

// material
const material = new THREE.MeshNormalMaterial({wireframe : false, flatShading : true, side : THREE.DoubleSide});

// Acciones
init();
loadScene();
setupGUI();
render();

function init()
{
    // Motor de render
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xFFFFFF)
    renderer.autoClear = false
    document.getElementById("container").appendChild(renderer.domElement);

    // Escena
    scene = new THREE.Scene();
    //scene.background = new THREE.Color(1.0,1.0,1.0);

    // perspective Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(150, 250, 150);
    camera.lookAt(0, 120, 0);

    // Control de camara
    const controls = new OrbitControls(camera, renderer.domElement);
    //controls.target.set(0,120,0)

    // Configuracion de las camaras
    const ar = window.innerWidth / window.innerHeight;
    setCameras(ar);

    // Captura de eventos para redimension de la ventana
    window.addEventListener('resize', updateAspectRatio);

    window.addEventListener('keydown', (moveRobot));
}

function loadScene()
{
    // suelo
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(1000,1000,25, 25), material);
    suelo.rotation.x = -Math.PI/2;

    // robot
    robot = new THREE.Object3D();
    brazo = new THREE.Object3D();
    antebrazo = new THREE.Object3D();
    nervios = new THREE.Object3D();
    manoObject = new THREE.Object3D();
    pinzaIzObject = new THREE.Object3D();
    pinzaDeObject = new THREE.Object3D();

    // create geometries
    const geoBase = new THREE.CylinderGeometry( 50, 50, 15, 20 );
    const geoEje = new THREE.CylinderGeometry( 20, 20, 18, 20 );
    const geoEsparrago = new THREE.BoxGeometry( 18, 120, 12 ); 
    const geoRotula = new THREE.SphereGeometry( 20, 20, 20 );
    const geoDisco = new THREE.CylinderGeometry( 22, 22, 6, 20 );
    const geoNervio = new THREE.BoxGeometry( 4, 80, 4 ); 
    const geoMano = new THREE.CylinderGeometry( 15, 15, 40, 20 );
    
    // create meshes
    const base = new THREE.Mesh( geoBase, material );
    const eje = new THREE.Mesh( geoEje, material );
    const esparrago = new THREE.Mesh( geoEsparrago, material );
    const rotula = new THREE.Mesh( geoRotula, material );
    const disco = new THREE.Mesh( geoDisco, material );
    const nervio1 = new THREE.Mesh( geoNervio, material );
    const nervio2 = new THREE.Mesh( geoNervio, material );
    const nervio3 = new THREE.Mesh( geoNervio, material );
    const nervio4 = new THREE.Mesh( geoNervio, material );
    const mano = new THREE.Mesh( geoMano, material );
    const geoPinza = new THREE.BufferGeometry();

    // define vertices of pinza
    const vertices = new Float32Array( [
        // Cara frontal
        19.0, 10.0, 2.0, //v0-6
        0.0, 10.0, 2.0, //v1-7
        0.0, -10.0, 2.0, //v2-8
        19.0, -10.0, 2.0, //v3-9
        38.0, -5.0, 1.0, //v4-10
        38.0, 5.0, 1.0, //v5-11

        // Cara trasera
        19.0, 10.0, -2.0, //v6
        0.0, 10.0, -2.0, //v7
        0.0, -10.0, -2.0, //v8
        19.0, -10.0, -2.0, //v9
        38.0, -5.0, -1.0, //v10
        38.0, 5.0, -1.0 //v11
    ] );

    // define indices of pinza
    const indices = [
        // Cara frontal
        0, 1, 2,
        2, 3, 0,
        5, 0, 3,
        3, 4, 5,

        // Cara trasera
        6, 7, 8,
        8, 9, 6,
        11, 6, 9,
        9, 10, 11,

        // Caras laterales
        1, 7, 8,
        8, 2, 1,
        5, 11, 10,
        10, 4, 5,
        11, 6, 0,
        0, 5, 11,
        6, 7, 1,
        1, 0, 6,
        10, 9, 3,
        3, 4, 10,
        9, 8, 2,
        2, 3, 9
    ];
    
    geoPinza.setIndex( indices );

    geoPinza.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
    
    // create mesh of pinza
    const pinzaIz = new THREE.Mesh( geoPinza, material );
    const pinzaDe = new THREE.Mesh( geoPinza, material );
    
    // perform transformations to position meshes
    robot.position.y = 7,5;
    brazo.position.y = 13;
    eje.rotateX(-Math.PI/2);
    esparrago.position.y = 60;
    rotula.position.y = 120;
    antebrazo.position.y = 120;
    nervios.position.y = 40;
    nervio1.position.x = 7;
    nervio1.position.z = 7;
    nervio2.position.x = 7;
    nervio2.position.z = -7;
    nervio3.position.x = -7;
    nervio3.position.z = 7;
    nervio4.position.x = -7;
    nervio4.position.z = -7;
    manoObject.position.y = 80
    mano.rotateX(-Math.PI/2);
    pinzaIz.position.y = 3;
    pinzaDe.position.y = -3;
    pinzaIz.rotateX(-Math.PI/2);
    pinzaDe.rotateX(-Math.PI/2);

    // put toghether the robot 
    robot.add(base);
    base.add(brazo);
    brazo.add(eje);
    brazo.add(esparrago);
    brazo.add(rotula);
    brazo.add(antebrazo);
    antebrazo.add(disco);
    antebrazo.add(nervios);

    antebrazo.add(manoObject)
    manoObject.add(mano)
    nervios.add(nervio1);
    nervios.add(nervio2);
    nervios.add(nervio3);
    nervios.add(nervio4);
    mano.add(pinzaIzObject);
    mano.add(pinzaDeObject);
    pinzaIzObject.add(pinzaIz);
    pinzaDeObject.add(pinzaDe);

    // add to scene
    scene.add(suelo);
    scene.add(robot);

    //robot.add(planta)
}

function update(delta)
{
    robot.rotation.y = effectController.rotateBase * Math.PI/180;
    brazo.rotation.z = effectController.rotateArm * Math.PI/180;
    antebrazo.rotation.y = effectController.rotateForearmY * Math.PI/180;
    antebrazo.rotation.z = effectController.rotateForearmZ * Math.PI/180;
    manoObject.rotation.z = effectController.rotateHand * Math.PI/180;
    pinzaIzObject.position.y = effectController.separationPinza/2
    pinzaDeObject.position.y = -effectController.separationPinza/2
    if (effectController.wired) {
        material.wireframe = true;
    } else {
        material.wireframe = false;
    }
    
    //robot.position.set( 1+effectController.separacion/2,0,0);
    // cubo.position.set( 1+effectController.separacion/2,0,0);
    // esfera.position.set( -1-effectController.separacion/2,0,0);
    // suelo.material.setValues( { color: effectController.coloralambres });
    // esferaCubo.rotation.y = effectController.giroY * Math.PI/180;
}

function render(delta)
{
    requestAnimationFrame(render);

    update(delta);

    renderer.clear();
    let smallerDimension = Math.min(window.innerWidth, window.innerHeight);
    let secondCameraSize = smallerDimension / 4;

    let w = window.innerWidth;
    let h = window.innerHeight;

    // Vista de la cámara principal (perspectiva)
    renderer.setViewport(0, h-secondCameraSize, secondCameraSize,secondCameraSize);
    renderer.render(scene, planta);
    
    // Vista de la cámara de planta
    renderer.setViewport(0, 0, w, h);
    renderer.render(scene, camera);
}

function setCameras(ar){
    // creacion de las camaras
    // ar -> aspect ratio (rel. de aspecto)
    let camaraOrto;
    if(ar>1) 
        camaraOrto = new THREE.OrthographicCamera(-L, L, L, -L, -200, 200);
    else 
        camaraOrto = new THREE.OrthographicCamera(-L, L, L, -L, -200, 200);

    planta = camaraOrto.clone();
    planta.position.set(0,L,0);
    planta.lookAt(0,0,0);
    planta.up = new THREE.Vector3(0,0,-1); // Cambia el vector UP de la camara porque mira hacia abajo
}

function updateAspectRatio() {
    // Cada vez que se cambie el tamayo de la ventana, se llama a esta funcion
    // Cambiar las dimensiones del canvas
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Nuevo ar de la camara
    const ar = window.innerWidth / window.innerHeight

    // perspectiva
    camera.aspect = ar;
    camera.updateProjectionMatrix();

    // ortografica
    // en funcion del ar, se cambia la camara
    if(ar > 1){
        planta.left = -L;
        planta.right = L;
        planta.bottom = -L;
        planta.top = L;
    }
    else {
        planta.left = -L;
        planta.right = L;
        planta.bottom = -L;
        planta.top = L;

    }

    // actualizar matrices de proyeccion
    planta.updateProjectionMatrix();
}

function moveRobot(event) {
    const speed = 5
    switch (event.key) {
        case 'ArrowUp':
            robot.position.z -= speed; // Move the robot forward
            break;
        case 'ArrowDown':
            robot.position.z += speed; // Move the robot backward
            break;
        case 'ArrowLeft':
            robot.position.x -= speed; // Move the robot left
            break;
        case 'ArrowRight':
            robot.position.x += speed; // Move the robot right
            break;
      }
}

function setupGUI() {
    // Definicion del objeto controlador
    effectController = {
        rotateBase: 0.0,
        rotateArm: 0.0,
        rotateForearmY : 0.0,
        rotateForearmZ : 0.0,
        rotateHand : 0.0,
        separationPinza : 0.0,
        wired: false,
        animate: animate
        // mensaje: 'Soldado y Robot',
        // giroY: 0.0,
        // separacion: 0,
        // coloralambres: 'rgb(150,150,150)'
    }

    // Crear la GUI
    const gui = new GUI();
    const h = gui.addFolder("Control Robot");
    h.add(effectController,"rotateBase",-180.0,180.0,0.025).name("Rotate base").listen();
    h.add(effectController,"rotateArm",-45.0,45.0,0.025).name("Rotate arm").listen();
    h.add(effectController,"rotateForearmY",-180.0,180.0,0.025).name("Rotate forearm Y").listen();
    h.add(effectController,"rotateForearmZ",-90.0,90.0,0.025).name("Rotate forearm Y").listen();
    h.add(effectController,"rotateHand",-40.0,220.0,0.025).name("Rotate hand").listen();
    h.add(effectController,"separationPinza",0.0,15.0,0.025).name("Separation pinza").listen();
    h.add(effectController, "wired").name("Wireframe");
    h.add(effectController, "animate").name("Animate");


    // gui.add(effectController,"mensaje").name("Aplicacion");
    // gui.add(effectController,"giroY",-180.0,180.0,0.025).name("Giro en Y").listen();
    // gui.add(effectController,"separacion",{'Ninguna':0, 'Media': 2, 'Total':5}).name("Separacion");
    // gui.addColor(effectController,"coloralambres").name("Color alambres");


}

function animate(){
    renderer.clear();
    const rotationSpeed = 10;

    //alert('Button clicked!');
    requestAnimationFrame(animate);

    // Rotate the cube around the Y-axis
    robot.rotation.y += rotationSpeed;
  
    // Render the scene with the camera
    renderer.render(scene, camera);
    //renderer.render(scene, planta);
}