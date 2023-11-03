/**
 * Practica #3 GPC
 * 
 * @author <lpizzon@ade.upv.es>, 2023
 */

// Modulos necesarios
import * as THREE from "../lib/three.module.js"
import { OrbitControls } from "../../lib/OrbitControls.module.js";
import {GUI} from "../lib/lil-gui.module.min.js";
import {TWEEN} from "../lib/tween.module.min.js";

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
const texSuelo = new THREE.TextureLoader().load("images/pisometalico_1024.jpg");
const texMetal = new THREE.TextureLoader().load("images/metal_128.jpg");
const surrounding = [
    "images/posx.jpg","images/negx.jpg",
    "images/posy.jpg","images/negy.jpg",
    "images/posz.jpg","images/negz.jpg",
]
const texRotula= new THREE.CubeTextureLoader().load(surrounding)

const material = new THREE.MeshNormalMaterial({wireframe : false, flatShading : true, side : THREE.DoubleSide});
const matSuelo = new THREE.MeshLambertMaterial({ color: 'white', map: texSuelo });
const matMetalMat = new THREE.MeshLambertMaterial({ color: 'white', map: texMetal });
const matMetalShiny = new THREE.MeshPhongMaterial({ color: 'white', specular: 0xFFFFFF, map: texMetal});
const matPinza = new THREE.MeshPhongMaterial({ color: 'white', specular: 0xFFFFFF, map: texMetal, side : THREE.DoubleSide });
const matRotula = new THREE.MeshPhongMaterial({color:"white",specular:"gray",shininess:30,envMap:texRotula})

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

    // shadows
    renderer.shadowMap.enabled = true;
    renderer.antialias = true;
    
    // Escena
    scene = new THREE.Scene();
    //scene.background = new THREE.Color(1.0,1.0,1.0);

    // perspective Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 10000);
    camera.position.set(300, 300, 300);
    camera.lookAt(0, 120, 0);

    // Control de camara
    const controls = new OrbitControls(camera, renderer.domElement);

    // Configuracion de las camaras
    const ar = window.innerWidth / window.innerHeight;
    setCameras(ar);

    // Lighting
    // ambient
    const ambientLight = new THREE.AmbientLight( 0x404040, 0.5 );
    scene.add( ambientLight );
    // directional
    const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
    directionalLight.position.set(0, 600, 500);
    directionalLight.target.position.set(0, 0, 0);
    directionalLight.shadow.camera.far = 2000; 
    directionalLight.shadow.mapSize.width = 10000;
    directionalLight.shadow.mapSize.height = 10000;
    directionalLight.shadow.camera.left = -500;
    directionalLight.shadow.camera.right = 500;
    directionalLight.shadow.camera.top = 500;
    directionalLight.shadow.camera.bottom = -500;
    directionalLight.castShadow = true;
    scene.add(directionalLight.target);
    scene.add(directionalLight);
    //scene.add(new THREE.CameraHelper(directionalLight.shadow.camera));
    
    // spot 1
    const spotLight = new THREE.SpotLight('white', 0.3);
    spotLight.position.set(500, 600, 0);
    spotLight.target.position.set(0, 0, 0);
    spotLight.shadow.camera.far = 2000; 
    spotLight.shadow.mapSize.width = 10000;
    spotLight.shadow.mapSize.height = 10000;
    spotLight.castShadow = true;
    scene.add(spotLight.target);
    scene.add(spotLight);
    //scene.add(new THREE.CameraHelper(spotLight.shadow.camera));

    // spot 2
    const spotLight2 = new THREE.SpotLight('white', 0.3);
    spotLight2.position.set(-500, 600, 0);
    spotLight2.target.position.set(0, 0, 0);
    spotLight2.shadow.camera.far = 2000; 
    spotLight2.shadow.mapSize.width = 10000;
    spotLight2.shadow.mapSize.height = 10000;
    spotLight2.castShadow = true;
    scene.add(spotLight2.target);
    scene.add(spotLight2);

    // Captura de eventos para redimension de la ventana
    window.addEventListener('resize', updateAspectRatio);

    window.addEventListener('keydown', (moveRobot));
}

function loadScene(){
    // Habitacion
    const walls = [];
    walls.push(new THREE.MeshBasicMaterial({side: THREE.BackSide, map: new THREE.TextureLoader().load("images/posx.jpg")}));
    walls.push(new THREE.MeshBasicMaterial({side: THREE.BackSide, map: new THREE.TextureLoader().load("images/negx.jpg")}));
    walls.push(new THREE.MeshBasicMaterial({side: THREE.BackSide, map: new THREE.TextureLoader().load("images/posy.jpg")}));
    walls.push(new THREE.MeshBasicMaterial({side: THREE.BackSide, map: new THREE.TextureLoader().load("images/negy.jpg")}));
    walls.push(new THREE.MeshBasicMaterial({side: THREE.BackSide, map: new THREE.TextureLoader().load("images/posz.jpg")}));
    walls.push(new THREE.MeshBasicMaterial({side: THREE.BackSide, map: new THREE.TextureLoader().load("images/negz.jpg")}));

    const geoRoom = new THREE.BoxGeometry(1000,1000,1000);
    const room = new THREE.Mesh(geoRoom, walls);
    room.position.y = 495;
    scene.add(room)

    // suelo
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(1000,1000,25, 25), matSuelo);
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
    const geoEsparrago = new THREE.BoxGeometry( 18, 120, 12);
    const geoRotula = new THREE.SphereGeometry( 20, 20, 20 );
    const geoDisco = new THREE.CylinderGeometry( 22, 22, 6, 20 );
    const geoNervio = new THREE.BoxGeometry( 4, 80, 4 ); 
    const geoMano = new THREE.CylinderGeometry( 15, 15, 40, 20 );
    
    // create meshes
    const base = new THREE.Mesh( geoBase, matMetalMat );
    const eje = new THREE.Mesh( geoEje, matMetalMat );
    const esparrago = new THREE.Mesh( geoEsparrago, matMetalMat );
    const rotula = new THREE.Mesh( geoRotula, matRotula );
    const disco = new THREE.Mesh( geoDisco, matMetalMat );
    const nervio1 = new THREE.Mesh( geoNervio, matMetalMat );
    const nervio2 = new THREE.Mesh( geoNervio, matMetalMat );
    const nervio3 = new THREE.Mesh( geoNervio, matMetalMat );
    const nervio4 = new THREE.Mesh( geoNervio, matMetalMat );
    const mano = new THREE.Mesh( geoMano, matMetalShiny );
    
    const geoPinza = new THREE.BufferGeometry();

    // define vertices of pinza
    const vertices = new Float32Array( [
        19.0, 10.0, 2.0, //v0-6
        0.0, 10.0, 2.0, //v1-7
        0.0, -10.0, 2.0, //v2-8
        19.0, -10.0, 2.0, //v3-9
        38.0, -5.0, 1.0, //v4-10
        38.0, 5.0, 1.0, //v5-11

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

    const uvs = new Float32Array([
        0, 0, // UV for vertex 0
        1, 0, // UV for vertex 1
        1, 1, // UV for vertex 2
        0, 1, // UV for vertex 3
        // ... and so on for all vertices
    ]);
    
    
    geoPinza.setIndex( indices );
    geoPinza.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
    geoPinza.computeVertexNormals();
    
    // create mesh of pinza
    const pinzaIz = new THREE.Mesh(geoPinza, matPinza);
    const pinzaDe = new THREE.Mesh(geoPinza, matPinza);
    
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

    // shadow
    suelo.receiveShadow = true;
    base.receiveShadow = true;
    base.castShadow = true;
    eje.receiveShadow = true;
    eje.castShadow = true;
    esparrago.receiveShadow = true;
    esparrago.castShadow = true;
    rotula.receiveShadow = true;
    rotula.castShadow = true;
    disco.receiveShadow = true;
    disco.castShadow = true;
    mano.receiveShadow = true;
    mano.castShadow = true;
    nervio1.receiveShadow = true;
    nervio1.castShadow = true;
    nervio2.receiveShadow = true;
    nervio2.castShadow = true;
    nervio3.receiveShadow = true;
    nervio3.castShadow = true;
    nervio4.receiveShadow = true;
    nervio4.castShadow = true;
    pinzaIz.receiveShadow = true;
    pinzaIz.castShadow = true;
    pinzaDe.receiveShadow = true;
    pinzaDe.castShadow = true;

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
        matMetalMat.wireframe = true;
        matMetalShiny.wireframe = true;
        matPinza.wireframe = true;
        matRotula.wireframe = true;
    } else {
        material.wireframe = false;
        matMetalMat.wireframe = false;
        matMetalShiny.wireframe = false;
        matPinza.wireframe = false;
        matRotula.wireframe = false;
    }

    TWEEN.update(delta);
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
        separationPinza : 15.0,
        wired: false,
        animate: animate
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

}

function animate(){
    
    // rotate
    const initial = 0;
    const target = - Math.PI / 3;
    const initalPosition = 15;
    const targetPosition = 0;


    const forward = new TWEEN.Tween({ rotation: initial, y: initalPosition})
        .to({ rotation: target, y: targetPosition }, 2000)
        .onUpdate((coords) => {
            effectController.rotateBase = coords.rotation / Math.PI * 180;
            effectController.rotateArm = coords.rotation / Math.PI * 180;
            effectController.rotateForearmY = coords.rotation / Math.PI * 180;
            effectController.rotateForearmZ = coords.rotation / Math.PI * 180;
            effectController.rotateHand = coords.rotation / Math.PI * 180;
            effectController.separationPinza = coords.y;
        });

    const back1 = new TWEEN.Tween({ rotation: target, y: targetPosition })
        .to({ rotation: initial, y: initalPosition }, 2000)
        .onUpdate((coords) => {
            effectController.rotateBase = coords.rotation / Math.PI * 180;
            effectController.rotateArm = coords.rotation / Math.PI * 180;
            effectController.rotateForearmY = coords.rotation / Math.PI * 180;
            effectController.rotateForearmZ = coords.rotation / Math.PI * 180;
            effectController.rotateHand = coords.rotation / Math.PI * 180;
            effectController.separationPinza = coords.y;
        });

        const backward = new TWEEN.Tween({ rotation: initial, y: initalPosition})
            .to({ rotation: -target, y: targetPosition }, 2000)
            .onUpdate((coords) => {
                effectController.rotateBase = coords.rotation / Math.PI * 180;
                effectController.rotateArm = coords.rotation / Math.PI * 180;
                effectController.rotateForearmY = coords.rotation / Math.PI * 180;
                effectController.rotateForearmZ = coords.rotation / Math.PI * 180;
                effectController.rotateHand = coords.rotation / Math.PI * 180;
                effectController.separationPinza = coords.y;
            });

        const back2 = new TWEEN.Tween({ rotation: -target, y: targetPosition })
            .to({ rotation: initial, y: initalPosition }, 2000)
            .onUpdate((coords) => {
                effectController.rotateBase = coords.rotation / Math.PI * 180;
                effectController.rotateArm = coords.rotation / Math.PI * 180;
                effectController.rotateForearmY = coords.rotation / Math.PI * 180;
                effectController.rotateForearmZ = coords.rotation / Math.PI * 180;
                effectController.rotateHand = coords.rotation / Math.PI * 180;
                effectController.separationPinza = coords.y;
            });
    
    


    
        
    forward.chain(back1);
    back1.chain(backward);
    backward.chain(back2);
    forward.start();
 
}