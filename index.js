import * as THREE from "three";
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import getRocket from "./src/getRocket.js";
import getSaucer from "./src/getSaucer.js";
import getStarfield from "./src/getStarfield.js";
import { GLTFLoader } from "jsm/loaders/GLTFLoader.js";

const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer();
renderer.setSize(w, h);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.03;

const manager = new THREE.LoadingManager();
const loader = new GLTFLoader(manager);
const glbs = ["rocket2", "saucer"];
const path = "./assets/";
const sceneData = {
  models: [],
  fontData: null,
};
manager.onLoad = () => initScene(sceneData);
glbs.forEach((name) => {
  loader.load(`${path}${name}.glb`, (glb) => {
    glb.name = name;
    sceneData.models.push(glb);
  });
});

function initScene(data) {
  let rocket = null;
  let saucer = null;
  const { models } = data;
  models.forEach((model) => {
    scene.name = model.name;
    if (model.name === "rocket2") {
      rocket = getRocket(model.scene);
      scene.add(rocket);
    }
    if (model.name === "saucer") {
      saucer = getSaucer(model.scene);
      scene.add(saucer);
    }
  });

  const stars = getStarfield({ numStars: 500 });
  scene.add(stars);
  // lights! 
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff);
  scene.add(hemiLight);
  const sunLight = new THREE.DirectionalLight(0xffffff, 3);
  sunLight.position.set(-1, 1, 1);
  scene.add(sunLight);
  function animate(t = 0) {
    requestAnimationFrame(animate);
    saucer.userData.update(t);
    rocket.userData.update();
    renderer.render(scene, camera);
    controls.update();
    
  }
  
  animate();
  
  // event listeners
  window.addEventListener("keydown", (evt) => {
    if (evt.key === "a") {
      rocket.userData.rotateLeft(true);
    }
    if (evt.key === "d") {
      rocket.userData.rotateRight(true);
    }
    if (evt.key === "j") {
      rocket.userData.thrust(true);
      saucer.userData.sense(rocket.position);
    }
  });
  window.addEventListener("keyup", (evt) => {
    
    if (evt.key === "a") {
      rocket.userData.rotateLeft(false);
    }
    if (evt.key === "d") {
      rocket.userData.rotateRight(false);
    }
    if (evt.key === "j") {
      rocket.userData.thrust(false);
    }
  });

}

function handleWindowResize () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleWindowResize, false);