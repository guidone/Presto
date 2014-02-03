/*jshint laxbreak: true,eqnull: true,browser: true,jquery: true,devel: true,regexdash: true,multistr: true, white: false */
/*global define: true, require: true, module: true, Ti: true, L: true, Titanium: true, Class: true */

var Backbone = require('/presto/components/backbone/backbone');
var Sync = require('/presto/components/backbone/synch/sqlite').sync;
var _ = require('/presto/libs/underscore');
var logger = require('/presto/logger');
var moment = require('/presto/components/moment/moment');

/*
		"id": "5189761e9ff9ed15b00a687b",
		"first_name": "Guido",
		"last_name": "Bellomo",
		"created_at": "2013-05-07T21:46:06+0000",
		"updated_at": "2013-11-09T18:50:46+0000",
		"external_accounts": [],
		"email": "guido.bellomo@gmail.com",
		"confirmed_at": "2013-05-07T21:46:06+0000",
		"username": "guidone",
		"role": "Admin",
		"admin": "true",
		"stats": {
			"photos": {
				"total_count": 14
			},
			"storage": {
				"used": 7432435
			}
		}
	}],
*/

/**
* @class presto.models.Action
* Class definition for action to be execute by a plugin, generally is defined inside a plugin which wants to expose an action
* for example a pugin that wants to make public a sharing method
*
*     var that = this;
*     that.app.registerAction({
*       name: 'share',
*       label: L('Share'),
*       execute: function() {
*         // that is the plugin in which the action is defined, it calls a share method specific of the plugin
*         // inside the callback *this* is the caller context (the plugin which called .action('share')
*         that.share(this);
*         },
*     });
*
* Tipically in the execute method we will fetch the data of the caller plugin (with something like this.model) and use the
* methods of the plugin which hosts the action (in the example above **share**)
*/
/**
* @property {String} name
* The name of the action, must be unique in the application
*/
/**
* @property {String} label
* If no view is specified, it's the label of the button corresponding to the action
*/
/**
* @property {Function} execute
* Callback function executed when activating this action, it runs in the context of the plugin which is calling the action.
* Generally the code is defined in the plugin which defines the action (for example a sharing action) while the context (this)
* is the caller
*/
/**
* @property {Ti.UI.View} view
* The view to use as button, if null a standard button will be used
*/

/**
* @class presto.models.Sharing
* The share description, holds content, picture and url to be shared with {@link presto.addons.SocialSharing} plugin
*/
/**
* @property {String/Function} text
* Text to be shared
*/
/**
* @property {String/Function} image
* Full path or URL to be shared
*/
/**
* @property {String/Function} url
* Url of the resource on the net (if any)
*/
/**
* @property {String/Function} removeIcons Remove some icons from sharing: print,sms,copy,contact,camera,mail
*/

/**
* @class presto.models.User
* User record
*/
/**
* @property {String} id User id
*/
/**
* @property {String} first_name
*/
/**
* @property {String} last_name
*/
/**
* @property {String} email
*/

/**
* @class presto.models.MenuConfig
* Menu configuration for the entire app
*/
/**
* @property {String} image A path the the image to be displayed in the menu, optimal fit would be 250dp
*/

/**
* @class presto.models.ContentClass
* Dictionary which defines a content class. Each content class (which can be considered a taxonomy) is defined in Node ACS through the tags.
* Each content in Node ACS could have any number of custom fields, some of them have special meanings
*
* - *language*: tells the locale of the content, if {@link presto.models.ContentClass#language} must be set to true to properly filtering
* - *url*: the url of a public website for sharing
*
*/
/**
* @property {String} className
* The name of the content class. Every entity in the ACS must have a tag with the same name to be part of the class.
*/
/**
* @property {Array} imageSizes
* Image sizes to download locally, it's an array of string: square_75, thumb_100, small_240, medium_500,
* medium_640, large_1024, original
*/
/**
* @property {Array} types
* Type of content for this class, they will downloaded if persisted. Allowed types are: posts, photos, checkins,
* collections, events, messages, objects, places, reviews, statuses, users
*/
/**
* @property {Boolean} [language=false]
* Tells if the content class is language aware, means the different locale of the phone downloads different
* sets of information, if set to true, only content with the custom field 'language' (same as the phone) will
* be downloaded
*/

/**
* @class presto.models.Menu
* Describe a menu item for a plugin
*/
/**
* @property {String} icon
*/
/**
* @property {String} title
*/
/**
* @property {String} sectionId
*/
/**
* @property {String} sectionName
*/

var sqliteSync_versions = Sync({
	db_name: 'presto',
	table_name: 'versions',
	debug: false,
	columns: {
		'tag': 'string',
		'version': 'number'
	}
});
var Version = Backbone.Model.extend({
	sync: sqliteSync_versions
});
var Versions = Backbone.Collection.extend({
	model: Version,
	sync: sqliteSync_versions
});


var sqliteSync_objects = Sync({
	db_name: 'presto',
	table_name: 'objects',
	debug: false,
	primaryKey: 'guid',
	columns: {
		'tag': 'string',
		'created_at': 'date',
		'updated_at': 'date',
		'json': 'string',
		'language': 'string'
	}
});

/**
* @class presto.models.Base
* Base class for all models
*/
var Base = Backbone.Model.extend({

	/**
	* @method getPhoto
	* Return the current photo of the model (resolves id_photo)
	* @return {presto.models.Photo}
	*/
	getPhoto: function() {

		var that = this;
		var id_photo = that.get('id_photo');
		var result = null;

		if (id_photo != null) {

			var photos = new Photos();
			photos.fetch({
				where: 'id = ?',
				params: id_photo
			});

			result = photos.length !== 0 ? photos.at(0) : null;

		}

		return result;
	},

	/**
	* @method getCustomFields
	* Get decoded custom fields from ACS
	* @return {Object}
	*/
	getCustomFields: function() {

		var that = this;
		var json = that.get('custom_fields');
		var result = null;

		if (json != null && json !== '') {
			try {
				result = JSON.parse(json);
			} catch(e) {
				// do nothing
			}

		}

		return result;
	},

	/**
	* @method getCustomField
	* Returns a custom field if exists, or null
	* @param {String} field
	* @return {Mixed}
	*/
	getCustomField: function(key) {

		var that = this;
		var json = that.getCustomFields(key);

		return json != null ? json[key] : null;
	},

	/**
	* @method getContent
	* Get the content of the post somehow formatted
	* @param {Object} options
	* @param {Boolean} [options.stripHtml=false] Remove html tags
	* @param {Number} [options.length=0] Number of chars to keep, 0 means all
	* @param {String} [options.elipsize=...] Chars to put at the end of the string if truncated
	* @return {String}
	*/
	getContent: function(opts) {

		var that = this;
		var default_options = {
			stripHtml: false,
			length: 0,
			elipsize: '...'
		};
		var options = _.extend(default_options,opts);
		var result = that.get('content');

		if (options.stripHtml) {
			result = result.replace(/(<([^>]+)>)/ig,'');
		}

		if (options.length > 0) {
			var tmp = result.substr(0,options.length)+(result.length > options.length ? options.elipsize : '');
			result = tmp;
		}

		return result;
	}

});


/**
* @class presto.models.Obj
* Base class for node ACS Objects
*/
var Obj = Backbone.Model.extend({

	sync: sqliteSync_objects,

	/**
	* @method get
	* Override basic get method, if not in the Backbone attribute, decode and search in json field
	* @param {String} key
	* @return {Mixed}
	*/
	get: function(key) {

		var that = this;

		if (that.attributes[key] !== undefined) {
			return Obj.__super__.get.apply(that,arguments);
		} else {
			if (that._json == null) {
				try {
					that._json = JSON.parse(that.get('json'));
				} catch(e) {
					Ti.API.error('Error parsing json object');
					that._json = {};
				}
			}
			return that._json[key];
		}

	}

});
var ObjList = Backbone.Collection.extend({
	model: Obj,
	sync: sqliteSync_objects
});


var sqliteSync_posts = Sync({
	db_name: 'presto',
	table_name: 'posts',
	debug: false,
	primaryKey: 'guid',
	columns: {
		'tag': 'string',
		'title': 'string',
		'description': 'string',
		'content': 'string',
		'created_at': 'date',
		'updated_at': 'date',
		'filename': 'string',
		'id_user': 'string',
		'id_photo': 'string',
		'custom_fields': 'string',
		'language': 'string'
	}
});


/**
* @class presto.models.Post
* Base class for node ACS Posts, each model reflects a post in ACS. Some custom field could have a particulare meaning for Presto
*
* - **language**: defines the local in which the post must be displayed, if {@link presto.models.ContentClass#language} is false,
* in the related content class, has no meaning
* - **description**: used somewhere as short description of the post (an abstract)
* - **url**: the URL of this post out in the web, used for sharing the content
*
* @extend presto.models.Base
*/
var Post = Base.extend({

	sync: sqliteSync_posts,

	/**
	* @method toJSON
	* Serialize the post including, if present, the photo
	* @return {Object}
	*/
	toJSON: function() {

		var that = this;
		var result = _.clone(that.attributes);
		var photo = that.getPhoto();

		if (photo != null) {
			result.photo = photo.toJSON();
		}

		return result;
	}

});
var PostList = Backbone.Collection.extend({
	model: Post,
	sync: sqliteSync_posts
});



var sqliteSync_events = Sync({
	db_name: 'presto',
	table_name: 'events',
	debug: false,
	primaryKey: 'guid',
	columns: {
		'tag': 'string',
		'title': 'string',
		'name': 'string',
		'description': 'string',
		'details': 'string',
		'content': 'string',
		'created_at': 'date',
		'updated_at': 'date',
		'id_user': 'string',
		'id_photo': 'string',
		'id_place': 'string',
		'custom_fields': 'string',
		'start_time': 'date',
		'ical': 'string',
		'recurring': 'string',
		'recurring_count': 'number',
		'recurring_until': 'date',
		'language': 'string'
	}
});


/**
* @class presto.models.Event
* Base class for node ACS Events
* @extend presto.models.Base
*/
var Event = Base.extend({
	sync: sqliteSync_events,

	/**
	* @method toJSON
	* Serialize the post including, if present, the photo
	* @return {Object}
	*/
	toJSON: function() {

		var that = this;
		var result = _.clone(that.attributes);
		var photo = that.getPhoto();

		if (photo != null) {
			result.photo = photo.toJSON();
		}

		// convert and format all dates
		/*_(_.keys(that.attributes)).each(function(key) {
			var the_value = that.get(key);
			if (_.isDate(the_value)) {
				result[key] = moment(the_value).format('MMM Do YY');
			}
		});*/


		return result;
	}

});
var EventList = Backbone.Collection.extend({
	model: Event,
	sync: sqliteSync_events
});




var sqliteSync_photos = Sync({
	db_name: 'presto',
	table_name: 'photos',
	debug: false,
	primaryKey: 'guid',
	columns: {
		'tag': 'string',
		'filename': 'string',
		'size': 'number',
		'created_at': 'date',
		'updated_at': 'date',
		'id_user': 'string',
		'processed': 'boolean',
		'square_75': 'string',
		'thumb_100': 'string',
		'small_240': 'string',
		'medium_500': 'string',
		'medium_640': 'string',
		'large_1024': 'string',
		'original': 'string',
		'content_type': 'string',
		'md5': 'string',
		'title': 'string',
		'description': 'string',
		'custom_fields': 'string',
		'language': 'string'
	}
});
var IMAGE_FIELDS = ['square_75','thumb_100','small_240','medium_500','medium_640','large_1024','original'];


/**
* @class presto.models.Photo
* Base class for node ACS Photos
*/
var Photo = Backbone.Model.extend({
	sync: sqliteSync_photos,

	// don't use it yet
	saveOrUpdate: function() {

		var that = this;

		// if already exists, then changes just the modified fields, mixup
		var photos = new Photos();
		photos.fetch({
			where: 'id = ?',
			params: that.guid
		});

		if (photos.length !== 0) {
			var my_photo = photos.at(0);
			var validFields = {};
			_(IMAGE_FIELDS).each(function(field) {
				if (that.get(field) != null) {
					validFields[field] = that.get(field);
				}
			});
			my_photo.save(validFields);

		} else {

			that.save.apply(that,arguments);

		}
	},

	/**
	* @method getCustomFields
	* Get decoded custom fields from ACS
	* @return {Object}
	*/
	getCustomFields: function() {

		var that = this;
		var json = that.get('custom_fields');
		var result = null;

		if (json != null && json !== '') {
			try {
				result = JSON.parse(json);
			} catch(e) {
				// do nothing
			}

		}

		return result;
	}

});
var Photos = Backbone.Collection.extend({
	model: Photo,
	sync: sqliteSync_photos
});

// Export
module.exports = {
	post: {
		model: Post,
		list: PostList
	},
	photo: {
		model: Photo,
		list: Photos
	},
	object: {
		model: Obj,
		list: ObjList
	},
	version: {
		model: Version,
		list: Versions
	},
	event: {
		model: Event,
		list: EventList
	}
};