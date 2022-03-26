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
	}, // End of init
	key_pressed : function (ev) {
		document.getElementById("pressed_key").value = ""+ev.keyCode;
		console.log ("pressed " + ev.keyCode);
	}
}

sudokuCS.init();
