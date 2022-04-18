if (typeof (sudokuOpts) == "undefined") {
	let sudokuOpts = {};
}

sudokuOpts = {
	dbug : sudoku.dbug,
	controls : {
		"allowHardChk" : null,
		"showTooltipsChk" : null,
		"hightlightRowColChk" : null,
		"highlightWrongNumbersChk" : null,
		"devSection" : null,
		"dbugChk" : null,
	},
	downkeys : {"d" : null},
	init : function () {
		for (var control in sudokuOpts.controls) {
			sudokuOpts.controls[control] = document.getElementById(control);
			if (control.match(/Chk/)) sudokuOpts.controls[control].addEventListener("click", sudokuOpts.saveOptions, false);
		}
		sudoku.addToPostLoad([sudokuOpts.fillValues]);

		document.addEventListener("keydown", sudokuOpts.checkKeys, false);

	}, // End of init
	fillValues : function () {
		if (sudokuOpts.dbug) console.log ("Filling form values");
		
		for (let i in sudoku.options) {
			if (sudokuOpts.dbug) console.log ("Setting " + i + " to " + sudoku.options[i]);
			if (sudoku.options[i] === true) {
				sudokuOpts.controls[i + "Chk"].setAttribute("checked", "checked");
				if (i.match(/dbug/)) {
					sudokuOpts.showDevSection();
				}
			} else {
				sudokuOpts.controls[i + "Chk"].removeAttribute("checked");
			}
		}
		if (sudokuOpts.dbug) console.log ("Finished filling form values");
	}, // End of fillValues
	saveOptions : function () {
		sudoku.options["allowHard"] = sudokuOpts.controls["allowHardChk"].checked;
		sudoku.options["showTooltips"] = sudokuOpts.controls["showTooltipsChk"].checked;
		
		sudoku.options["hightlightRowCol"] = sudokuOpts.controls["hightlightRowColChk"].checked;
		sudoku.options["highlightWrongNumbers"] = sudokuOpts.controls["highlightWrongNumbersChk"].checked;

		sudoku.options["dbug"] = sudokuOpts.controls["dbugChk"].checked;

		browser.storage.local.set({"options": sudoku.options}).then(function () { if (sudoku.options["dbug"]) console.log ("Options Saved!");}, sudoku.errorFun);

		//  Not sure if we need this.....Take it out for now.  Put it in later if needs be
		//browser.runtime.sendMessage({"task" : "updateOptions", "options" : sudoku.options});
	}, // End of saveOptions

	checkKeys : function (e) {
		//if (sudokuOpts.dbug) 
			console.log ("Key down: " + e.keyCode + ".");
		if (e.keyCode == 68) {
			document.removeEventListener("keydown", sudokuOpts.checkKeys);
			document.addEventListener("keyup", sudokuOpts.checkUpKey, false);

			if (e.keyCode == 68) {
				if (!sudokuOpts.downkeys["d"]) {
					sudokuOpts.downkeys["d"] = (new Date()).getTime();
				}
			}
		}
	}, // End of checkKeys
	checkUpKey : function (e) {
		if (sudokuOpts.dbug) console.log ("Key up: " + e.keyCode + ".");
		if (e.keyCode == 68) {
			document.removeEventListener("keyup", sudokuOpts.checkUpKey);
			document.addEventListener("keydown", sudokuOpts.checkKeys, false);
			
			var keyUpTime = (new Date()).getTime();
			if (e.keyCode == 68) {
				var eTime = keyUpTime - sudokuOpts.downkeys["d"];
				if (eTime > 900) sudokuOpts.showDevSection();
				sudokuOpts.downkeys["d"] = null;
			}
		}
	}, // End of checkUpKey
	showDevSection : function () {
		console.log ("Revealing developers section.");
		sudokuOpts.controls["devSection"].style.display = "block";
	}, // End of showDevSection

} // End of udokuOpts
if (sudokuOpts.dbug) console.log ("sudoku-options.js loaded.");
sudokuOpts.init();
