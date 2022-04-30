if (typeof (sudokuSB) == "undefined") {
	let sudokuSB = {};
}

sudokuSB = {
	dbug : sudoku.dbug,
	controls : {
		"newPuzzleBtn" : null,
		"optionsBtn" : null,
		"listHolder" : null,
		"unfinishedGamesH2" : null
	},
	
	init : function () {
		for (let control in sudokuSB.controls) {
			sudokuSB.controls[control] = document.getElementById(control);
			if (control == "newPuzzleBtn") {
				sudokuSB.controls[control].addEventListener("click", sudokuSB.newPuzzle, false);
				sudokuSB.controls[control].innerHTML = browser.i18n.getMessage("new");
			} else if (control == "optionsBtn") {
				sudokuSB.controls[control].addEventListener("click", sudokuSB.openOptionsPage, false);
				sudokuSB.controls[control].innerHTML = browser.i18n.getMessage("sudokuOptions");
			} else if (control == "listHolder") {
				sudokuSB.controls[control].innerHTML = "<p> - </p>";
			} else {
				let con = control.match(/(.*)(H\d|Lbl)/);
				if (con) {
					console.log ("from " + control + " about to get the i18n for " + con[1] + ".");
					console.log ("Gonna update for " +control + ": " + sudokuSB.controls[control] + ".");
					sudokuSB.controls[control].innerHTML = browser.i18n.getMessage(con[1]);
				}

			}

		}
		sudoku.load_grids().then (sudokuSB.populateUnfinishedList, sudoku.errorFun);
		//sudoku.observe(/*sudokuSB.populateUnfinishedList*/ function () {console.log ("storage was updated");});
	}, // End of init

	newPuzzle : function () {
		let thisPage = "?r=0";
		sudokuSB.openPage(thisPage);
	}, // End of newPuzzle

	openPage : function (page) {
		var sudokuTab = null;
		browser.tabs.query({url:"moz-extension://*" + sudoku.thePage + page}).then(function (tabs) {
				    //  moz-extension://7b9475d5-3135-47bb-8d8f-ca27fb4f1745/sidebar/c
			if (tabs.length == 0) {
				if (sudokuSB.dbug) console.log ("It's not already open.  Go ahead and open it now.");
				browser.tabs.create({url: sudoku.thePage + page});
			} else {
				if (sudokuSB.dbug) console.log ("It's already open in tab " + tabs[0].id + " in window " + tabs[0].windowId + ".  Gotta find which tab in which window.");
				// Gotta figure out how to activate the tab
				// Yay!  but what about if it's in a different window?
				browser.windows.update(tabs[0].windowId, {focused:true}).then(function(){
					browser.tabs.update(tabs[0].id, {active:true});
				}, sudoku.errorFun);
			}
		}, function () { console.error ("There was an error");});
	}, // End of openPage

	openOptionsPage : function () {
		browser.runtime.openOptionsPage();
	}, // end of openOptionsPage


	populateUnfinishedList : function () {
		//if (sudokuSB.dbug) 
		if (sudoku.countObjs(sudoku.loadedGrids) > 0) {
			listHolder.innerHTML = "";
			let ol = document.createElement("ol");
			listHolder.appendChild(ol);

			for (let grid in sudoku.loadedGrids) {
				let li = document.createElement("li");
				ol.appendChild(li);

				let a = document.createElement("a");
				a.textContent = sudokuSB.format_date(sudoku.loadedGrids[grid]["date"], browser.i18n.getMessage("dateformat"));

				a.setAttribute("href", "?p=" + grid);
				a.addEventListener("click", function (ev) {
					ev.preventDefault();
					sudokuSB.openPage("?p=" + grid);
					}, false);
				li.appendChild(a);
			}
		} else {
			if (sudokuSB.dbug) console.log ("populateUnfinishedList::Nothing to list.");
		}
	}, // End of populateUnfinishedList
	listener : function (data, sender) {
		if (data.msg == "reload") {
			sudoku.load_grids().then(sudokuSB.populateUnfinishedList, sudoku.errorFun);
		} else if (data.msg == "saveAndReload") {
			sudoku.add_grid(data.givens, data);
		}
	}, // End of listener
	format_date : function (d, fmt, monthNames) {
		var leftPad = function(n) {
			n = "" + n;
			return n.length == 1 ? "0" + n : n;
		};
    
		var r = [];
		var escape = false;
		if (monthNames == null)	monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

		for (var i = 0; i < fmt.length; ++i) {
			var c = fmt.charAt(i);
	
			if (escape) {
			    switch (c) {
			    case 'h': c = "" + d.getHours(); break;
			    case 'H': c = leftPad(d.getHours()); break;
			    case 'M': c = leftPad(d.getMinutes()); break;
			    case 'S': c = leftPad(d.getSeconds()); break;
			    case 'd': c = leftPad(d.getDate()); break;
			    case 'm': c = leftPad(d.getMonth() + 1); break;
			    case 'y': c = "" + d.getFullYear(); break;
			    case 'b': c = "" + monthNames[d.getMonth()]; break;
			    }
	    			r.push(c);
				escape = false;
			} else {
			    if (c == "%")
				escape = true;
			    else
				r.push(c);
			} // End of if escape
		} // End of for
		return r.join("");
	}, // End of format_date

}

browser.runtime.onMessage.addListener(sudokuSB.listener)

sudokuSB.init();

