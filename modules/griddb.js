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
EXPORTED_SYMBOLS = [
	"griddb",
	"LOG",
	"jsonhelper"
];

var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
LOG = function(msg) {
	consoleService.logStringMessage(msg);
}

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

