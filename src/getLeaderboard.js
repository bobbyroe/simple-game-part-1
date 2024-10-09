import * as THREE from "three";
import { Font } from "jsm/loaders/FontLoader.js";
function getLeaderboard(fontData) {
  const screenBounds = new THREE.Vector2();
  const leaderboardGroup = new THREE.Group();
  const font = new Font(fontData);
  const textMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
  });
  //
  let isGameOver = false;
  const gameOverText = "Game Over";
  const gameOverShapes = font.generateShapes(gameOverText, 1);
  const gameOverGeo = new THREE.ShapeGeometry(gameOverShapes);
  const gameOverMesh = new THREE.Mesh(gameOverGeo, textMat);
  gameOverGeo.computeBoundingBox();
  const xMid =
    -0.5 * (gameOverGeo.boundingBox.max.x - gameOverGeo.boundingBox.min.x);
  gameOverGeo.translate(xMid, 0, 0);
  gameOverMesh.visible = false;
  leaderboardGroup.add(gameOverMesh);
  //
  const maxScore = 10;
  let rocketScoreInt = 0;
  let rocketScoreShapes = font.generateShapes(rocketScoreInt + "", 1);
  let rocketScoreGeo = new THREE.ShapeGeometry(rocketScoreShapes);
  const rocketScore = new THREE.Mesh(rocketScoreGeo, textMat);
  rocketScore.scale.setScalar(0.6);
  leaderboardGroup.add(rocketScore);
  let saucerScoreInt = 0;
  const saucerScore = rocketScore.clone();
  saucerScore.position.set(2, 2.5, 0); // set this based on screen width
  leaderboardGroup.add(saucerScore);
  function update() {
    let rocketScoreText = rocketScoreInt.toString();
    let saucerScoreText = saucerScoreInt.toString();
    rocketScoreShapes = font.generateShapes(rocketScoreText, 1);
    rocketScoreGeo = new THREE.ShapeGeometry(rocketScoreShapes);
    rocketScore.geometry.dispose();
    rocketScore.geometry = rocketScoreGeo;
    let saucerScoreShapes = font.generateShapes(saucerScoreText, 1);
    let saucerScoreGeo = new THREE.ShapeGeometry(saucerScoreShapes);
    saucerScore.geometry.dispose();
    saucerScore.geometry = saucerScoreGeo;
  }
  function gameOver() {
    isGameOver = true;
    gameOverMesh.visible = true;
  }
  function incPlayerScore() {
    if (rocketScoreInt > maxScore) {
      gameOver();
    } else {
      rocketScoreInt += 1;
      update();
    }
  }
  function incComputerScore() {
    if (saucerScoreInt > maxScore) {
      gameOver();
    } else {
      saucerScoreInt += 1;
      update();
    }
  }
  function setScreenBounds(newValue) {
    screenBounds.copy(newValue);
    rocketScore.position.set((screenBounds.x - 1.0) * -1.0, screenBounds.y - 1.0, 0); // set this based on screen width
    saucerScore.position.set(screenBounds.x - 1.5, screenBounds.y - 1.0, 0); // set this based on screen width
  }
  leaderboardGroup.userData = { 
    incPlayerScore, 
    incComputerScore, 
    isGameOver: () => isGameOver,
    setScreenBounds,
  };
  return leaderboardGroup;
}

export default getLeaderboard;