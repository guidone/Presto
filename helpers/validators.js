/*jshint laxbreak: true,eqnull: true,browser: true,jquery: true,devel: true,regexdash: true,multistr: true, white: false */
/*global define: true, require: true, module: true, Ti: true, L: true, Titanium: true, Class: true */

module.exports = {
	
	isPersonName: function(str) {
		
		return str != null && str.length > 2;
	
	},
	
	isPhoneNumber: function(str) {
	
		return true;	
	},
	
	isEmail: function(str) {
	
		return true;	
	},	
	
};
