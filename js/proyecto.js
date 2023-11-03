/**
 * proyecto.js
 *
 * @author <lpizzon@ade.upv.es>, 2023
 */

// Modules
import * as THREE from "../lib/three.module.js"
import {GLTFLoader} from "../lib/GLTFLoader.module.js"
import { OrbitControls } from "../../lib/OrbitControls.module.js";
import {TWEEN} from "../lib/tween.module.min.js";

// Global variables
let renderer, scene, camera;
let cameraHelper;
let t = 0;
let curveRight;
let lane = 0;
let car;
let mixer;
let speed = 0.001;
let carBoundingBox;
let obstacles = []
let driving = false;
let animating = false;
let roundCount = 0

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
    const ambientLight = new THREE.AmbientLight( 0x404040, 1.5 );
    scene.add( ambientLight );
    const directionalLight1 = new THREE.DirectionalLight( 0xffffff, 1.5 );
    directionalLight1.position.set(50, 30, 0);
    scene.add( directionalLight1 );

    // Events
    window.addEventListener('resize', updateAspectRatio);
    window.addEventListener('keydown', (changeLane));
    const restartButton = document.getElementById('restart-button');
    restartButton.addEventListener('click', restart);
    const startButton = document.getElementById('start-button');
    startButton.addEventListener('click', start);
}

function loadScene(){
    // material
    const material = new THREE.LineBasicMaterial( { color: 0xff0000 } );
    const materialTransparent = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        opacity: 0,
        transparent: true
    });
    
    // create car bounding box
    carBoundingBox = new THREE.Box3();

    // create obstacle bounding boxes
    const obstacle1 = new THREE.Box3();
    obstacle1.min.set(64, 0, -12);
    obstacle1.max.set(66, 1, -8);
    obstacles.push(obstacle1);
    const obstacle2 = new THREE.Box3();
    obstacle2.min.set(45, 0, 19);
    obstacle2.max.set(47, 2, 21);
    obstacles.push(obstacle2);
    const obstacle3 = new THREE.Box3();
    obstacle3.min.set(9, 0, 18);
    obstacle3.max.set(13, 1, 19);
    obstacles.push(obstacle3);
    const obstacle4 = new THREE.Box3();
    obstacle4.min.set(-20, 0, 28);
    obstacle4.max.set(-15, 1, 30);
    obstacles.push(obstacle4);
    const obstacle5 = new THREE.Box3();
    obstacle5.min.set(-50, 0, 19);
    obstacle5.max.set(-45, 1, 22);
    obstacles.push(obstacle5);
    const obstacle6 = new THREE.Box3();
    obstacle6.min.set(-49, 0, -15);
    obstacle6.max.set(-45, 1, -12);
    obstacles.push(obstacle6);
    const obstacle7 = new THREE.Box3();
    obstacle7.min.set(-20, 0, -29);
    obstacle7.max.set(-16, 1, -26);
    obstacles.push(obstacle7);
    const obstacle8 = new THREE.Box3();
    obstacle8.min.set(14, 0, -23);
    obstacle8.max.set(17, 1, -20);
    obstacles.push(obstacle8);

    // Import scene
    const gltfloader = new GLTFLoader();
    gltfloader.load(
        'models/scene/scene.gltf',
        function( gltf ){
            scene.add( gltf.scene );
        })

    // import car
    gltfloader.load(
        'models/car/scene.gltf',
        function( gltf ){

            gltf.scene.scale.set(0.006, 0.006, 0.006)
            scene.add( gltf.scene );
            car = gltf.scene

            // add animations
            if (gltf.animations && gltf.animations.length > 0) {
                mixer = new THREE.AnimationMixer(car);
                for (const clip of gltf.animations) {
                    mixer.clipAction(clip).play();
                }
            }

            carBoundingBox.setFromObject(car);

            update();
        })

    // create curve
    curveRight = new THREE.CatmullRomCurve3( [
        new THREE.Vector3( 19, 1, -21.5 ),
        new THREE.Vector3( 35, 1, -20.5 ),
        new THREE.Vector3( 52, 1, -17 ),
        new THREE.Vector3( 61.5, 1, -9 ),
        new THREE.Vector3( 58, 1, 4 ),
        new THREE.Vector3( 46, 1, 14 ),
        new THREE.Vector3( 31, 1, 27 ),
        new THREE.Vector3( 19, 1, 20 ),
        new THREE.Vector3( 11, 1, 18 ),
        new THREE.Vector3( 0, 1, 20 ),
        new THREE.Vector3( -22, 1, 31 ),
        new THREE.Vector3( -47, 1, 11 ),
        new THREE.Vector3( -46, 1, -21 ),
        new THREE.Vector3( -30, 1, -24 ),
        new THREE.Vector3( -10, 1, -23 ),
        new THREE.Vector3( 19, 1, -21.5 )

    ] );
    //addPointsToScene(curveRight.getPoints(15), scene);
    const pointsCurve = curveRight.getPoints( 500 )
    const geometryCurve = new THREE.BufferGeometry().setFromPoints( pointsCurve );
    const curveObject = new THREE.Line( geometryCurve, materialTransparent );
    scene.add(curveObject)

    // create axis helper
    var axisHelper = new THREE.AxisHelper(10)
    axisHelper.position.y = 1
    //scene.add(axisHelper);

    // create camera helper
    const cubeGeometry = new THREE.BoxGeometry( 4, 2, 2 );
    cameraHelper = new THREE.Mesh( cubeGeometry, materialTransparent );
    scene.add( cameraHelper )
}

function updateAspectRatio(){
    renderer.setSize(window.innerWidth,window.innerHeight);
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
}

function update(delta){
    checkCollision();

    // animate car
    if (mixer) {
        mixer.update(0.01);
    }

    // Increase speed gradually
    speed += 0.0000009;

    if (driving){
        t += speed;
    }
    else{
        t = speed;
    }

    if (t > 1){
        t = 0;
        roundCount += 1;
        var score = document.getElementById('score-count');
        score.textContent = 'Score: ' + roundCount;
    } 

    var pointOnCurve = curveRight.getPointAt(t);

    // Update the car's position
    car.position.copy(pointOnCurve);

    if (!animating){
        if (lane == 1) {
            car.translateZ(-3);
        }
        else{
            car.translateZ(0);
        }
    }

    // Update the car's rotation to follow the curve
    const tangent = curveRight.getTangentAt(t);
    const angle = Math.atan2(-tangent.z, tangent.x);
    car.rotation.y = angle;

    const pointForHelper = curveRight.getPointAt(t);
    // Update the helper's position
    cameraHelper.position.copy(pointForHelper);
    cameraHelper.rotation.y = angle;

    // Calculate the position behind the car
    const relativePosition = new THREE.Vector3(-8, 7, 0);
    const cameraPosition = relativePosition.applyMatrix4(cameraHelper.matrixWorld);

    // Update the camera's position and look-at direction
    camera.position.copy(cameraPosition);
    camera.lookAt(cameraHelper.position);

    TWEEN.update(delta);
}

function render(delta){
    requestAnimationFrame(render);
    update(delta);
    renderer.render(scene, camera);
    
    document.body.appendChild(renderer.domElement);
}

function changeLane(event){
    if (event.key == 'ArrowLeft' && lane === 0){
        lane = 1;
        animate();
    }
    else if (event.key == 'ArrowRight' && lane === 1){
        lane = 0;
        animate();
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

function checkCollision() {
    carBoundingBox.setFromObject(car);
    for (const obstacle of obstacles) {
        if (carBoundingBox.intersectsBox(obstacle)) {
            driving = false
            const gameOverOverlay = document.getElementById("restart-overlay");
            gameOverOverlay.style.display = 'flex';

            const scoreCount = document.getElementById("score-container");
            scoreCount.style.display = 'none';

            var score = document.getElementById('score');
            score.textContent = 'Score: ' + roundCount;
            
        }
    }
}

function restart() {
    driving = true
    // Reset car position
    t = 0;
    car.position.set(19, 1, -21.5);
    
    // Reset speed and lane
    speed = 0.001;
    lane = 0;

    // Hide the game-over overlay
    const restartOverlay = document.getElementById("restart-overlay");
    restartOverlay.style.display = 'none';

    const scoreContainer = document.getElementById("score-container");
    scoreContainer.style.display = 'flex';

    roundCount = 0
    var score = document.getElementById('score-count');
    score.textContent = 'Score: ' + roundCount;
}

function start(){
    driving = true
    // Reset car position
    t = 0;
    car.position.set(19, 1, -21.5);
    
    // Reset speed and lane
    speed = 0.001;
    lane = 0;

    const score = document.getElementById("score-container");
    score.style.display = 'flex';

    // Hide the game-over overlay
    const startOverlay = document.getElementById("start-overlay");
    startOverlay.style.display = 'none';

}

function animate(){
    // make animation smoother
    const toLeft = new TWEEN.Tween({ z: 0})
    const toRight = new TWEEN.Tween({ z: -3})
    if (lane == 1){
        animating = true;
        toLeft.to({ z: -3}, 100)
        toLeft.onUpdate((coords) => {
            car.translateZ(coords.z);
        });
        toLeft.onComplete(() => {
            animating = false;
        });
        toLeft.start();
    }  
    if (lane == 0){
        animating = true;
        toRight.to({ z: 0}, 100)
        toRight.onUpdate((coords) => {
            car.translateZ(coords.z);
        });
        toRight.onComplete(() => {
            animating = false;
        });
        toRight.start();
    }  
}