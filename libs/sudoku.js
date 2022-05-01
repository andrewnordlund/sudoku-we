if (typeof (sudoku) == "undefined") {
	let sudoku = {};
}
sudoku = {
	dbug : false,
	thePage : "/content_scripts/sudoku.html",
	options : {
		"allowHard" : false,
		"showTooltips" : true,
		"hightlightRowCol" : true,
		"highlightWrongNumbers" : true,
		"dbug" : true
	},
	loaded : false,
	loadedGrids : {},
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
			if (savedObj.hasOwnProperty("options")) savedObj = savedObj["options"];

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
	add_grid : function(givens, data) {
		let dt = new Date();
		sudoku.loadedGrids[givens] = {"givens" : givens, "date" : dt, "data" : data};
		return sudoku.save_grids();
	}, // End of add_grid
	save_grids () {
		try {
			let saved = browser.storage.local.set({"savedGrids" : sudoku.loadedGrids});
			return saved;
		}
		catch (ex) {
			consol.error ("error whilst saving grids: " + ex.message);
		}
	}, // End of save_grids
	load_grids : function () {
		if (sudoku.dbug) console.log ("load_grids::loding grids");
		let savedObjP = browser.storage.local.get("savedGrids");
		savedObjP.then (function (savedObj) {
			if (savedObj.hasOwnProperty("savedGrids")) savedObj = savedObj["savedGrids"];
			sudoku.loadedGrids = savedObj;
			if (sudoku.dbug) console.log ("load_grids::We now have " + sudoku.countObjs(sudoku.loadedGrids) + " loaded grids.");
		}, sudoku.errorFun);
			if (sudoku.dbug) console.log ("load_grids::returning savedObjP.");
			return savedObjP;
	}, // End of load_grid
	load_grid : function (givens) {
		sudoku.load_grids().then (null, sudoku.errorFun);
	}, // End of load_grid
	clear_grid: function(givens) {
		if (sudoku.loadedGrids.hasOwnProperty(givens)) {
			delete sudoku.loadedGrids[givens];	// Ahhh. this function gets called a lot, but this _part_ should only be done when you've finished a puzzle!....except this is here in the original function, okay so leave it....it also happens with an unsolvable puzzle
			if (sudoku.dbug) console.log ("sudoku::clear_grids::Removing grid " + givens + " from storage.");
			let saved = sudoku.save_grids();
			return saved;
		} else {
			if (sudoku.dbug) console.log ("sudoku::clear_grids::Not removing grid " + givens + " from storage because it wasn't in loaded grids.");
			return ;

		}
	}, // End of clear_grid
	countObjs : function (obj) {
		var returnValue = 0;
		for (var i in obj) {
			returnValue++;
		}
		return returnValue;
	}, // End of countObjs
	getDifficultyString : function (dif) {
		var temp = "";
		
		if (dif>0 && dif<=30) {
			temp = browser.i18n.getMessage("easy");
		} else if (dif>30 && dif<=50) {
			temp = browser.i18n.getMessage("medium");
		} else if (dif>50) {
			temp = browser.i18n.getMessage("hard");
		} else {
			temp = browser.i18n.getMessage("unsolvable");
		}
		return temp;
		
	}, // End of getDifficultyString
	getTimeString : function (ticks) {
		let rv = "";
		if (ticks%60<10) {
			rv = "" + Math.floor(ticks/60) + ":0" + (ticks%60);
		} else {
			rv = "" + Math.floor(ticks/60) + ":" + (ticks%60);
		}
		return rv;
	}, // End of getTimeString
}



if (sudoku.dbug) console.log ("sudoku.js loaded");

sudoku.loadOptions(sudoku.init, sudoku.errorFun);
