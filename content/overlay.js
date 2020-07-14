/* ***** BEGIN LICENSE BLOCK *****
 *   Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 * 
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is sudoku.
 *
 * The Initial Developer of the Original Code is
 * Petr Blahoš.
 * Portions created by the Initial Developer are Copyright (C) 2008
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 * 
 * ***** END LICENSE BLOCK ***** */

var FF3SudokuDissector = {
init: function() {
	document.getElementById("content").openUILink = openUILink;
	// installs an on-load hook.
	FF3SudokuDissector.strings = document.getElementById("sudoku-strings");
	FF3SudokuTools.LOG("FF3SudokuDissector.init strings:" + FF3SudokuDissector.strings);
	try{
		var appcontent = document.getElementById("appcontent");   // browser
		if(appcontent){
			appcontent.addEventListener("DOMContentLoaded", FF3SudokuDissector.onPageLoad, true);
		}
		FF3SudokuDissector.browser = document.getElementById("content");
	}catch(e){}

},
cleanup: function() {
	document.getElementById("appcontent").removeEventListener("DOMContentLoaded", FF3SudokuDissector.onPageLoad, true);
},
onPageLoad: function(aEvent) {
	if ("chrome:"==aEvent.target.baseURI.substring(0, 7))	return ;
	if ("about:"==aEvent.target.baseURI.substring(0, 6))	return ;
	var doc = aEvent.target;
	FF3SudokuDissector.detect(doc, doc.baseURI);
},
detect: function(doc, uri) {
	if (	null!=doc.getElementById("sudokutable") &&
		null!=doc.getElementById("T0") && null!=doc.getElementById("T80")) {
		FF3SudokuTools.LOG("D1: maybe type 1"); // sudoku.com.au
		if (FF3SudokuDissector.grab_type1(doc, uri)) {
			return ;
		}
	}
	if (	null!=doc.getElementById("f00") && null!=doc.getElementById("f88")) {
		FF3SudokuTools.LOG("D1: maybe type 2"); // websudoku.com
		if (FF3SudokuDissector.grab_type2(doc, uri, "f")) {
			return ;
		}
	}
	if (	null!=doc.getElementById("inpt00") && null!=doc.getElementById("inpt88")) {
		FF3SudokuTools.LOG("D1: maybe type 2"); // http://www.online-sudoku.cz/hrat/
		if (FF3SudokuDissector.grab_type2(doc, uri, "inpt")) {
			return ;
		}
	}
	if (	null!=doc.getElementById("f11") && null!=doc.getElementById("f99")) {
		FF3SudokuTools.LOG("D1: maybe type 3 - f");	// www.sudokupuzz.com
		if (FF3SudokuDissector.grab_type3(doc, uri, 'f')) {
			return ;
		}
	}
	if (	null!=doc.getElementById("p1") && null!=doc.getElementById("p81")) {
		FF3SudokuTools.LOG("D1: maybe type 4 - p");	// http://sudokuonline.cz/
		if (FF3SudokuDissector.grab_type4(doc, uri, 'p')) {
			return ;
		}
	}
	if (	null!=doc.getElementById("i0") && null!=doc.getElementById("i80") && 
		null!=doc.getElementById("TAB0") && null!=doc.getElementById("TAB8")
	) {
		FF3SudokuTools.LOG("D1: maybe type 5 - p");	// sudoku.hu.cz sudoku.mobilhry.cz==www.lidovky.cz/sudoku.asp==sudoku.cz
		if (FF3SudokuDissector.grab_type5(doc, uri, 'i')) {
			return ;
		}
	}
},
notify: function(doc, grid) {
	var notificationBox = this.browser.getNotificationBox(this.browser.getBrowserForDocument(doc.defaultView.document));
	// Remove existing notifications. Notifications get removed
	// automatically onclick and on page navigation, but we need to remove
	// them ourselves in the case of reload, or they stack up.
	for (var i = 0, child; child = notificationBox.childNodes[i]; i++) {
		if (child.getAttribute("value") == "grid-fromweb") {
			notificationBox.removeNotification(child);
		}
	}

	var notification = notificationBox.appendNotification(
		this.strings.getString('puzzlefound.label'),
		"grid-fromweb",
		"chrome://sudoku/skin/main-small.png",
		notificationBox.PRIORITY_INFO_MEDIUM,
		[
		{ label: this.strings.getString('play.btn'),
		 accessKey: "P",
		 popup: null,
		 callback: function(){ FF3SudokuDissector.run(doc, grid); } }
		 ]);
},
run: function(doc, grid) {
	FF3SudokuDissector.browser.selectedTab = FF3SudokuDissector.browser.addTab("chrome://sudoku/content/grid.html?p=" + grid);
},
grab_type2: function(doc, uri, letter) {
	var r, c;
	var out = "";
	for (r = 0;r<9;r++) {
		for (c = 0;c<9;c++) {
			var id = doc.getElementById(letter + c + r);
			if (null==id) {
				return false;	// not this type.
			}
			if (""==id.value) {
				out+= "0";
			} else {
				var n = id.value.charCodeAt(0)-48;
				out+= n;
			}
		}
	}
	FF3SudokuTools.LOG("N:" + out);
	FF3SudokuDissector.notify(doc, out);
	return true;
},
grab_type3: function(doc, uri, letter) {
	var r, c;
	var out = "";
	for (r = 1;r<10;r++) {
		for (c = 1;c<10;c++) {
			var id = doc.getElementById(letter + r + c);
			if (null==id) {
				return false;	// not this type.
			}
			if (""==id.value) {
				out+= "_";
			} else {
				var n = id.value.charCodeAt(0)-48;
				out+= n;
			}
		}
	}
	FF3SudokuTools.LOG("N:" + out);
	FF3SudokuDissector.notify(doc, out);
	return true;
},
grab_type1: function(doc, uri) {
	var r, c, i = 0;
	var out = "";
	try {
		for (r = 0;r<9;r++) {
			for (c = 0;c<9;c++) {
				var id = doc.getElementById("T"+i);
				id = id.childNodes[0];
				if (1==id.nodeType && "B"==id.nodeName) {
					out+= id.innerHTML;
				} else {
					out+= '_';
				}
				i+= 1;
			}
		}
	} catch(e) {
		return false;
	}
	FF3SudokuTools.LOG("N:" + out);
	FF3SudokuDissector.notify(doc, out);
	return true;
},
grab_type4: function(doc, uri, letter) {
	var i = 1;
	var out = "";
	try {
		for (i = 1;i<82;i++) {
			var id = doc.getElementById(letter + i);
			if (null==id) {
				return false;	// not this type.
			}
			if (""==id.value) {
				out+= "_";
			} else {
				var n = id.value.charCodeAt(0)-48;
				out+= n;
			}
		}
	} catch(e) {
		return false;
	}
	FF3SudokuTools.LOG("N:" + out);
	FF3SudokuDissector.notify(doc, out);
	return true;
},
grab_type5: function(doc, uri, letter) {
	var out = "";
	var map = [ 0, 1, 2, 9, 10, 11, 18, 19, 20 ];
	try {
		for (var row = 0;row<55;row+= 27) {
			for (var col = 0;col<8;col+= 3) {
				for (var i = 0;i<9;i++) {
					var idx = row+col+map[i];
					var n = doc.getElementById(letter + idx).innerHTML;
					if (n.match(/^[1-9]$/)) {
						out+= n;
					} else {
						out+= '_';
					}
				}
			}
		}
		FF3SudokuTools.LOG("N:" + out);
		FF3SudokuDissector.notify(doc, out);
		return true;
	} catch(e) {
		return false;
	}
},
__sentinel: 0
};

window.addEventListener("load", function(){FF3SudokuDissector.init();}, false);
window.addEventListener("unload", function(){FF3SudokuDissector.cleanup();}, false);

