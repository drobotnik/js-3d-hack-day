(function () {

	// setup
	var width = 1000;
	var height = 500;

	// renderer
	// NOTE: +x is right, +y is up, +z points out of the screen
	var renderer = new THREE.WebGLRenderer();
	renderer.setSize(width, height);
	renderer.setClearColor(new THREE.Color(0.1, 0.5, 0.7))
	renderer.shadowMap.enabled = true;

	renderer.domElement.id = 'intro';
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
	
	// thing geometry parts
	var r1 = 0.6;
	var r2 = 0.9;
	var r3 = 0.6;

	var halfM = {
		parts: [
			{  // middle cones
				shape: { type: "cylinder", r1:0.1, r2:0.5, h: 1 },
				position: { x:0.4, y:1.75, z:0 },
				rotation: { x:0, y:0, z:100 }
			},
			{  // middle sphere
				shape: { type:"sphere", r:r1 },
				position: { x: 0, y: 0, z:0 },
			},
			{ 
				shape: { type: "cylinder", r1:0.4, r2:0.15, h: 1 },
				position: { x:0.2, y:0.5, z:0 },
				rotation: { x:0, y:0, z:140 }
			},
			{ 
				shape: { type: "cylinder", r1:0.15, r2:0.6, h:1 },
				position: { x: 0.75, y:1.2, z:0 },
				rotation: { x:0, y:0, z:140 }
			},
		
			{  // top right sphere
				shape: { type:"sphere", r:r2 },
				position: { x: 1.5, y:1.75, z:0 },
			},
			{ // 1st big
				shape: { type: "cylinder", r1: 0.75, r2:0.15, h: 1 },
				position: { x:1.85, y:1.2, z:0 },
				rotation: { x:0, y:0, z:30 }
			},
			{ //2nd big
				shape: { type: "cylinder", r1:0.15, r2:0.5, h:0.75 },
				position: { x:2.25, y:0.5, z:0 },
				rotation: { x:0, y:0, z: 30 }
			},
			{ // bottom right sphere
				shape: { type:"sphere", r:r3 },
				position: { x:2.5, y:0, z:0 },
			}
		]
	};

	var logo = makeGeometry(halfM);
	var leftSide = makeGeometry(halfM);
	leftSide.rotateY(toRad(180));
	logo.merge(leftSide, leftSide.matrix);
	var logoMesh = new THREE.Mesh(logo, makeMaterial({color:0xcc0000}));
	scene.add(logoMesh);
	logoMesh.castShadow = true;
	logoMesh.position.set(0, 0, 0);

	var	thingAngle = 0;

	// ---------------------------------------------
	// main loop
	function update() {

		logoMesh.rotation.y = toRad(thingAngle);
		thingAngle++;


		// draw
		renderer.render(scene, camera);

		// next frame
		requestAnimationFrame(update);
	};

	// start updates
	update();

}());
