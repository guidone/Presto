/*jshint laxbreak: true,eqnull: true,browser: true,jquery: true,devel: true,regexdash: true,multistr: true */
/*global define: true, require: true, module: true, Ti: true, L: true, Titanium: true */

var _ = require('/presto/libs/underscore');

/**
* @class presto.helpers.Loader
* Attach a loader to a window
*/
module.exports = function(opts) {

	var _window = null;
	var default_options = {
		closeOnHide: true	
	};
	var options = _.extend(default_options,opts);
	var _loader = null;

	function _createWindow() {

		_window = Ti.UI.createWindow({
			width: Ti.UI.SIZE,
			height: Ti.UI.SIZE,
			//width: Ti.UI.FLL,
			//height: Ti.UI.FILL,
			backgroundColor: '#000000',
			borderRadius: '12dp',
			opacity: 0.8,
			visible: false,
			layout: 'vertical'
			});

		
		var _view = Ti.UI.createView({
			width: Ti.UI.SIZE,
			height: Ti.UI.SIZE,			
			left: '20dp',
			right: '20dp',
			top: '20dp',
			bottom: '20dp'
		});
		
		_loader = Ti.UI.createActivityIndicator({
			style: Ti.UI.iPhone.ActivityIndicatorStyle.BIG,
			width: '220dp',
			height: '80dp',
			font: {
				fontFamily : 'Droid Sans',
				fontSize : 16,
				fontWeight : 'bold'
				},
			color: 'white',			
			message: L('Loading')+'...'	
			});
		_loader.show();
		
		_view.add(_loader);
		_window.add(_view);
		_window.open();
		
	}


	/**
	* @constructor
	* Init the loader
	* @param {Ti.UI.Window} window Window to attach the loader to
	*/
	
	var _visible = false;

	var obj = null;
	
	obj = {
	
		/**
		* @method show
		* Show the loader
		* @chainable
		*/
		show: function(msg) {

			if (_window == null) {
				_createWindow();
			}
			
			obj.message(msg);
			
			_window.show();
			_visible = true;			
			
			return this;
		},
			
		/**
		* @method hide
		* Hide the loader
		* @chainable
		*/	
		hide: function() {

			if (_window != null) {
				if (options.closeOnHide) {
					_window.close();
					_window = null;
				} else {
					_window.hide();	
				}
			}
			
			_visible = false;
			return this;		
			},
		
		/**
		* @method message
		* Set the message of the loader
		* @param {String} message
		* @chainable
		*/
		message: function(msg) {
			
			if (_loader == null) {
				return this;
			}
			
			if (msg != null && msg !== '') {
				_loader.message = msg;
			} else {
				_loader.message = L('Loading')+'...';
			}
			
			return this;
		},
		
		/**
		* @method visible
		* Return if visible
		* @return {Boolean}
		*/
		visible: function(visible) {
			
			if (visible != null) {
				if (visible) {
					this.show();
				} else {
					this.hide();
				}
			} else {
				return _visible;			
			}
		}		
			
	};
	
	return obj;
};