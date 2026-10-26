import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createMaterials } from './world/materials.js';
import { createExterior } from './world/exterior.js';
import { createInterior } from './world/interior.js';
import { landmarks, archives, interiorStories } from './data.js';
import './style.css';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const container = $('#scene-container');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch (error) {
  $('#loading h2').textContent = '当前浏览器未能启动 WebGL';
  $('.loading-note').textContent = '请开启浏览器硬件加速后刷新页面';
  $('.loading-track').hidden = true;
  throw error;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, .08, 280);
camera.position.set(62, 47, 59);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.2, 0);
controls.enableDamping = true;
controls.dampingFactor = .065;
controls.minDistance = 5;
controls.maxDistance = 140;
controls.minPolarAngle = .16;
controls.maxPolarAngle = Math.PI * .475;
controls.panSpeed = .65;
controls.rotateSpeed = .55;
controls.zoomSpeed = .8;
controls.update();

const materials = createMaterials();
const exterior = createExterior(materials);
const interior = createInterior(materials);
let activeScene = exterior;
let sceneMode = 'exterior';
let controlMode = 'orbit';
let selected = landmarks[1];
let currentInteriorView = 'overview';
let timeOfDay = 'day';
let cameraTween = null;
let transitioning = false;
let tourActive = false;
let tourIndex = 0;
let tourTimer = null;
let toastTimer = null;
let lookYaw = 0;
let lookPitch = 0;
let lookDrag = null;
let pointerStart = null;
const pressedKeys = new Set();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const tempVector = new THREE.Vector3();
const moveVector = new THREE.Vector3();
const upVector = new THREE.Vector3(0, 1, 0);
const spatialEntries = [];

function toast(message) {
  const element = $('#toast');
  clearTimeout(toastTimer);
  element.textContent = message;
  element.classList.add('show');
  toastTimer = setTimeout(() => element.classList.remove('show'), 2600);
}

function createSpatialLabel({ scene, position, number, name, className = '', onClick }) {
  const element = document.createElement('button');
  element.className = `spatial-label ${className}`;
  element.innerHTML = `<span class="label-index">${number}</span><span class="label-name">${name}</span>`;
  element.setAttribute('aria-label', name);
  element.addEventListener('click', event => {
    event.stopPropagation();
    onClick();
  });
  $('#spatial-labels').appendChild(element);
  spatialEntries.push({ scene, position: new THREE.Vector3(...position), element });
  return element;
}

landmarks.forEach(landmark => {
  const button = document.createElement('button');
  button.className = 'landmark-item';
  button.dataset.id = landmark.id;
  button.innerHTML = `<span class="item-number">${landmark.number}</span><span class="item-name">${landmark.name}</span><span class="item-sub">${landmark.id === 'sanwei' ? '可入内' : '前往'}</span><span class="item-dot"></span>`;
  button.addEventListener('click', () => selectLandmark(landmark.id));
  $('#landmark-list').appendChild(button);

  const label = createSpatialLabel({
    scene: 'exterior', position: landmark.position, number: landmark.number,
    name: landmark.name, onClick: () => selectLandmark(landmark.id)
  });
  label.dataset.id = landmark.id;

  const point = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  point.setAttribute('class', 'map-point');
  point.setAttribute('transform', `translate(${landmark.map[0]} ${landmark.map[1]})`);
  point.setAttribute('role', 'button');
  point.setAttribute('tabindex', '0');
  point.setAttribute('aria-label', landmark.name);
  point.dataset.id = landmark.id;
  point.innerHTML = `<circle r="4"/><text y="-8">${landmark.short}</text>`;
  point.addEventListener('click', () => selectLandmark(landmark.id));
  point.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') selectLandmark(landmark.id);
  });
  $('#map-points').appendChild(point);
});

createSpatialLabel({
  scene: 'interior', position: interior.userData.hotspots.early.toArray(), number: '早', name: '鲁迅书桌',
  className: 'hotspot interior-hotspot', onClick: () => focusInterior('desk')
});
createSpatialLabel({
  scene: 'interior', position: interior.userData.hotspots.painting.toArray(), number: '画', name: '匾额与松鹿图',
  className: 'hotspot interior-hotspot', onClick: () => focusInterior('painting')
});

function updateStory(story, isInterior = false) {
  $('#story-number').textContent = isInterior ? story.number : `${story.number} / 05`;
  $('#story-title').textContent = story.title || story.name;
  $('#story-subtitle').textContent = story.subtitle;
  $('#story-description').textContent = story.description;
  $('#story-quote').textContent = story.quote;
  $('#story-action span').textContent = isInterior ? '返回景区' : story.action;
  $('#story-note').hidden = isInterior || !story.interior;
  if (!isInterior && story.interior) $('#story-note').innerHTML = '<span></span>可进入内部参观';
}

function updateSelectedUI() {
  $$('.landmark-item, .map-point, .spatial-label[data-id]').forEach(element => {
    element.classList.toggle('active', element.dataset.id === selected.id);
  });
}

function configureControls() {
  const inside = sceneMode === 'interior';
  controls.minDistance = inside ? 1.1 : 5;
  controls.maxDistance = inside ? 14 : 140;
  controls.minPolarAngle = inside ? .15 : .16;
  controls.maxPolarAngle = inside ? Math.PI * .56 : Math.PI * .475;
  controls.enablePan = !inside;
  controls.enableZoom = true;
  controls.enabled = controlMode === 'orbit' && !cameraTween;
}

function flyTo(position, target, duration = 1500) {
  if (controlMode !== 'orbit') setControlMode('orbit', false);
  const actualDuration = reducedMotion ? 0 : duration;
  if (!actualDuration) {
    camera.position.set(...position);
    controls.target.set(...target);
    camera.lookAt(controls.target);
    controls.update();
    return;
  }
  cameraTween = {
    started: performance.now(), duration: actualDuration,
    fromPosition: camera.position.clone(), toPosition: new THREE.Vector3(...position),
    fromTarget: controls.target.clone(), toTarget: new THREE.Vector3(...target)
  };
  controls.enabled = false;
}

function selectLandmark(id, shouldFly = true, fromTour = false) {
  if (!fromTour) stopTour();
  const landmark = landmarks.find(item => item.id === id);
  if (!landmark) return;
  selected = landmark;
  updateSelectedUI();
  updateStory(landmark);
  if (shouldFly) flyTo(landmark.camera, landmark.focus, 1650);
}

function updateTourButton() {
  const button = $('#tour-btn');
  button.classList.toggle('active', tourActive);
  button.innerHTML = tourActive
    ? '<span class="tour-icon"><svg><use href="#i-pause"/></svg></span><span><strong>暂停游学路线</strong><small>点击可退出自动导览</small></span><svg class="tour-arrow"><use href="#i-pause"/></svg>'
    : '<span class="tour-icon"><svg><use href="#i-play"/></svg></span><span><strong>开启游学路线</strong><small>约 1 分钟 · 5 个景点</small></span><svg class="tour-arrow"><use href="#i-arrow"/></svg>';
}

function stopTour() {
  if (!tourActive) return;
  tourActive = false;
  clearTimeout(tourTimer);
  updateTourButton();
}

function advanceTour() {
  if (!tourActive) return;
  if (tourIndex >= landmarks.length) {
    stopTour();
    toast('游学路线已结束，也可以继续自由探索');
    return;
  }
  selectLandmark(landmarks[tourIndex].id, true, true);
  tourIndex += 1;
  tourTimer = setTimeout(advanceTour, 6500);
}

function toggleTour() {
  if (tourActive) {
    stopTour();
    toast('已暂停自动导览');
    return;
  }
  if (sceneMode === 'interior') return;
  if (controlMode === 'roam') setControlMode('orbit', false);
  tourActive = true;
  tourIndex = 0;
  updateTourButton();
  advanceTour();
}

function syncLookAngles() {
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');
  euler.setFromQuaternion(camera.quaternion);
  lookYaw = euler.y;
  lookPitch = euler.x;
}

function setControlMode(mode, reposition = true) {
  pressedKeys.clear();
  lookDrag = null;
  cameraTween = null;
  controlMode = mode;
  const roaming = mode === 'roam';
  document.body.classList.toggle('roaming', roaming);
  $('#roam-tip').hidden = !roaming;
  $('#mobile-pad').hidden = !roaming || !window.matchMedia('(max-width: 800px), (pointer: coarse)').matches;
  $('#roam-btn').classList.toggle('active', roaming);
  $('#overview-btn').classList.toggle('active', !roaming);
  controls.enabled = !roaming;
  if (roaming && reposition) {
    if (sceneMode === 'exterior') {
      if (selected.id === 'sanwei') {
        camera.position.set(-16, 1.72, 17.1);
        controls.target.set(-7, 2.1, 11);
      } else {
        camera.position.set(selected.focus[0], 1.72, selected.focus[2] + 8);
        controls.target.set(selected.focus[0], 1.72, selected.focus[2]);
      }
    } else {
      camera.position.set(0, 1.66, 4.7);
      controls.target.set(0, 1.66, -3);
    }
    camera.lookAt(controls.target);
    syncLookAngles();
  } else if (!roaming) {
    configureControls();
  }
}

function leaveRoamWithView() {
  setControlMode('orbit', false);
  if (sceneMode === 'exterior') flyTo(selected.camera, selected.focus, 1100);
  else flyTo(interior.userData.views[currentInteriorView].position, interior.userData.views[currentInteriorView].target, 950);
}

function updateInteriorStory(view) {
  currentInteriorView = view;
  updateStory(interiorStories[view], true);
  $$('.interior-view').forEach(button => button.classList.toggle('active', button.dataset.view === view));
}

function focusInterior(view) {
  if (sceneMode !== 'interior') return;
  stopTour();
  updateInteriorStory(view);
  const destination = interior.userData.views[view];
  flyTo(destination.position, destination.target, 1300);
}

async function enterInterior() {
  if (transitioning || sceneMode === 'interior') return;
  transitioning = true;
  stopTour();
  pressedKeys.clear();
  $('#transition').classList.add('active');
  await wait(reducedMotion ? 30 : 480);
  sceneMode = 'interior';
  activeScene = interior;
  document.body.classList.add('is-interior');
  $('#interior-bar').hidden = false;
  $('#scene-caption-text').textContent = '三味书屋 · 室内参观点';
  setControlMode('orbit', false);
  const view = interior.userData.views.overview;
  camera.position.set(...view.position);
  controls.target.set(...view.target);
  camera.lookAt(controls.target);
  configureControls();
  controls.update();
  updateInteriorStory('overview');
  await wait(reducedMotion ? 30 : 520);
  $('#transition').classList.remove('active');
  transitioning = false;
}

async function exitInterior() {
  if (transitioning || sceneMode === 'exterior') return;
  transitioning = true;
  pressedKeys.clear();
  $('#transition').classList.add('active');
  await wait(reducedMotion ? 30 : 480);
  sceneMode = 'exterior';
  activeScene = exterior;
  document.body.classList.remove('is-interior');
  $('#interior-bar').hidden = true;
  $('#scene-caption-text').textContent = '绍兴 · 鲁迅故里历史文化街区';
  setControlMode('orbit', false);
  camera.position.set(...selected.camera);
  controls.target.set(...selected.focus);
  camera.lookAt(controls.target);
  configureControls();
  controls.update();
  updateStory(selected);
  await wait(reducedMotion ? 30 : 520);
  $('#transition').classList.remove('active');
  transitioning = false;
}

function goOverview() {
  stopTour();
  if (sceneMode === 'interior') {
    focusInterior('overview');
  } else {
    if (controlMode === 'roam') setControlMode('orbit', false);
    flyTo([62, 47, 59], [0, 1.2, 0], 1600);
  }
}

function setStoryHidden(hidden) {
  document.body.classList.toggle('story-hidden', hidden);
  $('#story-card').setAttribute('aria-hidden', String(hidden));
  $('#story-open').hidden = !hidden;
  $('#story-open').setAttribute('aria-expanded', String(!hidden));
  (hidden ? $('#story-open') : $('#story-toggle')).focus({ preventScroll: true });
}
$('#story-toggle').addEventListener('click', () => setStoryHidden(true));
$('#story-open').addEventListener('click', () => setStoryHidden(false));

$('#story-action').addEventListener('click', () => {
  if (sceneMode === 'interior') exitInterior();
  else if (selected.interior) enterInterior();
  else selectLandmark(selected.id);
});
$('#home-btn').addEventListener('click', () => {
  if (sceneMode === 'interior') exitInterior();
  else goOverview();
});
$('#overview-btn').addEventListener('click', goOverview);
$('#roam-btn').addEventListener('click', () => {
  if (transitioning) return;
  if (controlMode === 'roam') leaveRoamWithView();
  else {
    stopTour();
    setControlMode('roam');
  }
});
$('#tour-btn').addEventListener('click', toggleTour);
$('#exit-interior').addEventListener('click', exitInterior);
$$('.interior-view').forEach(button => button.addEventListener('click', () => focusInterior(button.dataset.view)));
$('#day-btn').addEventListener('click', () => {
  timeOfDay = timeOfDay === 'day' ? 'dusk' : 'day';
  exterior.userData.setTimeOfDay(timeOfDay);
  $('#day-btn span').textContent = timeOfDay === 'day' ? '日景' : '暮景';
  $('#day-btn').classList.toggle('active', timeOfDay === 'dusk');
  if (sceneMode === 'interior') toast(`已切换为${timeOfDay === 'day' ? '日景' : '暮景'}，返回景区后生效`);
});

let archiveIndex = 0;
function renderArchive() {
  const archive = archives[archiveIndex];
  $('#archive-image').src = archive.src;
  $('#archive-image').alt = archive.alt;
  $('#archive-title').textContent = archive.title;
  $('#archive-caption').textContent = archive.caption;
  $('#archive-count').textContent = `${String(archiveIndex + 1).padStart(2, '0')} / 03`;
  $$('.archive-thumb').forEach((button, index) => button.classList.toggle('active', index === archiveIndex));
}
archives.forEach((archive, index) => {
  const button = document.createElement('button');
  button.className = 'archive-thumb';
  button.setAttribute('aria-label', `查看${archive.title}`);
  const image = document.createElement('img');
  image.src = archive.src;
  image.alt = '';
  button.appendChild(image);
  button.addEventListener('click', () => { archiveIndex = index; renderArchive(); });
  $('#archive-thumbnails').appendChild(button);
});
$('#photos-btn').addEventListener('click', () => $('#photo-dialog').showModal());
$('#help-btn').addEventListener('click', () => $('#help-dialog').showModal());
$$('.dialog-close').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
$('#archive-prev').addEventListener('click', () => { archiveIndex = (archiveIndex + archives.length - 1) % archives.length; renderArchive(); });
$('#archive-next').addEventListener('click', () => { archiveIndex = (archiveIndex + 1) % archives.length; renderArchive(); });
$$('dialog').forEach(dialog => dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
}));

function updateRaycaster(event) {
  const bounds = renderer.domElement.getBoundingClientRect();
  pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
}

renderer.domElement.addEventListener('pointerdown', event => {
  if (transitioning || event.button !== 0) return;
  pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
  if (controlMode === 'roam') {
    lookDrag = { x: event.clientX, y: event.clientY, id: event.pointerId };
    renderer.domElement.setPointerCapture(event.pointerId);
  }
});
renderer.domElement.addEventListener('pointermove', event => {
  if (!lookDrag || lookDrag.id !== event.pointerId || controlMode !== 'roam') return;
  const dx = event.clientX - lookDrag.x;
  const dy = event.clientY - lookDrag.y;
  lookYaw -= dx * .0032;
  lookPitch = THREE.MathUtils.clamp(lookPitch - dy * .003, -1.25, 1.25);
  lookDrag.x = event.clientX;
  lookDrag.y = event.clientY;
  camera.quaternion.setFromEuler(new THREE.Euler(lookPitch, lookYaw, 0, 'YXZ'));
});
renderer.domElement.addEventListener('pointerup', event => {
  if (!pointerStart || pointerStart.id !== event.pointerId) return;
  const distance = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
  pointerStart = null;
  lookDrag = null;
  if (distance > 5 || transitioning) return;
  updateRaycaster(event);
  if (sceneMode === 'exterior') {
    const hits = raycaster.intersectObjects(exterior.userData.entranceMeshes, false);
    if (hits.length && hits[0].object.userData.action === 'enterInterior') enterInterior();
  } else {
    const hits = raycaster.intersectObjects(interior.userData.interactables, false);
    if (hits.length) {
      const hotspot = hits[0].object.userData.hotspot;
      if (hotspot === 'early') focusInterior('desk');
      if (hotspot === 'painting') focusInterior('painting');
    }
  }
});
renderer.domElement.addEventListener('pointercancel', () => { lookDrag = null; pointerStart = null; });

const movementCodes = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'];
window.addEventListener('keydown', event => {
  if ($('#photo-dialog').open) {
    if (event.key === 'ArrowRight') $('#archive-next').click();
    if (event.key === 'ArrowLeft') $('#archive-prev').click();
    return;
  }
  if ($('#help-dialog').open) return;
  if (event.code === 'Escape' && controlMode === 'roam') {
    leaveRoamWithView();
    return;
  }
  if (controlMode === 'roam' && movementCodes.includes(event.code)) {
    event.preventDefault();
    pressedKeys.add(event.code);
  }
});
window.addEventListener('keyup', event => pressedKeys.delete(event.code));
window.addEventListener('blur', () => pressedKeys.clear());
$$('#mobile-pad button').forEach(button => {
  button.addEventListener('pointerdown', event => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    pressedKeys.add(button.dataset.key);
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    button.addEventListener(type, () => pressedKeys.delete(button.dataset.key));
  }
});

const furnitureBounds = [
  [0, -1.85, 1.5, .9], [0, -4.95, 3.1, .65],
  [-4.25, -2.7, 1.2, .85], [-4.25, .25, 1.2, .85], [-4.25, 3.15, 1.2, .85],
  [4.25, -2.7, 1.25, .85], [4.25, .25, 1.2, .85], [4.25, 3.15, 1.2, .85]
];
function updateRoaming(delta) {
  camera.quaternion.setFromEuler(new THREE.Euler(lookPitch, lookYaw, 0, 'YXZ'));
  const forwardAmount = Number(pressedKeys.has('KeyW') || pressedKeys.has('ArrowUp')) - Number(pressedKeys.has('KeyS') || pressedKeys.has('ArrowDown'));
  const sideAmount = Number(pressedKeys.has('KeyD') || pressedKeys.has('ArrowRight')) - Number(pressedKeys.has('KeyA') || pressedKeys.has('ArrowLeft'));
  if (!forwardAmount && !sideAmount) return;
  camera.getWorldDirection(moveVector);
  moveVector.y = 0;
  moveVector.normalize();
  const right = tempVector.crossVectors(moveVector, upVector).normalize();
  const speed = (pressedKeys.has('ShiftLeft') || pressedKeys.has('ShiftRight') ? 5.8 : 3.35) * delta;
  const movement = moveVector.multiplyScalar(forwardAmount).add(right.multiplyScalar(sideAmount)).normalize().multiplyScalar(speed);
  const next = camera.position.clone().add(movement);
  if (sceneMode === 'exterior') {
    next.x = THREE.MathUtils.clamp(next.x, -56, 56);
    next.z = THREE.MathUtils.clamp(next.z, -43, 43);
    const onBridge = Math.abs(next.x - 29) < 1.9 || Math.abs(next.x + 43) < 1.6;
    if (next.z > 18 && next.z < 30 && !onBridge) return;
    if (onBridge && next.z > 17 && next.z < 31) {
      next.y = 1.75 + Math.sin((next.z - 17) / 14 * Math.PI) * 1.55;
    } else next.y = 1.72;
  } else {
    next.x = THREE.MathUtils.clamp(next.x, -6.15, 6.15);
    next.z = THREE.MathUtils.clamp(next.z, -5.25, 5.35);
    next.y = 1.66;
    const blocked = furnitureBounds.some(([x, z, rx, rz]) => Math.abs(next.x - x) < rx && Math.abs(next.z - z) < rz);
    if (blocked) return;
  }
  camera.position.copy(next);
}

function updateSpatialLabels() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  spatialEntries.forEach(entry => {
    if (entry.scene !== sceneMode || controlMode === 'roam' || transitioning) {
      entry.element.style.display = 'none';
      return;
    }
    tempVector.copy(entry.position).project(camera);
    const visible = tempVector.z > -1 && tempVector.z < 1 && Math.abs(tempVector.x) < 1.08 && Math.abs(tempVector.y) < 1.08;
    entry.element.style.display = visible ? 'flex' : 'none';
    if (visible) {
      entry.element.style.left = `${(tempVector.x * .5 + .5) * width}px`;
      entry.element.style.top = `${(-tempVector.y * .5 + .5) * height}px`;
    }
  });
}

function updateMinimap() {
  if (sceneMode !== 'exterior') return;
  const source = controlMode === 'roam' ? camera.position : controls.target;
  const x = THREE.MathUtils.clamp((source.x + 60) / 120 * 230 + 5, 5, 235);
  const y = THREE.MathUtils.clamp((source.z + 45) / 90 * 140 + 5, 5, 150);
  $('#map-visitor').setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
  const angle = controlMode === 'roam' ? lookYaw : controls.getAzimuthalAngle();
  $('#orientation svg').style.transform = `rotate(${-angle}rad)`;
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65));
  renderer.setSize(window.innerWidth, window.innerHeight);
  $('#mobile-pad').hidden = controlMode !== 'roam' || !window.matchMedia('(max-width: 800px), (pointer: coarse)').matches;
}
window.addEventListener('resize', onResize);

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), .05);
  const time = clock.elapsedTime;
  if (cameraTween) {
    const progress = Math.min((performance.now() - cameraTween.started) / cameraTween.duration, 1);
    const eased = progress < .5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
    camera.position.lerpVectors(cameraTween.fromPosition, cameraTween.toPosition, eased);
    controls.target.lerpVectors(cameraTween.fromTarget, cameraTween.toTarget, eased);
    camera.lookAt(controls.target);
    if (progress === 1) {
      cameraTween = null;
      controls.enabled = controlMode === 'orbit';
      controls.update();
    }
  } else if (controlMode === 'roam') {
    updateRoaming(delta);
  } else {
    controls.update();
  }
  activeScene.userData.animate?.(time);
  updateSpatialLabels();
  updateMinimap();
  renderer.render(activeScene, camera);
}

updateSelectedUI();
updateStory(selected);
renderArchive();
animate();
setTimeout(() => $('#loading').classList.add('done'), 650);
