/**
 * proyecto.js
 * 
 * @author <lpizzon@ade.upv.es>, 2023
 */

// Modules
import * as THREE from "../lib/three.module.js"
import {GLTFLoader} from "../lib/GLTFLoader.module.js"
import { OrbitControls } from "../../lib/OrbitControls.module.js";

// Global variables
let renderer, scene, camera;
let cameraHelper;
let t = 0;
let curveRight;
let lane = 0;
let car;
let mixer;
let speed = 0.001;

// Actions
init();
loadScene();
render();

function init(){
    // Render engine
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("container").appendChild(renderer.domElement);

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xb8ddfa);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(0, 100, 0);
    camera.lookAt(0, 1, 0);

    // Control of camera
    const controls = new OrbitControls(camera, renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight( 0x404040 );
    scene.add( ambientLight );
    // const hemisphereLight = new THREE.HemisphereLight( 0xffffbb, 0x080820, 0.4 );
    // scene.add( hemisphereLight );
    const directionalLight1 = new THREE.DirectionalLight( 0xffffff, 0.5 );
    directionalLight1.position.set(50, 30, 0);
    const directionalLight2 = new THREE.DirectionalLight( 0xffffff, 0.5 );
    directionalLight2.position.set(-50, 30, 0);
    const directionalLight3 = new THREE.DirectionalLight( 0xffffff, 0.5 );
    directionalLight3.position.set(0, 30, 50);
    const directionalLight4 = new THREE.DirectionalLight( 0xffffff, 0.5 );
    directionalLight4.position.set(0, 30, -50);
    scene.add( directionalLight1 );
    scene.add( directionalLight2 );
    scene.add( directionalLight3 );
    scene.add( directionalLight4 );

    // Events
    window.addEventListener('resize',updateAspectRatio);
    window.addEventListener('keydown', (changeLane));
}

function loadScene(){
    // Import model
    const gltfloader = new GLTFLoader();
    gltfloader.load(
        'models/scene/scene.gltf',
        function( gltf ){

            scene.add( gltf.scene );

        })
    
    gltfloader.load(
        'models/car/scene.gltf',
        function( gltf ){

            gltf.scene.scale.set(0.006, 0.006, 0.006)
            scene.add( gltf.scene );
            car = gltf.scene

            if (gltf.animations && gltf.animations.length > 0) {
                // Create an AnimationMixer
                mixer = new THREE.AnimationMixer(car);

                // Add all animations to the mixer
                for (const clip of gltf.animations) {
                    mixer.clipAction(clip).play();
                }
            }

            update();

        })
    
    // Create a closed wavey loop
    curveRight = new THREE.CatmullRomCurve3( [
        new THREE.Vector3( 19, 2, -21.5 ),
        new THREE.Vector3( 35, 2, -20.5 ),
        new THREE.Vector3( 52, 2, -17 ),
        new THREE.Vector3( 61.5, 2, -9 ),
        new THREE.Vector3( 58, 2, 4 ),
        new THREE.Vector3( 46, 2, 14 ),
        new THREE.Vector3( 31, 2, 27 ),
        new THREE.Vector3( 19, 2, 20 ),
        new THREE.Vector3( 11, 2, 18 ),
        new THREE.Vector3( 0, 2, 20 ),
        new THREE.Vector3( -22, 2, 31 ),
        new THREE.Vector3( -47, 2, 11 ),
        new THREE.Vector3( -46, 2, -21 ),
        new THREE.Vector3( -30, 2, -24 ),
        new THREE.Vector3( -10, 2, -23 ),
        new THREE.Vector3( 19, 2, -21.5 )
        
    ] );

    //addPointsToScene(curveRight.getPoints(15), scene);

    const pointsRight = curveRight.getPoints( 500 )

    const material = new THREE.LineBasicMaterial( { color: 0xff0000 } );
    const materialTransparent = new THREE.MeshBasicMaterial({
        color: 0x00ff00, // Set your desired color
        opacity: 0,     // Adjust the opacity (0.0 to 1.0)
        transparent: true // Enable transparency
    });    

    const cubeGeometry = new THREE.BoxGeometry( 4, 2, 2 ); 
    const geometryRight = new THREE.BufferGeometry().setFromPoints( pointsRight );

    const curveObjectRight = new THREE.Line( geometryRight, materialTransparent );

    scene.add(curveObjectRight)

    var axisHelper = new THREE.AxisHelper(10)
    axisHelper.position.y = 1
    scene.add(axisHelper);
    
    cameraHelper = new THREE.Mesh( cubeGeometry, materialTransparent );

    scene.add( cameraHelper )
}

function updateAspectRatio(){
    renderer.setSize(window.innerWidth,window.innerHeight);
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
}

function update(){
    if (mixer) {
        // Update the animation mixer
        mixer.update(0.01); // You can pass a time delta as a parameter to control the animation speed
    }

    // Increase speed gradually
    speed += 0.0000009; // You can adjust the rate of acceleration as needed

    t = speed; // Increase t with the current speed
    if (t > 1) t = 0;
    
    // t += speed;
    // if (t > 1) t = 0;

    var pointOnCurve = curveRight.getPointAt(t);


    // Update the car's position
    car.position.copy(pointOnCurve);

    if (lane == 1) {
        car.translateZ(-3);
    }

    // Update the car's rotation to follow the curve
    const tangent = curveRight.getTangentAt(t);
    const angle = Math.atan2(-tangent.z, tangent.x); // Calculate the angle based on the tangent
    car.rotation.y = angle;
    console.log(car.rotation.y)

    const pointForHelper = curveRight.getPointAt(t);
    // Update the helper's position
    cameraHelper.position.copy(pointForHelper);
    cameraHelper.rotation.y = angle;
    
    // // Calculate the position behind the car
    // const distanceBehindCar = -10; // Adjust the distance as needed
    // const relativePosition = new THREE.Vector3(distanceBehindCar, 10, 0);
    // const cameraPosition = relativePosition.applyMatrix4(cameraHelper.matrixWorld);

    // // Update the camera's position and look-at direction
    // camera.position.copy(cameraPosition);
    // camera.lookAt(cameraHelper.position);
}

function render(){
    requestAnimationFrame(render);
    update();
    renderer.render(scene, camera);
}

function changeLane(event){
    if (event.key == 'ArrowLeft'){
        lane = 1;
    }
    else if (event.key == 'ArrowRight'){
        lane = 0;
    }
}

function addPointsToScene(points, scene) {
    const pointGeometry = new THREE.SphereGeometry(1, 16, 16); // Adjust the radius and other parameters as needed
    const pointMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    
    for (const point of points) {
        const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
        pointMesh.position.copy(point);
        scene.add(pointMesh);
    }
}