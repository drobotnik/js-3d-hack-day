// Utility functions

function toDeg(rad) { return rad * (180/Math.PI); }

function toRad(deg) { return deg * (Math.PI/180); }

function rand(min, max) {
	return (min + Math.random() * (max-min));
}

function extend(baseObj, obj) {
	var resultObj = {}  
	for(var prop in baseObj) {
		resultObj[prop] = obj.hasOwnProperty(prop) ? obj[prop] : baseObj[prop];
	}
	return resultObj;
}


// Control abstraction helper
// controlVector() gives the value of the "joystick" as a 3D vector
// isButtonPressed(buttonIndex) can be used to check buttons
function Controller(controls) {

	this.vec = new THREE.Vector3(0,0,0);
	this.buttons = [ false, false, false, false, false, false ];

	this.controls = controls;

	for (var i=0; i<this.controls.length; i++) {
		this.controls[i].pressed = false;
	}

	// returns 1 if right, -1 if left
	this.rightLeft = function() {
		return this.vec.x;
	}

	// returns 1 if up, -1 if down
	this.upDown = function() {
		return this.vec.y;
	}

	// returns 1 if forward, -1 if back
	this.forwardBack = function() {
		return this.vec.z;
	}

	this.controlVector = function() {
		return this.vec.clone();
	}
	
	this.isButtonPressed = function(buttonIndex) {
		if (buttonIndex >= 0 && buttonIndex < this.buttons.length) {
			return this.buttons[buttonIndex];
		}
		return false;
	}

	this.onKey = function(event, pressed) {
		// Get the key code of the pressed key
		var keyCode = event.which;
		for (var i=0; i<this.controls.length; i++) {
			if (keyCode == this.controls[i].kc) {
				
				var control = this.controls[i];

				/*var isPressed = pressed ? " pressed" : " up";
				console.log(control.which + isPressed);*/

				var effect = 0.0;
				if (pressed && !control.pressed) {
					effect = +1.0;
				}
				else if (!pressed && control.pressed) {
					effect = -1.0;
				}

				if (effect != 0) {
					if ("button" in control
						&& control.button >= 0 
						&& control.button < this.buttons.length) 
					{
						this.buttons[control.button] = (effect > 0);
					}
					if ("dx" in control) {
						this.vec.x += effect * control.dx;
					}
					if ("dy" in control) {
						this.vec.y += effect * control.dy;
					}
					if ("dz" in control) {
						this.vec.z += effect * control.dz;
					}
				}
				
				control.pressed = pressed;
			}
		}
	}

	function onKeyDown(event) { this.onKey(event, true); }

	function onKeyUp(event) { this.onKey(event, false); }

	document.addEventListener("keydown", onKeyDown.bind(this), false);
	document.addEventListener("keyup", onKeyUp.bind(this), false);
};

standardControls = [
	// xz controls: arrow keys left, right, up, down
	{ which:"left", kc:37, dx:-1 },
	{ which:"right", kc:39, dx:1 },
	{ which:"forward", kc:38, dz:1 },
	{ which:"back", kc:40, dz:-1 },

	// xyz controls w,a,s,d,q,e
	{ which:"a", kc:65, dx:-1 },
	{ which:"d", kc:68, dx:1 },
	{ which:"s", kc:83, dz:-1 },
	{ which:"w", kc:87, dz:1 },
	{ which:"q", kc:81, dy:-1 },
	{ which:"e", kc:69, dy:1 },

	// buttons z,x,c,v
	{ which:"z", kc:90, button:0 },
	{ which:"x", kc:88, button:1 },
	{ which:"c", kc:67, button:2 },
	{ which:"v", kc:86, button:3 }
];


// convenience function to make materials
function makeMaterial(customMatParams) {
	var defaultMatParams = {
		color: 0xffffff,
		specular: 0xffffff,
		shininess: 100,
		shading: THREE.SmoothShading
	}
	var matParams = extend(defaultMatParams, customMatParams);
	return new THREE.MeshPhongMaterial(matParams);
}


// given an object returns the direction it is pointing at
function getForwardVector(object3D) {
	var forwardVector = new THREE.Vector3(0,0,1);
	forwardVector.applyQuaternion(object3D.quaternion);
	return forwardVector;
}


// given an object returns the direction it is pointing at
function getSideVector(object3D) {
	var sideVector = new THREE.Vector3(1,0,0);
	sideVector.applyQuaternion(object3D.quaternion);
	return sideVector;
}


/*
util function to build geometry from a js object spec like this:

var ship = {
	parts: [
		{ 
			shape: { type: "sphere", r:0.1 },
		},
		{ 
			shape: { type: "cylinder", r1:0.1, r2:0.3, h:1.0 },
			position: { x:0.4, y:-0.7, z:0 },
		},
		{ 
			shape: { type: "cylinder", r1:0.1, r2:0.3, h:1.0 },
			position: { x:-0.4, y:-0.7, z:0 },
		},
		{ 
			shape: { type: "cylinder", r1:0.1, r2:0.3, h:1.0 },
			position: { x:0, y:0.5, z:0.2 },
			rotation: { x:30, y:0, z:0 }
		}
	]
}
*/
function makeGeometry(spec) {

	var SPH_SEG = 16;
	var CYL_SEG = 16;
	var LIN_SEG = 8;

	var baseGeom = new THREE.Geometry();

	for (var i=0; i<spec.parts.length; i++) {
		var part = spec.parts[i];
		if ("shape" in part) {
			var shape = part.shape;
			var geom;
			if (part.shape.type == "sphere") {
				geom = new THREE.SphereGeometry(shape.r, SPH_SEG, SPH_SEG);
			}
			if (part.shape.type == "cylinder") {
				geom = new THREE.CylinderGeometry(shape.r1, shape.r2, shape.h, CYL_SEG, LIN_SEG, false);
			}
			if (part.shape.type == "box") {
				geom = new THREE.BoxGeometry(shape.w, shape.h, shape.d, LIN_SEG, LIN_SEG, LIN_SEG);
			}

			if (geom) {
				var mat = new THREE.Matrix4();

				if ("position" in part) {
					var pos = part.position;
					var posMat = new THREE.Matrix4();
					posMat.makeTranslation(pos.x, pos.y, pos.z);
					mat.multiply(posMat);
				}

				if ("rotation" in part) {
					var rot = part.rotation;
					var rotMat = new THREE.Matrix4();
					var euler = new THREE.Euler( toRad(rot.x), toRad(rot.y), toRad(rot.z), 'XYZ');
					rotMat.makeRotationFromEuler(euler);
					mat.multiply(rotMat);
				}

				baseGeom.merge(geom, mat);
			}
		}
	}
	return baseGeom;
}
