let newPuzzleBtn, optionsBtn, listHolder = null;

newPuzzleBtn = document.getElementById("newPuzzleBtn");
optionsBtn = document.getElementById("optionsBtn");
listHolder = document.getElementById("listHolder");
if (newPuzzleBtn) {
	newPuzzleBtn.addEventListener("click", newPuzzle, false);
}

if (optionsBtn) {
	optionsBtn.addEventListener("click", openOptionsPage, false);
} else {
}

if (listHolder) listHolder.innerHTML = "<p> - </p>";

function newPuzzle () {
	let thePage = "/content_scripts/sudoku.html?r=0";

	var sudokuTab = null;
	browser.tabs.query({url:"moz-extension://*" + thePage}).then(function (tabs) {
			       //  moz-extension://7b9475d5-3135-47bb-8d8f-ca27fb4f1745/sidebar/c
		if (tabs.length == 0) {
			if (sudoku.dbug) console.log ("It's not already open.  Go ahead and open it now.");
			browser.tabs.create({url: thePage});
		} else {
			if (sudoku.dbug) console.log ("It's already open in tab " + tabs[0].id + " in window " + tabs[0].windowId + ".  Gotta find which tab in which window.");
			// Gotta figure out how to activate the tab
			// Yay!  but what about if it's in a different window?
			browser.windows.update(tabs[0].windowId, {focused:true}).then(function(){
				browser.tabs.update(tabs[0].id, {active:true});
			}, sudoku.errorFun);
		}
	}, function () { console.log ("There was an error");});

} // End of newPuzzle


function openOptionsPage () {
	browser.runtime.openOptionsPage();
} // end of openOptionsPage

sudoku.load_grids(populateUnfinishedList);

function populateUnfinishedList () {
	if (sudoku.countObjs(sudoku.loadedGrids) > 0) {
		listHolder.innerHTML = "";
		let ol = document.createElement("ol");
		listHolder.appendChild(ol);

		for (let grid in sudoku.loadedGrids) {
			let li = document.createElement("li");
			ol.appendChild(li);

			let a = document.createElement("a");
			a.textContent = sudoku.loadedGrids[grid]["date"];
			a.setAttribute("href", "?grid=" + grid);
			li.appendChild(a);
		}
	}
}
