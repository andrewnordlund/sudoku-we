console.log ("Loading grid.js");
dbug = true;
function get_shuffled_range(from, to) {
	/**
	 * Creates an array with items <from, to) and shuffles it.
	 */
	var i;
	var a = Array(to);
	for (i = 0; i<to; i++) {
		a[i] = i;
	}
	for (i = 0; i<to; i++) {
		s = Math.floor(Math.random()*to);
		temp = a[s];
		a[s] = a[i];
		a[i] = temp;
	}
	return a;
}

gridder = {
	show_hl_tips:	true,	// show the tooltips with "allowed" numbers
	hl_cross: true,		// highlight the "cross" under the cursor
	hl_errors: true,	// highlight wrongly placed numbers

	num: 0,		// the selected number that will be inserted on click
	hl_row: -1,	// the highlit row
	hl_col: -1,	// the highlit column
	// flags:
	autoclean_hint: 1,	// automatically clean the hints when a number was placed
	autocheck:	1,	// automatically check the integrity after each number placed
	autochecknum:	1,	// automatically mark completed numbers
	col_css_rules:	[ null, null, null, null, null, null, null, null, null ],
	sq_css_rules:	[ [ null, null, null] , [null, null, null], [null, null, null] ],
	grid: 		null,
	difficulty:	null,
	counts:		[ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
	key: function(keyCode) {
		if (keyCode>=96 && keyCode<=105) {
			keyCode-= 48;
		}
		if (keyCode>=48 && keyCode<=57 || 32==keyCode || 88==keyCode || 120==keyCode) {
			var k = keyCode-48;
			if (32==keyCode || 88==keyCode || 120==keyCode) {
				k = 0;
			}
			gridder.set_num(k);
		}
	}, // End of key
	set_num: function(n) {
		var sp = document.getElementById("s" + gridder.num); //gridder.doc.getElementById("s" + gridder.num);
		if (sp.className.indexOf("usedup") != -1) {
			sp.className = "usedup nbg9";
		} else {
			sp.className = "nbg" + gridder.counts[gridder.num];
		}
		gridder.num = n;
		sp = gridder.doc.getElementById("s" + gridder.num);
		sp.className = "selmark " + sp.className;

		for (var r = 0; r<9; r++) {
			for (var c = 0; c<9; c++) {
				var el = gridder.doc.getElementById("mn" + r + c);
				if (gridder.num==gridder.cache[r][c] || gridder.num==-gridder.cache[r][c]) {
					if (0!=gridder.num) {
						el.className+= " selmark";
					}
				} else {
					if (gridder.cache[r][c]<0) {
						el.className = "mn hard";
					} else {
						el.className = "mn";
					}
				}
			}
		}
	}, // End of set_num
	/*
		Called from the main page
		
		* loads preferences
		* bundleServices?
	 */
	init_ff3ext: function() {
		Components.utils.import("resource://sudoku/griddb.jsm");
		gridder.prefs = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService)
			.getBranch("extensions.sudoku.");
		gridder.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
		gridder.loadprefs();
		gridder.prefs.addObserver("", this, false);

		var bundleService = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
		var strings_bundle = bundleService.createBundle("chrome://sudoku/locale/sudoku.properties");

		gridder.strings = {
			getString: function(s) {
				return strings_bundle.GetStringFromName(s);
			},
			getFormattedString: function(s, a, b)	{
				return strings_bundle.formatStringFromName(s, a, b);
			}
		}
		// localize the texts...
		var spans = gridder.doc.getElementsByTagName("span");
		for (var i = 0; i < spans.length; i++) {
			try {
				var el = spans[i];
				if (el.id.indexOf("loc_") == 0) {
					// Looks like strings_bundle is
					el.innerHTML = strings_bundle.GetStringFromName(el.id.substring(4));
				}
			} catch(e) {}
		}
	}, // End of init_ff3ext
	init_gecko: function() {
		window.griddb = {
			load_grid:	function() {	return null;	},
			clear_grid:	function() {},
			save_grid:	function() {}
		};
		gridder.prefs = {
			setIntPref: function(n, v)	{			},
			getIntPref: function(n)		{	return 0;	}
		};
		gridder.strings = {
			getString: function(s) {
				if ("gridsidebar.easy"==s) 	return "Easy";
				if ("gridsidebar.medium"==s)	return "Medium";
				if ("gridsidebar.hard"==s)	return "Hard";
				return s;	
			},
			getFormattedString: function(s, a, b)	{
				if ("mark.label"==s)	return "Mark " + a;
				return s + " " + a;
			}
		};
		gridder.notify_sidebar = function() { };
	}, // End of init_gecko
	loadprefs: function() {
		gridder.show_hl_tips = sudoku.options["showTooltips"];
		gridder.hl_cross = sudoku.options["hightlightRowCol"];
		gridder.hl_errors = sudoku.options["highlightWrongNumbers"];
		dbug = sudoku.options["dbug"];
		/*
		try { gridder.show_hl_tips = gridder.prefs.getBoolPref("hinttips"); } catch (e) { }
		try { gridder.hl_cross = gridder.prefs.getBoolPref("hlcross"); } catch (e) { }
		try { gridder.hl_errors = gridder.prefs.getBoolPref("hlerrors"); } catch (e) { }
		*/
		document.getElementById("grid").className = gridder.hl_cross ? "g hv" : "g";
	}, // End of loadprefs
	observe: function(subject, topic, data) {
			 /*
			    // Gonna have to figure out how to do this....
		if (dbug) console.log("observe:" + subject + "," + topic + "," + data + "<");
		if ("nsPref:changed"!=topic) {
			return;
		}
		if ("hinttips"==data) {
			gridder.show_hl_tips = gridder.prefs.getBoolPref("hinttips");
		} else if ("hlcross"==data) {
			gridder.hl_cross = gridder.prefs.getBoolPref("hlcross");
			document.getElementById("grid").className = gridder.hl_cross ? "g hv" : "g";
		} else if ("hlerrors"==data) {
			gridder.hl_errors = gridder.prefs.getBoolPref("hlerrors");
		}
		*/
		browser.storage.onChanged.addListener(/*gridder.checkStorageChange*/  function () {console.log ("storage was updated");});
		//gridder.check_integrity();
	}, // End of observe
	checkStorageChange : function (changes, area) {
		console.log("Change in storage area: " + area);

		let changedItems = Object.keys(changes);

		for (let item of changedItems) {
			if (item == "options") sudoku.loadOptions(function () {gridder.loadprefs();gridder.check_integrity();}, sudoku.errorFun);
			/*
			console.log(item + " has changed:");
			console.log("Old value: ");
			console.log(changes[item].oldValue);
			console.log("New value: ");
			console.log(changes[item].newValue);
			*/
		}
		gridder.check_integrity();
	}, // End of checkStorageChange
	init_opera: function() {
		gridder.alert_cell = function(r, c, state) {
			if (-1==gridder.doc.getElementById("cb" + r + c).className.indexOf("hard")) {
				if (state) {
					gridder.doc.getElementById("mn" + r + c).style.color = "#8B0000";
				} else {
					gridder.doc.getElementById("mn" + r + c).style = null;
				}
			}
		};
		gridder.clear_cell_orig = gridder.clear_cell;
		gridder.clear_cell = function(r,c) {
			gridder.clear_cell_orig(r, c);
			gridder.alert_cell(r, c, 0);
		};
	}, // End of init_opera
	init_gears: function() {
		window.griddb = {
			load_grid:	function(givens) {
				var ret = null;
				var rs = this.db.execute("SELECT data FROM saves WHERE givens=?", [givens]);
				if (rs.isValidRow()) {
					ret = JSON.parse(rs.field(0));
				}
				rs.close()
				return ret;
			},
			clear_grid:	function(givens) {
				this.db.execute("DELETE FROM saves WHERE givens=?", [ givens ]);
			},
			save_grid:	function(givens, data) {
				var dt = new Date();
				this.db.execute("DELETE FROM saves WHERE givens=?", [ givens ]);
				this.db.execute("INSERT INTO saves (givens, date, data) VALUES (?, ?, ?)",
						[ givens, dt.getTime(), JSON.stringify(data) ]);
			},
			get_saved: function() {
				var ret = [];
				var rs = this.db.execute("SELECT givens, date FROM saves ORDER BY date");
				while (rs.isValidRow()) {
					ret.push([rs.field(0), rs.field(1)]);
					rs.next();
				}
				rs.close();
				return ret;
			},
			init: function() {
				this.db = google.gears.factory.create('beta.database');
				this.db.open('grid');
				this.db.execute('CREATE TABLE IF NOT EXISTS saves (givens TEXT PRIMARY KEY, date INTEGER, data BLOB)');
			}
			//note: calling close is not required (http://code.google.com/apis/gears/api_database.html)
		};
		window.griddb.init();
	}, // End of init_gears
	init: function() {
		if (dbug) console.log ("gidder::Initting!");
		gridder.find_css();
		gridder.cache = [
			[ 0,0,0,0,0,0,0,0,0 ],
			[ 0,0,0,0,0,0,0,0,0 ],
			[ 0,0,0,0,0,0,0,0,0 ],
			[ 0,0,0,0,0,0,0,0,0 ],
			[ 0,0,0,0,0,0,0,0,0 ],
			[ 0,0,0,0,0,0,0,0,0 ],
			[ 0,0,0,0,0,0,0,0,0 ],
			[ 0,0,0,0,0,0,0,0,0 ],
			[ 0,0,0,0,0,0,0,0,0 ]
		];
		gridder.hints = [];
		gridder.user_stack = [];
		for (var r = 0;r<9;r++) {
			gridder.hints.push([])
			for (var c = 0;c<9;c++) {
				gridder.hints[r].push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
			}
		}
		gridder.ticks = -1;
		gridder.timer_on = 0;
		gridder.timer = setInterval(gridder.watch, 1000);

	      if (dbug) console.log ("gridder::Finished Initting!");
		gridder.init_ui();
		sudoku.observe(gridder.checkStorageChange);
	}, // End of init
	restart: function() {
		var i = 0;
		for (var r = 0;r<9;r++) {
			for (var c = 0;c<9;c++) {
				var val = gridder.cache[r][c];
				gridder.clear_cell(r, c);
				gridder.cache[r][c] = 0;
				gridder.hints[r][c] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
				if (val<0) {
					gridder.set_hard(r, c,-val);
				}
			}
			gridder.doc.getElementById("s" + (r+1)).className = "";
		}
		gridder.user_stack = [];
		stack = gridder.doc.getElementById("stack");
		stack.innerHTML = "";
		gridder.doc.getElementById("completed").style.visibility = "hidden";

		gridder.check_integrity();
		gridder.start_timer();
	}, // End of restart
	start_grid: function(data) {
		gridder.set_long(data);

		gridder.user_stack = [];
		stack = gridder.doc.getElementById("stack");
		stack.innerHTML = "";
		gridder.doc.getElementById("completed").style.visibility = "hidden";

		gridder.difficulty = null;
		var setup = sudoku.load_grid(data);
		if (null!=setup) {
			var i;
			gridder.cache = setup[0];
			gridder.hints = setup[1];
			gridder.ticks = setup[2];
			gridder.user_stack = setup[3];
			for (i = 0;i<gridder.user_stack.length;i++) {
				r = stack.insertRow(0);
				c = r.insertCell(0);
				c.id = "mark_" + i;
				c.innerHTML = gridder.strings.getFormattedString("mark.label", [""+(i+1)], 1)
				c.addEventListener("click", gridder.pop_mark, false);
			}
			gridder.repaint();
			if (setup.length>4) {
				gridder.difficulty = setup[4];
			}
		}
		if (null==gridder.difficulty) {
			var s = new SOLVER();
			s.init(gridder.cache, 1);
			while (s.step(1)) {
			}
			s.step_stats();

			if (!s.unsolved) {
				if (s.in_depth) {
					gridder.difficulty = 70;
				} else {
					gridder.difficulty = 40;
				}
			} else {
				gridder.difficulty = -1;
			}
		}
		if (dbug) console.log("gridder.difficulty:" + gridder.difficulty);
		var temp = "Blah!";
		/*
		if (gridder.difficulty>0 && gridder.difficulty<=30) {
			temp = gridder.strings.getString("gridsidebar.easy");
		} else if (gridder.difficulty>30 && gridder.difficulty<=50) {
			temp = gridder.strings.getString("gridsidebar.medium");
		} else if (gridder.difficulty>50) {
			temp = gridder.strings.getString("gridsidebar.hard");
		} else {
			temp = gridder.strings.getString("gridsidebar.unsolvable");
		}
		*/
		gridder.doc.getElementById("info_dif").innerHTML = temp;

	}, // End of start_grid
	init_ui: function() {
		if (dbug) console.log ("gidder::UI_Initting!");
		var ts = gridder.doc.getElementsByTagName('th');
		for (var i = 0;i<ts.length;i++) {
			ts[i].addEventListener("mouseup", gridder.cell_click, false);
			ts[i].addEventListener("dblclick", gridder.cell_dblclick, false);
			ts[i].addEventListener("mouseover", gridder.cell_enter, false);
			ts[i].addEventListener("mouseout", gridder.cell_leave, false);
		}
		gridder.doc.getElementById('s0').addEventListener("click", function() {gridder.set_num(0);}, false);
		gridder.doc.getElementById('s1').addEventListener("click", function() {gridder.set_num(1);}, false);
		gridder.doc.getElementById('s2').addEventListener("click", function() {gridder.set_num(2);}, false);
		gridder.doc.getElementById('s3').addEventListener("click", function() {gridder.set_num(3);}, false);
		gridder.doc.getElementById('s4').addEventListener("click", function() {gridder.set_num(4);}, false);
		gridder.doc.getElementById('s5').addEventListener("click", function() {gridder.set_num(5);}, false);
		gridder.doc.getElementById('s6').addEventListener("click", function() {gridder.set_num(6);}, false);
		gridder.doc.getElementById('s7').addEventListener("click", function() {gridder.set_num(7);}, false);
		gridder.doc.getElementById('s8').addEventListener("click", function() {gridder.set_num(8);}, false);
		gridder.doc.getElementById('s9').addEventListener("click", function() {gridder.set_num(9);}, false);

		gridder.doc.getElementById('solve').addEventListener("click", function() {gridder.solve(1);}, false);

		gridder.doc.getElementById('push').addEventListener("click", function() {gridder.push();}, false);
		gridder.doc.getElementById('gen').addEventListener("click", function() {gridder.generate();}, false);
		gridder.doc.getElementById('restart').addEventListener("click", function() {gridder.restart();}, false);

		gridder.doc.getElementById('completed').addEventListener("click", function() {gridder.generate();}, false);
		if (gridder.doc!=document) {	// Uhhhhh, should this ever happen?
			gridder.doc.getElementById('pressed_key').addEventListener("DOMAttrModified", 
				function(ev) {
					// the trouble is that if we press a key 3, then click on 1,
					// then press key 3 again it won't work because the attribute 
					// really didn't change. We must "reset" the attribute.
					var v = 1*ev.newValue;
					if (v != 16) {
						gridder.key(1*ev.newValue);
						gridder.doc.getElementById('pressed_key').value = 16;
					}
			}, false);
		}

		gridder.rowhint = gridder.doc.getElementById('rowhint')
		gridder.colhint = gridder.doc.getElementById('colhint')
		gridder.sqhint = gridder.doc.getElementById('sqhint')
		if (dbug) console.log ("gidder::Finished UI_Initting!");
	}, // End of init_ui
	find_css: function() {
		var r, i;
		var rules;
		for (r = 0;r<gridder.doc.styleSheets.length;r++) {
			rules = gridder.doc.styleSheets[r].cssRules;
			for (i = 0;i<rules.length;i++) {
				if (3==rules[i].selectorText.length && rules[i].selectorText.substring(0, 2)==".c") {
					var n = rules[i].selectorText.charCodeAt(2) - 48;
					if (n>=0 && n<9) {
						gridder.col_css_rules[n] = rules[i];
					}
				} else if (4==rules[i].selectorText.length && rules[i].selectorText.substring(0, 2)==".q") {
					var c = rules[i].selectorText.charCodeAt(2) - 48;
					var r = rules[i].selectorText.charCodeAt(3) - 48;
					if (c>=0 && c<3 && r>=0 && r<3) {
						gridder.sq_css_rules[r][c] = rules[i];
					}
				}
			}
		}
	}, // End of find_css
	clear_cell: function(r,c) {
		gridder.doc.getElementById("cb" + r + c).className = "cb";
		var mn = gridder.doc.getElementById("mn" + r + c)
		mn.innerHTML = "";
		mn.className = "mn";
		gridder.doc.getElementById("hn" + r + c).innerHTML = "";
	}, // End of clear_cell
	set_long: function(s) {
		var i = 0;
		for (var r = 0;r<9;r++) {
			for (var c = 0;c<s.length && c<9;c++) {
				gridder.clear_cell(r, c);
				gridder.cache[r][c] = 0;
				gridder.hints[r][c] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
				try {
					var n = s.charCodeAt(r*9+c) - 48;
					if (n>0 && n<=9) {
						gridder.set_hard(r, c, n);
					}
				} catch(e) {
				}
			}
			gridder.doc.getElementById("s" + (r+1)).className = "";
		}
		gridder.check_integrity();
		gridder.start_timer();
	}, // End of set_long
	start_timer: function() {
		gridder.timer_on = 1;
		gridder.ticks = 0;
	}, // End of start_timer
	stop_timer: function() {
		gridder.timer_on = 0;
	}, // End of stop_timer
	watch: function() {
		if (gridder.timer_on) {
			gridder.ticks++;
			var el = gridder.doc.getElementById("timer");
			if (gridder.ticks%60<10) {
				el.innerHTML = "" + Math.floor(gridder.ticks/60) + ":0" + (gridder.ticks%60);
			} else {
				el.innerHTML = "" + Math.floor(gridder.ticks/60) + ":" + (gridder.ticks%60);
			}
		}
	}, // End of watch
	set_hard: function(r, c, val) {
		var el = gridder.doc.getElementById("cb" + r + c);
		el.className = el.className + " hard";
		gridder.doc.getElementById("mn" + r + c).innerHTML = val;
		gridder.doc.getElementById("hn" + r + c).innerHTML = "";
		gridder.cache[r][c] = -val;
	}, // End of set_hard
	hilight_column: function(column, hl) {
		if (!gridder.hl_cross) {
			// actually, we better replace the hilight_column
			// function with an empty one if the highlighting is off
			return ;
		}
		if (null!=gridder.col_css_rules[column]) {
			gridder.col_css_rules[column].style.background = hl ? "#E0FFFF" : "none";
		}
	}, // End of hilight_column
	hilight_square: function(column, row, hl) {
		return ;
		var c = Math.floor(column/3);
		var r = Math.floor(row/3);
		if (gridder.sq_css_rules[c][r] != null) {
			gridder.sq_css_rules[c][r].style.background = hl ? "#E0FFFF" : "none";
		}
	}, // End of hilight_square
	cell_enter: function(ev) {
		var row = this.id.charCodeAt(0) - 48;
		var col = this.id.charCodeAt(1) - 48;
		if (gridder.hl_col != -1 && gridder.hl_col != col) {
			gridder.hilight_column(gridder.hl_col, 0);
		}
		if (gridder.hl_col != -1 && Math.floor(gridder.hl_col/3) != Math.floor(col/3) && gridder.hl_row != -1 && Math.floor(gridder.hl_row/3) != Math.floor(row/3)) {
			gridder.hilight_square(gridder.hl_col, gridder.hl_row, 0);
		}
		gridder.hilight_square(col, row, 1);
		gridder.hilight_column(col, 1);
		gridder.hl_col = col;
		gridder.hl_row = row;
		gridder.get_hl_tips();
	}, // End of cell_enter
	set_hint_string: function(l, sep, el, left, top) {
		var hint = ""
		for(i = 1;i<10;i++) {
			if(!l[i]) {
				hint+= i + sep;
			}
		}
		if (hint != "") {
			el.innerHTML = hint;
			el.style.visibility = "visible";
			el.style.left = left + "px";
			el.style.top = top + "px";
		} else {
			el.style.visibility = "hidden";
		}
	}, // End of set_hint_string
	get_hl_tips: function() {
		if (!gridder.show_hl_tips) {
			return ;
		}
		var i, j, a;
		var row = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		var col = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		var sq = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		var hint;
		for (i = 0; i < 9; i++) {
			a = Math.abs(gridder.cache[gridder.hl_row][i]);
			if (a) row[a]++;
			a = Math.abs(gridder.cache[i][gridder.hl_col]);
			if (a) col[a]++;
		}
		var rr = 3*Math.floor(gridder.hl_row/3);
		var cc = 3*Math.floor(gridder.hl_col/3);
		for (i = rr; i < rr + 3; i++) {
			for (j = cc; j < cc + 3; j++) {
				a = Math.abs(gridder.cache[i][j]);
				if (a) sq[a]++;
			}
		}
		// FIXME: move these to init
		var table = gridder.doc.getElementById("grid");
		var u0 = table.offsetWidth/9;
		gridder.set_hint_string(row, "&nbsp;", gridder.rowhint, u0*9, u0*gridder.hl_row);
		gridder.set_hint_string(col, "<br>"  , gridder.colhint, u0*gridder.hl_col, u0*9);
		gridder.set_hint_string(sq, " ", gridder.sqhint, u0*9, u0*9);
	}, // End of get_hl_tips
	cell_leave: function(ev) {
		if (-1!=gridder.hl_col && -1!=gridder.hl_row) {
			gridder.hilight_square(gridder.hl_col, gridder.hl_row, 0)
		}
		if (-1!=gridder.hl_col) {
			gridder.hilight_column(gridder.hl_col, 0);
		}
		gridder.hl_col = gridder.hl_row = -1;
		gridder.colhint.style.visibility = "hidden";
		gridder.rowhint.style.visibility = "hidden";
		gridder.sqhint.style.visibility = "hidden";
	}, // End of cell_leave
	cell_dblclick: function(ev) {
		ev.preventDefault();
		ev.stopPropagation();

		var r = this.id.charCodeAt(0) - 48;
		var c = this.id.charCodeAt(1) - 48;
		if (gridder.cache[r][c]<0) {
			gridder.set_num(-gridder.cache[r][c]);
			return ;
		}
		var el2 = gridder.doc.getElementById("mn" + this.id);
		el2.innerHTML = "";
		el2.className = "mn"
		gridder.cache[r][c] = 0;
		gridder.hints[r][c] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
		if (gridder.autocheck) {
			gridder.check_integrity();
		}
		gridder.get_hl_tips();
	}, // End of cell_dblclick
	cell_click: function(ev) {
		ev.preventDefault();
		ev.stopPropagation();

		var el;
		var r = this.id.charCodeAt(0) - 48;
		var c = this.id.charCodeAt(1) - 48;
		if (gridder.cache[r][c]<0) {
			return ;
		}
		if (ev.ctrlKey || ev.button>0) {
			if (!gridder.num) {
				gridder.hints[r][c] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
				gridder.doc.getElementById("hn" + this.id).innerHTML = "";
				return ;
			}
			if (gridder.cache[r][c]>0) {
				return ;
			}
			if (gridder.hints[r][c][gridder.num]) {
				gridder.hints[r][c][gridder.num] = 0;
			} else {
				gridder.hints[r][c][gridder.num] = 2;
			}
			var i;
			var s = "";
			var counter = 0;
			for (i = 1;i<=9;i++) {
				if(gridder.hints[r][c][i]) {
					s+= i;
					counter++;
					if (0==counter%3) {
						s+= "<br>";
					}
				}
			}
			gridder.doc.getElementById("hn" + this.id).innerHTML = s;
		} else {
			gridder.cache[r][c] = gridder.num;
			gridder.hints[r][c] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
			el = gridder.doc.getElementById("mn" + this.id);
			if (!gridder.num) {
				el.innerHTML = "";
				el.className = "mn";
			} else {
				el.innerHTML = "" + gridder.num;
				el.className = "mn selmark";
			}
			if (gridder.autoclean_hint && 0!=gridder.num) {
				gridder.doc.getElementById("hn" + this.id).innerHTML = "";
			}
			if (gridder.autocheck) {
				gridder.check_integrity();
			}
			gridder.get_hl_tips();
		}
	}, // End of cell_click
	alert_cell: function(r, c, state) {
		if (-1==gridder.doc.getElementById("cb" + r + c).className.indexOf("hard")) {
			gridder.doc.getElementById("mn" + r + c).style.color = state ? "#8B0000" : null;
		}
	}, // End of alert_cell
	check_integrity: function() {
		// FIXME: perhaps we should only check those that have changed?
		// Or perhaps not as we need this function anyway and it seems
		// to be fast enough.
		var temp;
		var r, c, i;
		var hasc, hasr;
		var alert_count = 0;
		var empty_cells = 0;
		var alerts = [];

		gridder.counts =   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
		// columns and row
		for (r = 0;r<9;r++) {
			hasc = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
			hasr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
			hass = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
			for (c = 0;c<9;c++) {
				gridder.counts[Math.abs(gridder.cache[r][c])]++;
				if (0==gridder.cache[r][c])	empty_cells++;
				hasc[Math.abs(gridder.cache[r][c])]++;
				hasr[Math.abs(gridder.cache[c][r])]++;
				hass[Math.abs(gridder.cache[3*Math.floor(r/3)+Math.floor(c/3)][3*(r%3)+c%3])]++;
			}
			for (i = 1;i<10;i++) {
				if (hasc[i]>1) {
					for (c = 0;c<9;c++) {
						if (gridder.cache[r][c]==i) {
							alerts[r*10+c] = 1;
						}
					}
				}
				if (hasr[i]>1) {
					for (c = 0;c<9;c++) {
						if (gridder.cache[c][r]==i) {
							alerts[c*10+r] = 1;
						}
					}
				}
				if (hass[i]>1) {
					for (c = 0;c<9;c++) {
						var tr = 3*Math.floor(r/3)+Math.floor(c/3);
						var tc = 3*(r%3)+c%3;
						if (gridder.cache[tr][tc]==i) {
							alerts[tr*10+tc] = 1;
						}
					}
				}
			}
		}
		// colorize
		for (r = 0;r<9;r++) {
			for (c = 0;c<9;c++) {
				if (gridder.hl_errors && (r*10+c) in alerts) {
					gridder.alert_cell(r, c, 1);
					alert_count++;
				} else {
					gridder.alert_cell(r, c, 0);
				}
			}
		}
		if (gridder.autochecknum) {
			for (i = 1;i<10;i++) {
				if (gridder.counts[i]>9) {
					gridder.counts[i] = 10;
				}
				var id = "s" + i;
				var sp = gridder.doc.getElementById(id);
				var cn = "nbg" + gridder.counts[i];
				if (gridder.num==i) {
					cn+= " selmark"
				}
				if (gridder.counts[i]>=9) {
					cn+= " usedup";
				}
				if (cn!=sp.className) {
					sp.className = cn;
				}
			}
		}
		if (0==empty_cells && 0==alert_count) {
			gridder.stop_timer();
			gridder.finished();
		}
	}, // End of check_integrity
	finished: function() {
		gridder.doc.getElementById("completed").style.visibility = "visible";
		sudoku.clear_grid(gridder.get_givens());
		gridder.notify_sidebar();
	}, // End of finished
	notify_sidebar: function() {
		var browser = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
		   .getInterface(Components.interfaces.nsIWebNavigation)
		   .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
		   .rootTreeItem
		   .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
		   .getInterface(Components.interfaces.nsIDOMWindow).gBrowser;
		var sidebarWindow = browser.ownerDocument.getElementById("sidebar").contentWindow;
		if ("chrome://sudoku/content/gridsidebar.xul"==sidebarWindow.location.href) {
			sidebarWindow.gridsb.grid_updated();
		}
	}, // End of notify_sidebar
	get_givens: function() {
		var out = "";
		var r, c;
		for (r = 0;r<9;r++) {
			for (c = 0;c<9;c++) {
				if (gridder.cache[r][c]<0) {
					out+= (-gridder.cache[r][c]);
				} else {
					out+= "_";
				}
			}
		}
		return out;
	}, // End of get_givens
	smart_save: function() {
		var out = gridder.get_givens();
		if (gridder.difficulty<0) {
			if (dbug) console.log("Clearing unsolvable grid");
			sudoku.clear_grid(out);
			return;
		}
		if (!gridder.timer_on) {
			if (dbug) console.log("Smartsave: not saving - finished");
			return ;
		}
		if (dbug) console.log("Smartsave Gathering.");
		var data = [ gridder.cache, gridder.hints, gridder.ticks, gridder.user_stack, gridder.difficulty ];
		sudoku.add_grid(out, data);
		//gridder.notify_sidebar();	// I don't tink we need to do this.  Okay, what this does is if the sidebar is still open, it updates the contents.  Maybe we need to do this, but let's take care of the saving first.
	}, // End of smart_save
	push: function() {
		var r, c, i;
		var cache = [];
		var hints = [];
		for (r = 0;r<9;r++) {
			cache.push(gridder.cache[r].slice());
			hints.push([])
			for(c = 0;c<9;c++) {
				hints[r].push(gridder.hints[r][c].slice());
			}
		}

		x = [ cache, hints, gridder.num ]
		gridder.user_stack.push(x);
		i = gridder.user_stack.length-1;

		r = gridder.doc.getElementById("stack").insertRow(0);
		c = r.insertCell(0);
		c.id = "mark_" + i;
		//c.innerHTML = gridder.strings.getFormattedString("mark.label", [""+(i+1)], 1)	// This should be replaced with a new localization thingy.
		c.innerHTML = "Mark " + (i+1); 

		c.addEventListener("click", gridder.pop_mark, false);
	}, // End of push
	pop_mark: function(ev) {
		gridder.pop(1*this.id.substring(5));
	}, // End of pop_mark
	pop: function(i) {
		if (dbug) console.log("POPPING: " + i);
		var x = gridder.user_stack[i];

		gridder.cache = [];
		gridder.hints = [];
		for (r = 0;r<9;r++) {
			gridder.cache.push(x[0][r].slice())
			gridder.hints.push([])
			for(c = 0;c<9;c++) {
				gridder.hints[r].push(x[1][r][c].slice());
			}
		}
		gridder.repaint();
		gridder.set_num(x[2]);
		gridder.doc.getElementById("completed").style.visibility = "hidden";
	}, // End of pop
	get_hint_string: function(h) {
		var i, out = "";
		var counter = 0;
		for (i = 1;i<10;i++) {
			if (h[i]) {
				out+= i;
				if (0==++counter%3) {
					out+= "<br>";
				}
			}
		}
		return out;
	}, // End of get_hint_strong
	repaint: function() {
		var r, c;
		for (r = 0;r<9;r++) {
			for (c = 0;c<9;c++) {
				var mn = gridder.doc.getElementById("mn" + r + c);
				var el = gridder.doc.getElementById("cb" + r + c);
				el.className = "cb";
				mn.className = "mn";
				if (gridder.cache[r][c]) {
					mn.innerHTML = "" + Math.abs(gridder.cache[r][c]);
					gridder.doc.getElementById("hn" + r + c).innerHTML = "";
					if (gridder.cache[r][c]<0) {
						el.className = "cb hard";
					}
				} else {
					mn.innerHTML = ""
					gridder.doc.getElementById("hn" + r + c).innerHTML = gridder.get_hint_string(gridder.hints[r][c]);
				}
			}
		}
		gridder.check_integrity();
		gridder.set_num(gridder.num);
	}, // End of repaint
	solve: function(how) {
		// note: we do not use the user-supplied numbers.
		// Params:
		//	how	0 - logical only
		//		1 - can use brute force
		if (gridder.timer_on) {
			gridder.timer_on = 2;
		}
		var s = new SOLVER();
		s.init(gridder.cache, 1);
		while (s.step(how)) {
		}
		s.step_stats();
		gridder.cache = s.grid;
		gridder.hints = s.hints;
		gridder.repaint();
	}, // End of solve
	generate: function() {
		var s = new SOLVER();
		var difficulty = 10;
		if (sudoku.options["allowHard"] === true) {
			difficulty = 70;
		}
		
		s.generate(difficulty);
		gridder.start_grid(s.get_condensed_grid())
	}, // End of generate
	_x_sentinel: 0
}; // End of gridder

function SOLVER() {
	var r, c;

	this.depth = "";
	this.pruned_cnt = 0;
	this.prop_cnt = 0;
	this.singles_cnt = 0;
	this.nakedpairs_cnt = 0;
	this.pointing_cnt = 0;
	this.steps_cnt = 0;
	this.in_depth = 0;
	this.unsolved = 1;
	this.LOG = this.do_log;
	this.grid = [];
	this.stat = [];	
		// contains:
		//	0	when a number is not placed yet
		//	-1	when it's a given
		//	1	when it was placed in a straightforward manner
		//	2	when it was placed in s complex manner
		//	3	when it was guessed
	this.hints = [];

	for (r = 0;r<9;r++) {
		this.grid.push([ 0, 0, 0, 0, 0, 0, 0, 0, 0]);
		this.stat.push([ 0, 0, 0, 0, 0, 0, 0, 0, 0]);
		this.hints.push([]);
		for (c = 0;c<9;c++) {
			this.hints[r].push([0, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
		}
	}
} // End of SOLVER()

SOLVER.prototype = {
	do_log: function() {
		out = "";
		for (var i = 0;i<arguments.length;i++) {
			out+= arguments[i] + " ";
		}
		if (dbug) console.log(out);
	}, // End of do_log
	skip_log: function() {
	}, // End of skip_log
	init: function(grid, onlygivens) {
		// Params:
		//	grid		The initial grid, containing zeroes as unset values, 
		//			negatives as givens and positives as user supplied 
		//			values
		//	onlygivens	Use only givens, ignore user supplied numbers.
		var r, c, val;
		for (r = 0;r<9;r++) {
			for (c = 0;c<9;c++) {
				val = grid[r][c];
				if (onlygivens && val>0) {
					val = 0;
				}
				if (val) {
						this.set_at(r, c, val, -1);
				}
			}
		}
	}, // End of init
	set_at: function(r, c, num, round) {
		this.grid[r][c] = num;
		this.hints[r][c] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ];
		this.stat[r][c] = round;
	}, // End of set_at
	prune_cell: function(r, c) {
		var i, j;
		var pruned = 0;
		var val = Math.abs(this.grid[r][c]);
		for (i = 0;i<9;i++) {
			pruned+= this.hints[r][i][val];
			pruned+= this.hints[i][c][val];
			this.hints[r][i][val] = 0;
			this.hints[i][c][val] = 0;
		}
		var tr = 3*Math.floor(r/3);
		var tc = 3*Math.floor(c/3);
		for (i = 0;i<3;i++) {
			for (j=0;j<3;j++) {
				pruned+= this.hints[tr+i][tc+j][val];
				this.hints[tr+i][tc+j][val] = 0;
			}
		}
		return pruned;
	}, // End of prune_cell
	/**
	 * For each placed number, remove hints from the column, row, square.
	 * Returns the number of pruned numbers.
	 */
	prune: function() {
		var r, c;
		var pruned = 0;

		for (r = 0;r<9;r++) {
			for (c = 0;c<9;c++) {
				if (this.grid[r][c]) {
					pruned+= this.prune_cell(r, c);
				}
			}
		}
		return pruned;
	}, // End of prune
	/**
	 * For all cells: If there is only 1 hint for a cell, place the number.
	 * Returns the number of propagated hints.
	 */
	propagate_hints: function() {
		var r, c, i, cnt, num;
		var prop = 0;

		for (r = 0;r<9;r++) {
			for (c = 0;c<9;c++) {
				cnt = 0;
				num = 0;
				for (i = 1;i<10;i++) {
					if (this.hints[r][c][i]) {
						cnt++;
						num = i;
					}
				}
				if (1==cnt) {
					this.set_at(r, c, num, 1);
					prop++;
				}
			}
		}
		return prop;
	}, // End of propogate_hint
	/**
	 * If a value is in only one hint in a row/column/square, places
	 * the number.
	 * Returns the number of placed numbers.
	 */
	propagate_singles: function() {
		var r, c, i, j;
		var flags;
		var ret = 0;
		for (r = 0;r<9;r++) {
			flags = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ];
			for (c = 0;c<9;c++) {
				for (i = 1;i<10;i++) {
					flags[i]+= this.hints[r][c][i];
				}
			}
			for (i = 1;i<10;i++) {
				if (1==flags[i]) {
					for (c = 0;c<9;c++) {
						if (this.hints[r][c][i]) {
							this.set_at(r, c, i, 1);
							ret++;
							break;
						}
					}
				}
			}
		}
		if (ret)	return ret;
		for (c = 0;c<9;c++) {
			flags = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ];
			for (r = 0;r<9;r++) {
				for (i = 1;i<10;i++) {
					flags[i]+= this.hints[r][c][i];
				}
			}
			for (i = 1;i<10;i++) {
				if (1==flags[i]) {
					for (r = 0;r<9;r++) {
						if (this.hints[r][c][i]) {
							this.set_at(r, c, i, 1);
							ret++;
							break;
						}
					}
				}
			}
		}
		if (ret)	return ret;
		for (r = 0;r<9;r++) {
			flags = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ];
			for (c = 0;c<9;c++) {
				for (i = 1;i<10;i++) {
					flags[i]+= this.hints[3*Math.floor(r/3)+Math.floor(c/3)][3*(r%3)+c%3][i];
				}
			}
			for (i = 1;i<10;i++) {
				if (1==flags[i]) {
					for (c = 0;c<9;c++) {
						if (this.hints[3*Math.floor(r/3)+Math.floor(c/3)][3*(r%3)+c%3][i]) {
							this.set_at(3*Math.floor(r/3)+Math.floor(c/3), 3*(r%3)+c%3, i, 1);
							ret++;
							break;
						}
					}
				}
			}
		}
		return ret;
	}, // End of propogate_singles
	count_possibilities: function(r, c) {
		var i;
		var ret = 0;
		for(i = 1;i<10;i++) {
			ret+= this.hints[r][c][i];
		}
		return ret;
	}, // End of count_possibilities
	compare_possibilities: function(r0, c0, r1, c1) {
		var i;
		var h1 = this.hints[r0][c0];
		var h2 = this.hints[r1][c1];
		for (i = 1;i<10;i++) {
			if (h1[i]!=h2[i])	return 0;
		}
		return 1;
	}, // End of compare_possibilities
	/**
	 * If there are exactly the same 2 possibilities in the same column,
	 * these 2 numbers cannot be anywhere else. Same for rows, squares.
	 * Returns the number of hints removed.
	 */
	propagate_naked_pairs: function() {
		var r, c, sub, i, j;
		var removed = 0;
		for (r = 0;r<9;r++) {
			for (c = 0;c<9;c++) {
				if (this.count_possibilities(r, c) == 2) {
					for (sub = r+1; sub<9; sub++) {
						if (this.count_possibilities(sub, c) == 2 && this.compare_possibilities(r, c, sub, c)) {
							for (i = 0;i<9;i++) {
								if (r != 1 && sub != i) {
									for (j = 1;j<10;j++) {
										if (this.hints[r][c][j] && this.hints[i][c][j]) {
											removed+=1;
											this.hints[i][c][j] = 0;
											//this.if (dbug) console.log("-- naked pair C -- REMOVED", j, "from [", i, c, "] due to [", r, c, "]-[", sub, c, "]");
										}
									}
								}
							}
							if (removed) return removed;
						}
					} // End of (sub = r+1; sub<9; sub++)
					for (sub = c+1; sub<9; sub++) {
						if (this.count_possibilities(r, sub) == 2 && this.compare_possibilities(r, c, r, sub)) {
							for (i = 0;i<9;i++) {
								if (c != i && sub != i) {
									for (j = 1;j<10;j++) {
										if (this.hints[r][c][j] && this.hints[r][i][j]) {
											removed+= 1;
											this.hints[r][i][j] = 0;
											//this.if (dbug) console.log("-- naked pair R -- REMOVED", j, "from [", r, i, "] due to [", r, c, "]-[", r, sub, "]");
										}
									}
								}
							}
							if (removed) return removed;
						}
					}
					{
						var rr = Math.floor(r/3)*3;
						var cc = Math.floor(c/3)*3;
						var temp = c+1;
						for (rrr = r;rrr<rr+3;rrr++) {
							for (ccc = temp;ccc<cc+3;ccc++) {
								if (2==this.count_possibilities(rrr, ccc) && this.compare_possibilities(r, c, rrr, ccc)) {
									var rrrr, cccc;
									for (rrrr = rr; rrrr<rr+3; rrrr++) {
										for (cccc = cc;cccc<cc+3;cccc++) {
											if (rrr==rrrr && ccc==cccc || r==rrrr && c==cccc) {
											} else {
												for (j = 1;j<10;j++) {
													if (this.hints[r][c][j] && this.hints[rrrr][cccc][j]) {
														removed+= 1;
														this.hints[rrrr][cccc][j] = 0;
														//this.if (dbug) console.log("-- naked pair SQ -- REMOVED", j, "from [", rrrr, cccc, "] due to [", r, c, "]-[", rrr, ccc, "] sq: ", rr, cc);
													}
												}
											}
										}
									}
									if (removed)	return removed;
								}
							}
							temp = cc;
						}
					}
				} // End of if (this.count_possibilities(r, c) == 2)
			} // End of for (c = 0;c<9;c++)
		} // End of for (r = 0;r<9;r++)
		return 0;
	}, // End of propage_naked_pairs
	propagate_pointing: function() {
		var j, rs, cs, r, c;
		for (j = 1;j<10;j++) {
			for (rs = 0;rs<9;rs+=3) {
				for (cs = 0;cs<9;cs+=3) {
					// [rs,cs] is the square start
					var pointingrow = -1;
					var in_row = 1;
					var pointingcol = -1;
					var in_col = 1;
					for (r = rs;r<rs+3 && (in_row || in_col);r++) {
						for (c = cs;c<cs+3 && (in_row || in_col);c++) {
							if (this.hints[r][c][j]) {
									if (-1==pointingrow || r==pointingrow) {
									pointingrow = r;
								} else {
									in_row = 0;
								}
								if (-1==pointingcol || c==pointingcol) {
									pointingcol = c;
								} else {
									in_col = 0;
								}
							}
						}
					}
					var removed = 0;
					if (in_row && -1!=pointingrow) {
						for (c = 0;c<9;c++) {
							if (c>=cs && c<cs+3) {
								continue;
							}
							if (this.hints[pointingrow][c][j]) {
								removed++;
								//this.if (dbug) console.log("-- pointing ROW", pointingrow, "val:", j, "removed in col:", c);
								this.hints[pointingrow][c][j] = 0;
							}
						}
					}
					if (in_col && -1!=pointingcol) {
						for (r = 0;r<9;r++) {
							if (r>=rs && r<rs+3) {
								continue;
							}
							if (this.hints[r][pointingcol][j]) {
								removed++;
								//this.if (dbug) console.log("-- pointing COL", pointingcol, "val:", j, "removed in row:", r);
								this.hints[r][pointingcol][j] = 0;
							}
						}
					}
					if (removed)	return removed;
				}
			}
		}
		return 0;
	}, // End of propgate_pointing
	/**
	 * Takes a step in the solution. Returns 1 if any action was taken - either a hint removed or a number placed.
	 * Returns 0 otherwise.
	 */
	step: function(how) {
		var i;
		var prop = 0;
		var pruned = 0;
		this.steps_cnt++;
	
		if (pruned = this.prune()) {
			this.pruned_cnt+= pruned;
			if (prop = this.propagate_hints())	this.prop_cnt+= prop;
			return 1;
		}
		if (pruned = this.propagate_singles()) {
			this.singles_cnt+= pruned;
			if (prop = this.propagate_hints())	this.prop_cnt+= prop;
			return 1;
		}
		if (pruned = this.propagate_naked_pairs()) {
			this.nakedpairs_cnt+= pruned;
			if (prop = this.propagate_hints())	this.prop_cnt+= prop;
			return 1;
		}
		if (pruned = this.propagate_pointing()) {
			this.pointing_cnt+= pruned;
			if (prop = this.propagate_hints())	this.prop_cnt+= prop;
			return 1;
		}
		this.unsolved = this.solved();
		if (how) {
			if (this.unsolved>0) {
				this.in_depth++;
				this.deep_solve();
				this.unsolved = this.solved();
			}
			return 0;
		}
	/*	if (!this.solved()) {
			this.dump(this.grid);
			this.dump(this.stat);
		}*/
		return 0;
	}, // End of step
	step_stats: function() {
		this.LOG("STEP:", this.steps_cnt, "PRUNED:", this.pruned_cnt, "PROPAGATED:", this.prop_cnt, "SINGLES:", this.singles_cnt, "NAKEDPAIRS:", this.nakedpairs_cnt, "POINTING:", this.pointing_cnt, "IN_DEPTH:", this.in_depth, "UNSOLVED:", this.is_solved);
	}, // End of step_stats
	get_hint: function(r, c) {
		var i, out = "";
		var counter = 0;
		for (i = 1;i<10;i++) {
			if (this.hints[r][c][i]) {
				out+= i;
				if (0==++counter%3) {
					out+= "<br>";
				}
			}
		}
		return out;
	}, // End of get_hint
	solved: function() {
		// Returns:
		//	0	- if solved
		//	-1	- if it contains conflicts or is unsolvable otherwise
		//	a positive number - usually 1 - when some cells have not been filled in yet #was: the number of cells that have not been filled in yet
		var r, c, i;
		var hasc, hasr, hass;
		var empty_cells = 0;

		for (r = 0;r<9;r++) {
			hasc = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
			hasr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
			hass = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
			for (c = 0;c<9;c++) {
				if (0==this.grid[r][c])	empty_cells++;
				hasc[Math.abs(this.grid[r][c])]++;
				hasr[Math.abs(this.grid[c][r])]++;
				hass[Math.abs(this.grid[3*Math.floor(r/3)+Math.floor(c/3)][3*(r%3)+c%3])]++;

				if (0==this.grid[r][c]) {
					var cnt = 0;
					for (i = 1;i<10;i++) {
						cnt+= this.hints[r][c][i];
					}
					if (0==cnt) {
						this.LOG(this.depth, "SOLVER::solve error - no hints available at ", r, c);
						return -1;
					}
				}
			}
			for (i = 1;i<10;i++) {
				if (hasc[i]>1) {
					for (c = 0;c<9;c++) {
						if (Math.abs(this.grid[r][c])==i) {
							this.LOG(this.depth, "SOLVER::solve error at ", r, c);
							return -1;
						}
					}
				}
				if (hasr[i]>1) {
					for (c = 0;c<9;c++) {
						if (Math.abs(this.grid[c][r])==i) {
							this.LOG(this.depth, "SOLVER::solve error at ", c, r);
							return -1;
						}
					}
				}
				if (hass[i]>1) {
					for (c = 0;c<9;c++) {
						var tr = 3*Math.floor(r/3)+Math.floor(c/3);
						var tc = 3*(r%3)+c%3;
						if (Math.abs(this.grid[tr][tc])==i) {
							this.LOG(this.depth, "SOLVER::solve error at ", tr, tc);
							return -1;
						}
					}
				}
			}
		}
	/*	if (0==empty_cells) {
			this.LOG(this.depth, "SOLVER::solve DONE");
		} else {
			this.LOG(this.depth, "SOLVER::solve to go:", empty_cells);
		}*/
		return empty_cells;
	}, // End of solved
	/**
	 * Returns 0 if there is exactly one solution.
	 * If there are more solutions, returns a number > 0.
	 * If there is no solution, returns a number < 0
	 */
	has_unique_solution: function() {
		while(this.step(0)) {
		}
		var solved = this.solved();
		if (solved<=0) {
			this.LOG(this.depth, "unique solution or non-solution", solved);
			return solved;
		}
		if (this.depth.length>2) {
			this.do_log(this.depth, "-------------------<too deep. assuming a non-unique solution.");
			return 2;
		}
		var shortest = 1000, sr = -1, sc = -1;
		var r, c, i;
		var cnt;

		for (r = 0;r<9;r++) {
			for (c = 0;c<9;c++) {
				cnt = 0;
				for (i = 1;i<10;i++) {
					cnt+= this.hints[r][c][i];
				}
				if (cnt>0 && cnt<shortest) {
					sr = r;
					sc = c;
					shortest = cnt;
					if (2==shortest) {
						r = c = 10;
						break;
					}
				}
			}
		}
		cnt = -1;
		for (i = 1;i<10;i++) {
			if (this.hints[sr][sc][i]) {
				this.do_log(this.depth, "US trying:", sr, sc, ">", i, "[", shortest);
				var s = new SOLVER();
				s.LOG = s.skip_log;
				s.init(this.grid, 0);
				s.depth = this.depth + ">";
				s.set_at(sr, sc, i, 3);
				var count = s.has_unique_solution();
				if (!count) {
					cnt+= 1;
				} else if (count>0) {
					cnt+= 2;
				}
				if (cnt>0) {
					this.LOG(this.depth, "non-unique solution");
					return cnt;
				}
			}
		}
		this.LOG(this.depth, "unique solution or non-solution", cnt);
		return cnt;
	}, // End of has_unique_solution
	deep_solve: function() {
		this.LOG(this.depth, "recurse in", this.depth.length);
		if (this.depth.length>92) {
			this.LOG("TOO DEEP");
			return ;
		}
		var shortest = 1000, sr = -1, sc = -1;
		var r, c, i;
		var cnt;

		var cnt = this.solved();
		if (cnt<=0) {
			return ;
		}
		var shortest_r = [];
		var shortest_c = [];

		for (r = 0;r<9;r++) {
			for (c = 0;c<9;c++) {
				cnt = 0;
				for (i = 1;i<10;i++) {
					cnt+= this.hints[r][c][i];
				}
				if (cnt>0 && cnt<shortest) {
					shortest_r = [];
					shortest_c = [];
					shortest = cnt;
				}
				if (cnt==shortest) {
					shortest_r.push(r);
					shortest_c.push(c);
				}
			}
		}
		i = Math.floor(Math.random()*shortest_r.length);
		sr = shortest_r[i];
		sc = shortest_c[i];
		for (i = 1;i<10;i++) {
			if (this.hints[sr][sc][i]) {
				this.LOG(this.depth, "recursive: solving with [", sr, sc, "]==", i);
				var s = new SOLVER();
				s.LOG = s.skip_log;
				s.init(this.grid, 0);
				s.depth = this.depth + ">";
				s.set_at(sr, sc, i, 3);
				while(s.step(1)) {
				}
				if (!s.solved()) {
					this.LOG(this.depth, "recursive: SOLVED");
					this.grid = s.grid;
					this.hints = s.hints;
					for (r = 0;r<9;r++) {
						for (c = 0;c<9;c++) {
							if (0==this.stat[r][c]) {
								this.stat[r][c] = s.stat[r][c];
							}
						}
					}
					break;
				} else {
					this.LOG(this.depth, "recursive: NOT SOLVED");
				}
			}
		}
	}, // End of deep_solve
	generate: function(difficulty) {
		var r, s, i, temp;
		// shuffle an array 1..9
		var shuffled = [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
		for (r = 0; r<9; r++) {
			s = Math.floor(Math.random()*9);
			temp = shuffled[s];
			shuffled[s] = shuffled[r];
			shuffled[r] = temp;
		}
		for (r = 0; r<9; r++) {
			this.set_at(r, Math.floor(Math.random()*9), shuffled[r], 3);
		}
		//this.do_log(shuffled);
		//this.dump(this.grid);
		while (this.step(1)) {
		}
		// remove non-guessed numbers
		for (r = 0;r<9;r++) {
			for (c = 0;c<9;c++) {
				if (3!=this.stat[r][c]) {
					this.grid[r][c] = 0;
				} else {
					this.grid[r][c] = -this.grid[r][c];
				}
			}
		}

		var removed = 0, put_back = 0;
		shuffled = get_shuffled_range(0, 81);
		// FIXME: randomize the item removal
		for (i = 0; i<81;i++) {
			r = Math.floor(shuffled[i]/9);
			c = shuffled[i] % 9;
		//for (r = 0;r<9;r++) {
		//	for (c = 0;c<9;c++) {
				if (this.grid[r][c]) {
					temp = this.grid[r][c];
					this.grid[r][c] = 0;
					removed++;
					s2 = new SOLVER();
					s2.LOG = s2.skip_log;
					s2.init(this.grid, 1);
					if (difficulty>50) {
						if (s2.has_unique_solution()) {
							this.grid[r][c] = temp;
							put_back++;
						}
					} else {
						while(s2.step(0)) {
						}
						if (s2.solved()) {
							this.grid[r][c] = temp;
							put_back++;
						}
					}
				}
			//}
		}
		this.LOG("stayed:", put_back, "  out of:", removed);
		this.log_puzzle();
	}, // End of generate
	get_condensed_grid: function() {
		var r, c, out = "";
		for (r = 0;r<9;r++) {
			for (c = 0;c<9;c++) {
				if (this.grid[r][c]<0) {
					out+= -this.grid[r][c];
				} else {
					out+= "_";
				}
			}
		}
		return out;
	}, // End of get_condensed_grid
	log_puzzle: function() {
		this.LOG("PUZZLE:", this.get_condensed_grid());
	}, // End of log_puzzle
	dump: function(a) {
		var r, c, out = "DUMP: ";
		for (r = 0;r<9;r++) {
			for (c = 0;c<9;c++) {
				if (a[r][c]<0) {
					out+= a[r][c] + " ";
				} else {
					out+= " " + a[r][c] + " ";
				}
			}
			out+= "\n      ";
		}
		this.do_log(out);
	}, // End of dump
	__sentinel: 0
}; // End of SOLVER.prototype
console.log ("Loaded grid.js");
