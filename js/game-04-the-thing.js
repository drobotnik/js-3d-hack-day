(function () {

	// setup
	var width = 500;
	var height = 500;

	// renderer
	// NOTE: +x is right, +y is up, +z points out of the screen
	var renderer = new THREE.WebGLRenderer();
	renderer.setSize(width, height);
	renderer.setClearColor(new THREE.Color(0.1, 0.5, 0.7))
	renderer.shadowMap.enabled = true;

	document.body.appendChild(renderer.domElement);

	// scene
	var scene = new THREE.Scene();

	// light - sky and ground
	var worldLight = new THREE.HemisphereLight(0x66ccff , 0x00aa00, 0.5);
	scene.add(worldLight)

	// light - spot
	var spotLight = new THREE.SpotLight(0xffffff, 0.6, 0, toRad(60), 20.0);
	scene.add(spotLight);
	spotLight.castShadow = true;
	spotLight.shadowDarkness = 1.0;
	spotLight.shadowCameraNear = 5;
	spotLight.shadowCameraFar = 50;
	spotLight.shadowCameraFov = toDeg(spotLight.angle);
	spotLight.position.set(10, 20, 0);

	// camera
	var camera = new THREE.PerspectiveCamera(60, width/height, 0.1, 1000);
	camera.position.set(3, 5, 7);
	camera.lookAt(new THREE.Vector3(0,0,0));

	// floor plane
	var arenaSize = 20;
	var floorGeom = new THREE.PlaneGeometry(arenaSize, arenaSize, 1, 1);
	var floor = new THREE.Mesh(floorGeom, makeMaterial({color:0x009f2f, shininess:1}));
	scene.add(floor);
	floor.receiveShadow = true;
	floor.rotation.x = -toRad(90);

	// thing geometry parts
	var thingParts = {
		parts: [
			{ 
				shape: { type:"sphere", r:0.6 },
			},
			{ 
				shape: { type:"sphere", r:0.3 },
				position: { x:-0.2, y:0.3, z:0.3 },
			},
			{ 
				shape: { type:"sphere", r:0.25 },
				position: { x:0.2, y:0.3, z:0.3 },
			},
			{ 
				shape: { type: "cylinder", r1:0.1, r2:0.4, h:1.0 },
				position: { x:0, y:0.0, z:0.6 },
				rotation: { x:90, y:0, z:0 }
			},
			{ 
				shape: { type: "box", w:1.0, h:0.1, d:0.5 },
				position: { x:0.9, y:0, z:-0.2 },
				rotation: { x:0, y:20, z:-10 }
			},
			{ 
				shape: { type: "box", w:1.0, h:0.1, d:0.5 },
				position: { x:-0.9, y:0, z:-0.2 },
				rotation: { x:0, y:-20, z:10 }
			},
			{ 
				shape: { type: "box", w:0.1, h:1.0, d:1.2 },
				position: { x:0, y:0.2, z:-0.3 },
				rotation: { x:30, y:0, z:0 }
			}
		]
	};
	// thing
	var thingGeom = makeGeometry(thingParts);
	var thingMesh = new THREE.Mesh(thingGeom, makeMaterial({color:0xffffff}));
	scene.add(thingMesh);
	thingMesh.castShadow = true;
	thingMesh.position.set(0, 1, 0);

	var	thingAngle = 0;

	// ---------------------------------------------
	// main loop
	function update() {

		thingMesh.rotation.y = toRad(thingAngle);
		thingAngle++;


		// draw
		renderer.render(scene, camera);

		// next frame
		requestAnimationFrame(update);
	};

	// start updates
	update();

}());
