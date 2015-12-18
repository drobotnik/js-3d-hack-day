(function () {

	// setup
	var frame = 0;

	var div = document.createElement('div');
	document.body.appendChild(div);

	// ---------------------------------------------
	// main loop
	function update() {
		div.innerHTML = frame;
		frame++;

		// next frame
		requestAnimationFrame(update);
	};

	// start updates
	update();
	
}());
