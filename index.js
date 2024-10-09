import * as THREE from "three";
import getStarfield from "./src/getStarfield.js";
import { GLTFLoader } from "jsm/loaders/GLTFLoader.js";
import getRocket from "./src/getRocket.js";
import getSaucer from "./src/getSaucer.js";
import getLeaderboard from "./src/getLeaderboard.js";
import TWEEN from "jsm/libs/tween.module.js";
import { TTFLoader } from "jsm/loaders/TTFLoader.js";

const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer();
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

let rocket = null;
let saucer = null;
let rocketBolts = [];
let saucerBolt = null;
const screenBounds = new THREE.Vector2();

const manager = new THREE.LoadingManager();
const loader = new GLTFLoader(manager);
const ttfLoader = new TTFLoader(manager);
const audioLoader = new THREE.AudioLoader(manager);

const glbs = ["rocket2", "saucer"];
const mp3s = ["explosion", "explosion-saucer", "rocket-fire", "saucer-fire"];
const path = "./assets/models/";
const sceneData = {
  fontData: null,
  models: [],
  sounds: [],
};
manager.onLoad = () => initScene(sceneData);
glbs.forEach((name) => {
  loader.load(`${path}${name}.glb`, (glb) => {
    glb.name = name;
    sceneData.models.push(glb);
  });
});
ttfLoader.load("./src/ATComStdRegular.ttf", function (ttf) {
  sceneData.fontData = ttf;
});

const listener = new THREE.AudioListener();
camera.add(listener);
mp3s.forEach((name) => {
  const sound = new THREE.Audio(listener);
  sound.name = name;
  sceneData.sounds.push(sound);
  audioLoader.load(`./assets/${name}.mp3`, function (buffer) {
    sound.setBuffer(buffer);
  });
});

const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff);
scene.add(hemiLight);
const sunLight = new THREE.DirectionalLight(0xffffff, 10);
sunLight.position.set(-1, 1, 1);
scene.add(sunLight);

const stars = getStarfield({ numStars: 500 });
scene.add(stars);

function initScene(data) {
  const { fontData, models, sounds } = data;
  
  models.forEach((model) => {
    scene.name = model.name;
    if (model.name === "rocket2") {
      rocket = getRocket(model.scene);
      scene.add(rocket);
    }
    if (model.name === "saucer") {
      saucer = getSaucer(model.scene);
      scene.add(saucer);
      saucerBolt = saucer.userData.bolt;
      scene.add(saucerBolt);
    }
  });

  let explosionSound = null;
  let explosionSaucerSound = null;
  sounds.forEach((sound) => {
    console.log(sound.name);
    if (sound.name.includes("rocket")) {
      rocket.userData.setSoundEffect(sound);
    }
    if (sound.name.includes("saucer")) {
      saucer.userData.setSoundEffect(sound);
    }
    if (sound.name.includes("explosion")) {
      explosionSound = sound;
    }
    if (sound.name.includes("explosion-saucer")) {
      explosionSaucerSound = sound;
    }
  });
  const leaderboard = getLeaderboard(fontData);
  scene.add(leaderboard);

  rocketBolts = rocket.userData.getBolts();
  let currentRocketBolt = rocketBolts[0];
  scene.add(...rocketBolts);

  // initialize flashing plane
  const geometry = new THREE.PlaneGeometry(10, 10, 10, 10);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.0
  });

  function setScreenBounds(w, h) {
    const pixelToUnitRatio = 173;
    screenBounds.set(
      (0.5 * w) / pixelToUnitRatio,
      (0.5 * h) / pixelToUnitRatio
    );

    rocket.userData.setScreenBounds(screenBounds);
    saucer.userData.setScreenBounds(screenBounds);
    leaderboard.userData.setScreenBounds(screenBounds);
  }

  const flashingPlane = new THREE.Group();
  scene.add(flashingPlane);
  const planeObj = new THREE.Mesh(geometry, material);
  flashingPlane.add(planeObj);
  flashingPlane.userData.flash = () => {
    console.log("flashing", planeObj.material);

    const tween = new TWEEN.Tween(planeObj.material)
      .to({ opacity: 1.0 }, 100)
      .easing(TWEEN.Easing.Linear.None)
      .onComplete(() => {
        console.log(planeObj.material);
        planeObj.material.opacity = 0.0;
      })
      .start();
  };

  function animate(t = 0) {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    stars.rotation.y += 0.0005;

    rocket.userData.update();
    saucer.userData.update(t);

    // check collisions
    const distance = rocket.position.distanceTo(saucer.position);
    if (distance < rocket.userData.radius + saucer.userData.radius) {
      rocket.userData.playHitAnimation();
      saucer.userData.playHitAnimation();
      flashingPlane.userData.flash();
      leaderboard.userData.incPlayerScore();
      leaderboard.userData.incComputerScore();
      explosionSound.stop();
      explosionSound.play();
    }
    // TODO loop thru all rocket bolts
    const boltDistance = currentRocketBolt?.position.distanceTo(
      saucer.position
    );
    if (boltDistance < saucer.userData.radius) {
      currentRocketBolt.visible = false;
      currentRocketBolt.position.copy(rocket.position);
      saucer.userData.playHitAnimation();
      flashingPlane.userData.flash();
      leaderboard.userData.incPlayerScore();
      explosionSaucerSound.stop();
      explosionSaucerSound.play();
    }

    const saucerBoltDistance = saucerBolt.position.distanceTo(rocket.position);
    if (saucerBoltDistance < rocket.userData.radius) {
      saucerBolt.visible = false;
      saucerBolt.position.copy(saucer.position);
      rocket.userData.playHitAnimation();
      flashingPlane.userData.flash();
      leaderboard.userData.incComputerScore();
      explosionSound.stop();
      explosionSound.play();
    }
    TWEEN.update();
  }

  setScreenBounds(w, h);
  animate();

  window.addEventListener("mouseup", (evt) => {
    if (leaderboard.userData.isGameOver() === true) {
      window.location.reload();
    }
  });

  window.addEventListener("keydown", (evt) => {
    if (evt.key === "a") {
      rocket.userData.rotateLeft(true);
    }
    if (evt.key === "d") {
      rocket.userData.rotateRight(true);
    }
    if (evt.key === "l") {
      currentRocketBolt = rocket.userData.fire();
    }
    if (evt.key === "j") {
      rocket.userData.thrust(true);
      saucer.userData.sense(rocket.position);
    }
  });
  window.addEventListener("keyup", (evt) => {
    if (evt.key === " ") {
      if (leaderboard.userData.isGameOver() === true) {
        window.location.reload();
      }
    }
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
  function handleWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    setScreenBounds(window.innerWidth, window.innerHeight);
  }
  window.addEventListener("resize", handleWindowResize, false);
}
