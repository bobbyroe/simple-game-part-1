import * as THREE from "three";
import TWEEN from "jsm/libs/tween.module.js";
import { caluculateLookAtRotation } from "./utils.js";

function getBolt(saucer) {
  const size = 0.05;
  let hue = 0.4 + Math.random() * 0.25;
  const bolt = new THREE.Mesh(
    new THREE.IcosahedronGeometry(size, 2),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(hue, 1.0, 0.5),
    })
  );
  bolt.position.copy(saucer.position);
  bolt.visible = false;
  function update() {
    if (bolt.visible === true) {
      bolt.position.x += Math.cos(boltDirection) * boltSpeed;
      bolt.position.y += Math.sin(boltDirection) * boltSpeed;
      if (
        bolt.position.x > 10 ||
        bolt.position.x < -10 ||
        bolt.position.y > 10 ||
        bolt.position.y < -10
      ) {
        bolt.visible = false;
      }
    }
  }
  const boltSpeed = 0.05;
  let boltDirection = 0;
  function fire(direction) {
    hue = 0.4 + Math.random() * 0.25;
    bolt.material.color.setHSL(hue, 1.0, 0.5);
    bolt.visible = true;
    boltDirection = direction;
    bolt.position.copy(saucer.position);
  }

  bolt.userData = {
    fire,
    update,
  };
  return bolt;
}

function createDeadSaucer(glb) {
  const deadSaucer = glb.clone();
  const material = new THREE.MeshBasicMaterial({
    color: 0xff4444,
    transparent: true,
    opacity: 0.25,
  });

  deadSaucer.traverse((o) => {
    if (o.isMesh) {
      o.material = material;
    }
  });

  deadSaucer.visible = false;
  deadSaucer.userData = {
    material,
  };
  return deadSaucer;
}
function randomizeColor(glb) {
  const palette = [
    0x7400b8, 0x6930c3, 0x5e60ce, 0x5390d9, 0x4ea8de, 0x48bfe3, 0x56cfe1,
    0x64dfdf, 0x72efdd, 0x80ffdb,
  ];
  function getRandomMat(colors) {
    const hex = colors[Math.floor(Math.random() * colors.length)];
    return new THREE.MeshBasicMaterial({ color: hex });
  }
  glb.traverse((o) => {
    if (o.isMesh) {
      o.material = getRandomMat(palette);
    }
  });
}

function getSaucer(glb) {
  let saucerGroup = new THREE.Group();
  const ship = glb;
  const size = 0.4;
  ship.scale.set(size, size, size);
  const startX = 6;
  let yPos = Math.random() * 8 - 4;
  let saucerSpeed = -0.03;
  saucerGroup.position.set(startX, yPos, 0);

  // color saucer with palette
  randomizeColor(ship);

  saucerGroup.add(ship);
  const deadSaucer = createDeadSaucer(ship);
  saucerGroup.add(deadSaucer);
  // collision sphere
  const radius = 0.2;
  const geometry = new THREE.IcosahedronGeometry(radius, 4);
  const material = new THREE.MeshBasicMaterial({
    color: 0xff9900,
    transparent: true,
    opacity: 0.2,
  });

  const collisionSphere = new THREE.Mesh(geometry, material);
  // saucerGroup.add(collisionSphere); // debug

  let fireSound;
  function setSoundEffect (sound) {
    console.log('setting sound effect', sound)
    fireSound = sound;
  }

  let targetDirection = Math.PI;
  const bolt = getBolt(saucerGroup);
  function fire() {
    const angle = targetDirection; // Math.random() * Math.PI * 2;
    bolt.userData.fire(angle);
    fireSound.stop();
    fireSound.play();
  }
  const screenBounds = new THREE.Vector2();
  let nextTime = 3000;
  function update(t) {
    if (!isTweening) {
      saucerGroup.position.x += saucerSpeed;
      saucerGroup.position.y += Math.sin(t * 0.0025) * 0.005;
      saucerGroup.rotation.y = t * 0.0025;
      if (saucerGroup.position.x < -screenBounds.x) {
        saucerGroup.position.x *= -1;
      }
      if (t > nextTime) {
        fire();
        nextTime = t + 2500 + Math.random() * 2000;
      }
    }
    bolt.userData.update();
  }
  let isTweening = false;
  function playHitAnimation() {
    if (!isTweening) {
      isTweening = true;
      ship.visible = false;
      deadSaucer.visible = true;
      deadSaucer.userData.material.opacity = 0.25;
      let alphaTween = new TWEEN.Tween(deadSaucer.userData.material)
        .to({ opacity: -1 }, 2000)
        .easing(TWEEN.Easing.Linear.None)
        .onComplete(() => {
          isTweening = false;
          ship.visible = true;
          deadSaucer.visible = false;
          yPos = Math.random() * 8 - 4;
          saucerGroup.position.set(startX, yPos, 0);
          saucerSpeed = -0.01 + Math.random() * -0.01;
          randomizeColor(ship);
        })
        .start();
    }
  }

  let blinkInterval = 0;
  let counter = 0;
  let blinkCount = 0;
  const maxBlinks = 8;
  function _playHitAnimation() {
    isTweening = true;
    ship.visible = false;
    counter += 1;
    if (counter > blinkInterval) {
      deadSaucer.visible = !deadSaucer.visible;
      counter = 0;
      blinkCount += 1;
      blinkInterval = 20;
    }
    if (blinkCount < maxBlinks) {
      requestAnimationFrame(playHitAnimation);
    } else {
      isTweening = false;
      ship.visible = true;
      deadSaucer.visible = false;
      yPos = Math.random() * 8 - 4;
      saucerGroup.position.set(startX, yPos, 0);
      saucerSpeed = -0.01 + Math.random() * -0.01;
      blinkCount = 0;
      blinkInterval = 0;
    }
  }

  function sense(targetPos) {
    targetDirection = caluculateLookAtRotation(targetPos, saucerGroup);
  }
  saucerGroup.userData = {
    bolt,
    playHitAnimation,
    radius,
    sense,
    setScreenBounds: (newValue) => screenBounds.copy(newValue),
    setSoundEffect,
    update,
  };
  return saucerGroup;
}

export default getSaucer;
