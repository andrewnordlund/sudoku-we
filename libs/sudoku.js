if (typeof (sudoku) == "undefined") {
	let sudoku = {};
}
console.log ("Loading sudoku.js");

sudoku = {
	dbug : true,
	options : {
		"allowHard" : false,
		"showTooltips" : true,
		"hightlightRowCol" : true,
		"highlightWrongNumbers" : true,
		"dbug" : true
	},
	loaded : false,
	postLoad : [],
	init : function () {
		// Set global values to their defaults
		// I guess I don't have anything here yet.  Maybe sometime in the future.
	}, // End of init
	loadOptions : function (success, failure) {
		if (sudoku.dbug) console.log ("Loading Options.");
		var getting = browser.storage.local.get("options");
		getting.then(function (savedObj) {
			if (sudoku.dbug) console.log ("Got stored options.")

			for (var opt in sudoku.options) {
				if (savedObj.hasOwnProperty(opt)) {
					sudoku.options[opt] = savedObj[opt];
					if (opt == "dbug") {
						sudoku.dbug = sudoku.options[opt];
					}
				}
			}
			sudoku.setLoaded();
			if (success) success();
		}, failure);

	}, // End of loadOptions
	setLoaded : function () {
		sudoku.loaded = true;
		sudoku.afterLoad();
	}, // End of setLoaded
	afterLoad : function () {
		for (var i = 0; i < sudoku.postLoad.length; i++) {
			sudoku.postLoad[i]();
		}
	}, // End of afterLoad
	addToPostLoad : function (funcs) {
		sudoku.postLoad = Object.assign(sudoku.postLoad, funcs);
		if (sudoku.loaded) {
			sudoku.afterLoad();
		}
	}, // End of afterLoad
	errorFun : function (e) {
		console.error ("Error! " + e);
	}, // End of errorFun

}


if (sudoku.dbug) console.log ("sudoku.js loaded");

sudoku.loadOptions(sudoku.init, sudoku.errorFun);
