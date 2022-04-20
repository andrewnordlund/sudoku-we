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

// Taken from griddb.js

// Might not need this because json support is prolly better now.
var jsonhelper = {
	init: function() {
		try {
			jsonhelper.stringify = JSON.stringify;
			jsonhelper.parse = JSON.parse;
		} catch(e) {
			jsonhelper.component = Components.classes["@mozilla.org/dom/json;1"].createInstance(Components.interfaces.nsIJSON);
			jsonhelper.stringify = jsonhelper.xstringify;
			jsonhelper.parse = jsonhelper.xparse;
		}
	},
	xstringify: function(o) {
		return jsonhelper.component.encode(o);
	},
	xparse: function(o) {
		return jsonhelper.component.decode(o);
	}
} // End of jsonhelper

// This will have to be severely modified because we don't do SQL anymore; it's all storage.
var griddb = {
	conn: null,
	init: function() {
		var file = Components.classes["@mozilla.org/file/directory_service;1"]
                	     .getService(Components.interfaces.nsIProperties)
	                     .get("ProfD", Components.interfaces.nsIFile);
		file.append("grids.sqlite");

		var storageService = Components.classes["@mozilla.org/storage/service;1"]
                        .getService(Components.interfaces.mozIStorageService);
		var createdb = 0;
		try {
			this.conn = storageService.openDatabase(file);
			// check whether we have got the tables
			var statement = this.conn.createStatement("SELECT count(*) FROM sqlite_master WHERE type='table' and name='saves' ");
			while (statement.executeStep()) {
				var value = statement.getInt32(0);
				if (!value) {
					// initialize the database
					createdb = 1;
				}
			}
			statement.finalize();
		} catch(e) {
			LOG("Exception: " + e);
			createdb = 1;
			file.remove(false);
			this.conn = storageService.openDatabase(file);
		}
		if (createdb) {
			this.createdb();
		}
	}, // End of init
	createdb: function() {
		LOG("Creating griddb");
		this.conn.executeSimpleSQL("CREATE TABLE saves (givens TEXT PRIMARY KEY, date INTEGER, data BLOB)");
		LOG("Creating griddb - done");
	}, // End of createdb
	save_grid: function(givens, data) {
		var s1 = this.conn.createStatement("SELECT count(*) FROM saves WHERE givens=?1");
		s1.bindStringParameter(0, givens);
		while (s1.executeStep()) {
			var value = s1.getInt32(0);
			break;
		}
		s1.finalize();
		if (value>0) {
			// update
			LOG("updating grid");
			s1 = this.conn.createStatement("UPDATE saves SET data=?1 WHERE givens=?2");
			s1.bindStringParameter(0, jsonhelper.stringify(data));
			s1.bindStringParameter(1, givens);
		} else {
			// insert
			LOG("saving as a new grid");
			var dt = new Date();
			s1 = this.conn.createStatement("INSERT INTO saves (givens, date, data) VALUES (?1, ?2, ?3)");
			s1.bindStringParameter(0, givens);
			s1.bindInt64Parameter(1, dt.getTime());
			s1.bindStringParameter(2, jsonhelper.stringify(data));
		}
		s1.execute();
		s1.finalize();
	}, // End of save_grid
	load_grid: function(givens) {
		var ret = null;
		var s1 = this.conn.createStatement("SELECT data FROM saves WHERE givens=?1");
		s1.bindStringParameter(0, givens);
		if (s1.executeStep()) {
			var s = s1.getString(0);
			ret = jsonhelper.parse(s);
		}
		s1.finalize();
		return ret;
	}, // End of load_grid
	clear_grid: function(givens) {
		var s1 = this.conn.createStatement("DELETE FROM saves WHERE givens=?1");
		s1.bindStringParameter(0, givens);
		s1.execute();
		s1.finalize();
	}, // End of clear_grid
	__sentinel: 0 //so that we can write a , after every bloody member.
}; // End of griddb

griddb.init();
jsonhelper.init();


if (sudoku.dbug) console.log ("sudoku.js loaded");

sudoku.loadOptions(sudoku.init, sudoku.errorFun);
