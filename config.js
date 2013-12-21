/*jshint laxbreak: true,eqnull: true,browser: true,jquery: true,devel: true,regexdash: true,multistr: true, white: false */
/*global define: true, require: true, module: true, Ti: true, L: true, Titanium: true, Class: true */

var _ = require('/presto/libs/underscore');
var Class = require('/presto/libs/inheritance').Class;
var jQ = require('/presto/libs/deferred/jquery-deferred');
var logger = require('/presto/logger');

/**
* @class presto.Config
* Instance of the configuration class
*/
var Config = Class.extend({
	
	/**
	* @property {presto.AppManager} app
	* Instance of the application manager
	*/
	app: null,
	
	/**
	* @property {Object} _config
	* Dictionary of the namespace/key/value/type association
	* @private
	*/
	_config: {},
	
	/**
	* @method registerParam
	* Register a configuration parameter
	* @param {String} namespace
	* @param {String} name
	* @param {String} type
	* @chainable
	*/
	registerParam: function(namespace,name,type) {
		
		this._config[namespace+'.'+name] = {
			namespace: namespace,
			name: name,
			type: type	
		};
		
		return this;	
	},
	
	/**
	* @constructor init
	*/
	init: function(app,opts) {
		
		var default_settings = {
			
		};
		this._options = _.extend(default_settings,opts);
		
		this.app = app;
		
		
		return this;
	},
	
	/**
	* @method has
	* Tells if a property exists
	* @param {String} namespace
	* @param {String} key
	* @return {Boolean}
	*/
	has: function(namespace,key) {
		return Ti.App.Properties.hasProperty(namespace+'.'+key);
	},
	
	/**
	* @method getType
	* Get the type of config param, defaults to string
	* @param {String} namespace
	* @param {String} key
	* @return {String}	
	*/
	getType: function(namespace,key) {
	
		if (this._config[namespace+'.'+key] != null) {
			return this._config[namespace+'.'+key].type;
		} else {
			return 'string';
		}
		
	},
	
	/**
	* @method get
	* Get a parameter for the configuration
	* @param {String} namespace Name space, generally is the plugin name
	* @param {String} key
	* @return {Mixed}
	*/
	get: function(namespace,key) {

		logger.info('Key '+Ti.App.Properties.getString(key));
		
		var composite = namespace+'.'+key;
		var type = this.getType(namespace,key);
		
		switch(type) {

			case 'boolean':
				return Ti.App.Properties.getBool(composite);
			
			case 'string':
				return Ti.App.Properties.getString(composite);
			
			case 'object':
				var raw = Ti.App.Properties.getString(composite);
				var result = null;
				try {
					result = JSON.parse(raw);
				} catch(e) {
					// do nothing
				}
				return result;
		
			default:
				return Ti.App.Properties.getString(composite);
		
		}
				
	},
	
	/**
	* @method set
	* Persists a key into the configuration
	* @param {String} namespace
	* @param {String} key
	* @param {Mixed} value
	* @chainable
	*/
	set: function(namespace,key,value) {
		
		var composite = namespace+'.'+key;
		var type = this.getType(namespace,key);
		
		switch(type) {
			
			case 'boolean':
				Ti.App.Properties.setBool(composite,value);
				break;
			
			case 'string':
				Ti.App.Properties.setString(composite,value);
				break;
				
			case 'object':			
				Ti.App.Properties.setString(composite,JSON.stringify(value));
				break;
		
		}		
				
		return this;
	}
	
	
	
});

module.exports = Config;

