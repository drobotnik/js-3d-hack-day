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
	camera.position.set(5, 10, 20);
	camera.lookAt(new THREE.Vector3(0,0,0));

	// floor plane
	var arenaSize = 20;
	var floorGeom = new THREE.PlaneGeometry(arenaSize, arenaSize, 1, 1);
	var floor = new THREE.Mesh(floorGeom, makeMaterial({color:0x009f2f, shininess:1}));
	scene.add(floor);
	floor.receiveShadow = true;
	floor.rotation.x = -toRad(90);

	// sphere
	var ballRad = 2;
	var ballGeom = new THREE.SphereGeometry(ballRad, 32, 32);
	var ball = new THREE.Mesh(ballGeom, makeMaterial({color:0xffffff, shininess:100}));
	scene.add(ball);
	ball.castShadow = true;
	ball.position.set(0, 2, 0);

	// ---------------------------------------------
	// main loop
	function update() {

		// draw
		renderer.render(scene, camera);

		// next frame
		requestAnimationFrame(update);
	};

	// start updates
	update();

}());
