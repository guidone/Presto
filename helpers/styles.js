/*jshint laxbreak: true,eqnull: true,browser: true,jquery: true,devel: true,regexdash: true,multistr: true, white: false */
/*global define: true, require: true, module: true, Ti: true, L: true, Titanium: true, Class: true */

var _ = require('/presto/libs/underscore');
var utils = require('/presto/helpers/utils');


/**
* @class common.helpers.Style
* Helper class for styles
*/
var Style = {

	applyStyle: function(obj,properties) {
				
		_(properties).each(function(value,key) {
			
			var functionName = 'set'+utils.capitalize(key);
			obj[functionName](value);
			
		});

	},
	
	mergeStyle: function() {
		
		var result = {};
		var idx = 0;
		for (idx = 0; idx < arguments.length; idx++) {
			_.extend(result,arguments[idx]);
		}
		
		return result;
	},
	
	/**
	* @method add
	* Add and parse dp, unlimited number of params '15dp','10dp','5dp' = '30dp'
	
	*/
	add: function() {
		
		var idx = 0;
		var result = 0;
		
		for(idx = 0; idx < arguments.length; idx++) {
			if (!isNaN(parseInt(arguments[idx],10))) {
				result += parseInt(arguments[idx],10);
			}
		}
				
		return result+'dp';
	},
	
	divide: function(a,b) {
		
		a = parseInt(a,10);
		b = parseInt(b,10);
		
		var result = Math.floor(a/b);
		
		return result+'dp';		
	},
	
	isPositive: function(a) {
		
		a = parseInt(a,10);
		if (!isNaN(a) && a > 0) {
			return true;
		} else {
			return false;
		}
	
	}


};

module.exports = Style;