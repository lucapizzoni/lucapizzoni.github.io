/**
 * Practica #2 GPC
 * 
 * @author <lpizzon@ade.upv.es>, 2023
 */

// Modulos necesarios
import * as THREE from "../lib/three.module.js"

// Variables de consenso
let renderer, scene, camera;

// Otras globales
let robot;
let brazo;
let antebrazo;
let nervios;

// Acciones
init();
loadScene();
render();

function init()
{
    // Motor de render
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("container").appendChild(renderer.domElement);

    // Escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(1.0,1.0,1.0);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(150, 250, 150);
    camera.lookAt(0, 120, 0);
}

function loadScene()
{
    // material
    const material = new THREE.MeshBasicMaterial( {color:'red', wireframe: true} ); 

    // suelo
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(1000,1000,25, 25), material);
    suelo.rotation.x = -Math.PI/2;

    // robot
    robot = new THREE.Object3D();
    brazo = new THREE.Object3D();
    antebrazo = new THREE.Object3D();
    nervios = new THREE.Object3D();

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
    brazo.position.y = 10;
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
    mano.position.y = 80
    mano.rotateX(-Math.PI/2);
    pinzaIz.position.y = 10;
    pinzaDe.position.y = -10;
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
    antebrazo.add(mano);
    nervios.add(nervio1);
    nervios.add(nervio2);
    nervios.add(nervio3);
    nervios.add(nervio4);
    mano.add(pinzaIz);
    mano.add(pinzaDe);

    // add to scene
    scene.add(suelo);
    scene.add(robot);
}

function update()
{
    
}

function render()
{
    requestAnimationFrame(render);
    update();
    renderer.render(scene, camera);
}