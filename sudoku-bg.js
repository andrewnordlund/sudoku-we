if (typeof (sudokuBG) == "undefined") {
	var sudokuBG = {};
}

sudokuBG = {
	urlRE : null,
	dbug : sudoku.dbug,
	thePage : "content_scripts/sudoku.html",
	init : function () {
		console.log ("Running sudoku....");
		//sudokuBG.dbug = true; //nordburg.getBoolPref("extensions.sudokuBG.", "dbug");
		//sudokuBG.observe(); //run();	// Let's see if we can do this more manually.
	}, // End of init
	run : function () {
		if (sudokuBG.dbug) console.log ("running.");
		var sudokuTab = null;
		browser.tabs.query({url:"moz-extension://8a44b277-5dde-4cf9-9d8b-b5ba07a491dc/" + sudokuBG.thePage}).then(function (tabs) {
			if (tabs.length == 0) {
				if (sudokuBG.dbug) console.log ("It's not already open.  Go ahead and open it now.");
				browser.tabs.create({url: sudokuBG.thePage});
			} else {
				if (sudokuBG.dbug) console.log ("It's already open in tab " + tabs[0].id + " in window " + tabs[0].windowId + ".  Gotta find which tab in which window.");
				// Gotta figure out how to activate the tab
				// Yay!  but what about if it's in a different window?
				browser.windows.update(tabs[0].windowId, {focused:true}).then(function(){
					browser.tabs.update(tabs[0].id, {active:true});
				}, sudokuBG.errorFun);
			}
		}, sudoku.errorFun);
	}, // End of run
}
browser.browserAction.onClicked.addListener(sudokuBG.run);
