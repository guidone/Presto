/*jshint laxbreak: true,eqnull: true,browser: true,jquery: true,devel: true,regexdash: true,multistr: true, white: false */
/*global define: true, require: true, module: true, Ti: true, L: true, Titanium: true, Class: true */

var _ = require('/presto/libs/underscore');
var Class = require('/presto/libs/inheritance').Class;
var Stackable = require('/presto/libs/stackable');
var jQ = require('/presto/libs/deferred/jquery-deferred');
var SlidingMenu = require('/presto/slidingMenu');
var Loader = require('/presto/helpers/loader');
var Navigation = require('/presto/navigation');
var Cloud = require('ti.cloud');
var Content = require('/presto/content');
var Config = require('/presto/config');
var Session = require('/presto/session');
var Theme = require('/presto/theme');
var Diads = require('/presto/helpers/diads');
var logger = require('/presto/logger');
var moment = require('/presto/components/moment/moment');

/**
* @class presto.AppManager
* Application manager
*/
var AppManager = Class.extend({

  /**
  * @property {String} AcsOauthSecret
  * Set programmatically Oauth Secret, useful to be used with TiShadow
  */
	AcsOauthSecret: null,

  /**
  * @property {String} AcsOauthKey
  * Set programmatically Oauth Key, useful to be used with TiShadow
  */
	AcsOauthKey: null,

  /**
  * @property {String} AcsApiKey
  * Set programmatically Oauth API Key, useful to be used with TiShadow
  */
	AcsApiKey: null,

	/**
	* @event start
	* Fired when the app starts
	*/

	/**
	* @property {String} className
	* Class name this is used to resolve the styles of UI in this plugin
	*/
	className: 'app',

	/**
	* @cfg {String} property
	* Id fo the app, must match the id in tiapp.xml, needed to run the app in TiShadow (otherwise some assets could be
	* missing)
	*/
	id: null,

	/**
	* @property {Array} _plugins
	* Instances of plugin initialized for this application and registered with {@link presto.AppManager#registerPlugin}
	* @private
	*/
	_plugins: [],

	/**
	* @method {Array} _styles
	* Loaded styles for the application
	*/
	_styles: [],

	_pluginsDict: {},

	_pluginHome: null,

	_pluginCurrent: null,

	_options: {},

	_actions: null,

	_defaultOptions: {

		/**
		* @cfg {String} id
		* Id fo the app, must match the id in tiapp.xml, needed to run the app in TiShadow (otherwise some assets could be
		* missing)
		*/
		id: null,

		/**
		* @cfg {String} title
		* Title of the application
		*/
		title: 'My App',

		/**
		* @cfg {Ti.UI.Window/Function}
		* Window or Window factory for the splash screen while loading application content
		*/
		splashWindow: null,

		/**
		* @cfg {String} theme
		* Theme of the app
		*/
		theme: 'roller',

		/**
		* @cfg {presto.models.ContentClass} content
		* Class name of the content to be loaded at startup
		*/
		content: {
			className: 'home',
			types: ['objects']
		},

		/**
		* @cfg {Function} onInit
		* Callend on initialization, it's the first thing called after {@link presto.AppManager#bootstrap}, at this
		* point only the loader,content instances are ready
		*/
		onInit: null,

		/**
		* @cfg {Function} onContent
		* Called after content of the app is loaded, but before loading the content of the plugins
		*/
		onContent: null,

		onSession: null,

		/**
		* @cfg {Boolean} authentication
		* Requires login to access the app (not implemented yet)
		*/
		authentication: false,

		/**
		* @cfg {String} [dbName=presto]
		* Default database name per for app
		*/
		dbName: 'presto',

		/**
		* @cfg {presto.models.MenuConfig} menu
		*/
		menu: null,

		/**
		* @cfg {Array} locales
		* Array of available locales according to ISO_639-1, if the locale of the phone will not match any of these
		* the first will be the default language
		*/
		locales: ['en'],


		useOAuth: false
	},

	/**
	* @method getOptions
	* Get the application's options
	* @return {Object}
	*/
	getOptions: function() {

		return this._options;

	},

	/**
	* @method getLocale
	* Get the current language or the default one (the first in the {@link presto.AppManager#locales} property)
	* if the phone language is not supported
	* @return {String}
	*/
	getLocale: function() {

		var that = this;
		var locales = that.getOptions().locales;
		var phoneLocale = Ti.Locale.currentLanguage;

		if (_(locales).contains(phoneLocale)) {
			return phoneLocale;
		} else {
			return locales[0];
		}

	},

	/**
	* @method resolveLocale
	* Resolve a string into locale, if the argument is a string, it will pass through, if it's a dictionary, if will search
	* for a key with with the current local, if not present will search for the default locale
	*/
	resolveLocale: function(obj) {

		var that = this;

		if (_.isString(obj)) {
			return obj;
		} else if (_.isObject(obj)) {
			var locale = that.getLocale();
			if (obj[locale]) {
				return obj[locale];
			}
		}

		return _.isFunction(obj.toString) ? obj.toString() : '';
	},

	_moment: null,

	/**
	* @method getMoment
	* Return an instance of Moment correctly instantiated with the current locale, use standard formatter of MomentJS or
	* use option values: timeFormat, dateFormat, dateTimeFormat (available in the options hash of each plugin)
	* @return {Object}
	*/
	getMoment: function() {

		var that = this;

		if (that._moment == null) {
			moment.lang(that.getLocale());
			that._moment = moment;
		}

		return that._moment;
	},

	/**
	* @method loadContent
	* Load the content of the home app, then load the content, if any, of each plugin, then cast the callback
	* @deferred
	*/
	loadContent: function(opts) {

		var that = this;
		var deferred = jQ.Deferred();
		var options = that._options;
		var hasValidLocalContent = true;

		// if skip return immediately
		if (opts !=null && opts.update === false) {
			logger.info('Skipping loading content.');
			deferred.resolve();
			return deferred.promise();
		}

		logger.info('Loading app content...');

		// return immediately if no content
		if (options.content == null || options.content.className == null) {
			deferred.resolve();
			return deferred.promise();
		}

		// if valid local content, cast the fecth in parallel, so download home and resolve
		if (hasValidLocalContent) {

			logger.info('asking for ----> '+JSON.stringify(options.content.className));
			// ask the main content class, at app level, generally is 'home'
			// doing silently
			that.content.fetch(options.content.className,{silent: true})
				.done(function() {

					// ok downloaded the the home content
					var homeCollection = that.content.getCollection(options.content.className,'objects');
					homeCollection.fetch();
					var home = homeCollection.at(0);

					// now build the load content procedure for each plugin
					var stack = new Stackable();

					// main on content
					if (_.isFunction(that._options.onContent)) {
						stack.push(_.bind(that._options.onContent,that));
					}

					logger.info('** Verifying content versions');

					// cycle the plugins
					_(that._plugins).each(function(plugin) {
						// if has content
						if (plugin.hasContent()) {
							// get content class name of the plugin, if any fetch the content
							var contentClassName = plugin.getContentClassName();
							if (contentClassName != null) {

								var currentVersion = that.content.getLocalContentVersion(contentClassName);
								var onlineVersion = home.get(contentClassName);
								var willUpdate = onlineVersion != null && currentVersion < onlineVersion;

								// info
								logger.info('Checking: '+contentClassName
									+' local:'+currentVersion+' online:'+onlineVersion
									+' '+(willUpdate ? 'updating...' : 'skipping...'));

								// add to the queue
								if (willUpdate) {
									// add the fetcher
									stack.push(function() {
										// return the promise of the fetch
										var deferred = jQ.Deferred();

										that.content.fetch(contentClassName,{version: onlineVersion})
											.done(function() {
												deferred.resolve();
											})
											.fail(function() {
												deferred.reject();
											})
											.progress(function(obj) {
												//Ti.API.info('NOTIFY AL LIVELLO INTERMEDIO '+JSON.stringify(obj));
												deferred.notify(obj);
											});

										return deferred.promise();
									});
									// push the onContent callback
									stack.push(_.bind(plugin.onContent,plugin));
								}

							}

						}
					});

					// trigger them all
					if (stack.length() !== 0) {
						that.loader.show();
						stack.serial()
							.done(function() {
								// everyhting ok
								logger.info('All data downloaded!');
								// destroy the app
								that.destroy();
								// bootstrap again
								logger.info('Bootstrapping again...');
								that.bootstrap({
									update: false
								});
							}).fail(function(err) {
								// pass through the error
								logger.info('Some data failed!');
							}).always(function() {
								that.loader.hide();
							}).progress(function(obj) {
								that.loader.message('Loading '+obj.className+': '+obj.currentDownload+'/'+obj.numberOfDownloads);
							});
					} else {
						logger.info('Nothing to update.');
					}
				})
			.fail(function() {
				// Home data fetching not successful, do nothing
				logger.info('Error retrieving home data');
			});

			deferred.resolve();
		} else {

			//.always(function() {
			//	that.loader.hide();
			//});

		}




		return deferred.promise();
	},


	initMenu: function() {

		var that = this;

		// init the menu
		var menuOptions = null;
		if (that._options.menu != null && that._options.menu.image != null) {
			if (menuOptions == null) {
				menuOptions = {};
			}
			menuOptions.createViewHeader = function() {
				return Ti.UI.createImageView({
					image: that._options.menu.image,
					width: '250dp',
					left: '0dp'
				});
			};
		}
		that.menu = new SlidingMenu(menuOptions);

	},

	/**
	* @constructor init
	* @param {Object} options
	* @param {Object} options.onInit Deferred or callback called just after the call of {@link presto.AppManager#bootstrap}
	*/
	init: function(opts) {

		var that = this;

		// merge the options
		that._options = _.extend({},that._defaultOptions,opts);

    // set acs api key
    if (that._options.AcsOauthSecret != null) {
      logger.info('Using AcsOauthSecret: '+that._options.AcsOauthSecret);
      Ti.App.Properties.setString('acs-oauth-secret',that._options.AcsOauthSecret);
      Ti.App.Properties.setString('acs-oauth-secret-production',that._options.AcsOauthSecret);
      Ti.App.Properties.setString('acs-oauth-secret-development',that._options.AcsOauthSecret);
    }
    if (that._options.AcsOauthKey != null) {
      logger.info('Using AcsOauthKey: '+that._options.AcsOauthKey);
      Ti.App.Properties.setString('acs-oauth-key',that._options.AcsOauthKey);
      Ti.App.Properties.setString('acs-oauth-key-production',that._options.AcsOauthKey);
      Ti.App.Properties.setString('acs-oauth-key-development',that._options.AcsOauthKey);
    }
    if (that._options.AcsApiKey != null) {
      logger.info('Using AcsApiKey: '+that._options.AcsApiKey);
      Ti.App.Properties.setString('acs-api-key',that._options.AcsApiKey);
      Ti.App.Properties.setString('acs-api-key-production',that._options.AcsApiKey);
      Ti.App.Properties.setString('acs-api-key-development',that._options.AcsApiKey);
    }

		// sets the id
		that.id = that._options.id;
		// initialize the array of available actions
		that._actions = {};
		// init the menu
		that.initMenu();
		// init the loader
		that.loader = new Loader();
		// init the theme manager
		that.theme = new Theme(that,{theme: that._options.theme});
		// register the theme style sheet
		that.registerStyle('presto/style.js');
		that.registerStyle('themes/'+that._options.theme+'/style.js');
		// init the content manager
		that.content = new Content(that);
		// init the config manager
		that.config = new Config(that);
		// init the session manager
		that.session = new Session(that,{
			useOAuth: that._options.useOAuth
		});
		// install db
		that.installDb();
		// register the home content
		if (that._options.content) {
			that.registerContent(that._options.content);
		}
		// register a test action
		that.registerAction({
			name: 'echo',
			label: 'Echo',
			execute: function() {
				alert('Echo!');
			}
		});

		return this;
	},

	/**
	* @method registerAction
	* Register an action for the application
	* @param {presto.models.Action} action
	* @chainable
	*/
	registerAction: function(action) {

		var that = this;

		that._actions[action.name] = action;

		return that;
	},

	/**
	* @method getAction
	* Get an action descriptor by name
	* @param {String} name
	* @return {presto.models.Action}
	*/
	getAction: function(name) {

		return this._actions[name];
	},

	/**
	* @method databaseExists
	* Check if local app db exists
	* @return {Boolean}
	*/
	databaseExists: function() {
		var that = this;
		var dbFileName = Ti.Filesystem.applicationDataDirectory
			+'../Library/Private%20Documents/'+that._options.dbName+'.sql';
		var file = Ti.Filesystem.getFile(dbFileName);
		return file.exists();
	},

	/**
	* @method installDb
	* Install bare db if necessary
	*/
	installDb: function() {

		var that = this;

		// if no db installed
		if (!that.databaseExists()) {

			var path = that.getPath();
			var file = Ti.Filesystem.getFile(path+'content','presto.sql');

			if (file.exists()) {
				logger.info('Installing content DB ...');
				Ti.Database.install('/content/presto.sql',that._options.dbName);
			} else {
				logger.info('Installing default DB ...');
				Ti.Database.install('/presto/db/presto.sql',that._options.dbName);
			}
		}
	},

	/**
	* @method getHome
	* Get the home plugin, either the predefined one or the first plugin
	* @return {presto.Plugin}
	*/
	getHome: function() {

		if (this._pluginHome != null) {
			return this._pluginHome;
		} else {
			return this._plugins[0];
		}
	},

	/**
	* @property {presto.SlidingMenu} menu
	* Instance of the sliding menu
	*/
	menu: null,

	/**
	* @property {presto.Navigation} navigation
	* Navigation controller
	*/
	navigation: null,

	loader: null,

	/**
	* @method {presto.Theme} theme
	* Theme instance
	*/
	theme: null,

	/**
	* @property {presto.Config}
	*/
	config: null,

	/**
	* @property {presto.Content}
	* Instance of the content manager
	*/
	content: null,

	/**
	* @method registerContent
	* Just a proxy of {@link presto.Content#registerContent}
	* @chainable
	*/
	registerContent: function(opts) {

		return this.content.registerContent(opts);

	},

	/**
	* @method registerStyle
	* Register a style sheet in the app
	* @chainable
	*/
	registerStyle: function(path) {

		var requirePath = path.replace(/\.js$/,'');
		var that = this;

		try {

			var sheet = require(requirePath);
			that._styles.push(path);
			sheet = null;

		} catch(e) {
			Ti.API.error('Unable to load style sheet: '+path);
		}

		return that;
	},

	/**
	* @method getStyles
	* Get the array of registered styles for this app
	* @return {Array}
	*/
	getStyles: function() {

		return this._styles;

	},

	/**
	* @method getPluginById
	* Get a plugin by id
	* @param {String} id
	* @return {presto.Plugin}
	*/
	getPluginById: function(id) {

		var that = this;
		return that._pluginsDict[id];

	},

	/**
	* @method registerPlugin
	* Register a plugin
	* @param {String} plugin Type of plugin to add to the application
	* @param {Object} params
	* @return {presto.Plugin}
	*/
	registerPlugin: function(pluginName,params) {

		var that = this;
		var Plugin = require('/addons/'+pluginName+'/'+pluginName);
		var plugin = new Plugin(this,params);

		// append to the list
		that._plugins.push(plugin);

		// store by id
		if (that._pluginsDict[plugin.id] == null) {
			that._pluginsDict[plugin.id] = plugin;
		} else {
			Ti.API.error('Plugin id already used: '+plugin.id);
			throw 'Plugin id already used: '+plugin.id;
		}

		// expose plublic method
		// DEPRECATED
		/*
		if (that.pluginName == null) {
			// new scope
			that[pluginName] = {};
			// attach with plugin scope
			var apis = plugin.getApi();
			if (apis != null) {
				_(apis).each(function(func,method) {
					that[pluginName][method] = _.bind(func,that);
				});
			}
		}
		*/
		// expose the plugin to the app scope
		if (that[plugin.id] == null) {
			that[plugin.id] = plugin;
		} else {
			Ti.API.warn('Failed to attach '+plugin.id+' to app scope, possible use of reserved or duplicated id');
		}

		// if it's home
		if (plugin.isHome()) {
			if (that._pluginHome == null) {
				that._pluginHome = plugin;
			} else {
				Ti.API.error('Home plugin was already defined');
			}
		}

		return plugin;
	},

	/**
	* @method hasPlugin
	* Check if a plugin with a given class name was registered
	* @param {String} className
	* @return {Boolean}
	*/
	hasPlugin: function(pluginName) {

		var found = _(this._plugins).find(function(plugin) {
			return plugin.className == pluginName;
		});

		return found != null;
	},


	getInitStack: function() {

		var that = this;
		var stack = new Stackable();

		if (_.isFunction(this._options.onInit)) {

			stack.push(_.bind(this._options.onInit,that));

		}
		_(that._plugins).each(function(plugin) {
			stack.push(_.bind(plugin.onInit,plugin));
		});

		return stack;
	},

	checkSession: function() {

		var deferred = jQ.Deferred();

		deferred.resolve();

		return deferred.promise();
	},


	_events: {},

	/**
	* @method addEventListener
	* Attach the event to the Ti.App global scope (namespaced with app:) and also forward the event to the registered
	* plugins
	* @param {String} name
	* @param {Function} callback
	* @chainable
	*/
	addEventListener: function(name,callback) {

		var that = this;

		var func = function(evt) {

			// execute the original callback
			callback.call(that,evt);
			// fire the event at plugins
			_(that._plugins).each(function(plugin) {
				plugin.fireEvent(name,evt);
			});

		};

		// append to global
		Ti.App.addEventListener('app:'+name,func);
		// store to be able to remove it on destroy
		this._events[name] = func;

		return that;
	},

	/**
	* @method fireEvent
	* Cast an event to the app manager
	* @param {String} name
	* @param {Object} data
	* @chainable
	*/
	fireEvent: function(name,data) {

		Ti.API.info('fireEvent@AppManager');

		var that = this;

		// call the main scope event
		Ti.App.fireEvent(name,data);

		_(that._plugins).each(function(plugin) {

			// event to plugin
			plugin.fireEvent(name,data);

		});

		return that;
	},

	/**
	* @method destroy
	* Destroy the app, close the main window, remove all global events
	*/
	destroy: function() {

		Ti.API.warn('Destroying app...');
		var that = this;

		// remove global events
		_(that._events).each(function(value,key) {
			Ti.App.removeEventListener('app:'+key,value);
		});

		// destroy every single plugin
		_(that._plugins).each(function(plugin) {

			// destroy plugin
			plugin.destroy();

		});

		// destroy the menu
		//that.menu.destroy();

	},

	/**
	* @method isTiShadow
	* Tells if the app is running in demo mode under TiShadow
	* @return {Boolean}
	*/
	isTiShadow: function() {

		return Ti.App.id == 'com.TiShadowClientCloud';

	},

	/**
	* @method getPath
	* Get the app path, with final slash, if it's running TiShadow the app path is inside the document directory
	* @return {String}
	*/
	getPath: function() {

		if (this.isTiShadow()) {
			// in tishadow the app path is inside documents
			return Ti.Filesystem.applicationDataDirectory+this.id+'/';
		} else {
			return Titanium.Filesystem.resourcesDirectory;
		}

	},

	/**
	* @method bootstrap
	* Bootstrap the application
	*/
	bootstrap: function(opts) {

		var that = this;
		var default_options = {
			update: true
		};
		var options = _.extend(default_options,opts);

		// if the menu doesn't exist, then create it
		if (that.menu == null) {
			that.initMenu();
		}

		// open and hide, to be the first (under everything) but not visbile until
		// the main window is ready and shown
		that.menu.getWindow().hide();
		that.menu.getWindow().open();

		/*

		1. onInit of AppManager
		2. onInit of each plugins
		3. download content of the app
		4. onContent of AppManager
		5. download content of each plugin
		6. onContent on each plugin
		7. refresh of menus
		8. check session
		10. login if it's mandatory
		11. onSession of the App
		12. onSession on plugins


		*/

		var initStack = that.getInitStack();

		initStack.serial()
			.done(function() {

				logger.info('Init completed');

				// search for session id
				if (that.config.has('session_id')) {
					// get the session id
					Cloud.sessionId = that.config.get('session_id');
					//logger.info('Found a sessionId -> '+Cloud.sessionId);
				}

				that.loadContent(options)
					.done(function() {

						logger.info('Content...OK');
						// refresh the menu
						that.menu.refresh();

						// get the window of the home plugin
						//var homeWindow = that.getHome().getWindow();

						// create the navigation controller
						//that.navigation = new Navigation(homeWindow);


						var homePlugin = that.getHome();
						// draw the home plugin
						homePlugin.layout();

						logger.info('Home plugin...OK');
						// is the home plugin, create a navigation
						homePlugin.createNavigation();
						that._pluginCurrent = homePlugin;

						// add the navigation controller to the main window
						jQ.when(homePlugin.onBeforeShow())
							.done(function() {

								// attach the navigation to the main window
								//that.mainWindow.add(homePlugin.getNavigation().get());

								// open the main window
								//that.mainWindow.open();
								//that.menu.setClient(that.mainWindow);
								that.menu.setClient(homePlugin.getNavigation().get());
								that.menu.getWindow().show();

								// fire start event
								that.fireEvent('app_start');
							});

					})
					.fail(function(err) {

						Ti.API.error('Error -> '+JSON.stringify(err));

					});


				//that.menu.open();
			})
			.fail(function() {

				// failed init

			});

	},

	/**
	* @method open
	* Open a instance of the plugin given the id, it opens a new window and a new navigation group, to open a plugin
	* inside the navigation group of another plugin, use the open method of the plugin
	* @param {String/presto.Plugin} plugin The plugin instance or the id of the plugin
	* @param {presto.Navigation} [navigation] Specify a navigation to open the plugin window in the navigation group of another
	* plugin and mantain history, without this a new window and navigation group will be created
	* @deferred
	*/
	open: function(id,navigation) {

		Ti.API.info('open@AppManager');

		var plugin = null;
		var that = this;
		var deferred = jQ.Deferred();

		if (_.isString(id)) {
			plugin = that._pluginsDict[id];
		}

		// if plugin exists with this id
		if (plugin != null) {

			if (navigation != null) {
				plugin.setNavigation(navigation);
			}

			// create the layout if not already created
			if (!plugin.hasWindow()) {
				logger.info('Window not present or destroyed, create one');
				plugin.create();
			}

			// add the new navigation
			jQ.when(
				plugin.requiresAuthentication() && that.login != null ?
					that.login.login() : true
				)
				.done(function() {

					// start the opening
					jQ.when(plugin.onBeforeShow())
						.done(function() {

							if (navigation == null) {

								that._pluginCurrent.hide();
								// remove from main window the current plugin navigation group
								//that.mainWindow.remove(that._pluginCurrent.getNavigation().get());

								// this is the root of the stack, create a navigation group inside this plugin
								if (!plugin.hasNavigation()) {
									plugin.createNavigation();
								}
								// add the new window
								//that.mainWindow.add(plugin.getNavigation().get());

								// swap the current plugin
								that._pluginCurrent = plugin;

								that.menu.setClient(plugin.getNavigation().get());
								//that.menu.getWindow().show();
								plugin.show();


							} else {

								// do not close the previous plugin and do not change the current plugin (which is always root)
								navigation.open(plugin);
							}

							deferred.resolve();
						})
						.fail(function() {
							// che succede se fallisce
							deferred.reject();
						});

				})
				.fail(function() {

					Ti.API.info('Authentication failed for plugin '+plugin.id);
					deferred.reject();

				});


		} else {
			throw('No plugin found with this id: '+id);
		}

		return deferred;
	},

	/**
	* @property {Number} [ERROR_AUTHENTICATION_FAILED=1]
	* Authentication error, wrong username or password
	*/
	ERROR_AUTHENTICATION_FAILED: 1




});

module.exports = AppManager;
