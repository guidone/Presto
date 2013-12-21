/*jshint laxbreak: true,eqnull: true,browser: true,jquery: true,devel: true,regexdash: true,multistr: true, white: false */
/*global define: true, require: true, module: true, Ti: true, L: true, Titanium: true, Class: true */

var _debugInConsole = false;

module.exports = {
	info: function(str) {
		if (_debugInConsole) {
			Ti.API.error(str);
		} else {
			Ti.API.info(str);	
		}
	},
	error: function(str) {
		Ti.API.error(str);
	},	
	warn: function(str) {
		if (_debugInConsole) {
			Ti.API.error(str);
		} else {
			Ti.API.warn(str);	
		}
	}
};