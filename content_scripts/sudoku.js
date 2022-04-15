if (typeof (sudokuCS) == "undefined") {
	var sudokuCS = {};
}

sudokuCS = {
	dbug : true,
	gidder : null,
	init : function () {
		let body = null;
		body = document.querySelector("body");
		body.addEventListener("keyup", sudokuCS.key_pressed, false);
		body.addEventListener("contextmenu", function () {return false;}, false);
	}, // End of init
	key_pressed : function (ev) {
		document.getElementById("pressed_key").value = ""+ev.keyCode;
		console.log ("pressed " + ev.keyCode);
		gridder.key(ev.keyCode);
	}
}

document.addEventListener("DOMContentLoaded", function () {
	console.log ("Window is now loaded.");
	var supplied_grid_type = "random";
	var supplied_grid = 1;

	var p = window.location.href.indexOf("sudoku.html?p=");
	if (p!=-1) {
		supplied_grid_type = "data";
		supplied_grid = window.location.href.substr(p+14);
	} else {
		var p = window.location.href.indexOf("sudoku.html?r=");
		if (p!=-1) {
			supplied_grid = 1*window.location.href.substr(p+14);
		}
	}

	gridder.doc = document;
	//gridder.init_ff3ext();
	console.log ("About to call gridder.init();");
	gridder.init();
	if (supplied_grid_type == "data") {
		gridder.start_grid(supplied_grid);
	} else {
		gridder.generate(supplied_grid);
	}
}, false);

sudokuCS.init();
