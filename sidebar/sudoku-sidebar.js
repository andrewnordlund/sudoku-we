if (typeof (sudokuSB) == "undefined") {
	let sudokuSB = {};
}

sudokuSB = {
	dbug : sudoku.dbug,
	controls : {
		"newPuzzleBtn" : null,
		"optionsBtn" : null,
		"listHolder" : null,
	},
	
	init : function () {
		for (let control in sudokuSB.controls) {
			sudokuSB.controls[control] = document.getElementById(control);
			if (control == "newPuzzleBtn") sudokuSB.controls[control].addEventListener("click", sudokuSB.newPuzzle, false);
			if (control == "optionsBtn") sudokuSB.controls[control].addEventListener("click", sudokuSB.openOptionsPage, false);
			if (control == "listHolder") sudokuSB.controls[control].innerHTML = "<p> - </p>";

		}
		sudoku.load_grids(sudokuSB.populateUnfinishedList);
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
		if (sudoku.countObjs(sudoku.loadedGrids) > 0) {
			listHolder.innerHTML = "";
			let ol = document.createElement("ol");
			listHolder.appendChild(ol);

			for (let grid in sudoku.loadedGrids) {
				let li = document.createElement("li");
				ol.appendChild(li);

				let a = document.createElement("a");
				a.textContent = sudoku.loadedGrids[grid]["date"];
				a.setAttribute("href", "?p=" + grid);
				a.addEventListener("click", function (ev) {
					ev.preventDefault();
					sudokuSB.openPage("?p=" + grid);
					}, false);
				li.appendChild(a);
			}
		}
	}, // End of populateUnfinishedList
	listener : function (data, sender) {
		console.log ("got a message: " + data.msg);
		if (data.msg == "reload") sudoku.load_grids(sudokuSB.populateUnfinishedList);
	}, // End of listener
}

browser.runtime.onMessage.addListener(sudokuSB.listener)

sudokuSB.init();

