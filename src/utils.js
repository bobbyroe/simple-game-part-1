import * as THREE from 'three';
function caluculateLookAtRotation(targetPos, obj3D) {
    const target = new THREE.Vector3();
    target.copy(targetPos);
    target.sub(obj3D.position);
    target.normalize();
    const angle = Math.atan2(target.y, target.x);
    return angle;
  }

  export { caluculateLookAtRotation }