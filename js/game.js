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


	// ---------------------------------------------
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

			var jumpVector = new THREE.Vector3(0,20,0);
			var diveVector = new THREE.Vector3(0,-1,0);
			var gravity = new THREE.Vector3(0,-0.7,0);
			if (controller.isButtonPressed(0) && this.mesh.position.y < 1.1){
				force.add(jumpVector);

			};

			if(controller.isButtonPressed(1)){
				force.add(diveVector);
			};
			if(this.mesh.position.y > 1){
				force.add(gravity);
				
			};




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

			if(this.mesh.position.y < 1){
				this.mesh.position.y = 1;
			};


		

		}


	};


	// ---------------------------------------------
	// blobs
	function Blob() {

		function makeBlobGeom(num, mns, mxs, spr) {
			var blobSpec = { parts:[] };
			for (var i = 0; i<num; i++) {
				blobSpec.parts.push(
				{
					shape: { type: "sphere", r:rand(mns,mxs) },
					position: { x:rand(-spr,spr), y:rand(-spr,spr), z:rand(-spr,spr) }
				});
			}
			return makeGeometry(blobSpec);
		}

		// create mesh
		var blobGeom = makeBlobGeom(10, 0.5, 1, 0.7);
		blobGeom.computeBoundingSphere();
		this.mesh = new THREE.Mesh(blobGeom, makeMaterial({color:0xffff00}));
		this.mesh.castShadow = true;

		var mass = 100;

		this.angle = 0;
		this.angularVel = rand(-10,10);
		this.vel = new THREE.Vector3(0,0,0);
		var maxForce = 1.0;

		// initialise function
		this.init = function() {
			scene.add(this.mesh);
			this.mesh.visible = false;
		}

		this.placeRandomly = function(spread) {
			this.mesh.position.set(rand(-spread,spread), 1, rand(-spread,spread));
			this.mesh.visible = true;
		}

		// updates movements
		this.update = function() {

			// update angle
			this.angle -= this.angularVel;	
			this.mesh.rotation.y = toRad(this.angle);

			// update position
			var force = new THREE.Vector3(rand(-maxForce,maxForce), 
										  0, 
										  rand(-maxForce,maxForce));

			// Keep it inside the circle
			var outBy = this.mesh.position.length() > arenaSize;
			if (outBy > 0)
			{
				var pushBack = this.mesh.position.clone();
				pushBack.y = 0;
				pushBack.negate();
				force.add(pushBack);
			}

			var acceleration = force.clone();
			acceleration.divideScalar(mass);

			this.vel.add(acceleration);
			this.mesh.position.add(this.vel);

			this.vel.multiplyScalar(moveFriction);
		}

		this.active = function() {
			return this.mesh.visible;
		}

		this.hide = function() {
			this.mesh.visible = false;
		}

		this.collidesWith = function(other) {
			var d = this.mesh.position.distanceTo(other.mesh.position);
			return (d < this.mesh.geometry.boundingSphere.radius);
		}

	}

	// ---------------------------------------------

	// create and initialise our thing
	var thing = new Thing();
	thing.init();

	// create and initialise blobs
	function createBlobs(num) {
		var blobs = [];
		for (var i = 0; i< num; i++) {
			var blob = new Blob();
			blob.init();
			blobs.push(blob);
		}
		return blobs;
	}

	function placeBlobs() {
		blobs.forEach( function(blob) { 
			blob.placeRandomly(arenaSize / 2); 
		});
	}

	var blobs = createBlobs(10);
	placeBlobs();



	// ---------------------------------------------
	// main loop
	function update() {

		thing.update();

		var haveActiveBlobs = false;
		blobs.forEach( function(blob) {
			if (blob.active()) {
				blob.update();
				haveActiveBlobs = true;
				if (blob.collidesWith(thing)) {
					if(thing.mesh.position.y > 1.1){
						blob.hide();
					}
					else{
						console.log('BOUNCE!')
					};
					
				}
			}
		});
		if (!haveActiveBlobs) {
			placeBlobs();
		}
		
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
