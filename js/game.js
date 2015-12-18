(function () {

	// setup
	var width = 1000;
	var height = 500;
	var BULLET_SPEED = 1.2;
	var bullets = [];
	var lives = 3;
	var score = 0;
	var showScore;

	// renderer
	// NOTE: +x is right, +y is up, +z points out of the screen
	var renderer = new THREE.WebGLRenderer();
	renderer.setSize(width, height);
	renderer.setClearColor(new THREE.Color(0.1, 0.5, 0.7))
	renderer.shadowMap.enabled = true;

	document.addEventListener("DOMContentLoaded", function(event) {
    document.getElementById("intro").addEventListener("mousedown", closeIntro);

    function closeIntro() {
        document.body.insertBefore(renderer.domElement, document.body.firstChild);
        var element = document.getElementById("intro");
        element.removeEventListener("mousedown", closeIntro);
        document.body.removeChild(element);
        showScore = true;
				document.getElementById('score').innerHTML = score;
				document.body.removeChild(document.getElementById('intro-text'));
    } 

  });

	// scene
	var scene = new THREE.Scene();

	// light - sky and ground
	var worldLight = new THREE.HemisphereLight(0xffffff , 0x303030, 0.9);
	scene.add(worldLight)

	// light - spot
	var spotLight = new THREE.SpotLight(0xffffff, 0.2, 0, toRad(60), 20.0);
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
	var arenaSize = 60;
	var floorGeom = new THREE.CircleGeometry(arenaSize, 64);
	var floor = new THREE.Mesh(floorGeom, makeMaterial({color:0x909090, shininess:1}));
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
		this.mesh = new THREE.Mesh(thingGeom, makeMaterial({color:0xffff00}));
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

			var jumpVector = new THREE.Vector3(0,30,0);
			var gravity = new THREE.Vector3(0,-0.7,0);
			if (controller.isButtonPressed(0) && this.mesh.position.y < 1.01){
				force.add(jumpVector);

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
		function makeBlobGeom(){
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
    return logo

		}

		this.damage = function(){
			this.mesh.material.emissive.setHex(orange);
			this.damaged = 1;
			window.setTimeout(function() {
			  this.mesh.material.emissive.setHex(0);
			  this.damaged = 0;
			}.bind(this), 3000);
		};

		// create mesh
		var blobGeom = makeBlobGeom();
		blobGeom.computeBoundingSphere();
		orange = 0xff9900;
		red = 0xff0000;
		this.mesh = new THREE.Mesh(blobGeom, makeMaterial({color:red}));
		this.mesh.castShadow = true;

		var mass = 100;
		this.damaged = 0;

		this.angle = 0;
		this.angularVel = rand(-10,10);
		this.vel = new THREE.Vector3(0,0,0);
		var maxForce = 1.0;

		// initialise functionwzw
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
	spotLight.target = thing.mesh;

	THREE.SceneUtils.attach(camera, scene, thing.mesh);
	camera.position.set(0,3, -5);
	camera.rotation.set(toRad(20),toRad(180),0);


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

	// Create and attach gun
	var gun = new Gun();
	gun.attachTo(thing);
	gun.init();

	// ---------------------------------------------
	// gun
	function Gun() {
		var OVERHEAT = 10;
		var gunGeom = new THREE.SphereGeometry(0.1, 32, 32);

		this.mesh = new THREE.Mesh(gunGeom, makeMaterial({color: 0xAAffff}));

		this.attachTo = function(owner) {
			owner.mesh.add(this.mesh);
		};

		this.fire = function() {
			var bullet;

			if (this.overheat > 0) {
				return;
			}

			bullet = new Bullet();

			bullet.init(this.mesh.parent.position, this.mesh.parent.rotation);

			this.overheat = OVERHEAT;

		};

		this.removeFrom = function(owner) {
			owner.mesh.remove(this.mesh);
		};

		this.init = function () {
			// scene.add(this.mesh);
		};

		this.update = function () {
			this.overheat -= 1;
			if (controller.isButtonPressed(4)) {
				this.fire();
			}
		};
	}

	function Bullet() {
		var BULLET_SIZE = 0.01;
		var bulletGeom = new THREE.CylinderGeometry(BULLET_SIZE, BULLET_SIZE*10, 3, 10);
		bulletGeom.rotateX(toRad(90));
		var material = makeMaterial({color: 0x000000});
		material.emissive.setHex(0x33FF33);
		this.mesh = new THREE.Mesh(bulletGeom, material);
		this.init = function(position, rotation) {
			this.mesh.position.copy(position);
			this.mesh.rotation.copy(rotation);
			bullets.push(this);
			scene.add(this.mesh);
		};

		this.destroy = function() {
			var indexToRemove;
			bullets.forEach(function (bullet, index) {
				if (bullet == this) {
					indexToRemove = index;
				}
			}.bind(this));
			bullets.splice(indexToRemove, 1);
			scene.remove(this.mesh);
		}

		this.update = function() {
			// get the thing's forward vector
			var forwardVector = getForwardVector(this.mesh);
			forwardVector.multiplyScalar(BULLET_SPEED);
			this.mesh.position.add(forwardVector);

			// Destroy if out of screen
			var outBy = this.mesh.position.length();
			if (outBy > arenaSize * 2)
			{
				this.destroy();
			}
		};

	}

	// ---------------------------------------------
	// main loop
	function update() {

		thing.update();
		gun.update();

		var haveActiveBlobs = false;
		blobs.forEach( function(blob) {
			if (blob.active()) {
				blob.update();
				haveActiveBlobs = true;
				if (blob.collidesWith(thing)) {
					if(thing.mesh.position.y > 1.1){
						blob.damage()
					}
					else{
						var pushBack = thing.mesh.position.clone();
						pushBack.sub(blob.mesh.position);
						pushBack.normalize();
						pushBack.multiplyScalar(0.4);
						thing.vel.add(pushBack);
						if (!blob.damaged) score -= 5;
					};
					
				}
			}
		});
		if (!haveActiveBlobs) {
			placeBlobs();
		}
		
		bullets.forEach(function (bullet) {
			bullet.update();
			blobs.forEach(function (blob) {
				if (blob.active() && blob.collidesWith(bullet) && blob.damaged) {
					blob.hide();
					score += Math.floor(Math.random() * 7);
				}
			});
		});

		// draw
		renderer.render(scene, camera);

		// next frame
		requestAnimationFrame(update);

		// update score
		if (showScore) {
			document.getElementById('score').innerHTML = score;
			document.getElementById('score').className = (score > 0 ? 'winning' : 'losing');
		}
	};

	// start updates
	update();
	
}());
