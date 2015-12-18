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
	var spotLight = new THREE.SpotLight(0xffffff, 0.6, 0, toRad(60), 10.0);
	scene.add(spotLight);
	spotLight.castShadow = true;
	spotLight.shadowDarkness = 1.0;
	spotLight.shadowCameraNear = 30;
	spotLight.shadowCameraFar = 100;
	spotLight.shadowCameraFov = toDeg(spotLight.angle);
	spotLight.position.set(10, 35, 0);

	// camera
	var camera = new THREE.PerspectiveCamera(60, width/height, 0.1, 1000);
	camera.position.set(10, 20, 20);
	camera.lookAt(new THREE.Vector3(0,0,0));

	// floor plane
	var arenaSize = 20;
	var floorGeom = new THREE.CircleGeometry(arenaSize, 64);
	var floor = new THREE.Mesh(floorGeom, makeMaterial({color:0x009f2f, shininess:1}));
	scene.add(floor);
	floor.receiveShadow = true;
	floor.rotation.x = -toRad(90);

	// controller utility object
	var controller = new Controller(standardControls);

	// game objects
	var rotFriction = 0.95;
	var moveFriction = 0.98;

	// playable "character"
	function Thing() {

		// thing geometry parts
		var thingSpec = {
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
		// create mesh
		var thingGeom = makeGeometry(thingSpec);
		this.mesh = new THREE.Mesh(thingGeom, makeMaterial({color:0xffffff}));
		this.mesh.castShadow = true;

		// constants
		var thingRotMass = 5;
		var thingMass = 50;

		// motion variables
		this.angle = 0;
		this.angularVel = 0;
		this.vel = new THREE.Vector3(0,0,0);

		// initialise function
		this.init = function() {
			scene.add(this.mesh);
			this.mesh.position.set(0, 1, 0);
		}

		// updates movements
		this.update = function() {

			// update angle
			var rotForce = controller.rightLeft();

			var rotAccel = rotForce / thingRotMass;

			this.angularVel += rotAccel;

			this.angle -= this.angularVel;	
			this.mesh.rotation.y = toRad(this.angle);

			this.angularVel *= rotFriction; // simulated friction


			// update position
			var force = getForwardVector(this.mesh);
			force.multiplyScalar(controller.forwardBack());

			// Keep it inside the circle
			var outBy = this.mesh.position.length() > arenaSize;
			if (outBy > 0)
			{
				var pushBack = this.mesh.position.clone();
				pushBack.y = 0;
				pushBack.negate();
				//pushBack.normalize();
				force.add(pushBack);
			}

			var acceleration = force.clone();
			acceleration.divideScalar(thingMass);

			this.vel.add(acceleration);
			this.mesh.position.add(this.vel);

			this.vel.multiplyScalar(moveFriction);
		}
	};

	// create and initialise our thing
	var thing = new Thing();
	thing.init();

	// ---------------------------------------------
	// main loop
	function update() {

		thing.update();
		
		// update camera
		camera.lookAt(thing.mesh.position);

		// draw
		renderer.render(scene, camera);

		// next frame
		requestAnimationFrame(update);
	};

	// start updates
	update();
	
}());
