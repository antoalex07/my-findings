to create a website to just work on three js u can create a folder with just an index.html and main.js files instead of creating a whole react or vite web application the index.html page should be set as follows
```
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<title>My first three.js app</title>
		<style>
			body { margin: 0; }
		</style>
	</head>
	<body>
        <script type="importmap">
            {
              "imports": {
                "three": "https://unpkg.com/three/build/three.module.js",
                "jsm/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"
              }
            }
          </script>
		<script type="module" src="/main3.js"></script> // here it is main3.js so the threejs code would be in the file with that name
	</body>
</html>
```

then u can go on and edit the main.js page and make the imports as following

```
import * as THREE from 'three';
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
```

one of the first things to do while creating a three js frames is to set up the scene, camera and the renderer

```
// Set up scene, camera, and renderer
const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.body.appendChild(renderer.domElement);
const camera = new THREE.PerspectiveCamera(60, 1920 / 1080, 1.0, 1000.0);
camera.position.set(75, 20, 0);

```

obtaining a shadow for a mesh of your choice was the reason that bought me to creating this documentation. took way too long to figure out where i had gone wrong on that one 

next up we need to create a plane on which we will cast the shadow 

```
const planeGeometry = new THREE.PlaneGeometry(10, 10); // Width and height of the plane
const planeMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00, side: THREE.DoubleSide }); 
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.y = Math.PI; // Rotate plane to be horizontal
plane.receiveShadow = true;
plane.castShadow = false;
plane.position.set(0, 0, -2.5)
scene.add(plane);
```

here the important factor to notice is that at first i created the planeMaterial as MeshBasicMaterial which doesn't support shadowCasting in it so check whether the features you want to implement is supported by the things you use. also here we don't need the plane to cast any shadows so set it as false just make it so that it recieves the shadow on to it

for the 3d model we use a cube for now

```
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshStandardMaterial({color: 0x0077ff});
const cube = new THREE.Mesh(geometry, material);
cube.castShadow = true;
cube.receiveShadow = true;
cube.position.set(-1, 1, -1.5)
scene.add(cube);
```

both castShadow and recieveShadow are set to true since that would be like a realistic thing to do and thinking about being realistic we can make the plane cast shadow when it has some fluctuations in it now its just in the 2d plane simple stuff no shadow will be created from so thats it 

now for the lighting part

```
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 1.0);
pointLight.position.set(-1.01, 1, 0);
pointLight.castShadow = true;
scene.add(pointLight);

const pointLightHelper = new THREE.PointLightHelper(pointLight, 1);
scene.add(pointLightHelper);
```

here the pointLight will be the one that determines the shadow since ambientlight cannot cast a shadow

PointLight, SpotLight and DirectionalLight are the ones that are able to cast a shadow on threejs 

AmbientLight, HemisphereLight and RectLight are not able to cast a shadow

### Setting the position of the camera ###

``` const camera  = new THREE.PerspectiveCamera(fov, aspect ratio, near, far)  ```

fov is the camera frustum field of view from bottom to top of view 
	to get it into stuff the way i understand u take the picture of an object inside the frame the size of the object is determined by how much it gathers the focus for that picture there is also the distance from where the camera and the model is but the focus can change the size and the relative textures of that particular object and this happens at an angle from the camera in camera lens numerology it goes in 18-200mm lenses stuff like that. here in coding terminology it is defined by the arc angle at which the scene is focused on so the range is from 0 - 90 i don't exactly know the correct numbers. to put it simply it is in degrees and 10 did a magical clarity work on one of the models i used to work in

there is also another line of code that sets the camera in a given position 

``` camera.position.set(x, y, z) ```

##setting it all as 0## 
	the camera is kinda zoomed in on the center of my object 

## increasing only the value of x ##
	set as 1 the scene is in the right side, set as -1 scene is in the left side 
	set as 10 the scene is still in the same position in the right side but moved a bunch back in the z plane
	set as -10 same as -1 moved back in the z direction
	the values i checked where (1, 0, 0), (-1, 0, 0), (10, 0, 0), (-10, 0, 0)

## increasing only the value of y ##
	set as 1 the scene is now on top of the screen, set as -1 the scene is on the bottom
	set as 10 the scene moves backwards same as when the x value change was made

in each case the scene shifted 90 degrees to that side and when the value increases the scene stretches in to the z direction

##increasing only the value of z ##
	set as 1 u face the scene set as -1 the scene and u face the same direction, not at each other "to the same direction"
	set as 10 scene moves backwards stays in the centre itself 
	set as -10 scene and u face the same direction but scene is infront of u, u can see the backside of your frame

