/*jshint laxbreak: true,eqnull: true,browser: true,jquery: true,devel: true,regexdash: true,multistr: true, white: false */
/*global define: true, require: true, module: true, Ti: true, L: true, Titanium: true, Class: true */

/*
function test() {
	
	
	var my_property = Diads(function() {
			return 3*3;
		},{
		iphone: function() {
			return 3*2;
		},
		'iphone3G,iphone3GS': function() {
			return 1*2;
		}
	});
	
	Diads(my_property).call(context);
	my_property();
}
*/
var _ = require('/presto/libs/underscore');
var model = Titanium.Platform.model;
var osname = Ti.Platform.osname;
var displayCaps = Ti.Platform.displayCaps;


function currentPlatform() {
	
	/*
		
	*/
	
	Ti.API.info('*********************************');
	Ti.API.info('**** Current model: '+model);
	Ti.API.info('**** Current osname: '+osname);
	Ti.API.info('**** DisplayCaps DPI: '+displayCaps.dpi);
	
	if (model.indexOf('iPad1') != -1) {
		return 'ipad1';
	} else if (model.indexOf('iPad2') != -1) {
		return 'ipad2';
	} else if (model.indexOf('iPad3') != -1) {
		return 'ipad3';
	}

	// for sure it's an iPad
	if (osname == 'ipad') {
		
		if (displayCaps.density == 'high' && displayCaps.dpi == 260) {
			return 'ipadretina';
		}
				
		return 'ipad';
	}
	
	if (osname == 'iphone') {
		
		// On iPhone and iPod devices with retina display, the density property is high and the dpi property is 320. 
		// For other iPhone and iPod devices, density is medium and dpi is 160.
		if (displayCaps.density == 'high' && displayCaps.dpi == 320) {
			return 'iphoneretina';
		}
		
		return 'iphone';
	}
	
	if (osname == 'android') {
		return 'android';
	}
}

var compatibilities = {
	
	iphone: ['ios'],
	ipad: ['ios'],
	
	iphone2g: ['iphone','ios'],
	iphone3g: ['iphone','ios'],
	iphone3gs: ['iphone','ios'],
	iphone4: ['iphone','ios','iphoneretina'],
	iphone4s: ['iphone','ios','iphoneretina'],
	iphone5: ['iphone','ios','iphoneretina'],
	iphone5s: ['iphone','ios','iphoneretina'],
	iphone5c: ['iphone','ios','iphoneretina'],
	iphoneretina: ['iphone','ios'], 
	ipad1: ['ipad','ios'],
	ipad2: ['ipad','ios'],
	ipad3: ['ipad','ios'],
	
	ipadretina: ['ipad','ios']	
};

var platform = currentPlatform();
Ti.API.info('*** Platform: '+platform);


function resolveFunction(defaultValue,options) {
	
	var result = defaultValue;
	
	if (options[platform] != null) {
		result = options[platform];
	} else if (compatibilities[platform] != null) {
		// find firs which is not null
		var compatiblePlatform = _(compatibilities[platform]).find(function(item) {
			return options[item] != null;
		});
		if (compatiblePlatform != null) {
			result = options[compatiblePlatform];
		}
	}
	
	return result;
}


/**
* @class presto.helpers.Diads
* Diads are multi-behaviour functions that acts differently based on the platform.
* my_diad_function = new Diads(42,{
* ipad: function() { return 42*3; }
* });
* Returns a function that returns 126 on iPad and 42 in all other platforms.
* Note that the first argument could be a function as well.
*/

/**
* @method Diads
* Create the diad
* @param {Mixed/Function} default The default value/function
* @param {Object} options
* @param {Mixed/Function} options.ios Value/function executed on iOS 
* @param {Mixed/Function} options.android Value/function executed on Android
* @param {Mixed/Function} options.iphone Value/function executed on iPhone
* @param {Mixed/Function} options.iphoneretina Value/function executed on iPhone retina
* @param {Mixed/Function} options.ipad Value/function executed on iPad
* @param {Mixed/Function} options.ipadretina Value/function executed on iPad retina
* @return {Function}    
*/
var Diads = function(defaultValue,opts) {
	
	var default_options = {
		ios: null,
		android: null,
		iphone: null,
		ipad: null,
		iphoneretina: null,
		ipadretina: null
	};
	var options = _.extend(default_options,opts);
	
	var func = resolveFunction(defaultValue,options);
	
	return function() {		
		var that = this;
		return _.isFunction(func) ? func.apply(that,arguments) : func;		
	};
};

module.exports = {
	Diads: Diads,
	platform: platform,
	isCompatible: function(targetPlatform) {
		Ti.API.info(compatibilities[targetPlatform] != null);
		Ti.API.info(compatibilities[targetPlatform].indexOf(targetPlatform));
		return targetPlatform == platform 
			|| (compatibilities[targetPlatform] != null && _(compatibilities[targetPlatform]).contains(targetPlatform)); 
	},
	keywords: _(compatibilities).keys()	
};