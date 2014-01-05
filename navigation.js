/*jshint laxbreak: true,eqnull: true,browser: true,jquery: true,devel: true,regexdash: true,multistr: true, white: false */
/*global define: true, require: true, module: true, Ti: true, L: true, Titanium: true, Class: true */

var _ = require('/presto/libs/underscore');
var Class = require('/presto/libs/inheritance').Class;
var logger = require('/presto/logger');

/**
* @class presto.Navigation
* Navigation manager
*/
var Navigation = Class.extend({

	className: 'navigation',

	/**
	* @property {Number} length
	* Number of window open in the stack of the navigation group
	*/
	length: 0,

	/**
	* @property {presto.AppManager} _app
	* Instance of the app manager
	* @private
	*/
	_navigation: null,

	/**
	* @method get
	* Current instance of the navigation
	* @return {Ti.UI.NavigationGroup}
	*/
	get: function() {
		return this._navigation;
	},

	/**
	* @constructor init
	* Initialize the navigation manager
	* @param {Ti.UI.Window} window
	*/
	init: function(window) {

		// create the navigation group, before the panel is created and attach events
		this._navigation = Ti.UI.iOS.createNavigationWindow({
			window: window,
			width: Ti.Platform.displayCaps.platformWidth,
			borderRadius: '2dp',
			statusBarStyle: Ti.UI.iPhone.StatusBar.GREY
		});

		this._navigation.open();

		this.length = 1;

		return this;
	},

	/**
	* @method hide
	* Hide the navigation group
	*/
	hide: function() {

		//this._navigation.remove();
		this._navigation.hide();

		return this;
	},

	/**
	* @method destroy
	* Destroy the object
	*/
	destroy: function() {

		// nothing to do

	},

	/**
	* @method show
	* Show the navigation group
	*/
	show: function() {

		this._navigation.show();

		return this;
	},

	/**
	* @method open
	* Open a new window inside the navigation
	* @param {presto.Plugin} plugin
	* @chainable
	*/
	open: function(plugin) {

		//logger.info('open@navigation');

		var that = this;

		// open the window
		that._navigation.openWindow(plugin.getWindow());
		// set again the navigation (not really necessary)
		//plugin.setNavigation(that.getNavigation());

		// increment stack counter
		that.length += 1;

		return that;
	},

	/**
	* @method close
	* Close a window associated with a plugin
	* @param {presto.Plugin} plugin
	* @chainable
	*/
	close: function(plugin) {

		var that = this;
		var window = plugin.getWindow();

		that._navigation.closeWindow(window);

		that.length -= 1;

		return that;
	},

	/**
	* @method openWindow
	* Open a window
	* @param {Ti.UI.Window} window
	* @chainable
	*/
	openWindow: function(window) {

		var that = this;

		Ti.API.info('openWindow@navivation -> '+JSON.stringify(window));

		// open the window
		that._navigation.openWindow(window);
		// set again the navigation (not really necessary)
		//plugin.setNavigation(that.getNavigation());

		// increment stack counter
		that.length += 1;

		return that;

	},

	/**
	* @method closeWindow
	* Close a window
	* @param {Ti.UI.Window} window
	* @chainable
	*/
	closeWindow: function(window) {

		var that = this;

		that._navigation.closeWindow(window);

		that.length -= 1;

		return that;
	}


});

module.exports = Navigation;

