/*jshint laxbreak: true,eqnull: true,browser: true,jquery: true,devel: true,regexdash: true,multistr: true, white: false */
/*global define: true, require: true, module: true, Ti: true, L: true, Titanium: true, Class: true */

var _ = require('/presto/libs/underscore');
var Utils = require('/presto/helpers/utils');
var Navigation = require('/presto/navigation');
var Base = require('/presto/base');
var LayoutManager = require('/presto/components/layoutmanager/layoutManager').LayoutManager;
var logger = require('/presto/logger');
var jQ = require('/presto/libs/deferred/jquery-deferred');

/*

TODO

- metodo close con onClose e deferred
- su close, se disposable distruggere finestra

*/


/**
* @class presto.Plugin
* Base class for plugins
* @extend presto.Base
*/
var Plugin = Base.extend({

	/**
	* @property {String} className
	* Class name of the plugin, this is used to resolve the styles of UI in this plugin
	*/
	className: 'plugin',

	_options: null,

	_window: null,

	_collection: null,

	_model: null,

	_navigation: null,

	/**
	* @property {presto.LayoutManager} _layout
	* Instance of the layout manager for this plugin
	* @private
	*/
	_layout: null,

	/**
	* @property {Array} _styles
	* Array of path for styles of this plugin
	* @private
	*/
	_styles: null,

	/**
	* @property {Object} _ids
	* Reference by id of the UI elements
	* @private
	*/
	_ids: {},

	/**
	* @property {presto.AppManager}
	* Instance of application
	*/
	app: null,

	/**
	* @property {Object} tags
	* Associative array with tags to be used during layout creatiom
	*/
	tags: null,

	/**
	* @method _addId
	* Add a view to the id, if not null, act as a pass through
	* @param {String} id
	* @param {Mixed} element
	* @return {Mixed}
	* @private
	*/
	_addId: function(id,element) {
		if (id != null) {
			this._ids[id] = element;
		}
		return element;
	},

	/**
	* @method getTags
	* Get the available tags for the plugin, mixing the tags defined in the plugin throught the property {@link presto.Plugin#property-tags} and
	* the configuration {@link presto.Plugin#cfg-tags}
	* @protected
	* @return {Object}
	*/
	getTags: function() {

		var result = [];
		var that = this;

		if (_.isObject(that._options.tags)) {
			result = _.extend(result,that._options.tags);
		}
		if (_.isObject(that.tags)) {
			result = _.extend(result,that.tags);
		}

		return result;
	},

	/**
	* @method getVariables
	* Get variables to be passed to the layout manager, by default preload all collection connected to the content className and
	* the related types
	* @return {Object}
	* @return {String} return.title Title of the plugin, taken from options
	* @return {Number} return.random A random number to avoid caching problems
	* @return {String} return.themePath The path to the current theme
	* @return {String} return.pluginPath The path to the current plugin
	* @return {String} return.appPath The path to the application
	* @return {String} return.contentPath The path to the content data
	* @return {String} return.dateFormat The momentjs date format
	* @return {String} return.timeFormat The momentjs time format
	* @return {String} return.dateTimeFormat The momentjs date and time format
	* @protected
	*/
	getVariables: function() {

		//logger.info('getVariables@plugin');

		var that = this;
		var contentDefinition = that.getContent();
		var options = that.getOptions();

		//var contentPath = that.app.content.getContentClassPath(contentDefinition.className);
		var pluginPath = that.getPath();
		var appPath = that.app.getPath();
		var themePath = this.app.theme.getPath();
		var result = {
			//contentPath: contentPath,
			themePath: themePath,
			pluginPath: pluginPath,
			appPath: appPath,
			random: Math.random(),
			hasSharing: that.hasSharing(),
			title: that._options.title
		};

		// store format value
		result.dateFormat = options.dateFormat;
		result.timeFormat = options.timeFormat;
		result.dateTimeFormat = options.dateTimeFormat;

		// scan all the type
		if (contentDefinition != null) {

			// store the content path
			result.contentPath = that.app.content.getContentClassPath(contentDefinition.className);

			// setup query
			var query = null;
			var params = null;
			if (contentDefinition.language) {
				query = 'language = ?';
				params = [that.app.getLocale()];
			}

			// collect collections
			if (_.isArray(contentDefinition.types)) {
				_(contentDefinition.types).each(function(type) {
					// get the collection
					var collection = that.getCollection(type);
					// store in the plugin
					that._collection = collection;
					// do fetch
					collection.fetch({
						where: query,
						params: params
					});
					// store
					result[type] = collection;
					// remove the final s for smart collection
					if (collection.length > 0 && type.match(/.+s$/)) {
						result[type.substr(0,type.length-1)] = collection.at(0);
					}

				});
			}

		}

		return result;
	},

	/**
	* @method getLayoutManager
	* Get the current instance of the layout manager
	* return {presto.LayoutManager}
	*/
	getLayoutManager: function() {

		var that = this;

		// if layout is null, then create one
		if (that._layout == null) {

			// create the layout object
			that._layout = new LayoutManager({
				debug: false,
				tags: that.getTags(),
				variables: that.getVariables(),
				moment: that.app.getMoment()
			});

			// trigger on complete event
			that._layout.on('complete',function() {
				if (_.isFunction(that.onPaint)) {
					that.onPaint.call(that);
				}
			});

			// add the styles for the plugin
			_(that._options.styles).each(function(style) {
				that._layout.addStyle(style);
			});

			// add the styles for the plugin
			_(that.getApp().getStyles()).each(function(style) {
				that._layout.addStyle(style);
			});

		}

		return this._layout;

	},

	/**
	* @method get
	* Get an elment of the layout given the id
	* @param {String} id
	* @return {Ti.UI.View}
	*/
	get: function(id) {

		if (this._layout == null) {
			return null;
		} else {
			return this._layout.getById(id);
		}

	},

	/**
	* @method resolveLocale
	* Resolve a string into locale, if the argument is a string, it will pass through, if it's a dictionary, if will search
	* for a key with with the current local, if not present will search for the default locale
	*/
	resolveLocale: function(obj) {

		return this.app.resolveLocale(obj);

	},

	/**
	* @property {Array} requires
	* Array of plugin names required for this plugin
	* @readonly
	* @private
	*/
	requires: null,

	/**
	* @property {String} configNameSpace
	* Configuration name space, properties are stored with keys like namespace.nameofproperty
	* @private
	*/
	configNameSpace: null,

	configParams: [],

	/**
	* @method getPath
	* Return the fully qualified path of the plugin directory, supports TiShadow
	* @return {String}
	*/
	getPath: function() {
		return this.app.getPath()+'addons/'+this.className+'/';
	},

	/**
	* @method getDefaults
	* Get default options of the plugin
	* @return {Object}
	* @protected
	*/
	getDefaults: function() {

		return {

			/**
			* @cfg {Boolean} isHome
			* Tells if this is the main plugin, the first to start as the app starts
			*/
			isHome: false,

			isDisposable: false,

			/**
			* @cfg {String} id
			* Id for this plugin, use it as argument of {@link presto.AppManager#open}
			*/
			id: null,

			/**
			* @cfg {String} title
			* Title of the window
			*/
			title: null,

			/**
			* @cfg {String} target
			* Specify the target of the plugin, could be 'production' or 'development': will instantiate this
			* plugin only on the specified environment. Any other value means always
			*/
			target: null,

			/**
			* @property {presto.models.Sharing} sharing
			* Sharing configuration, set null for no sharing
			*/
			sharing: null,

			/**
			* @cfg {presto.models.Menu} menu
			* Title in the menu
			*/
			menu: null,

			/**
			* @cfg {Object} tags
			* Associative array with tags to be used during layout creatiom
			*/
			tags: null,

			/**
			* @cfg {Array} styles
			* List of styles to add to the plgu
			*/
			styles: null,

			/**
			* @cfg {Boolean} canSwipe
			* Make the main window of the plugin swipeable, means can reveal the munderneat menu
			*/
			canSwipe: true,

			/**
			* @cfg {presto.models.ContentClass} content
			* Content class to load from Custom Object in ACS for this plugin, it will be loaded and, eventually,
			* persisted in the "content" stage of the bootstrap
			*/
			content: null,

			/**
			* @cfg {Boolean} requiresLogin
			* Requires login to access the app
			*/
			requiresLogin: false,

			/**
			* @cfg {Function} onRefresh
			* Called at the end of a refresh
			*/
			onRefresh: null,

			/**
			* @cfg {String/presto.models.Action/Array} action
			* An action name, an array of actions or an action description that describe what to do with the top right button
			* of the window, generally the action is defined in the plugin that implements the action feature (for example
			* the sharing). A plugin can override this to define its own action
			*/
			action: null,

			/**
			* @cfg {String} [timeFormat=LT]
			* Momentjs format for the time, use only long format here, since locale dependent formattation is handled by
			* Momentjs itself
			*/
			timeFormat: 'LT',

			/**
			* @cfg {String} [dateFormat=LL]
			* Momentjs format for the date, use only long format here, since locale dependent formattation is handled by
			* Momentjs itself
			*/
			dateFormat: 'LL',

			/**
			* @cfg {String} [dateTimeFormat=LL, LT]
			* Momentjs format for the date time, use only long format here, since locale dependent formattation is handled by
			* Momentjs itself
			*/
			dateTimeFormat: 'LL, LT'

		};

	},

	/**
	* @method addStyle
	* Register a style sheet in the app
	* @chainable
	* @protected
	*/
	addStyle: function(path) {

		var that = this;

		var expandedPath = path;
		var requirePath = expandedPath.replace(/\.js$/,'');

		try {
			var sheet = require(requirePath);
			that._options.styles.push(expandedPath);
			sheet = null;
		} catch(e) {
			Ti.API.error('Plugin '+this.className+': Unable to load style sheet: '+expandedPath);
		}

		return that;
	},

	/**
	* @method getCollection
	* Return the collection associated with the content class name of this plugin
	* @param {String} type Type of content, for example: posts, photos, comments, etc
	* @return {Backbone.Collection}
	*/
	getCollection: function(type) {

		var that = this;
		var content = that.app.content;

		var result = content.getCollection(that.getContentClassName(),type);

		return result;
	},

	/**
	* @method getOptions
	* Get the options of this instance
	* @return {Object}
	*/
	getOptions: function() {

		return this._options;

	},

	/**
	* @method initMenu
	* Create the menu, this in generally called inside the init of the plugin
	* @chainable
	* @private
	*/
	initMenu: function() {

		var that = this;
		var app = that.getApp();
		var menu = app.menu;
		var options = that._options;

		if (options.menu != null) {

			var menuItem = options.menu;

			menu.addSection(menuItem.sectionId,menuItem.sectionName);

			menu.addItem(menuItem.sectionId,{
				id: options.id,
				title: menuItem.title,
				icon: menuItem.icon,
				onClick: function() {
					// if custom handler
					if (_.isFunction(menuItem.onClick)) {
						jQ.when(menuItem.onClick.call(that,menuItem))
							.done(function() {
								// close the menu
								setTimeout(function() {
									menu.close();
								},10);
							});
					} else {
						app.open(options.id)
							.done(function() {
								// close the menu
								setTimeout(function() {
									menu.close();
								},10);
							});
					} // end if

				}
			});
		}

		return this;
	},

	/**
	* @property {String} template
	* The path of the main layout file, by default the file it's *layout.js* in the plugin's folder. If the exported
	* layout doesn't have a root element of type *window* it will automatically wrapped inside the plugin's default
	* window
	*/
	template: null,

	/**
	* @method {Boolean} hasContent
	* Tells if the plugin has registered a content class
	* @return {Boolean}
	* @protected
	*/
	hasContent: function() {

		return this._options.content != null && this._options.content.className != null;

	},

	/**
	* @method getContentClassName
	* Return the content class name of the plugin, if some is registered, otherwise null
	* @return {String}
	* @protected
	*/
	getContentClassName: function() {

		if (this.hasContent()) {
			return this._options.content.className;
		} else {
			return null;
		}

	},

	/**
	* @method getContent
	* Get the content class definition for the plugin
	* @return {Object}
	* @protected
	*/
	getContent: function() {

		return this._options.content;

	},

	/**
	* @method setContent
	* Set the content class definition for the plugin
	* @param {Object} content
	* @chainable
	* @protected
	*/
	setContent: function(content) {

		this._options.content = content;

		return this;
	},

	/**
	* @method getApp
	* Current instance of the app manager, use {@link presto.Plugin#app}
	* @return {presto.AppManager}
	* @protected
	*/
	getApp: function() {
		return this.app;
	},

	init: function(app,opts) {

		//logger.info('Init plugin app:'+JSON.stringify(app));
		var that = this;

		// store the app instance
		that.app = app;

		// merge options
		that._options = _.extend({},that.getDefaults(),opts);
		if (that._options.styles == null) {
			that._options.styles = [];
		}
		if (that._options.tags == null) {
			that._options.tags = [];
		}

		// set model and collection if specified
		if (that._options.model) {
			this._model = that._options.model;
		}
		if (that._options.collection) {
			this._collection = that._options.collection;
		}

		logger.info('Init plugin ('+that.className+') opts:'+JSON.stringify(that._options));

		// if no template property, then set the default
		if (that.template == null) {
			that.template = '/addons/'+that.className+'/layout.js';
		}

		// empty set of elements
		that._events = {};

		// if id is null, then create one
		if (that._options.id == null) {
			that._options.id = Utils.guid();
		}

		// register content if any
		if (that._options.content !== '') {
			that.app.registerContent(that._options.content);
		}

		// call onInitialize
		if (_.isFunction(that.onInitialize)) {
			that.onInitialize.call(that);
		}

		// init basic menu
		this.initMenu();

		return that;
	},

	/**
	* @method isHome
	* Tells if the plugin is the home plugin
	* @return {Boolean}
	*/
	isHome: function() {
		return this._options.isHome;
	},

	isDisabled: function() {

	},

	disable: function() {

	},

	onInit: function() {
		return true;
	},

	/**
	* @method onInitialize
	* Method called just after instantiation, but before the menu is created, at this stage the {@link presto.Plugin#getOptions}
	* is ready, good place if you want to override the creation of the menu
	* @protected
	*/
	onInitialize: null,


	onContent: function() {

		return true;
	},

	onCreate: function() {

	},

	/**
	* @method onBeforeShow
	* Called just before the window is shown
	* @deferred
	* @protected
	*/
	onBeforeShow: function() {

	},

	/**
	* @method onLayout
	* Method called just after the layout is created, before any event is attached
	* @protected
	*/
	onLayout: null,

	/**
	* @method onPaint
	* Method called when the layout is ready on the view port
	* @protected
	*/
	onPaint: null,

	/**
	* @method onRefresh
	* Called at the end of a refresh
	* @protected
	*/
	onRefresh: null,


	onResume: function() {

	},

	onOpen: function() {

	},

	onClose: function() {

	},

	/**
	* @method close
	* Close the plugin's window
	* @chainable
	*/
	close: function() {

		var that = this;
		var navigation = that.getNavigation();
		navigation.close(that);

		return that;
	},


	/**
	* @method open
	* Open a plugin in the navigation group of the current plugin, just
	* @param {String/presto.Plugin} plugin The plugin instance or the id of the plugin
	* @param {Object} properties Hash of properties to be set in the plugin before it's painted (good place to pass a parameter)
	* @deferred
	*/
	open: function(id,properties) {

		logger.info('open@plugin '+id+' '+JSON.stringify(properties));

		var that = this;
		var app = that.getApp();
		var navigation = that.getNavigation();

		// get the plugin
		if (_.isObject(properties)) {
			var plugin = _.isObject(id) ? id : app.getPluginById(id);
			// copy the properties
			_(properties).each(function(value,key) {
				plugin[key] = value;
			});
			// copy the content class
			plugin.setContent(that.getContent());
		}

		return app.open(id,navigation);

	},

	/**
	* @method getWindow
	* Return the current window of the plugin, if any
	* @return {Ti.UI.Window}
	*/
	getWindow: function() {

		return this._window;

	},

	/**
	* @method hasWindow
	* Tells if the plugin has already created a window
	* @return {Boolean}
	*/
	hasWindow: function() {

		return this._window != null;

	},

	/**
	* @method hasNavigation
	* Tells if the plugin has already a navigation group
	* @return {Boolean}
	*/
	hasNavigation: function() {

		return this._navigation != null;

	},

	/**
	* @method hasSharing
	* Tells if the plugin has a configuration for sharing
	* @return {Boolean}
	* @protected
	*/
	hasSharing: function() {

		return this._options.sharing != null;

	},

	getSharing: function() {

		return this._options.sharing;

	},

	/**
	* @method getLayout
	* Return the top level layout of the plugin, it may contains tags of the LayoutManager. The default version loads a layout.js
	* in the root directory of the plugin
	* @return {Object}
	* @protected
	*/
	getLayout: function() {

		var module = null;
		var layout = null;
		var that = this;

		try {
			module = require(that.template.replace('.js',''));
			layout = module.layout;
		} catch(e) {
			// do nothing
		}

		if (layout == null) {
			Ti.API.error('Unable to load layout for addon '+this.className);
		}

		return layout;

	},

	/**
	* @method createActionLayout
	* Create the layout for the action button
	* @param {presto.models.Action} action
	* @return {Object}
	* @protected
	*/
	createActionLayout: function(action) {

		return {
			type: 'button',
			className: 'pr-toolbarbtn pr-toolbarbtn-action',
			title: action.label != null ? action.label : action.name
		};

	},

	/**
	* @method getWindowLayout
	* Returns the default layout of the window that will decorate the layout in case it doesn't have one, make sure the
	* window will have a .pr-window class, the plugin use it to find the window during the creation of the layout
	* @return {Object}
	* @private
	*/
	getWindowLayout: function() {

		var that = this;
		var options = that._options;
		var navigation = that.getNavigation();
		var isRoot = navigation != null && navigation.length >= 1 ? false : true;
		var windowLayout = {
			type: 'window',
			title: options.title,
			className: 'pr-window pr-window-'+that.className.toLowerCase(),
			leftNavButton: {
				type: 'button',
				className: isRoot ?
					'pr-toolbarbtn pr-toolbarbtn-menu' : 'pr-toolbarbtn pr-toolbarbtn-back'
			}
		};

		// attach in the layout the button or the view for the action
		var action = that.getAction();
		if (action != null) {
			action = _.isObject(action) ? action : that.app.getAction(action);
			windowLayout.rightNavButton = that.createActionLayout(action);
		}

		return windowLayout;
	},

	/**
	* @method hasTopLevelWindow
	* Verify a layout object has a top level object defining a window, if not, must be decorated with a top level window
	* @return {Boolean}
	* @private
	*/
	hasTopLevelWindow: function(layout) {

		if (_.isObject(layout) && layout.type == 'window') {
			return true;
		} else if (_.isArray(layout) && _.isObject(layout[0]) && layout[0].type == 'window') {
			return true;
		} else {
			return false;
		}

	},

	/**
	* @method collectUIs
	* Collect of user interface elements registered in the ui objects
	* @chainable
	* @private
	*/
	collectUIs: function() {

		var that = this;

		if (_.isObject(that.ui)) {
			var layoutManager = that.getLayoutManager();
			_(that.ui).each(function(value,key) {
				if (_.isString(value)) {
					that.ui[key] = layoutManager.getById(key);
				}
			});
		}

		return that;
	},

	/**
	* @method layout
	* Build the layout of the plugin, call other layout* methods, like layoutWindow, etc. Override this to create the layout
	* of the plugin, usually should write into _window property to store the window related to the plugin. If the method doesn't
	* exist or returns null, then the plugin is window-less
	* @chainable
	* @protected
	*/
	layout: function() {

		var that = this;
		//var options = that._options;
		var layout = that.getLayoutManager();
		var my_layout = that.getLayout();

		// if the layout doesn't have a top level window, add the default one
		var compositeLayout = null;
		if (!that.hasTopLevelWindow(my_layout)) {
			// decorate with a window
			compositeLayout = that.getWindowLayout();
			compositeLayout.childs = _.isArray(my_layout) ? my_layout : [my_layout];
		} else {
			compositeLayout = my_layout;
		}

		// create the composite view, must be a window
		var views = null;
		try {
			views = layout.createLayout(compositeLayout);
		} catch(e) {
			Ti.API.error('Error creating layout: '+JSON.stringify(e));
		}
		//logger.info('views -> '+JSON.stringify(views));

		// execute callback
		if (_.isFunction(that.onLayout)) {
			that.onLayout();
		}

		// collect all registered uis elements
		that.collectUIs();

		// attach events
		that.attachEvents();

		// find main window
		var layoutWindow = layout.getByClass('pr-window');
		if (_.isArray(layoutWindow) && layoutWindow.length > 0) {
			// store the window
			that._window = layoutWindow[0];
		} else {
			throw 'The plugin has a method layout but no window was created';
		}

		return this;
	},

	/**
	* @method refresh
	* Refresh the layout, redesigning completely, main window remains the same. Variables are recalculated and event
	* reattached, at the end the {@link presto.Plugin#method-onRefresh} method and callback is called, as well as
	* {@link presto.Plugin#onLayout} before attaching events
	*/
	refresh: function() {

		logger.info('refresh@plugin');

		var that = this;
		var options = that._options;
		var layout = that.getLayoutManager();
		var my_layout = that.getLayout();

		// remove everything from the window
		var window = that.getWindow();
		_(window.children).each(function(item) {
			window.remove(item);
		});

		// refresh variables
		layout.setVariables(that.getVariables());

		// create the composite view, must be a window
		var views = null;
		try {
			views = layout.createLayout(my_layout);
		} catch(e) {
			Ti.API.error('Error creating layout: '+JSON.stringify(e));
		}

		window.add(views);

		// execute callback
		if (_.isFunction(that.onLayout)) {
			that.onLayout();
		}

		// attach events
		that.attachEvents();

		if (_.isFunction(that.onRefresh)) {
			that.onRefresh.call(that);
		}
		if (_.isFunction(options.onRefresh)) {
			options.onRefresh.call(that);
		}

		return this;
	},

	/**
	* @method createNavigation
	* Create a navigation group, do this after the creation of the window
	* @private
	*/
	createNavigation: function() {

		var that = this;

		that._navigation = new Navigation(that._window);

	},

	/**
	* @method setNavigation
	* Sets the navigation for a plugin
	* @param {presto.Navigation} navigation
	* @chainable
	* @private
	*/
	setNavigation: function(navigation) {

		this._navigation = navigation;

		return this;
	},

	/**
	* @method getNavigation
	* Get the navigation associated with this plugin
	* @return {presto.Navigation}
	* @private
	*/
	getNavigation: function() {

		return this._navigation;

	},

	/**
	* @method getAction
	* Return the current action of the plugin
	* @return {presto.models.Action}
	* @private
	*/
	getAction: function() {

		return this.getOptions().action;

	},

	setAction: function(action) {

		var that = this;
		var action_layout = null;
		var layoutManager = that.getLayoutManager();
		var window = that.getWindow();
		var action_view = null;

		if (action != null) {
			action_layout = that.createActionLayout(action);
			action_view = layoutManager.createLayout(action_layout);
			action_view.addEventListener('click',function(evt) {
				action.execute.call(that,evt);
			});
			// attach to window
			window.setRightNavButton(action_view);

		} else {
			window.setRightNavButton(null);
		}

	},

	/**
	* @method getEvents
	* Get the basic events to attach to the created layout, by default attach the click to the top left button and the swipe
	* to the windows which open the application menu
	* @return {Object}
	* @protected
	*/
	getEvents: function() {

		var that = this;
		//var options = that.getOptions();

		var result = {
			'.pr-toolbarbtn-back': {
				'click': function() {
					that.close();
				}
			},
			'.pr-toolbarbtn-menu': {
				'click': function(evt) {
					that.app.menu.toggle();
				}
			},
			'.pr-window': {
				'swipe': function(evt) {

// !todo se loader
					//if (_loader.visible()) {
					//	return false;
					//}
					var menu = that.app.menu;

					if (evt.direction == 'left') {
						//menu.close();
						menu.close();
					} else if (evt.direction == 'right') {
						//menu.open();
						menu.open();
					}

				}
			}
		};

		// if an events object is specified, then merge with current
		if (_.isObject(that.events)) {
			_(that.events).each(function(events,selector) {
				// init if empty
				if (result[selector] == null) {
					result[selector] = {};
				}
				// attach function or strings
				if (_.isObject(events)) {
					_(events).each(function(callback,event) {
						if (_.isFunction(callback)) {
							result[selector][event] = _.bind(callback,that);
						} else if (_.isString(callback) && _.isFunction(that[callback])) {
							result[selector][event] = _.bind(that[callback],that);
						} else {
							throw('Callback for event not found: '+callback);
						}
					});
				}
			});

		}

		// if any action, attach the event to the attach button
		var action = that.getAction();
		if (action != null) {
			action = _.isObject(action) ? action : that.app.getAction(action);
			result['.pr-toolbarbtn-action'] = {
				'click': function() {
					that.action(action);
				}
			};
		}

		return result;
	},

	/**
	* @method action
	* Executes the action passed
	* @param {presto.models.Action/String} [action]
	* @deferred
	*/
	action: function(action) {

		var that = this;
try {
		if (_.isString(action)) {
			var lookup_action = that.app.getAction(action);
			if (lookup_action == null) {
				Ti.API.error('Unable to find action '+action);
			} else {
				action = lookup_action;
			}
		}

		if (_.isFunction(action.execute)) {
			return action.execute.call(that);
		} else {
			Ti.API.error('Action '+action.name+' has not a valid executor (function)');
		}
} catch(e) {
	Ti.API.info('eeeeeeeee '+JSON.stringify(e));
}
	},

	/**
	* @method attachEvents
	* Attach events to the created layout, called inside layout(). Calls getEvents() to get a list of events and functions
	* to call and attach
	* @protected
	*/
	attachEvents: function() {

		var that = this;
		var layout = that.getLayoutManager();

		layout.events(that.getEvents());

		return this;
	},

	/**
	* @method create
	* Create the layout of the plugin, if already created should skip the process
	* @chainable
	* @private
	*/
	create: function() {

		if (this._window == null) {
			this.layout();
		}

		return this;
	},

	/**
	* @method destroy
	* Destroy the plugin, it removes the main window of the plugin, the navigator and layout manager
	* @chainable
	*/
	destroy: function() {

		var that = this;

		if (that.hasWindow()) {
			that._window.close();
			that._window = null;
		}

		// destroy the navigation if has one
		if (that._navigation != null) {
			that._navigation.destroy();
			that._navigation = null;
		}

		// destroy the layout manager
		that._layout = null;
		that.ui = null;

		return that;
	},

	/**
	* @property {Object} _events
	* Hash of local events for this plugin
	* @private
	*/
	_events: null,

	/**
	* @method addEventListener
	* Add listener to this object
	* @param {String} name
	* @param {Function} callback
	* @chainable
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
	* Cast an event to the app manager
	* @chainable
	*/
	fireEvent: function(name,data) {

		var that = this;

		if (that._events[name] != null) {
			_(that._events[name]).each(function(cb) {
				// chiama ogni callback
				cb.call(that,data);
			});
		}

		return this;
	}

});


/**
* @property {String} id
* Unique id of the plugin instance
*/
Object.defineProperty(Plugin.prototype,'id',{
	get: function() {
		return this._options.id;
	},
	enumerable: true,
	configurable: false
});

/**
* @property {Backbone.Collection} collection
* Return the current instance of the collection
*/
Object.defineProperty(Plugin.prototype,'collection',{
	get: function() {
		return this._collection;
	},
	set: function(collection) {
		this._collection = collection;
		return this;
	},
	enumerable: true,
	configurable: false
});

/**
* @property {Backbone.Model} model
* Return the current instance of the model
*/
Object.defineProperty(Plugin.prototype,'model',{
	get: function() {
		return this._model;
	},
	set: function(model) {
		this._model = model;
		return this;
	},
	enumerable: true,
	configurable: false
});


module.exports = Plugin;
