import * as THREE from 'three';
import {
  meshBox, cylinderBetween, createBuilding, createRoof, createCourtyardWall,
  createTree, createLantern, createBoat, createStoneBridge, createCorridor
} from './architecture.js';

function addBuilding(scene, materials, options) {
  const building = createBuilding(materials, options);
  scene.add(building);
  return building;
}

function addWall(scene, materials, width, x, z, rotation = 0, height = 2.2) {
  const wall = createCourtyardWall(materials, width, height);
  wall.position.set(x, 0, z);
  wall.rotation.y = rotation;
  scene.add(wall);
  return wall;
}

function addTree(scene, trees, materials, x, z, scale = 1, seed = 0) {
  const tree = createTree(materials, scale, seed);
  tree.position.set(x, 0, z);
  scene.add(tree);
  trees.push(tree);
  return tree;
}

function createGarden(scene, materials) {
  const garden = new THREE.Group();
  garden.position.set(12, 0, -31);
  garden.add(meshBox(28, .16, 18, materials.earth, 0, -.01, 0));
  const path = meshBox(3.2, .12, 18, materials.stone, 0, .07, 0);
  garden.add(path);
  for (const side of [-1, 1]) {
    for (let row = 0; row < 4; row++) {
      garden.add(meshBox(4.3, .18, 1.25, materials.earth, side * 5.4, .11, -5.7 + row * 3.4));
    }
  }
  const cropGeometry = new THREE.ConeGeometry(.18, .52, 5);
  const crops = new THREE.InstancedMesh(cropGeometry, materials.crop, 160);
  const matrix = new THREE.Matrix4();
  let index = 0;
  for (const side of [-1, 1]) {
    for (let row = 0; row < 4; row++) {
      for (let plant = 0; plant < 20; plant++) {
        const x = side * 5.4 + ((plant % 5) - 2) * .76;
        const z = -5.7 + row * 3.4 + (Math.floor(plant / 5) - 1.5) * .28;
        matrix.makeTranslation(x, .46, z);
        crops.setMatrixAt(index++, matrix);
      }
    }
  }
  crops.castShadow = true;
  garden.add(crops);

  const well = new THREE.Group();
  const wellBase = new THREE.Mesh(new THREE.CylinderGeometry(.85, .95, .8, 12, 1, true), materials.stone);
  wellBase.position.y = .4;
  well.add(wellBase);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.87, .14, 6, 16), materials.stone);
  rim.rotation.x = Math.PI / 2; rim.position.y = .82;
  well.add(rim);
  const water = new THREE.Mesh(new THREE.CircleGeometry(.73, 20), materials.water);
  water.rotation.x = -Math.PI / 2; water.position.y = .25;
  well.add(water);
  well.position.set(9.7, 0, -4.8);
  garden.add(well);

  const signPost = meshBox(.14, 1.7, .14, materials.wood, -1.9, .85, 6.5);
  garden.add(signPost);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.65, .68), materials.sign('百草園', { fontSize: 150 }));
  sign.position.set(-1.9, 1.5, 6.55);
  garden.add(sign);

  const mudWall = meshBox(15, 1.3, .45, materials.plasterDark, 3.5, .65, -8.4);
  garden.add(mudWall);
  scene.add(garden);
  addWall(scene, materials, 12, -1, -40, 0, 1.6);
  addWall(scene, materials, 12, 25, -40, 0, 1.6);
}

function createEntrance(scene, materials) {
  const gate = new THREE.Group();
  gate.position.set(-51, 0, 0);
  for (const z of [-4.25, 4.25]) {
    gate.add(meshBox(1.05, 4.6, 1.05, materials.plaster, 0, 2.3, z));
    gate.add(meshBox(1.25, .4, 1.25, materials.stone, 0, .2, z));
  }
  gate.add(meshBox(.65, .65, 9.3, materials.darkWood, 0, 4.3, 0));
  const roof = createRoof(materials, 10.2, 2, .85);
  roof.rotation.y = Math.PI / 2;
  roof.position.y = 4.65;
  gate.add(roof);
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(3.7, .85), materials.sign('魯迅故里'));
  plaque.rotation.y = Math.PI / 2;
  plaque.position.set(.37, 4.25, 0);
  gate.add(plaque);
  scene.add(gate);
}

export function createExterior(materials) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#cbd8cf');
  scene.fog = new THREE.Fog('#cbd8cf', 70, 150);
  const trees = [];
  const boats = [];
  const lanterns = [];
  const entranceMeshes = [];

  const ground = meshBox(126, .5, 94, materials.grass, 0, -.35, 0);
  ground.castShadow = false;
  scene.add(ground);
  const mainStreet = meshBox(112, .15, 8.2, materials.stone, 0, -.01, 0);
  mainStreet.castShadow = false;
  scene.add(mainStreet);
  for (const x of [-39, -19, 3, 27, 47]) {
    const lane = meshBox(3.4, .12, 39, materials.stone, x, -.02, -19);
    lane.castShadow = false;
    scene.add(lane);
  }
  for (const z of [-4.35, 4.35]) {
    const curb = meshBox(112, .22, .25, materials.plasterDark, 0, .06, z);
    scene.add(curb);
  }

  const canal = new THREE.Mesh(new THREE.PlaneGeometry(124, 11, 1, 1), materials.water);
  canal.rotation.x = -Math.PI / 2;
  canal.position.set(0, -.04, 24);
  canal.receiveShadow = true;
  scene.add(canal);
  for (const z of [18.15, 29.85]) {
    const bank = meshBox(124, 1.25, .75, materials.stone, 0, -.14, z);
    scene.add(bank);
    const cap = meshBox(124, .18, .95, materials.plasterDark, 0, .52, z);
    scene.add(cap);
  }

  const ancestral = addBuilding(scene, materials, { width: 19, depth: 9, height: 4.7, x: -31, z: -11, sign: '魯迅祖居', windows: 4, roofRise: 2.1 });
  addBuilding(scene, materials, { width: 9, depth: 6, height: 3.8, x: -43, z: -17, sign: '', windows: 2, rotation: Math.PI / 2 });
  addBuilding(scene, materials, { width: 12, depth: 6, height: 3.8, x: -28, z: -24, sign: '', windows: 3, rotation: Math.PI });
  addWall(scene, materials, 20, -31, -4.8, 0, 1.5);
  addWall(scene, materials, 18, -42, -13.5, Math.PI / 2, 2.1);

  const former = addBuilding(scene, materials, { width: 20, depth: 9, height: 4.6, x: 11, z: -11, sign: '魯迅故居', windows: 4, roofRise: 2 });
  addBuilding(scene, materials, { width: 11, depth: 6, height: 3.8, x: 1, z: -20, rotation: Math.PI / 2, windows: 2 });
  addBuilding(scene, materials, { width: 13, depth: 6, height: 3.9, x: 20, z: -20, rotation: -Math.PI / 2, windows: 2 });
  addWall(scene, materials, 8, 1.5, -5.4, 0, 1.6);
  addWall(scene, materials, 7, 20.5, -5.4, 0, 1.6);

  const memorial = addBuilding(scene, materials, { width: 20, depth: 10, height: 5.2, x: 40, z: -11, sign: '魯迅紀念館', windows: 5, roofRise: 2.1, base: .55 });
  const memorialSteps = meshBox(9, .35, 2.4, materials.stone, 40, .15, -4.8);
  scene.add(memorialSteps);
  addWall(scene, materials, 15, 49.5, -20, Math.PI / 2, 2.2);

  createGarden(scene, materials);

  const sanwei = addBuilding(scene, materials, { width: 20, depth: 8, height: 4.8, x: -7, z: 11.1, sign: '', windows: 4, roofRise: 1.9, base: .65 });
  const sanweiEntrance = sanwei.userData.entrance;
  sanweiEntrance.userData.action = 'enterInterior';
  sanweiEntrance.userData.landmark = 'sanwei';
  entranceMeshes.push(sanweiEntrance);
  const verticalPlaque = new THREE.Mesh(
    new THREE.PlaneGeometry(.56, 2.05),
    materials.sign('三味書屋', { width: 256, height: 768, vertical: true, fontSize: 142, background: '#20241f', color: '#d1c5a5' })
  );
  verticalPlaque.position.set(-1.45, 2.25, 4.22);
  sanwei.add(verticalPlaque);
  const platform = meshBox(23, .75, 4.6, materials.stone, -7, .17, 16.15);
  scene.add(platform);
  for (let step = 0; step < 3; step++) scene.add(meshBox(5.2, .22, .7, materials.stone, -7, -.18 + step * .19, 18.3 - step * .58));
  for (const x of [-16.4, -11.2, -2.8, 2.4]) {
    const column = new THREE.Mesh(new THREE.CylinderGeometry(.16, .2, 4.6, 10), materials.darkWood);
    column.position.set(x, 2.75, 15.55);
    column.castShadow = true;
    scene.add(column);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.3, .34, .28, 10), materials.stone);
    base.position.set(x, .62, 15.55);
    scene.add(base);
  }
  for (const x of [-12.4, -1.6]) {
    const lantern = createLantern(materials, 1.15);
    lantern.position.set(x, 4.25, 15.65);
    scene.add(lantern);
    lanterns.push(lantern);
  }
  for (const x of [-16.2, 2.2]) {
    scene.add(meshBox(.16, 1, .16, materials.darkWood, x, 1.15, 17.3));
  }
  scene.add(cylinderBetween([-16.2, 1.55, 17.3], [-10.3, 1.55, 17.3], .06, materials.darkWood, 6));
  scene.add(cylinderBetween([-3.7, 1.55, 17.3], [2.2, 1.55, 17.3], .06, materials.darkWood, 6));

  const shops = [
    { x: -43, sign: '咸亨酒店', width: 12 },
    { x: -29, sign: '紹興黃酒', width: 12 },
    { x: 12, sign: '魯鎮茶館', width: 13 },
    { x: 29, sign: '書畫裝裱', width: 13 },
    { x: 45, sign: '故里人家', width: 12 }
  ];
  shops.forEach((shop, index) => {
    const building = addBuilding(scene, materials, { width: shop.width, depth: 7, height: 4 + (index % 2) * .4, x: shop.x, z: 10.7, sign: shop.sign, windows: 2, rotation: Math.PI, roofRise: 1.6 });
    if (index % 2 === 0) {
      const lantern = createLantern(materials, .85);
      lantern.position.set(shop.x + 3.6, 3.65, 6.85);
      scene.add(lantern); lanterns.push(lantern);
    }
    building.userData.shop = true;
  });

  addBuilding(scene, materials, { width: 15, depth: 8, height: 4.1, x: -35, z: -33, windows: 3, roofRise: 1.7 });
  addBuilding(scene, materials, { width: 12, depth: 7, height: 3.8, x: -15, z: -34, windows: 2, roofRise: 1.6 });
  addBuilding(scene, materials, { width: 15, depth: 8, height: 4.1, x: 41, z: -34, windows: 3, rotation: Math.PI, roofRise: 1.8 });
  addBuilding(scene, materials, { width: 13, depth: 7, height: 3.9, x: 47, z: 38, windows: 2, rotation: Math.PI, roofRise: 1.7 });
  addBuilding(scene, materials, { width: 15, depth: 8, height: 4, x: 17, z: 39, windows: 3, rotation: Math.PI, roofRise: 1.7 });
  addBuilding(scene, materials, { width: 14, depth: 7, height: 3.8, x: -35, z: 39, windows: 2, rotation: Math.PI, roofRise: 1.6 });

  const corridor = createCorridor(materials, 17);
  corridor.position.set(-18.8, 0, -12.3);
  scene.add(corridor);

  const bridge = createStoneBridge(materials, 3.5, 16);
  bridge.position.set(29, 0, 24);
  scene.add(bridge);
  const smallBridge = createStoneBridge(materials, 2.8, 15);
  smallBridge.position.set(-43, 0, 24);
  scene.add(smallBridge);

  [[-15, 23.7, .15], [10, 25.8, -.08], [-33, 22.5, .08], [42, 24.8, -.12]].forEach(([x, z, rotation], index) => {
    const boat = createBoat(materials, index === 0 ? 6.5 : 5.7);
    boat.position.set(x, -.08, z);
    boat.rotation.y = rotation;
    boat.userData.baseY = boat.position.y;
    boat.userData.phase = index * 1.7;
    scene.add(boat); boats.push(boat);
  });

  [
    [-48,-8,1.1],[-42,-28,1.25],[-24,-29,1],[-9,-20,.9],[-4,-36,1.15],
    [4,-27,.85],[22,-30,1.2],[25,-38,1.1],[31,-22,.85],[50,-26,1.2],
    [-46,8,.9],[-24,7,.8],[6,8,.85],[21,8,.75],[48,8,.9],
    [-51,32,1.1],[-25,34,1.05],[-3,34,1.2],[33,36,1.15],[53,32,1],
    [-2,16,1.1],[15,-40,.9],[8,-40,1]
  ].forEach(([x,z,scale], index) => addTree(scene, trees, materials, x, z, scale, index));

  createEntrance(scene, materials);

  const hemi = new THREE.HemisphereLight('#e7eee3', '#5a5848', 2.2);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff1d4', 3.1);
  sun.position.set(-35, 58, 28);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -68; sun.shadow.camera.right = 68;
  sun.shadow.camera.top = 58; sun.shadow.camera.bottom = -58;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 150;
  sun.shadow.bias = -.00025;
  sun.shadow.normalBias = .035;
  scene.add(sun);
  const fill = new THREE.DirectionalLight('#c5d8d0', .55);
  fill.position.set(30, 20, -40);
  scene.add(fill);

  scene.userData.animate = time => {
    materials.water.map.offset.x = time * .006;
    materials.water.map.offset.y = Math.sin(time * .18) * .025;
    materials.water.bumpMap.offset.copy(materials.water.map.offset);
    boats.forEach(boat => {
      boat.position.y = boat.userData.baseY + Math.sin(time * .85 + boat.userData.phase) * .045;
      boat.rotation.z = Math.sin(time * .55 + boat.userData.phase) * .012;
    });
    lanterns.forEach((lantern, index) => { lantern.rotation.z = Math.sin(time * .7 + index) * .025; });
    trees.forEach((tree, index) => {
      tree.userData.canopy.rotation.z = Math.sin(time * .35 + index * .7) * .006;
    });
  };

  scene.userData.setTimeOfDay = mode => {
    const dusk = mode === 'dusk';
    scene.background.set(dusk ? '#776f69' : '#cbd8cf');
    scene.fog.color.set(dusk ? '#776f69' : '#cbd8cf');
    hemi.color.set(dusk ? '#b6a5a1' : '#e7eee3');
    hemi.groundColor.set(dusk ? '#3c3b38' : '#5a5848');
    hemi.intensity = dusk ? 1.25 : 2.2;
    sun.color.set(dusk ? '#ffb36b' : '#fff1d4');
    sun.intensity = dusk ? 2.25 : 3.1;
    sun.position.set(dusk ? -55 : -35, dusk ? 20 : 58, 28);
    fill.intensity = dusk ? .3 : .55;
    materials.red.emissiveIntensity = dusk ? 1.8 : .12;
    materials.water.color.set(dusk ? '#465b58' : '#527c6e');
  };

  scene.userData.entranceMeshes = entranceMeshes;
  scene.userData.landmarkBuildings = { ancestral, sanwei, former, memorial };
  return scene;
}
