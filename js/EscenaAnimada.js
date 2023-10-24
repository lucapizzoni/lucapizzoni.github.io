/**
 * Escena.js
 * 
 * Seminario #2 GPC: Pintar una escena basica con transformaciones,
 * animacion y modelos importados.
 * 
 * @author <rvivo@upv.es>, 2023
 */

// Modulos necesarios
import * as THREE from "../lib/three.module.js"
import {GLTFLoader} from "../lib/GLTFLoader.module.js"
import {OrbitControls} from "../lib/OrbitControls.module.js"
import {TWEEN} from "../lib/tween.module.min.js"

// Variables de consenso
let renderer, scene, camera;

// Otras globales
let esferaCubo;
let angulo = 0;
let cameraControls;

// Acciones
init();
loadScene();
render();


function init()
{
    // Motor de render
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight);
    document.getElementById("container").appendChild( renderer.domElement );

    // Escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0.7,0.9,0.9);

    // Camara
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set( 0.5, 2, 7 );
    cameraControls = new OrbitControls( camera, renderer.domElement );
    cameraControls.target.set( 0,1,0 );
    camera.lookAt( 0, 1, 0 );

    // Eventos atendidos
    window.addEventListener('resize',updateAspectRatio);
    renderer.domElement.addEventListener('dblclick', animate );

}

function loadScene()
{
    const material = new THREE.MeshBasicMaterial( {color:'darkblue', wireframe: true} );

    const geoCubo = new THREE.BoxGeometry( 2,2,2 );
    const geoEsfera = new THREE.SphereGeometry( 1, 20,20 );

    const cubo = new THREE.Mesh( geoCubo, material );
    const esfera = new THREE.Mesh( geoEsfera, material );

    esferaCubo = new THREE.Object3D();

    cubo.position.set( 1,0,0 );
    esfera.position.set( -1,0,0 );

    esferaCubo.position.set(0,1,0);

    scene.add(esferaCubo);
    esferaCubo.add( cubo );
    esferaCubo.add(esfera);

    // Suelo
    const suelo = new THREE.Mesh( new THREE.PlaneGeometry(10,10, 10,10), material );
    suelo.rotation.x = -Math.PI/2;

    // Importar un modelo JSON
    const loader = new THREE.ObjectLoader();
    loader.load( 'models/soldado/soldado.json',
                 function(objeto){
                    cubo.add(objeto);
                    objeto.position.set(0,1,0);
                    objeto.rotation.y = Math.PI;
                    objeto.name = 'soldado';
                 }
    );

    // Importar modelo en GLTF
    const gltfloader = new GLTFLoader();
    gltfloader.load('models/robota/scene.gltf',
                    function( gltf ){
                        gltf.scene.position.y = 1;
                        gltf.scene.rotation.y = Math.PI/2;
                        gltf.scene.name = 'robot';
                        //gltf.scene.scale.set( 0.01, 0.01, 0.01 );
                        esfera.add( gltf.scene );
                    });

    scene.add( suelo );
    scene.add( new THREE.AxisHelper(2) );

}

function updateAspectRatio()
{
    renderer.setSize(window.innerWidth,window.innerHeight);
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
}

function animate(event)
{
    // Capturar posicion del click
    let x = event.clientX;
    let y = event.clientY;

    // Normalizar al cuadrado de 2x2
    x = ( x / window.innerWidth ) * 2 - 1;
    y = -(y / window.innerHeight ) * 2 + 1;

    // Construir el rayo
    const rayo = new THREE.Raycaster();
    rayo.setFromCamera( new THREE.Vector2(x,y), camera );

    // Intersecciones con soldado y robot
    const soldado = scene.getObjectByName('soldado');
    let intersecciones = rayo.intersectObject(soldado,false);
    if( intersecciones.length > 0 ){
        console.log("Tocado!")
        // Animacion
        new TWEEN.Tween( soldado.position )
        .to( {x:[0,0], y:[3,1], z:[0,0]}, 2000 )
        .interpolation( TWEEN.Interpolation.Bezier )
        .easing( TWEEN.Easing.Bounce.Out )
        .start();
    }

    const robot = scene.getObjectByName('robot');
    intersecciones = rayo.intersectObjects(robot.children,true);
    if( intersecciones.length > 0 ){
        console.log("Tocado!")
        // Animacion
        new TWEEN.Tween( robot.rotation )
        .to( {x:[0,0], y:[-Math.PI,Math.PI/2], z:[0,0]}, 5000 )
        .interpolation( TWEEN.Interpolation.Linear )
        .easing( TWEEN.Easing.Exponential.InOut )
        .start();
    }

}

function update(delta)
{
    //angulo += 0.01;
    //esferaCubo.rotation.y = angulo ;

    TWEEN.update(delta);

}

function render(delta)
{
    requestAnimationFrame( render );
    update(delta);
    renderer.render( scene, camera );

}