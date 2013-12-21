/*jshint laxbreak: true,eqnull: true,browser: true,jquery: true,devel: true,regexdash: true,multistr: true, white: false */
/*global define: true, require: true, module: true, Ti: true, L: true, Titanium: true, Class: true */

var _ = require('/presto/libs/underscore');

var mimeTypeMapping = {
	
	'image/bmp': 'image',
	'image/gif': 'image',
	'image/x-icon': 'image',
	'image/ief': 'image',
	'video/jpm': 'image',
	'image/jpeg': 'image',
	'image/png': 'image',
	'image/x-portable-pixmap': 'image',
	'image/svg+xml': 'image',
	'image/tiff': 'image',
	'image/webp': 'image',
	'image/x-portable-bitmap': 'image',
	'image/pict': 'image',
	'image/x-quicktime': 'image',
	'image/x-tiff': 'image',
	
	'application/json': 'json',
	'application/x-javascript': 'json',
	'text/javascript': 'json',
	'text/x-javascript': 'json',
	'text/x-json': 'json',
	
	'text/html': 'html'
	
};

/**
* @class presto.helpers.Utils
* Helper class for dialogs
*/
var Utils = {

	/**
	* @method guid
	* Generate a random unique string
	* @return {String}
	*/
	guid: function() {

		var S4 = function () {
			return Math.floor(
				Math.random() * 0x10000 /* 65536 */
				).toString(16);
		};
		
		return (
			S4() + S4() + "-" +
			S4() + "-" +
			S4() + "-" +
			S4() + "-" +
			S4() + S4() + S4()
		);
	},
			
	/**
	* @method capitalize
	* Capitalize a string
	* param {String} string
	* @return {String}
	*/
	capitalize: function (str) {
		return str.substr(0,1).toUpperCase()+str.substr(1);
	},
	
	
	/**
	* @method getPosition
	* Get the position
	* @deferred
	* @return {Object}
	* @return {Nuimber} return.latitude
	* @return {Nuimber} return.longitude
	*/
	getPosition: function() {
		
		var deferred = Ti.App.jQuery.Deferred();
		
		Ti.Geolocation.getCurrentPosition(function(e) {

			if (e.success) {
				deferred.resolve({
					latitude: e.coords.latitude,
					longitude: e.coords.longitude
				});
			} else {
				deferred.reject();
			}

		});
		
		return deferred.promise();
	},
	
	isFileType: function(file) {
		// todo
		return false;
	}
	
	

};

module.exports = Utils;