import * as THREE from "three";
function getRocketBolt(rocket) {
  const hue = Math.random() * 0.25;
  const bolt = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.4, 0.04),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(hue, 1.0, 0.5),
    })
  );
    bolt.position.copy(rocket.position);
    bolt.rotation.z = rocket.rotation.z;
    bolt.visible = false;
    function update(t) {
      if (bolt.visible === true) {
        bolt.position.x += Math.cos(boltDirection) * boltSpeed;
        bolt.position.y += Math.sin(boltDirection) * boltSpeed;
        if (bolt.position.x > 10 || bolt.position.x < -10
          || bolt.position.y > 10 || bolt.position.y < -10) {
          bolt.visible = false;
        }
      }
    }

    const boltSpeed = 0.2;
    let boltDirection = 0;
    function fire(directionAngle) {
      bolt.visible = true;
      boltDirection = directionAngle;
      bolt.rotation.z = rocket.rotation.z;
      bolt.position.copy(rocket.position);
      // fudge the bolt position
      bolt.position.y -= 0.065;
    }
    bolt.userData = {
      fire,
      update,
    };
    return bolt;
  }

  export default getRocketBolt;