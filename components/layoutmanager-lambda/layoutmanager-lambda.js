/*jshint laxbreak: true,eqnull: true,browser: true,jquery: true,devel: true,regexdash: true,multistr: true, white: false */
/*global define: true, require: true, module: true, Ti: true, L: true, Titanium: true, Class: true */

var _ = require('/presto/components/underscore/underscore');
var clickedMultitap = false;

function findAbsoluteScreenLocation(component) {

    var x = parseInt(component.rect.x,10);
    var y = parseInt(component.rect.y,10);
    var parent = component.getParent();

	// if no parent, stop here
	if (parent == null) {
		return null;
	}

	if (parent.layout == 'absolute' || parent.layout == 'composite' || parent.layout == null) {

		return {
			x: x,
			y: y,
			view: parent
		};

	} else {

		// call again to the parent of the parent
		var recourse = findAbsoluteScreenLocation(parent);

		if (recourse != null) {
//Ti.API.info('aggiungo '+x+)
			return {
				x: x+recourse.x,
				y: y+recourse.y,
				view: recourse.view
			}
		} else {
			return {
				x: x,
				y: y,
				view: parent
			};
		}

	}

/*

    while (component.getParent() != null) {
        var parent = component.getParent();
        x += parent.rect.x;
        y += parent.rect.y;
        component = parent;
    }
    return { x: x, y: y }
*/
}


module.exports = {


	/**
	* @method debounce
	* Antirimbalzo per funzioni che vanno agganciate a eventi come il click
	* @param {Function}
	* @return {Function}
	*/
	debounce: function(func,options) {

		var my_func = null;
		if (options != null && options.context != null) {
			my_func = _.bind(func,options.context)
		} else {
			my_func = func;
		}
		return _.debounce(function(evt) {
			my_func(evt);
		},600,true);

	},

	/**
	* @method multitap
	* Gestisce il multitap, ovvero due tap contemporanei in view diverse (usa una variabile globale)
	* @param {Function}
	* @param {Object} options
	* @param {Object} [options.timeout=600] Timeout
	* @return {Function}
	*/
	multitap: function(func,opts) {

		var default_options = {
			timeout: 600
		};
		var options = _.extend(default_options,opts);

		return function(e) {

			// if not yet clicked
			if (!clickedMultitap) {
				// set the flag
				clickedMultitap = true;
				// call next
				func(e);
		        // reset after a while
		        setTimeout(function() {
		        	clickedMultitap = false;
		        },options.timeout);

			}
		};

	},


	throttle: function(func,context) {

		var my_func = null;
		if (context != null) {
			my_func = _.bind(func,context)
		} else {
			my_func = func;
		}
		return _.throttle(function(evt) {
			my_func(evt);
		},1000);

	},

	/**
	* @method test
	* Semplicemente un test di funzionamento
	* @param {Function}
	* @return {Function}
	*/
	test: function(func) {
		return function(evt) {
			Ti.API.info('Hi, I am just a lambda function test');

			func(evt);
		};
	},


	loader: function(func,opts) {

		var default_options = {
			width: '200dp',
			height: '80dp',
			context: null
		};
		var options = _.extend(default_options,opts);
		var that = null;

		if (options.context != null && _.isFunction(options.context.on)) {
			that = options.context
		} else {
			that = this;
		}

		return function(e) {

			var win = Ti.UI.createWindow({
				backgroundColor: '#000000',
				height: Ti.UI.SIZE,
				width: Ti.UI.SIZE,
				borderRadius: '10dp'
			});
			var activityIndicator = Ti.UI.createActivityIndicator({
			color: '#ffffff',
			font: {
				fontFamily: 'Helvetica Neue',
				fontSize: '20dp',
				fontWeight:'bold'
			},
			message: 'Loading...',
			style: Ti.UI.iPhone.ActivityIndicatorStyle.PLAIN,
			left: '10dp',
			right: '10dp',
			indicatorColor: '#ffffff',
			indicatorDiameter: '120dp',
			height: options.height,
			width: options.width
			});
			win.add(activityIndicator);
			activityIndicator.show();
			win.open();

			// listen to complete
			that.once('complete',function() {
				win.close();
			});
			// esegue la funzione di partenza
			var result = func(e);

		};

	},


	/**
	* @method blink
	* Semplicemente un test di funzionamento
	* @param {Function}
	* @param {Object} options
	* @param {Object} [options.image=/presto/components/layoutmanager-lambda/blink/blackhi.png] Path dell'immagine
	* @param {Object} [options.width=40]
	* @param {Object} [options.height=40]
	* @param {Object} [options.timeout=100] Timeout
	* @return {Function}
	*/
	blink:function(func,opts) {

		var default_options = {
			image: '/presto/components/layoutmanager-lambda/blink/blackhi.png',
			timeout: 100,
			width: 40,
			height: 40
		};
		var options = _.extend(default_options,opts);
		var path = options.image;
		var left = null;
		var right = null;
		var top = null;
		var bottom = null;

		return function(e) {

			var element = e.source;
			var parent = findAbsoluteScreenLocation(element);
			var image = Ti.UI.createImageView({
				image: path,
				width: options.width+'dp',
				height: options.height+'dp',
				zIndex: 10000,
				top: (e.y-options.width/2)+'dp',
				left: (e.x-options.height/2)+'dp',
				//left: parent.x+e.x+'dp'
				//left: 0
			});

			try {

				// add to the view
				parent.view.add(image);

		        // il timeout è gestisto da questa variabile
		        var timeout = options.timeout;

		        setTimeout(function() {

		        	// nasconde
					image.visible = false;
					parent.view.remove(image);

					// chiama originale
					func(e);

		        },timeout);

			} catch(e) {

				// just in case it failed
				func(e);

			}
		};
	}



};