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

Components.utils.import("resource://sudoku/griddb.jsm");

function format_date(d, fmt, monthNames) {
    var leftPad = function(n) {
	n = "" + n;
	return n.length == 1 ? "0" + n : n;
    };
    
    var r = [];
    var escape = false;
    if (monthNames == null)
	monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (var i = 0; i < fmt.length; ++i) {
	var c = fmt.charAt(i);
	
	if (escape) {
	    switch (c) {
	    case 'h': c = "" + d.getHours(); break;
	    case 'H': c = leftPad(d.getHours()); break;
	    case 'M': c = leftPad(d.getMinutes()); break;
	    case 'S': c = leftPad(d.getSeconds()); break;
	    case 'd': c = "" + d.getDate(); break;
	    case 'm': c = "" + (d.getMonth() + 1); break;
	    case 'y': c = "" + d.getFullYear(); break;
	    case 'b': c = "" + monthNames[d.getMonth()]; break;
	    }
	    r.push(c);
	    escape = false;
	}
	else {
	    if (c == "%")
		escape = true;
	    else
		r.push(c);
	}
    }
    return r.join("");
}

var gridsb = {
init: function() {
	this.browser = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
	   .getInterface(Components.interfaces.nsIWebNavigation)
	   .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
	   .rootTreeItem
	   .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
	   .getInterface(Components.interfaces.nsIDOMWindow).gBrowser;

	this.strings = document.getElementById("main-strings");
	this.saved = document.getElementById("saved");
	this.item_template = document.getElementById("item_template");

	this.date_format = this.strings.getString("dateformat")

	this.show_saved();
},
unload: function() {
	// called when the sidebar is hidden
},
show_saved: function() {
	while(this.saved.getRowCount()) {
		this.saved.removeItemAt(0);
	}

	var s1 = griddb.conn.createStatement("SELECT givens, date FROM saves ORDER BY date");
	while (s1.executeStep()) {
		var g = s1.getString(0);
		var d = s1.getInt64(1);
		this.add_saved(g, d);
	}
},
add_saved: function(grid, dtx) {
	var item = document.createElement("richlistitem");
	var hb = document.createElement("hbox");
	var vb = document.createElement("vbox");
	var s0;

	var dt = new Date();
	dt.setTime(dtx);

	hb.flex = 1;
	hb.align = "center";
	vb.flex = 1;

	item.tooltip = "gridtip";
	item.id = "item_" + grid;
	
	var temp = format_date(dt, gridsb.date_format);
	s0 = document.createElement("description");
	s0.className = "clickable";
	s0.textContent = temp;
	vb.appendChild(s0);

	s0 = document.createElement("image");
	s0.setAttribute("src", "chrome://sudoku/skin/main-small.png");
	hb.appendChild(s0);

	hb.appendChild(vb);
	item.appendChild(hb);
	item.addEventListener("click", function(ev) {gridsb.action(ev, grid)} , false);
	this.saved.appendChild(item);
},
/*actionid: function(ev, src) {
	alert("EVENT:" + ev + " SRC:" + src.id);
},*/
action: function(ev, grid) {
	var uri = "chrome://sudoku/content/grid.html?p="+grid;
	this.browser.openUILink(uri, ev, false, true);
},
random: function(ev, difficulty) {
	var uri= "chrome://sudoku/content/grid.html?r=" + difficulty;
	this.browser.openUILink(uri, ev, false, true);
},
tip_showing: function(ev) {
	var fvr = this.saved.getIndexOfFirstVisibleRow();
	var lvr = fvr + this.saved.getNumberOfVisibleRows() + 1;
	var found = null;
	for (var i = fvr;i<lvr;i++) {
		var r = this.saved.getItemAtIndex(i).getBoundingClientRect();
		if (ev.clientY>=r.top && ev.clientY<=r.bottom && ev.clientX>=r.left && ev.clientX<=r.right) {
			found = this.saved.getItemAtIndex(i);
			break;
		}
	}
	if (null==found) {
		return false;
	}
	if ("item_"!=found.id.substring(0, 5)) {
		return false;
	}
	var grid_id = found.id.substring(5);
	var grid = griddb.load_grid(grid_id);
	if (null==grid) {
		return false;
	}
	for (var r = 0;r<9;r++) {
		for (var c = 0;c<9;c++) {
			var el = document.getElementById("g" + (r*9+c));
			var v = grid[0][r][c];
			el.className = "";
			if (0==v) {
				el.value = '';
			} else if (v<0) {
				el.value = -v;
				el.className = "givens";
			} else {
				el.value = v;
			}
		}
	}
	if (grid[2]%60<10) {
		document.getElementById("tm").value = "" + Math.floor(grid[2]/60) + ":0" + (grid[2]%60);
	} else {
		document.getElementById("tm").value = "" + Math.floor(grid[2]/60) + ":" + (grid[2]%60);
	}
	if (grid.length>4) {
		var temp = "";
		if (grid[4]>0 && grid[4]<=30) {
			temp = this.strings.getString("gridsidebar.easy");
		} else if (grid[4]>30 && grid[4]<=50) {
			temp = this.strings.getString("gridsidebar.medium");
		} else if (grid[4]>50) {
			temp = this.strings.getString("gridsidebar.hard");
		} else {
			temp = this.strings.getString("gridsidebar.unsolvable");
		}
		document.getElementById("difficulty").value = temp;
	}
	return true;
},
grid_updated: function() {
	gridsb.show_saved();
},
_sentinel_0: 0
};

