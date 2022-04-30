if (typeof (sudokuCS) == "undefined") {
	var sudokuCS = {};
}

sudokuCS = {
	dbug : sudoku.dbug,
	init : function () {
		let body = null;
		body = document.querySelector("body");
		body.addEventListener("keyup", sudokuCS.key_pressed, false);
		body.addEventListener("contextmenu", function () {return false;}, false);

		let grid = null;
		grid = document.getElementById("grid");
		if (grid) grid.addEventListener("contextmenu", sudokuCS.handleRightMouse, false);
	}, // End of init
	key_pressed : function (ev) {
		document.getElementById("pressed_key").value = ""+ev.keyCode;
		gridder.key(ev.keyCode);
	}, // End of key_pressed
	handleRightMouse : function (e) {
		e.preventDefault();
	}, // End of handleRightMouse
	listener : function (message, sender, sendMessage) {
		if (message.msg == "updateOptions") {
			sudokuCS.dbug = message["options"]["dbug"];
			sudoku.options = message["options"];
			gridder.loadprefs();
			gridder.check_integrity();
		}
	}, // End of listener
}

document.addEventListener("DOMContentLoaded", function () {
	var supplied_grid_type = "random";
	var supplied_grid = 1;

	var p = window.location.href.indexOf("sudoku.html?p=");
	if (p != -1) { // it's there;  there's already a puzzle
		supplied_grid_type = "data";
		supplied_grid = window.location.href.substr(p+14);
	} else {
		var r = window.location.href.indexOf("sudoku.html?r=");
		if (r != -1) {  // It's there; and this should be getting the difficulty level?  Like r=0?
			supplied_grid = 1*window.location.href.substr(p+14);
		}
	}

	gridder.doc = document;
	//gridder.init_ff3ext();
	gridder.init();	// Sets everything to 0, or square 1, as it were; and adds event handlers.
	if (supplied_grid_type == "data") {
		sudoku.load_grids().then(function () {
			gridder.setup = sudoku.loadedGrids[supplied_grid]["data"];
			gridder.start_grid(supplied_grid);
		}, sudoku.errorFun);
		//gridder.start_grid(supplied_grid);	// This is for a loaded grid
	} else {
		sudoku.load_grids().then(function () {
			gridder.generate(supplied_grid);	// This is to generate a random grid
		}, sudoku.errorFun);
	}
}, false);
window.addEventListener("beforeunload", function () {
	gridder.smart_save();
}, false);

browser.runtime.onMessage.addListener(sudokuCS.listener)

sudokuCS.init();
