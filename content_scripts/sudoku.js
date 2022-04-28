if (typeof (sudokuCS) == "undefined") {
	var sudokuCS = {};
}

sudokuCS = {
	dbug : true,
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
		console.log ("pressed " + ev.keyCode);
		gridder.key(ev.keyCode);
	}, // End of key_pressed
	handleRightMouse : function (e) {
		e.preventDefault();
	}, // End of handleRightMouse
	listener : function (message, sender, sendMessage) {
		if (message.msg == "updateOptions") {
			console.log ("Updating options in CS");
			sudokuCS.dbug = message["options"]["dbug"];
			sudoku.options = message["options"];
			gridder.loadprefs();
			gridder.check_integrity();
		}
	}, // End of listener
}

document.addEventListener("DOMContentLoaded", function () {
	console.log ("Window is now loaded.");
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
	console.log ("About to call gridder.init();");
	gridder.init();
	if (supplied_grid_type == "data") {
		gridder.start_grid(supplied_grid);
	} else {
		gridder.generate(supplied_grid);
	}
}, false);
window.addEventListener("beforeunload", function () {
	console.log ("Unloading and then saving....");
	gridder.smart_save();
}, false);

browser.runtime.onMessage.addListener(sudokuCS.listener)

sudokuCS.init();
