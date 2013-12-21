/*jshint laxbreak: true,eqnull: true,browser: true,jquery: true,devel: true,regexdash: true,multistr: true, white: false */
/*global define: true, require: true, module: true, Ti: true, L: true, Titanium: true, Class: true */

var _ = require('/presto/libs/underscore');
var jQ = require('/presto/libs/deferred/jquery-deferred');
var Base = require('/presto/base');
var logger = require('/presto/logger');

var displayHeight = Titanium.Platform.displayCaps.platformHeight;

/**
* @class presto.SlidingMenu
* Main sliding menu of the application
*/
module.exports = function(opts) {

	var options = null;
	var _createViewSection = function(title) {
		
		var _view = Ti.UI.createView({
			width: Ti.UI.FILL,
			height: '15dp',
			backgroundColor: '#222b3c'
		});
		_view.add(Ti.UI.createLabel({
			
			color: '#ffffff',
			text: title.toUpperCase(),
			height: '15dp',
			left: '10dp',
			width: Ti.UI.FILL,
			textAlign:  Ti.UI.TEXT_ALIGNMENT_LEFT,
			font: {
				fontSize: '11dp',
				fontFamily: 'Helvetica Neue',
				fontWeight: 'bold',
				fontStyle: 'normal'
			}		
		}));
		
		return _view;
		
	};

	var _createViewRow = function(item) {

		//logger.info('Creo menu -> '+JSON.stringify(item));

		var row = Ti.UI.createTableViewRow({
			backgroundColor: options.backgroundColor,
			height: '40dp',
			id: item.id,
			layout: 'vertical'
		});
		var borderTop = Ti.UI.createView({
			width: '250dp',
			height: '1dp',
			backgroundColor: '#3a4354'
		});
		row.add(borderTop);
		var view = Ti.UI.createView({
			width: '250dp',
			height: '39dp',
			borderSize: '0dp',
			left: '0dp',
			top: '8dp',
			layout: 'horizontal'
			
		});
		
		if (item.icon != null) {
			var icon = Ti.UI.createImageView({
				image: item.icon,
				left: '4dp',
				width: '24dp',
				height: '24dp'
			});
			view.add(icon);
		}
		
		
		var label = Ti.UI.createLabel({
			color: options.color,
			width: Ti.UI.FILL,
			left: '8dp',
			text: item.title,
			shadowColor: '#202739',
			textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
			shadowOffset: {x:1,y:1},
			font: {
				fontFamily: 'Droid Sans',
				fontSize: '15dp'
				}
		});

		view.add(label);
		row.add(view);
		
		return row;	
	};

	var default_options = {
		backgroundColor: '#313a4b',
		separatorColor: '#222b3c',
		color: '#c6cddf',
		width: '250dp',
		onClick: null,
		items: [],
		createViewSection: _createViewSection,
		createViewRow: _createViewRow,
		createViewHeader: null,
		headerHeight: 65	
	};
	var _instance = null;
	options = _.extend({},default_options,opts);
	

	var _window = Ti.UI.createWindow({
		layout: 'vertical',
		width: (parseInt(options.width,10)+8)+'dp',
		left: 0,
		borderRadius: '0dp',
		backgroundColor: options.backgroundColor,
		zIndex: 100
	});
	var _client = null;
	var _open = false;
	
			
	// Tableview
	var tableView = Ti.UI.createTableView({
		scrollable: true,
		backgroundColor: options.backgroundColor,
		separatorColor: options.separatorColor,
		//height: Math.min(40*options.items.length,displayHeight-options.headerHeight)+'dp'
		height: Ti.UI.FILL
	});
	
	// append the logo
	if (_.isFunction(options.createViewHeader)) {
		_window.add(options.createViewHeader());	
	}
	
	// append table to the window
	_window.add(tableView);	

	_instance = {
		
		/**
		* @method setItems
		* Set the items of the menu
		* @param {Array} section
		* @param {String} section.title
		* @param {String} section.id Id of the section
		* @param {Array} section.items
		* @param {Object} section.items.item Menu item
		* @param {String} section.items.item.id Id of the menu
		* @param {String} section.items.item.title Title of the menu item
		* @param {Function} section.items.item.onClick On click
		*/
		setItems: function(items) {
			options.items = items;
			return this;
		},
		
		getItems: function() {
			return options.items;	
		},
		
		findSection: function(sectionId) {
		
			var section = _(options.items).find(function(section) {
				return section.id == sectionId;
			});
			
			return section;
		},
		
		addSection: function(sectionId,sectionTitle) {
			
			if (this.findSection(sectionId) != null) {
				return this;
			}
			
			options.items.push({
				id: sectionId,
				title: sectionTitle,
				items: []
			});	
						
			return this;
		},
		
		addItem: function(sectionId,menu) {
			
			var section = this.findSection(sectionId);
			
			if (section != null) {
				section.items.push(menu);
			}
			
			return this;
		},
		
		/**
		* @method refresh
		* Refresh the menu
		*/
		refresh: function() {

			var cumulativeHeight = 0;

			// merge titles with base options
			var menuTitles = [];
			_(options.items).each(function(item) {
		
				var row = null;
								
				if (item.items == null) {
					row = options.createViewRow(item);	
					menuTitles.push();
					cumulativeHeight += 40;
				} else {
					
					var section = Ti.UI.createTableViewSection({
						headerView: options.createViewSection(item.title)
						});
					cumulativeHeight += 15;
					
					_(item.items).each(function(subitem) {
						
						row = options.createViewRow(subitem);												
						row.addEventListener('click',function(evt) {
							if (_.isFunction(subitem.onClick)) {
								subitem.onClick();
							}							
						});
						
						section.add(row);
						cumulativeHeight += 40;
					});
										
					menuTitles.push(section);
					
				}
						
				//menuTitles.push(row);
				//section.add(row);
			});
			
			//menuTitles.push(section);
			
			tableView.setData(menuTitles);
			//tableView.setHeight(Math.min(cumulativeHeight,displayHeight-options.headerHeight)+'dp');
			
		},
		
		/**
		* @method getWindow
		* Get the window of the menu
		* @return {Ti.UI.Window}
		*/
		getWindow: function() {
			return _window;
		},
		
		
		setClient: function(client) {
			_client = client;
		},
	
		getClient: function() {
			return _client;
		},
		
		/**
		* @method open
		* Open the menu
		* @deferred
		*/
		open: function() {
			
			var deferred = jQ.Deferred();
			
			var slide = Ti.UI.createAnimation({
				left: options.width,
				duration: 200
			});
			slide.addEventListener('complete',function() { 
				_open = true; 
				deferred.resolve();
				});			
			_client.animate(slide);
			
			return deferred.promise();
		},
		
		/**
		* @method close
		* Close the menu
		* @deferred
		*/
		close: function() {
			var deferred = jQ.Deferred();
			var slide = Ti.UI.createAnimation({
				left: '0dp',
				duration: 200
			});
			slide.addEventListener('complete',function() { 
				_open = false; 
				deferred.resolve();
				});			
			_client.animate(slide);
			return deferred.promise();
		},
		
		/**
		* @method isOpen
		* Tells if the menu is open
		* @return {Boolean}		
		*/
		isOpen: function() {			
			return _open;
		},
		
		/**
		* @method toggle
		* Toggle open/close of the menu
		* @chainable
		*/
		toggle: function() {
			if (this.isOpen()) {
				return this.close();
			} else {
				return this.open();
			}
		},
		
		destroy: function() {
			
			_window.close();
			_window = null;
			
		}
		
	};	
	
	_instance.refresh();
	
	return _instance;
};