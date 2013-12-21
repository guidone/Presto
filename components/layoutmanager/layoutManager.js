/*jshint laxbreak: true,eqnull: true,browser: true,jquery: true,devel: true,regexdash: true,multistr: true, white: false, loopfunc: true */
/*global define: true, require: true, module: true, Ti: true, L: true, Titanium: true, Class: true, exports: true */

var _ = require('/presto/components/underscore/underscore');
var Class = require('/presto/components/inheritance/inheritance').Class;
var Backbone = require('/presto/components/backbone/backbone');
var orientationUtils = require('components/orientationUtils/orientationUtils');
var logger = require('/presto/logger');
var Platform = require('/presto/helpers/diads');

// imported from combinatorics.js, created a sandbox
var getPowerSet = (function() {

    var toArray = function(f) {
        var e, result = [];
        this.init();
        while ((e = this.next()) != null) result.push(f ? f(e) : e);
        this.init();
        return result;
    };

    var common = {
        toArray: toArray,
        map: toArray,
        forEach: function(f) {
            var e;
            this.init();
            while ((e = this.next()) != null) f(e);
            this.init();
        },
        filter: function(f) {
            var e, result = [];
            this.init();
            while ((e = this.next()) != null) if (f(e)) result.push(e);
            this.init();
            return result;
        }

    };
    /* common methods */
    var addProperties = function(dst, src) {
        Object.keys(src).forEach(function(p) {
            Object.defineProperty(dst, p, {
                value: src[p]
            });
        });
    };
    var hideProperty = function(o, p) {
        Object.defineProperty(o, p, {
            writable: true
        });
    };

	var getPowerSet = function(ary, fun) {
        if (ary.length > 32) throw "RangeError";
        var size = 1 << ary.length,
            sizeOf = function() {
                return size;
            },
            that = Object.create(ary.slice(), {
                length: {
                    get: sizeOf
                }
            });
        hideProperty(that, 'index');
        addProperties(that, {
            valueOf: sizeOf,
            init: function() {
                that.index = 0;
            },
            nth: function(n) {
                if (n >= size) return;
                var i = 0,
                    result = [];
                for (; n; n >>>= 1, i++) if (n & 1) result.push(this[i]);
                return result;
            },
            next: function() {
                return this.nth(this.index++);
            }
        });
        addProperties(that, common);
        that.init();
        return (typeof (fun) === 'function') ? that.map(fun) : that;
    };

    return getPowerSet;
})();

var _titaniumVersion = Ti.version;
var _reservedKeys = ['type','id','className','condition','childs','forEach'];
var _typeMap = {

	window: 'createWindow',
	view: 'createView',
	textField: 'createTextField',
	button: 'createButton',
	label: 'createLabel',
	webView: 'createWebView',
	activityIndicator: 'createActivityIndicator',
	buttonBar: 'ButtonBar',
	dashboardItem: 'createDashboardItem',
	dashboardView: 'createDashboardView',
	emailDialog: 'createEmailDialog',
	imageView: 'createImageView',
	listItem: 'createListItem',
	listSection: 'createListSection',
	listView: 'createListView',
	maskedImage: 'createMaskedImage',
	picker: 'createPicker',
	pickerColumn: 'createPickerColumn',
	pickerRow: 'createPickerRow',
	progressBar: 'createProgressBar',
	scrollView: 'createScrollView',
	scrollableView: 'createScrollableView',
	searchBar: 'createSearchBar',
	slider: 'createSlider',
	'switch': 'createSwitch',
	tab: 'createTab',
	tabGroup: 'createTabGroup',
	tabbedBar: 'createTabbedBar',
	tableView: 'createTableView',
	tableViewRow: 'createTableViewRow',
	tableViewSection: 'createTableViewSection',
	textArea: 'createTextArea',
	toolbar: 'createToolbar',
	splitWindow: 'createSplitWindow',
	popover: {method: 'createPopover', scope: Ti.UI.iPad}
};
var _typeKeys = _(_typeMap).keys();
var _events = ['orientationchange'];


function executeAPI(scope,method,renderedStyle) {
	var result = null;

	switch(method) {
		case 'createTextArea':
			result = Ti.UI.createTextArea(renderedStyle);
			break;
		case 'createScrollView':
			result = Ti.UI.createScrollView(renderedStyle);
			break;
		case 'createTextField':
			result = Ti.UI.createTextField(renderedStyle);
			break;
		case 'createTabGroup':
			result = Ti.UI.createTabGroup(renderedStyle);
			break;
		case 'createSwitch':
			result = Ti.UI.createSwitch(renderedStyle);
			break;

		default:
			result = scope[method](renderedStyle);
	}
	return result;
}

/**
* @class presto.LayoutManager
* Base class for all objects: has reference of the app main process and styles/layout
*/
var LayoutManager = Class.extend({

	/**
	* @property {String} className
	* Class name of the plugin, this is used to resolve the styles of UI in this plugin
	*/
	className: 'LayoutManager',

	_styles: null,

	/**
	* @property {Object} _ids
	* Array associativo tra elementi inseriti e id utilizzato
	* @private
	*/
	_ids: null,

	_guids: null,

	_eventsset: null,

	/**
	* @property {Object} _classes
	* Store for classes
	*/
	_classes: null,

	_datas: null,

	/**
	* @property {Boolean} debug
	* Debug mode, show the css resolution rules
	*/
	debug: false,

	controller: null,

	_orientationListeners: [],

	_orientationListener: null,


	/**
	* @method getOrientation
	* Return current orientation: portrait or landscape
	* @return {String}
	*/
	getOrientation: function() {

		return orientationUtils.getOrientation();

	},

	/**
	* @method rotate
	* Rotate interface
	* @param {String} orientation Could be portrait or landscape
	* @chainable
	*/
	rotate: function(orientation) {

		//Ti.API.info('rotate@LayoutManager -> '+orientation);

		_(this._orientationListeners).each(function(item) {
			// call update function for each listener item
			item.listener.call(item.view,orientation);
		});

		return this;
	},

	/**
	* @method clear
	* Clear the instance of the layout manager
	*/
	clear: function() {

		var that = this;

		that._ids = {};
		that._guids = {};
		that._eventsset = {};
		that._classes = {};
		that._datas = {};

		return this;
	},

	/**
	* @property {Object} options
	* Options dictionary
	* @private
	*/
	options: null,

	init: function(opts) {

		var that = this;

		var default_options = {
			/**
			* @cfg {String} [layoutDirectoryPath=/custom/layouts/]
			* Base directory for layout
			*/
			layoutDirectoryPath: '/custom/layouts/',

			/**
			* @cfg {String} [stylesDirectoryPath=/custom/styles/]
			* Base directory for styles
			*/
			stylesDirectoryPath: '/custom/styles/',

			/**
			* @cfg {Boolean} [debug=false]
			* Debug how the style rules are calculated
			*/
			debug: false,

			/**
			* @cfg {Boolean} [profiler=false]
			* Enable the profiler to test the speed of rendering
			*/
			profiler: false,

			/**
			* @cfg {Boolean} [cache=false]
			* Enable caching of resolve style. Improve performance but it's still experimental
			*/
			cache: false,

			/**
			* @cfg {Object} tags
			* Tags to be used as reference for external layouts
			*/
			tags: {},

			/**
			* @cfg {Object} variables
			* Variables to be used inside layout
			*/
			variables: {},

			/**
			* @cfg moment
			* Return an instance of Moment correctly instantiated with the current locale, use long date format for generic data
			* and time format like: LT -> "HH:mm", L -> "DD/MM/YYYY", LL -> "D MMMM YYYY", LLL -> "D MMMM YYYY LT",
			* LLLL -> "dddd D MMMM YYYY LT"
			*/
			moment: null,

			leftDelimiter: '{',

			rightDelimiter: '}',

			/**
			* @cfg {Array} styles
			* List of styles to be used for rendering the layout
			*/
			styles: []
		};

		// init local storage
		that._styles = [];


		that.clear();

		// for compatibility
		if (opts != null && opts.LAYOUTS_DIRECTORY_PATH != null) {
			opts.layoutDirectoryPath = opts.LAYOUTS_DIRECTORY_PATH;
			delete opts.LAYOUTS_DIRECTORY_PATH;
		}
		if (opts != null && opts.STYLES_DIRECTORY_PATH != null) {
			opts.stylesDirectoryPath = opts.STYLES_DIRECTORY_PATH;
			delete opts.STYLES_DIRECTORY_PATH;
		}
		var options = _.extend(default_options,opts);

		// create the memoized function
		if (options.cache) {
			that.computeStyle = _.memoize(that.computeStyleRaw,function(type,className,id,path,itemData) {
				// type,className,id,path,options
				var hashed_path = '';
				_(path).each(function(item) {
					hashed_path = hashed_path+item.className+item.type+item.id;
				});
				var hash = type+className+id+':'+hashed_path+':';
				return hash;
			});
		} else {
			that.computeStyle = that.computeStyleRaw;
		}

		// store options
		that.options = options;
		// copy debug
		that.debug = options.debug;

		// profiler
		if (options.profiler) {
			that.profiler = require('/presto/components/profiler/profiler');
		} else {
			that.profiler = require('/presto/components/profiler/profiler_dummy');
		}

		// if any styles, then add
		_(options.styles).each(function(style) {
			that.addStyle(style);
		});

		// add events capabilities
		that = _.extend(that,Backbone.Events);

		return that;
	},

	enableProfiler: function() {

		this.profiler = require('/presto/components/profiler/profiler');

	},

	disableProfiler: function() {

		this.profiler = require('/presto/components/profiler/profiler_dummy');

	},


	/**
	* @method getById
	* Get element in the layout by id
	* @param {String} id
	* @return {Mixed}
	*/
	getById: function(id) {

		return this._ids[id] != null ? this._ids[id] : null;

	},

	/**
	* @method getByGuid
	* Get element in the layout by id
	* @param {String} guid
	* @return {Mixed}
	*/
	getByGuid: function(guid) {

		return this._guids[guid] != null ? this._guids[guid] : null;

	},

	/**
	* @method getByClass
	* Get element by class names
	* @param {String} className
	* @return {Array}
	*/
	getByClass: function(className) {

		return this._classes[className] != null ? this._classes[className] : null;

	},

	/**
	* @method getParent
	* Get a parent element
	* @param {Ti.UI.View} element
	* @return {Ti.UI.View}
	*/
	getParent: function(element) {

		// exit if null
		if (element == null) {
			return null;
		}

		var that = this;
		if (_.isArray(element.path) && element.path.length >= 2) {
			var parentId = element.path[element.path.length-2].guid;
			return that.getByGuid(parentId);
		} else {
			return null;
		}

	},

	/**
	* @method getMoment
	* Return an instance of Moment correctly instantiated with the current locale, use standard formatter of MomentJS or
	* use the build-in costant: timeFormat, dateFormat, dateTimeFormat (available as variables inside the layout)
	* @return {Object}
	*/
	getMoment: function() {

		return this.options.moment;

	},

	/**
	* @method removeByClass
	* Remove elements by class
	* @param {String} className
	* @chainable
	*/
	removeByClass: function(className) {

		//Ti.API.info('removeByClass@layoutManager');

		var that = this;
		var elements = that.getByClass(className);

		_(elements).each(function(element) {
			that.removeElement(element);
		});

		that._classes[className] = null;

		return this;
	},

	/**
	* @method removeElement
	* Remove an element
	* @param {Ti.UI.View} element
	* @chainable
	*/
	removeElement: function(element) {

		var that = this;
		var parent = that.getParent(element);

		// Bug in Titanium, if a table row, remove from section using the standard get parent
		// otherwise raise a silent error that crashes the view engine, layout manager no longer works
		if (element.triplet != null && element.triplet.type == 'tableViewRow') {
			element.getParent().remove(element);
		} else {
			// remove if exists, silently
			try {
				if (parent != null) {
					if (parent.triplet.type == 'tableView') {
						parent.deleteRow(element);
					} else {
						parent.remove(element);
					}
				}


			} catch(e) {
				// do nothing
				Ti.API.info('ERROR removeElement@LayoutManager '+JSON.stringify(e));
			}
		}

		// dovrei toglierli da tutti i riferimenti

		return this;
	},


	/**
	* @method appendLayout
	* Add a new layout to an element created with layoutManager (for each element created with LayoutManager it's possibile
	* to get the parent element)
	* @param {Ti.UI.View} element
	* @param {Object/String} layout
	* @return {Ti.UI.View}
	*/
/*	appendLayout: function(element,layout) {

		var that = this;

		if (element.triplet == null || element.path) {
			Ti.API.info('Error appendLayout@LayoutManager: trying to append to an object not generated with LayoutManager');
			return false;
		}

		var append = that.createLayout(layout);
		var new_path = [];

		_(element.path).each(function(item) {
			new_path.push(item);
		});
		new_path.push(element.triplet);

		append.path = new_path;
Ti.API.info('APPENDING TO '+JSON.stringify(element.triplet));
Ti.API.info('APPENDING TO '+JSON.stringify(element.triplet));
		if (element.triplet.type == 'tableView') {
			element.appendRow(append);
		} else {
			element.add(append);
		}


		return append;
	},
*/

	/**
	* @method addStyle
	* Register a style sheet in the app
	* @chainable
	*/
	addStyle: function(path) {

		var requirePath = path.replace(/\.js$/,'');
		requirePath = requirePath.replace('file://localhost','');

		var that = this;

		// add path
		if (!that.isFullyQualifiedPath(requirePath)) {
			requirePath = that.options.stylesDirectoryPath+requirePath;
		}

		try {

			var sheet = require(requirePath).style;
			that._styles.push({
				style: sheet,
				path: requirePath
			});

		} catch(e) {
			Ti.API.error('Unable to load style sheet: '+path);
		}

		return that;
	},

	/**
	* @method addOrientationListener
	* Add orientation listener to the queue
	* @param {Ti.UI.View} view
	* @param {Function} listener
	* @chainable
	*/
	addOrientationListener: function(view,listener) {

		//Ti.API.info('addOrientationListener@layoutManager');

		var that = this;

		// init listener if not
		if (this._orientationListener == null) {
			this._orientationListener = function(evt) {

				var orientation = that.getOrientation();
				/* DEPRECATO
				var orientation = null;
				if (evt.orientation == Ti.UI.PORTRAIT || evt.orientation == Ti.UI.UPSIDE_PORTRAIT) {
					orientation = 'portrait';
				} else if (evt.orientation == Ti.UI.LANDSCAPE_LEFT || evt.orientation == Ti.UI.LANDSCAPE_RIGHT
						|| evt.orientation == Ti.UI.FACE_UP || evt.orientation == Ti.UI.FACE_DOWN) {
					orientation = 'landscape';
				}
				*/

				that.rotate(orientation);
			};
			Ti.Gesture.addEventListener('orientationchange',this._orientationListener);
		}

		// remove previous orientation handler
		this._orientationListeners = _(this._orientationListeners).reject(function(item) {
			return view.triplet.guid == item.guid;
		});

		// push listener
		this._orientationListeners.push({
			guid: view.triplet.guid,
			view: view,
			listener: listener
		});

		return this;
	},

	/**
	* @method refreshStyle
	* Refresh the style of an element
	* @param {Ti.UI.View} element
	* @chainable
	*/
	refreshStyle: function(obj) {

		var that = this;
		//Ti.API.info('refreshStyle@layoutManager');

		// resolve the style, pass through the itemData
		var newStyle = that.resolveStyle(
			obj.triplet.type,
			obj.triplet.className,
			obj.triplet.id,
			obj.path,
			{},
			null
		);

		// apply properties
		_(newStyle).each(function(value,key) {
			obj[key] = value;
		});

		// add the orientation handler if needed
		if (_.isFunction(newStyle.onorientationchange)) {
			that.addOrientationListener(obj,newStyle.onorientationchange);
		}

	},

	/**
	* @method hasClass
	* Check if an element has a class
	* @param {Mixed/String} view The view or the id of the view
	* @param {String} className
	* @return {Boolean}
	*/
	hasClass: function(obj,className) {

		var that = this;
		obj = that.expandId(obj);

		// if not null
		if (obj.triplet != null && obj.triplet.className != null && obj.triplet.className !== '') {
			var aClasses = obj.triplet.className.split(' ');

			if (_(aClasses).contains(className)) {
				return true;
			}
		}

		return false;
	},

	/**
	* @method removeClass
	* Add a class name to the element
	* @param {Mixed/String} view The view or the id of the view
	* @param {String} className
	* @return {Mixed}
	*/
	removeClass: function(obj,className) {

		//Ti.API.info('removeClass@layoutManager -> '+JSON.stringify(obj));

		var that = this;
		var aClasses = [];

		obj = that.expandId(obj);

		if (obj == null) {
			return null;
		}

		// if not null
		if (obj.triplet != null && obj.triplet.className != null && obj.triplet.className !== '') {
			aClasses = obj.triplet.className.split(' ');
		}

		// create
		if (_(aClasses).contains(className)) {
			aClasses = _(aClasses).without(className);
			var newTriplet = _.extend({},obj.triplet);
			newTriplet.className = aClasses.join(' ');
			obj.triplet = newTriplet;
			// refresh
			that.refreshStyle(obj);
		}

		return obj;
	},


	/**
	* @method addClass
	* Add a class name to the element
	* @param {Mixed/String} view The view or the id of the view
	* @param {String} className
	* @return {Mixed}
	*/
	addClass: function(obj,className) {

		//Ti.API.info('addClass@layoutManager');

		var that = this;
		var aClasses = [];

		obj = that.expandId(obj);

		if (obj == null) {
			return null;
		}

		// if null
		if (obj.triplet != null && obj.triplet.className != null && obj.triplet.className !== '') {
			aClasses = obj.triplet.className.split(' ');
		}

		// create
		if (!_(aClasses).contains(className)) {
			aClasses.push(className);
			var newTriplet = _.extend({},obj.triplet);
			newTriplet.className = aClasses.join(' ');
			obj.triplet = newTriplet;
			// refresh
			that.refreshStyle(obj);
		}

		return obj;
	},

	/**
	* @method setClass
	* Set one or more classes for an element and refresh the style applying the new properties, returns the same object
	* @param {Mixed} view
	* @param {String} className
	* @return {Mixed}
	*/
	setClass: function(obj,className) {

		//Ti.API.info('setClass@layoutManager -> '+JSON.stringify(obj));

		var that = this;

		obj = that.expandId(obj);

		if (obj == null) {
			return null;
		}

		// if null
		if (obj.triplet == null) {
			obj.triplet = {};
		}

		// create
		var newTriplet = _.extend({},obj.triplet);
		newTriplet.className = className;
		obj.triplet = newTriplet;
		// refresh
		that.refreshStyle(obj);

		return obj;
	},

	computeStyleRaw: function(type,className,id,path,itemData) {

		var that = this;
		var myStyle = {};

		// cycle for all styles added
		_(that._styles).each(function(sheet) {
			if (that.debug) {
				Ti.API.info('+ Using style sheet: '+sheet.path);
			}
			myStyle = _.extend(
				myStyle,
				that.matchRule(
					sheet.style,
					type,
					className,
					id,
					path,
					itemData
				)
			);

		});

		return myStyle;
	},

	/**
	* @method resolveStyle
	* Call with this style resolveStyle(selector1,selector2,selectorN,params), it will search for the
	* appropriate selector first in the theme of the app, then in style of the plugin
	* @param {String} type Type of the element (window, button, etc)
	* @param {String} className Class name of the element (className attribute inside options)
	* @param {String} id Id of the element (id attribute inside options)
	* @param {Array} path
	* @param {Object} path.triplet
	* @param {Object} options Options to be added directly, it's like inline css
	* @param {Object} itemData The single element of a forEach collection
	* @return {Object}
	*/
	resolveStyle: function(type,className,id,path,options,itemData) {

		var that = this;
		if (that.debug) {
			Ti.API.info('||||||||||||||||||||||||||||||||||||||||||||||');
			Ti.API.info('resolveStyle@LayoutManager -> type:'+type
				+' className:'+className+' id:'+id);
			Ti.API.info('path:'+JSON.stringify(path));
			Ti.API.info('options: '+JSON.stringify(options));
			Ti.API.info('itemData: '+JSON.stringify(itemData));
		}

		var myStyle = that.computeStyle(type,className,id,path,itemData);

		// finally merge the provided options, evaluate callback function
		var resolved = _.extend(myStyle,options);
		_(options).each(function(value,key) {
			if (_.isFunction(value) && key != 'onorientationchange' && key != 'onpostlayout') {
				resolved[key] = value.call(that,options,itemData);
			} else {
				resolved[key] = value;
			}
		});

		if (that.debug) {
			Ti.API.info('------------------------------------------');
			Ti.API.info('rendered style -> '+JSON.stringify(resolved));
			Ti.API.info('orientationchange -> '+_.isFunction(resolved.onorientationchange));
			Ti.API.info('------------------------------------------');
		}

		return resolved;
	},

	/**
	* @method evaluateVariables
	* Replace a variable inside a string
	* @param {Mixed} value
	* @return {Mixed}
	*/
	evaluateVariables: function(value,itemData) {

		var that = this;
		var rightDelimiter = that.options.rightDelimiter;
		var leftDelimiter = that.options.leftDelimiter;

		if (_.isString(value)) {

			var exp = new RegExp('\\{[A-Za-z0-9_.]{1,}\\}','g');
			var matched = value.match(exp);
			if (matched != null) {
				var newValue = value;
				_(matched).each(function(toReplace) {
					var theKey = toReplace.replace(rightDelimiter,'').replace(leftDelimiter,'');
					var theValue = '';
					// find the value
					if (theKey.substr(0,5) == 'data.') {
						if (that.isBackboneModel(itemData)) {
							theValue = itemData.get(theKey.replace('data.',''));
						} else if (_.isObject(itemData)) {
							theValue = itemData[theKey.replace('data.','')];
						}
					} else if (that.options.variables[theKey] != null) {
						theValue = that.options.variables[theKey];
					}

					// finally replace
					theValue = theValue != null ? theValue : '';
					newValue = newValue.replace(toReplace,theValue);
				});
				return newValue;
			} else {
				return value;
			}

		} else {
			return value;
		}

	},

	/**
	* @method getVariable
	* Get a variable
	* @param {String} name
	* @return {Mixed}
	*/
	getVariable: function(name) {

		var that = this;
		return that.options.variables[name] != null ? that.options.variables[name] : null;

	},

	/**
	* @method existsVariable
	* Verify if variable exists
	* @param {String} name
	* @return {Boolean}
	*/
	existsVariable: function(name) {

		return this.getVariable(name) != null;
	},

	/**
	* @method setVariable
	* Set a variable
	* @param {String} name
	* @param {Mixed} value
	* @chainable
	*/
	setVariable: function(name,value) {

		var that = this;

		that.options.variables[name] = value;

		return that;
	},

	/**
	* @method setVariables
	* Merge the passed dictionary with the layout manager variables
	* @param {Object} variables
	* @chainable
	*/
	setVariables: function(obj) {


		var that = this;

		_.extend(that.options.variables,obj);

		return this;
	},

	/**
	* @method getPowerSet
	* Get the power set of an array, basically the css set of rules, ordered from the shortest to the longest, the passed
	* array is left intact
	* @param {Array} path
	* @return {Array}
	*/
	getPowerSet: function(path) {

		var clonedPath = _.clone(path);
		var pathPowerSet = getPowerSet(clonedPath);
		var result = [];
		var k = 0;

		for (k = 0; k < pathPowerSet.length; k++) {
			var item = pathPowerSet.nth(k);
			// if not empty
			if (item.length !== 0) {
				result.push(item);
			}
		}

		// order starting from the shortest
		result = _(result).sortBy(function(item) {
			return item.length;
		});

		return result;
	},


	findKeyInStyle: function(style,path,keys,pwd) {

		var matchedStyle = {};
		var that = this;

		pwd = pwd != null ? pwd : [];

		if (path.length === 0) {

			// reached the end of the path, now check
			_(keys).each(function(key) {
				if (style[key] != null) {
					if (that.debug) {
						/*
						Ti.API.info('  Found css rule in "'+key+'" -> '+JSON.stringify(style[key]));
						Ti.API.info('  Found "'
					+that.pathToString(path,{id: id,type: type,className: className})+'" -> '
					+JSON.stringify(newStyle));
					*/
					//Ti.API.info('  Found css "'+pwd.join(' ')+' '+key+'" -> '+JSON.stringify(style[key]));

					}
					matchedStyle = _.extend(matchedStyle,style[key]);
				}
			});

			return matchedStyle;


		} else {

			// remove the first element of the path and expand for the possible keys of the triplets
			var newRoot = path[0];
			var newPath = path.slice(1);
			var newTestKeys = that.getStyleAccessKeys(newRoot.type,newRoot.className,newRoot.id);

			// then call the substyle for each possibile elements
			_(newTestKeys).each(function(key) {

				// if the key exists
				if (style[key] != null) {
					// calculate working directory
					var currentPwd = _.clone(pwd);
					currentPwd.push(key);
					// search into the sub style
					var newStyle = that.findKeyInStyle(style[key],newPath,keys,currentPwd);
					// if any merge
					if (newStyle != null && !_.isEmpty(newStyle)) {
						matchedStyle = _.extend(matchedStyle,newStyle);
					}
				}

			});

			return matchedStyle;
		}

	},

	/**
	* @method pathToString
	* Convert a set o triplets in the CSS style string, fro debugging purpose
	* @param {Array} triplets
	* @return {String}
	*/
	pathToString: function() {

		var result = '';
		var that = this;

		_(arguments).each(function(item) {
			var tmp = '';

			if (_.isArray(item)) {
				tmp = that.pathToString.apply(that,item);
				result = result !== '' ? result+' '+tmp : tmp;
			} else if (_.isObject(item)) {
				tmp += item.type != null ? item.type : '';
				tmp += item.className != null ? '.'+item.className : '';
				tmp += item.id != null ? '#'+item.id : '';
				result = result !== '' ? result+' '+tmp : tmp;
			}
		});

		return result;
	},

	/**
	* @method matchRule
	* Match a stile rule against a style sheet
	* @param {Object} style
	* @param {String} type The type of the element
	* @param {String} className A dictionary containing the ccs-like classes
	* @param {String} id The id of the element
	* @param {String} path Array of triplets parents of this object
	* @param {Object} itemData The single element of a forEach collection
	* @return {Object}
	*/
	matchRule: function(style,type,className,id,path,itemData) {

		var matchedStyle = {};
		var that = this;

		// define which key to search inside the style, priority is from more generic to more specific
		var testKeys = this.getStyleAccessKeys(type,className,id);
		if (that.debug) {
			//Ti.API.info('Check for: '+testKeys);
		}

		// search in the root of the dictionary
		_(testKeys).each(function(key) {
			if (style[key] != null) {
				if (that.debug) {
					Ti.API.info('  Found css rule in root "'+key+'" -> '+JSON.stringify(style[key]));
				}
				matchedStyle = _.extend(matchedStyle,style[key]);
			}
		});

		// calculate the power set of the array
		var pathPowerSet = that.getPowerSet(path);

		// cycle
		_(pathPowerSet).each(function(path) {

			// find the style following a specific path
			var newStyle = that.findKeyInStyle(
				style,
				path,
				testKeys
			);

			// if any style found
			if (newStyle != null && !_.isEmpty(newStyle)) {
				matchedStyle = _.extend(matchedStyle,newStyle);
			}

		});

		var evaluatedStyle = {};
		var isOrientationSensible = false;

		// check if some platform keywords are present, this is before special keys like portrait, landscape and functions
		// means that inside ipad: ... it's possibile to user landscape, portrait and anonymous function
		var perPlatformStyles = {};
		_(matchedStyle).each(function(value,key) {
			if (_(Platform.keywords).contains(key)) {
				if (Platform.isCompatible(key)) {
					perPlatformStyles = _.extend(perPlatformStyles,value);
				}
			}
		});

		// resolve the style object (if has function, execute them)
		// remove all keys that are also types
		_(matchedStyle).each(function(value,key) {

			// if function evaluate, but not an on orientation change event
			if (_.isFunction(value) && key != 'onorientationchange' && key != 'onpostlayout') {
				evaluatedStyle[key] = value.call(that,matchedStyle,itemData);
			} else if (key.toUpperCase() == 'PORTRAIT' && that.getOrientation() == 'portrait') {
				isOrientationSensible = true;
				evaluatedStyle = _.extend(evaluatedStyle,value);
			} else if (key.toUpperCase() == 'LANDSCAPE' && that.getOrientation() == 'landscape') {
				isOrientationSensible = true;
				evaluatedStyle = _.extend(evaluatedStyle,value);
			} else if (_typeKeys.indexOf(key) == -1) {
				evaluatedStyle[key] = value;
			}
			// now check for variables
			evaluatedStyle[key] = that.evaluateVariables(evaluatedStyle[key],itemData);

		});

		// now merge the properties depening from the platform, doing before the above block will overwrite the changes
		// but in this way we keep priority on platform keywords
		evaluatedStyle = _.extend(evaluatedStyle,perPlatformStyles);

		// if is orientable
		if (isOrientationSensible) {

			evaluatedStyle.onorientationchange = function(orientation) {

				var obj = null;
				var that = this; // the view

				if (orientation == 'portrait' && matchedStyle.PORTRAIT != null) {
					obj = matchedStyle.PORTRAIT;
				} else if (orientation == 'portrait' && matchedStyle.portrait != null) {
					obj = matchedStyle.portrait;
				} else if (orientation == 'landscape' && matchedStyle.landscape != null) {
					obj = matchedStyle.landscape;
				} else if (orientation == 'landscape' && matchedStyle.LANDSCAPE != null) {
					obj = matchedStyle.LANDSCAPE;
				}

				//Ti.API.info('('+orientation+') Re-apply on '+that.triplet.guid+' '+JSON.stringify(obj));

				if (obj != null) {
					_(obj).each(function(value,key) {
						that[key] = value;
					});
				}

			};

		}

		return evaluatedStyle;
	},

	/**
	* @method resolve
	* If the passed object is a function, executes it in the objetc's context, otherwise act transparently
	* @param {Mixed/Function} obj
	* @return {Mixed}
	*/
	resolve: function(obj) {
		return _.isFunction(obj) ? obj.call(this) : obj;
	},

	/**
	* @method getStyleAccessKeys
	* Get the priority of the keys to search inside a style, priority is from more generic to more specific
	* @param {String} elementClassName The class name of the element (the property className of the dictionary)
	* @param {String} elementType The type of the element (window,button,etc)
	* @param {String} elementId The id of the element (the property id of the dictionary)
	* @return {Array}
	*/
	getStyleAccessKeys: function(elementType,elementClassName,elementId) {

		var result = [];

		/*
		Should produce something like that, if not null
		[
			elementType,
			'.'+elementClassName,
			// combination with .
			elementType+'.'+elementClassName,
			// with the ids are have higher priorities
			'#'+elementId,
			'.'+elementClassName+'#'+elementId,
			elementType+'#'+elementId,
			elementType+'.'+elementClassName+'#'+elementId
		]
		*/
		var classes = null;

		if (elementClassName != null) {
			classes = elementClassName.split(' ');
		} else {
			classes = [null];
		}

		_(classes).each(function(elementClassName) {

			if (elementType != null) {
				result.push(elementType);
			}
			if (elementClassName != null) {
				result.push('.'+elementClassName);
				if (elementType != null) {
					result.push(elementType+'.'+elementClassName);
				}
			}
			if (elementId != null) {
				result.push('#'+elementId);
				if (elementClassName != null) {
					result.push('.'+elementClassName+'#'+elementId);
				}
				if (elementType != null) {
					result.push(elementType+'#'+elementId);
				}
				if (elementClassName != null && elementType != null) {
					result.push(elementType+'.'+elementClassName+'#'+elementId);
				}
			}

		});

		return result;
	},

	/**
	* @method isCollection
	* Tells if value is a collection, an array or a Backbone collection
	* @param {Mixed} value
	* @return {Boolean}
	*/
	isCollection: function(value) {

		return _.isArray(value);

	},

	/**
	* @method isBackboneCollection
	* Check if value is a backbone collection
	* @param {Mixed} value
	* @return {Boolean}
	*/
	isBackboneCollection: function(value) {

		return value instanceof Backbone.Collection;

	},

	/**
	* @method isBackboneModel
	* Check if value is a backbone collection
	* @param {Mixed} value
	* @return {Boolean}
	*/
	isBackboneModel: function(value) {

		return value instanceof Backbone.Model;

	},

	/**
	* @method getData
	* Given the id, get the related data of the forEach statement
	* @param {String} id
	* @return {Mixed}
	*/
	getData: function(guid) {

		return this._datas[guid] != null ? this._datas[guid] : null;

	},

	/**
	* @method getDataFromElement
	* Get data from the element, if it's not present, then climb back the view hierarchy and return the data
	* collection of the first parent that owns a data collection (means a label will inherit the data collection
	* of the view in which is contained)
	* @param {Ti.UI.View} element
	* @return {Mixed}
	*/
	getDataFromElement: function(element) {

		//Ti.API.info('getDataFromElement@layoutManager -> '+JSON.stringify(element.triplet));
		//Ti.API.info('*************');
		//Ti.API.info(JSON.stringify(this._datas));
		//Ti.API.info('*************');

		var that = this;
		if (element.triplet.guid != null && that.getData(element.triplet.guid) != null) {
			return that.getData(element.triplet.guid);
		} else if (_.isArray(element.path) && element.path.length > 0){
			var k = null;
			// climb back and get the id
			for(k = element.path.length-1; k >= 0; k--) {
				if (element.path[k].guid != null && that.getData(element.path[k].guid) != null) {
					return that.getData(element.path[k].guid);
				}
			}
		}

		return null;
	},


	/**
	* @method findMoreRowIdx
	* Find the first row with the flag forEachMore, which should remain fixed at the bottom of the table
	* @private
	* @return {Number}
	*/
	findMoreRowIdx: function(rows) {

		//Ti.API.info('findMoreRowIdx@layoutManager');
		var k = 0;
		var result = null;

		var section = rows[0];
		var subrows = section.getRows();

		for(k = 0; k < subrows.length; k++) {
			if (subrows[k].forEachPersist === true && result == null) {
				result = k;
			}
		}

		return result;
	},

	/**
	* @method rebuildLayout
	* Rebuild the layout of a partial layout
	* @param {Object} layoutObject The portion of layout to rebuild
	* @param {Object} path The path of the element
	* @param {Mixed} inheritedItemData Item data, could be an array of object or a Backbone collection
	* @param {Boolean} [more=false] If true, means views must be appended and not replace the current content
	* @param {Number} [offset=0] The offset
	*/
	rebuildLayout: function(layoutObject,path,inheritedItemData,more,offset,append) {

		//Ti.API.info('rebuildLayout@layoutManager -> more: '+more+' offset:'+offset);
		var that = this;

		that.profiler.start();

		offset = _.isNumber(offset) ? offset : 0;
		append = append != null ? append : false;
		var lastNode = _.isArray(path) && path.length > 0 ? path[path.length-1] : null;

		that.profiler.trace('init rebuildLayout');

		if (lastNode == null || lastNode.guid == null) {
			Ti.API.info('rebuildLayout: parent node doesn\'t have any id');
			return null;
		}

		var parent = that.getByGuid(lastNode.guid);
		that.profiler.trace('getByGuid');

		var views = that.createViews(layoutObject,path,inheritedItemData,offset);
		that.profiler.trace('createViews');

		// remove all rows
		if (lastNode.type == 'tableView' || lastNode.type == 'dashboardView') {

			if (append) {
				parent.appendRow(views);
				that.profiler.trace('appendRow in tableView');
			} else {
				parent.setData(views);
				that.profiler.trace('setData in tableView');
			}
		} else {

			if (!append) {
				parent.removeAllChildren();
				that.profiler.trace('removeAllChildren');
			}
			parent.add(views);
			that.profiler.trace('add views');
		}

		that._attachLiveEvents();
		that.profiler.trace('reattach live events');

		// cast event on parent item
		parent.fireEvent('layout',{items: views});
		that.profiler.trace('fire event layout');

		that.profiler.end();

	},

	convertTag: function(layoutObject) {

		var that = this;

		if (_.isObject(layoutObject) && layoutObject.type == 'tag') {
			// calculate tag value
			var tagName = null;
			if (_.isString(layoutObject.name)) {
				tagName = layoutObject.name;
			} else if(_.isFunction(layoutObject.name)) {
				tagName = layoutObject.name.call(that);
			}
			// if null return void
			if (tagName == null) {
				return {
					type: 'void'
				};
			}
			// expand
			if (that.existsTag(tagName)) {
				return that.expandTag(tagName);
			} else {
				Ti.API.info('LayoutManager: error, the tag '+tagName+' was not found');
				return layoutObject;
			}
		} else {
			return layoutObject;
		}
	},

	/**
	* @method createViews
	* Create a view object from a layout descriptor. Could also be an array (in that case an array of views will be
	* returned).
	* @param {Object} layoutObject
	* @param {Array} path
	* @param {Object} inheritedItemData
	* @return {Mixed}
	*/
	createViews: function(layoutObject,path,inheritedItemData,inheritedItemDataOffset) {

		var that = this;
		var result = [];
		inheritedItemDataOffset = _.isNumber(inheritedItemDataOffset) ? inheritedItemDataOffset : 0;

		that.profiler.trace('init createViews');

		// if the layout object is a tag, then resolve it
		if (_.isObject(layoutObject) && layoutObject.type == 'tag') {
			// calculate tag value
			var tagName = null;
			if (_.isString(layoutObject.name)) {
				tagName = layoutObject.name;
			} else if(_.isFunction(layoutObject.name)) {
				tagName = layoutObject.name.call(that);
			}
			// expand
			if (that.existsTag(tagName)) {
				layoutObject = that.expandTag(tagName);
			} else {
				Ti.API.info('LayoutManager: error, the tag '+tagName+' was not found');
			}
		}

		that.profiler.trace('resolve tag');

		if (that.debug) {
			Ti.API.info('**************************************');
			Ti.API.info('createViews@LayoutManager -> '+JSON.stringify(layoutObject));
		}

		// defaults
		path = path == null ? [] : path;

		// if not array
		var objs = _.isArray(layoutObject) ? layoutObject : [layoutObject];

		that.profiler.trace('init before loop of object');

		// cycle all passed elements
		_(objs).each(function(obj) {

			// clone otherwise object will be modified
			var layout = {};
			_(obj).each(function(value,key) {
				if (!_(_reservedKeys).contains(key)) {
					//layout[key] = value;
					layout[key] = that.evaluateVariables(value,inheritedItemData);
				}
			});

			that.profiler.trace('clone and evaluate');

			// evaluate the collection, if any
			var currentForEach = null;
			if (_.isFunction(obj.forEach)) {
				currentForEach = obj.forEach.call(that,layoutObject);
			} else if (_.isString(obj.forEach)) {
				var matchedForEach = obj.forEach.match(/^\{([A-Za-z0-9]{1,})\}$/);
				if (matchedForEach != null && that.existsVariable(matchedForEach[1])) {
					currentForEach = that.getVariable(matchedForEach[1]);
				}
			} else if (obj.forEach != null) {
				currentForEach = obj.forEach;
			}

			that.profiler.trace('evaluate the collection');

			// populate the collection if any
			var collection = null;
			var collectionLength = 1;
			var collectionIndex = 0;
			var onSynch = null;
			if (currentForEach != null && _.isArray(currentForEach)) {
				collection = currentForEach;
				collectionLength = currentForEach.length;
			} else if (currentForEach != null && that.isBackboneCollection(currentForEach)) {
				collectionLength = currentForEach.length;
				collection = currentForEach;
				// attach event for synch
				onSynch = function(model,resp,options) {
					that.rebuildLayout(
						layoutObject,
						path,
						inheritedItemData,
						options != null ? options.more : null,
						options != null && options.offset != null ? options.offset : 0,
						options != null ? options.append : null
					);
					that.trigger('repaint',options);
					that.trigger('complete',options);
				};
				collection.once('sync',onSynch);
			} else if (currentForEach != null && that.isBackboneModel(currentForEach)) {
				collectionLength = 1;
				collection = [currentForEach];
				onSynch = function(model,resp,options) {
					that.rebuildLayout(layoutObject,path,inheritedItemData);
					that.trigger('repaint',options);
					that.trigger('complete',options);
				};

				collection[0].once('sync',onSynch);
			} else {
				collectionLength = 1;
			}

			that.profiler.trace('populate the collection');

			// cycle the collection if any
			for(collectionIndex = inheritedItemDataOffset; collectionIndex < collectionLength; collectionIndex++) {

				if (obj.type != null && _typeMap[obj.type] != null) {

					var childs = null;
					var type = obj.type; // this is mandatory
					var method = null;
					var scope = null;

					// select which factory method to call
					if (_.isObject(_typeMap[obj.type])) {
						method = _typeMap[type].method;
						scope = _typeMap[type].scope;
					} else {
						method = _typeMap[type];
						scope = Ti.UI;
					}

					if (_.isString(scope)) {
						scope = require(scope);
					}

					that.profiler.trace('layout element init');

					if (_.isFunction(scope[method])) {

						// create a unique id for each element, it's used to reference with the data associated
						// with the collection
						// it's not the id of the layout, also the id can be evaluated through a callback and might use
						// the associated collection
						var guid = _.uniqueId();
						layout.guid = guid;

						that.profiler.trace('generate guid');

						// get the item data if any
						var itemData = null;
						if (_.isArray(collection) && collection.length !== 0 && that.isBackboneModel(collection)) {
							itemData = collection[0];
							// ensure we have a unique id for the element
//id = id != null ? id : _.uniqueId();
							// ensure we have a unique id for the element
							// store the reference to data in the layout manager with the id
							that._datas[guid] = itemData;
						} else if (_.isArray(collection)) {
							itemData = collection[collectionIndex];
							// ensure we have a unique id for the element
//id = id != null ? id : _.uniqueId();
							// store the reference to data in the layout manager with the id
							that._datas[guid] = itemData;
						} else if (that.isBackboneCollection(collection)) {
							itemData = collection.at(collectionIndex);
							// ensure we have a unique id for the element
//id = id != null ? id : _.uniqueId();
							// store the reference to data in the layout manager with the id
							that._datas[guid] = itemData;
						}

						that.profiler.trace('get element from collection');

						// find out which data to pass through, itemData from local forEach
						// always take precedence, then inherited itemData from a forEach in
						// upper levels
						var passthroughItemData = null;
						if (itemData != null) {
							passthroughItemData = itemData;
						} else if (inheritedItemData != null) {
							passthroughItemData = inheritedItemData;
						}

						// check the condition
						var condition = true;
						if (_.isFunction(obj.condition)) {
							var resultCondition = obj.condition.call(that,obj,passthroughItemData);
							condition = _.isBoolean(resultCondition) ? resultCondition : true;
						} else if (_.isBoolean(obj.condition)) {
							condition = obj.condition;
						}

						that.profiler.trace('evaluate single element condition');

						// if not condition
						if (condition) {

							// childs
							if (obj.childs != null) {
								childs = obj.childs;
								//obj.childs = undefined;
							}

							// get the id and evaluate in case of callback function
							var id = _.isFunction(obj.id) ? obj.id.call(that,obj,passthroughItemData) : obj.id;
							var className = _.isFunction(obj.className) ? obj.className.call(that,obj,passthroughItemData) : obj.className;

							that.profiler.trace('init before insertion');

							// resolve the style, pass through the itemData
							var renderedStyle = that.resolveStyle(
								type,
								className,
								id,
								path,
								layout, // properties could be here, it's like the inline in css
								passthroughItemData // item data from forEach
							);

							that.profiler.trace('resolve style');

							// create obj
							//var rendered = scope[method](renderedStyle);
							var rendered = executeAPI(scope,method,renderedStyle);
							result.push(rendered);

							that.profiler.trace('generate item with factory');

							// add the update method
							/*rendered.addEventListener('updatelayout',function(evt) {

								Ti.API.info('aggiorno layout');
								that.rebuildLayout(layoutObject,path,inheritedItemData);

							});*/

							// store if id is not null
							if (id != null) {
								that._ids[id] = rendered;
							}
							if (guid != null) {
								that._guids[guid] = rendered;
							}

							// store if classname is not null
							if (className != null) {
								_(className.split(' ')).each(function(className) {
									if (that._classes[className] == null) {
										that._classes[className] = [];
									}
									that._classes[className].push(rendered);
								});
							}

							// store the triplet, store here, are needed in orientation listener
							var triplet = {
								guid: guid,
								id: id,
								className: className,
								type: type
							};
							rendered.triplet = triplet;

							// append triplets
							rendered.path = _.union(path,[triplet]); // append and copy

							that.profiler.trace('storing triplets');

							// add listener if orientation changes
							if (_.isFunction(renderedStyle.onorientationchange)) {
								that.addOrientationListener(rendered,renderedStyle.onorientationchange);
							}
							// add listener for postlayout
							if (_.isFunction(renderedStyle.onpostlayout)) {
								rendered.addEventListener('postlayout',function(evt) {
									renderedStyle.onpostlayout.call(that,evt);
								});
							}

							that.profiler.trace('append listeners orientation and layout');

							// if any childs
							if (childs != null) {
								// create the childs, pass through the array
								var viewChilds = _(childs).map(function(child) {
									var tmp = that.convertTag(child);
									return that.createViews(
										tmp, // if tag expand it
										rendered.path,
										passthroughItemData
									);
								});
								// this is a trick
								viewChilds = _.flatten(viewChilds);

								// add the subviews, but keep in mind of expections like tableView
								if (type == 'tableView' || type == 'dashboardView') {
									// add the rows
									rendered.setData(viewChilds);
								} else {
									// normal subviews
									_(viewChilds).each(function(child) {
										if (child != null) {
											rendered.add(child);
										}
									});
								}

								that.profiler.trace('append childs');
							}

							// if any right nav button
							if (obj.rightNavButton != null && _.isFunction(rendered.setRightNavButton)) {
								var rightNavButton = that.createViews(obj.rightNavButton,rendered.path,passthroughItemData);
								rendered.setRightNavButton(rightNavButton[0]);
							}
							// if left right nav button
							if (obj.leftNavButton != null && _.isFunction(rendered.setLeftNavButton)) {
								var leftNavButton = that.createViews(obj.leftNavButton,rendered.path,passthroughItemData);
								rendered.setLeftNavButton(leftNavButton[0]);
							}


						}
					} else {
						Ti.API.error('Missing factory method: '+method);
					}


				} else if (obj.type == 'void') {
					// do nothing, no error, I'm here to do nothing
				} else {
					Ti.API.error('Missing type property in layout or unknown type: '+JSON.stringify(obj));
				} // end if type not null

			} // end for


		});

		return _.flatten(result);
	},

	/**
	* @method isFullyQualifiedPath
	* Tells if a string is a path
	* @param {String} str
	* @return {Boolean}
	*/
	isFullyQualifiedPath: function(str) {
		return _.isString(str) && str.indexOf('/') != -1;
	},


	/**
	* @method expandId
	* If the argument is a string, search for the element with the given id, otherwise returns the same param
	* @param {Ti.UI.View/String} id
	* @return {Ti.UI.View}
	*/
	expandId: function(id) {

		if (_.isString(id)) {

			var obj = this.getById(id);
			if (obj != null) {
				return obj;
			} else {
				return null;
			}

		}

		return id;

	},

	/**
	* @method existsTag
	* Check if a tag exists
	* @param {String} tag
	* @return {Object}
	*/
	existsTag: function(tag) {

		// get the file for this tag
		var that = this;
		var options = that.options;

		return options.tags != null && options.tags[tag] != null;

	},

	/**
	* @method expandTag
	* Expand a tag into the related object
	* @param {String} tag
	* @return {Object}
	*/
	expandTag: function(tag) {

		// get the file for this tag
		var that = this;
		var options = that.options;
		var obj = null;

		if (options.tags != null && options.tags[tag] != null) {

			var resource = options.tags[tag];
			// remove .js
			resource = resource.replace(/\.js$/,'');
			resource = resource.replace('file://localhost','');
			// add path
			if (!that.isFullyQualifiedPath(resource)) {
				resource = options.layoutDirectoryPath+resource;
			}

			try {
				obj = require(resource).layout;
			} catch(e) {
				Ti.API.error('Error loading module: '+resource);
			}
		}

		return obj;
	},


	/**
	* @method layout
	* Create layout using one or more tags or layout object
	* @param {Object/Array} tags
	* @return {Object/Array} An array of views or a single view
	*/
	createLayout: function(tags) {

		var that = this;

		that.profiler.start();

		var tagsToRender = _.flatten(arguments);
		var result = [];

		that.profiler.trace('flatted array');

		_(tagsToRender).each(function(tag) {

			var obj = null;

			// expand tag into object definition
			if (_.isObject(tag)) {
				obj = tag;
			} else {
				obj = that.expandTag(tag);
			}

			that.profiler.trace('expand tag');

			// render it

			var view = that.createViews(obj);
			that.profiler.trace('view created');

			// add
			result.push(view);

		});

		var flattened = _.flatten(result);

		that.profiler.end();

		that.trigger('complete');

		return (flattened.length == 1) ? flattened[0] : flattened;
	},


	/**
	* @method getStyle
	* Get a value of a selector (.my_class, #my_id, etc) from the style sheets registered in the layout manager,
	* resolves portait/landscape keywords
	* @param {String} selector
	* @return {Object}
	*/
	getStyle: function(selector) {

		var that = this;
		var result = null;
		var resolved = null;

		_(that._styles).each(function(style) {
			var res = that._findKey(style.style,selector);
			if (res != null) {
				result = res;
			}
		});

		// resolve portrait
		if (result != null) {
			var currentOrientation = that.getOrientation();
			resolved = {};

			_(result).each(function(value,key) {
				if (key != 'portrait' && key != 'landscape') {
					resolved[key] = value;
				} else if (key == currentOrientation) {
					resolved = _.extend(resolved,value);
				}
			});

			return resolved;

		} else {

			return null;

		}

	},

	/**
	* @method _findKey
	* Recursively find a key in a dictionary recursively
	* @private
	* @param {Object} obj
	* @param {String} searchKey
	* @return {Mixed}
	*/
	_findKey: function(obj,searchKey) {

		var that = this;


		if (!_.isObject(obj)) {

			return null;

		} else {

			var result = null;
			// cycle
			_(obj).each(function(value,key) {

				if (key == searchKey) {
					result = value;
				}
				// continue with sub objs, the last wins
				if (_.isObject(value)) {
					var res = that._findKey(value,searchKey);
					if (res != null) {
						result = res;
					}
				}
			});

			return result;
		}

	},


	/**
	* @method query
	* Query the layout manager for some css selector a-la-jquery style. Currently supports just
	* #name_id e .classname
	* @param {String} selector
	* @return {Array} Ti.UI.View
	*/
	query: function(selector) {

		var that = this;
		var matched = null;
		var found = null;

		if ((matched = selector.match(/#([A-Za-z0-9_-]{1,})/)) != null) {
			found = that.getById(matched[1]);
			if (found != null) {
				return [found];
			} else {
				return null;
			}
		} else if ((matched = selector.match(/\.([A-Za-z0-9_-]{1,})/)) != null) {
			found = that.getByClass(matched[1]);
			return found;
		}

	},

	_lambdas: null,

	/**
	* @method addLambda
	* Aggiunge un lambda wrapper al layout manager in modo che venga aggiunto ricorsivamente ai vari eventi
	* @param {String} selector selettore a cui applicare il wrapper (sono supportati attualmente soltanto
	* selettore semplici come .my_class, my_type, #my_id
	* @param {String} eventName Generalmente e' il click
	* @param {Function} func Funzione wrapper (deve avere restituire una funziona cge gestisce come primo argomento
	* un oggetto evento
	* @param {Object} options Opzioni da passare alla funzione lambda, oggetto totalmente arbitrario, ad esempio potrebbe
	* contente il riferimento alla finestra principale
	*/
	addLambda: function(selector,eventName,func,options) {

		var that = this;
		if (that._lambdas == null) {
			that._lambdas = [];
		}

		that._lambdas.push({
			eventName: eventName,
			selector: selector,
			func: func,
			options: options
		});

	},

	/**
	* @method is
	* Verifica che un elemento possa applicarsi da un determinato selettore (sono supportati attualmente soltanto
	* selettore semplici come .my_class, my_type, #my_id
	* @param {Ti.UI.View} element
	* @param {String} seletor
	* @return {Boolean}
	*/
	is: function(element,selector) {

		//Ti.API.info('is@layoutManager: '+JSON.stringify(element.triplet)+' - '+selector);

		var that = this;

		if (selector == null || selector === '') {
			return false;
		}

		if (selector.substr(0,1) == '.') {
			var className = selector.substr(1);
			return that.hasClass(element,className);
		} else if (selector.substr(0,1) == '#') {
			var the_id = selector.substr(1);
			return the_id == element.triplet.id;
		} else {
			return selector == element.triplet.type;
		}


	},

	lambdaWrap: function(element,eventName,func) {

		var new_func = func;
		var that = this;

		_(this._lambdas).each(function(lambda) {
			// check if selector apply
			if (eventName == lambda.eventName && that.is(element,lambda.selector)) {
				// then wrap the function
				new_func = lambda.func(new_func,lambda.options);
			}
		});

		return new_func;
	},

	/**
	* @method events
	* Attach a bundle of events using selectors a-la-jquery style, pass an object like:
	* {'.my_selector': {'click': function() { ... }}}. The object can be nested at will...
	* @param {Object} eventMapping
	* @param {String} [eventsSetId] Used by live
	* @chainable
	*/
	events: function(eventMapping,eventsSetId) {

		var that = this;
		_(eventMapping).each(function(events,selector) {
			// ask for elements
			var elements = that.query(selector);
			if (_.isArray(elements) && elements.length !== 0) {
				// cycle all found elements
				_(elements).each(function(element) {
					// cycle all events
					_(events).each(function(event,name) {
						if (_.isFunction(event)) {
							// debug
							if (that.debug) {
								Ti.API.info('LayoutManager -> attaching '+name);
							}
							// verify if can attach the event, skip if the events were already attached
							var canAttach = true;
							if (eventsSetId != null && _(element.triplet.events).contains(eventsSetId)) {
								// don't attach if already attached, don't do this twice
								canAttach = false;
							}
							// finally attach events
							if (canAttach) {

								// wrap the event in lambda functions
								var new_event = that.lambdaWrap(element,name,event);

								// attach
								element.addEventListener(name,new_event);
								// store the id
								if (eventsSetId != null) {
									if (!_.isArray(element.triplet.events)) {
										// do like that or get an error in titanium
										var newTriplet = _.extend({},element.triplet);
										newTriplet.events = [];
										element.triplet = newTriplet;
										element.triplet.events.push(eventsSetId);
									}
								}
							}
						} else {
							Ti.API.error('Trying to attach an event which is not a function: '+JSON.stringify(event));
						}
					});

				});
			} // end if element
		}); // end cycle selectors

	},


	_attachLiveEvents: function() {

		//Ti.API.info('attachLiveEvents@layoutManager');

		var that = this;

		_(that._eventsset).each(function(eventMapping,eventsSetId) {
			that.events(eventMapping,eventsSetId);
		});

		return that;
	},

	/**
	* @method live
	* Attach events that persists even if the interface is redesigned after a change in forEach
	* @param {Object} eventMapping
	* @chainable
	*/
	live: function(eventMapping) {

		//Ti.API.info('live@layoutManager');

		var that = this;
		var eventsSetId = _.uniqueId();

		// store this set
		that._eventsset[eventsSetId] = eventMapping;

		that.events(eventMapping,eventsSetId);

	}



});

LayoutManager.extendTypeMap = function(obj) {
    if (_.isObject(obj) && !_.isEmpty(obj)) {
        _.extend(_typeMap, obj);
        _typeKeys = _(_typeMap).keys();
    }
};

// per retrocompatibilita'
module.exports.createLayout = function(type,controller) {
	var LayoutManagerLegacy = require('/presto/components/layoutmanager/layoutManager_legacy');
	return LayoutManagerLegacy(type,controller);
};

// this is the real object
module.exports.LayoutManager = LayoutManager;
