

// Variables globales que van siempre
var renderer, scene, camera;
var cameraControls;
var angulo = -0.01;

// 1-inicializa 
init();
// 2-Crea una escena
loadScene();
// 3-renderiza
render();

function init()
{
  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setClearColor( new THREE.Color(0xFFFFFF) );
  document.getElementById('container').appendChild( renderer.domElement );

  scene = new THREE.Scene();

  var aspectRatio = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera( 50, aspectRatio , 0.1, 100 );
  camera.position.set( 1, 1.5, 2 );

  cameraControls = new THREE.OrbitControls( camera, renderer.domElement );
  cameraControls.target.set( 0, 0, 0 );

  window.addEventListener('resize', updateAspectRatio );
}


function loadScene()
{
	// Añade el objeto grafico a la escena
    //let material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Verde
    let material = new THREE.MeshNormalMaterial();
       // Grupo para juntar todos los escalones
    let escalera = new THREE.Group();
    let ancho = 1;   // X
    let alto = 0.2;  // Y
    let fondo = 0.4; // Z
    let numEscalones = 10;for (let i = 0; i < numEscalones; i++) {
        let escalon = new THREE.Mesh(
            new THREE.BoxGeometry(ancho, alto, fondo),
            material
        );
        // Posición del escalón i
        escalon.position.y = i * alto;      // altura
        escalon.position.z = i * fondo;     // avance
        
        // Añadir al grupo
        escalera.add(escalon);  
    }
    scene.add(escalera);
}


function updateAspectRatio()
{
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function update()
{
  // Cambios para actualizar la camara segun mvto del raton
  cameraControls.update();
}

function render()
{
	requestAnimationFrame( render );
	update();
	renderer.render( scene, camera );
}