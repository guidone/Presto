/*jshint laxbreak: true,eqnull: true,browser: true,jquery: true,devel: true,regexdash: true,multistr: true, white: false */
/*global define: true, require: true, module: true, Ti: true, L: true, Titanium: true, Class: true */

var _ = require('/presto/libs/underscore');
var Class = require('/presto/libs/inheritance').Class;
var Utils = require('/presto/helpers/utils');
var debug = false;
var logger = require('/presto/logger');

/*
var _typeMap = {

	window: 'createWindow',
	view: 'createView',
	textField: 'createTextField',
	button: 'createButton',
	label: 'createLabel',
	webView: 'createWebView',
	map: 'createMap'	
};
*/

/**
* @class presto.Base
* Base class for all objects: has reference of the app main process and styles/layout
*/
var Base = Class.extend({

	/**
	* @property {String} className
	* Class name of the plugin, this is used to resolve the styles of UI in this plugin
	*/
	className: 'base',

	/**
	* @property {presto.AppManager} app
	* Instance of the app manager
	* @private
	*/
	app: null,
	
	_events: {},

	/**
	* @method addEventListener
	* @param {String} name Name of the event
	* @param {Function} callback
	*/
	addEventListener: function(name,callback) {
	
		var that = this;
		if (that._events[name] == null) {
			that._events[name] = [];
		}
		
		that._events[name].push(callback);
		
		return that;
	},
	
	/**
	* @method fireEvent
	* @param {String} name
	* @param {Mixed} data
	*/
	fireEvent: function(name,data) {
		
		var that = this;
		if (that._events[name] != null) {
			
			_(that._events[name]).each(function(cb) {
				
				// chiama ogni callback
				cb.call(that,data);
				
			});			
		}
		
	}	

});

module.exports = Base;