var renderer, scene, camera, cameraControls;
var robot, base, brazo, eje, rotula, abr, mano, pinza1, pinza2;
var gui, ctrls = {};
var animando = false, tweenUI;

var cameraMini;
const MINI_SCALE = 0.25;
let miniSize = 0;


var controls = {
  giroBase: 0,
  giroBrazo: 0,
  giroAntebrazoY: 0,
  giroAntebrazoZ: 0,
  rotacionPinzaZ: 0,
  sepPinza: 10,
  alambres: false,
  anima: function(){ animando ? stopAnim() : startAnim(); }
};

const PATHS = {
  floorColor: 'images/suelo.jpeg',
  robotPaint: 'images/metaloro.jpg',
  robotMetal: 'images/metal_128.jpg'
};
const TL = new THREE.TextureLoader();



init();
loadScene();
render();

function init() {
  renderer = new THREE.WebGLRenderer({ antialias:true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xFFFFFF);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setScissorTest(true);

  document.getElementById('container').appendChild(renderer.domElement);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 100);
  camera.position.set(1,3,3);

  cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
  cameraControls.target.set(0,0.5,0);
 

  const half = 5.5;
  cameraMini = new THREE.OrthographicCamera(-half, half, half, -half, 0.1, 50);
  cameraMini.position.set(0, 15, 0);
  cameraMini.up.set(0, 0, -1);
  cameraMini.lookAt(0, 0, 0);
  miniSize = Math.floor(MINI_SCALE * Math.min(window.innerWidth, window.innerHeight));



  window.addEventListener('resize', updateAspectRatio);
  document.addEventListener('keydown', onKeyDown);
}

function loadScene() {
  const texFloor = TL.load(PATHS.floorColor, t=>{
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(4,4);
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    t.encoding = THREE.sRGBEncoding;
  });
  const matSuelo = new THREE.MeshStandardMaterial({ map: texFloor, roughness: 0.9, metalness: 0.0 });
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(10,10), matSuelo);
  piso.rotation.x = -Math.PI/2;
  piso.receiveShadow = true;
  scene.add(piso);

  const texPaint = TL.load(PATHS.robotPaint, t=>{ t.anisotropy = renderer.capabilities.getMaxAnisotropy(); t.encoding = THREE.sRGBEncoding; });
  const texMetal = TL.load(PATHS.robotMetal, t=>{ t.anisotropy = renderer.capabilities.getMaxAnisotropy(); t.encoding = THREE.sRGBEncoding; });

  const matPaint = new THREE.MeshLambertMaterial({ map: texPaint, color: 0xffffff });
  const matMetal = new THREE.MeshPhongMaterial({ map: texMetal, color: 0xffffff, specular: 0x666666, shininess: 40 });

  const matPinza = matPaint.clone();
  matPinza.side = THREE.DoubleSide;

  const luz = new THREE.DirectionalLight(0xffffff, 1);
  luz.position.set(5,10,5);
  scene.add(luz, new THREE.AmbientLight(0xffffff, 0.4));

  robot = new THREE.Object3D();
  scene.add(robot);

  base = new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,0.15,30), matMetal);
  robot.add(base);

  brazo = new THREE.Object3D();
  base.add(brazo);

  eje = new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,0.18,16), matMetal);
  eje.rotation.z = Math.PI/2;
  brazo.add(eje);

  const esp = new THREE.Mesh(new THREE.BoxGeometry(0.18,1.2,0.12), matMetal);
  esp.position.y = 0.7;
  brazo.add(esp);

  rotula = new THREE.Mesh(new THREE.SphereGeometry(0.2), matPaint);
  rotula.position.y = 1.3;
  brazo.add(rotula);

  abr = new THREE.Object3D();
  abr.position.y = 1.3;
  brazo.add(abr);

  const disco = new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.22,0.06,24), matMetal);
  abr.add(disco);

  const nervios = new THREE.BoxGeometry(0.04,0.8,0.04);
  for (let i=0;i<4;i++){
    const n = new THREE.Mesh(nervios, matMetal);
    const a = i * Math.PI/2;
    n.position.set(0.1*Math.cos(a), 0.4, 0.1*Math.sin(a));
    abr.add(n);
  }

  mano = new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.15,0.4,16), matPaint);
  mano.position.y = 0.8;
  mano.rotation.z = Math.PI/2;
  abr.add(mano);

  const vertices = [
    0,0,0, 0,0.20,0, 0,0.20,0.04, 0,0,0.04,
    0.19,0.20,0.04, 0.19,0.20,0, 0.19,0,0, 0.19,0,0.04,
    0.38,0.16,0, 0.38,0.04,0, 0.38,0.04,0.02, 0.38,0.16,0.02
  ];
  const indices = [
    3,7,0, 7,6,0, 1,2,0, 2,3,0,
    5,1,0, 5,0,6, 4,5,6, 4,6,7,
    2,4,3, 4,7,3, 4,2,1, 4,1,5,
    4,5,8, 4,8,11, 8,5,6, 8,6,9,
    8,9,11, 11,9,10, 4,11,7, 11,10,7,
    10,9,6, 10,6,7
  ];
  const geoPinza = new THREE.BufferGeometry();
  geoPinza.setAttribute('position', new THREE.Float32BufferAttribute(vertices,3));
  geoPinza.setIndex(indices);
  geoPinza.computeVertexNormals();

  pinza1 = new THREE.Mesh(geoPinza, matPinza);
  pinza1.position.set(-0.05,0.06,0);
  pinza1.rotation.x = -Math.PI/2;
  pinza1.rotation.z = -Math.PI/2;
  mano.add(pinza1);

  pinza2 = pinza1.clone();
  pinza2.position.y = -0.07;
  pinza2.scale.z = -1;
  mano.add(pinza2);

  gui = new dat.GUI();
  const g = gui.addFolder('Control Robot');
  g.add(controls, 'giroBase',       -180, 180).name('Giro Base').listen();
  g.add(controls, 'giroBrazo',       -45,   45).name('Giro Brazo').listen();
  g.add(controls, 'giroAntebrazoY', -180,  180).name('Giro Antebrazo Y').listen();
  g.add(controls, 'giroAntebrazoZ',  -90,   90).name('Giro Antebrazo Z').listen();
  g.add(controls, 'rotacionPinzaZ',  -40,  220).name('Giro Pinza').listen();
  g.add(controls, 'sepPinza',          0,   15).name('Separación Pinza');
  g.add(controls, 'alambres').name('alambres');
  g.add(controls, 'anima').name('Anima');
  g.open();


}

function updateAspectRatio(){
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  miniSize = Math.floor(MINI_SCALE * Math.min(window.innerWidth, window.innerHeight));
}

function deg2rad(g){ return g * Math.PI / 180; }

function onKeyDown(e){
  if (!robot) return;
  const s = e.shiftKey ? 0.2 : 0.08, lim = 4.7;
  if (e.key === 'ArrowUp') robot.position.z -= s;
  else if (e.key === 'ArrowDown') robot.position.z += s;
  else if (e.key === 'ArrowLeft') robot.position.x -= s;
  else if (e.key === 'ArrowRight') robot.position.x += s;
  robot.position.x = Math.max(-lim, Math.min(lim, robot.position.x));
  robot.position.z = Math.max(-lim, Math.min(lim, robot.position.z));
}

function aplicarControles(){
  base.rotation.y  = deg2rad(controls.giroBase);
  brazo.rotation.z = deg2rad(controls.giroBrazo);
  abr.rotation.y   = deg2rad(controls.giroAntebrazoY);
  abr.rotation.z   = deg2rad(controls.giroAntebrazoZ);
  mano.rotation.z  = Math.PI/2 + deg2rad(controls.rotacionPinzaZ);
  const y = 0.065 + controls.sepPinza*0.005;
  pinza1.position.y =  y;
  pinza2.position.y = -y;
  robot.traverse(o=>{
    if (o.isMesh && o.material){
      if (Array.isArray(o.material)) o.material.forEach(m=>m.wireframe = controls.alambres);
      else o.material.wireframe = controls.alambres;
    }
  });
}

function updateDisplays(){
  for (var k in ctrls){
    if (ctrls[k] && ctrls[k].updateDisplay) ctrls[k].updateDisplay();
  }
}

function startAnim(){
  if (animando) return;
  animando = true;
  TWEEN.removeAll();

  tweenUI = new TWEEN.Tween(controls)
    .to({
      giroBase: 180,
      giroBrazo: 45,
      giroAntebrazoY: 180,
      giroAntebrazoZ: 90,
      rotacionPinzaZ: 220
    }, 2200)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .yoyo(true)
    .repeat(3)
    .onUpdate(() => { })
    .onComplete(() => { animando = false; })
    .start();
}



function update(){
  if (cameraControls) cameraControls.update();
  if (typeof TWEEN !== 'undefined' && TWEEN.update) TWEEN.update();
  aplicarControles();
}

function stopAnim(){
  animando = false;
  TWEEN.removeAll();
  updateDisplays();
}


function render(){
  requestAnimationFrame(render);
  update();

  renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
  renderer.setScissor(0, 0, window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);

  const x = 0;
  const y = window.innerHeight - miniSize;
  renderer.setViewport(x, y, miniSize, miniSize);
  renderer.setScissor(x, y, miniSize, miniSize);
  renderer.render(scene, cameraMini);
}

