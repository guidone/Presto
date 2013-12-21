/*jshint laxbreak: true,eqnull: true,browser: true,jquery: true,devel: true,regexdash: true,multistr: true, white: false */
/*global define: true, require: true, module: true, Ti: true, L: true, Titanium: true, Class: true */
/*jshint -W079 */

var _ = require('/presto/libs/underscore');
var Class = require('/presto/libs/inheritance').Class;
var jQ = require('/presto/libs/deferred/jquery-deferred');
var Cloud = require('ti.cloud');
var logger = require('/presto/logger');

/**
* @class presto.Node
* Node is an aggregation of information for a contentClassName. It may contain posts, images, comments, etc. It holds some
* basic information for the class like the version, the time stamp and the directory location. The version is used to tell
* if the informations need to be updated from the backend and the directory is needed because the chunk of informations could
* be relocated
*/
var Node = Class.extend({
	
	className: 'node',
		
	/**
	* @property {Number} version
	* Version number of this information, lower version means older contents
	*/
	version: null,
	
	ts: null,
	
	/**
	* @property {String} path
	* Base path for the chunk of information, with final slash. Inside here are directory like images,posts, etc
	*/
	path: null,
	
	/**
	* @property {Boolean} isLocal
	* Tells if the node content is the content delivered with the application or was downloaded from the backend. This is
	* useful to calculate the base path of the node directory
	*/
	isLocal: false,
	
	init: function() {
		
		return this;
	},
	
	/**
	* @method serialize
	* Serialize the node, put everything is not a function
	* @return {Object}
	*/
	serialize: function() {
	
		var obj = {};
		
		_(this).each(function(value,key) {
			if (!_.isFunction(value)) {
				obj[key] = value;
			}
		});
	
		return obj;		
	},
	
	
	/**
	* @method save
	* Save the current object in json
	* @chainable
	*/
	save: function() {
		
		var myFile = Ti.Filesystem.getFile(this.path+'/data.json');
		myFile.write(JSON.stringify(this.serialize()));		
		
		return this;
	}
	
});

module.exports = Node;
	