/*jshint laxbreak: true,eqnull: true,browser: true,jquery: true,devel: true,regexdash: true,multistr: true, white: false */
/*global define: true, require: true, module: true, Ti: true, L: true, Titanium: true, Class: true */
/*jshint -W079 */

var _ = require('/presto/libs/underscore');
var jQ = require('/presto/libs/deferred/jquery-deferred');
var Cloud = require('ti.cloud');
var Node = require('/presto/node');
var models = require('/presto/models');
var logger = require('/presto/logger');

var Event = models.event.model;
var Events = models.event.list;

module.exports = function(contentClass,isDownloaded) {

	logger.info('**** FETCH EVENTS '+JSON.stringify(contentClass));
	
	var deferred = jQ.Deferred();
	var className = contentClass.className;
	var that = this;
	var dbName = 'presto';
	var tableName = 'events';
	var new_node = that.getContentNode(className);
	var fields = ['name','start_time','details','ical','recurring','recurring_count','recurring_until','id_place','created_at','updated_at'];
				
	Cloud.Events.query({
		//where: {tags_array: {'$in':[className]}}
		},
		function(result) {

			// if any
			if (_.isArray(result.events) != null && result.events.length !== 0) {
			
				deferred.notify({
					current: 1,
					steps: 1
				});
			
				// create the directory
				that._createDirectory(className+'/events');

				// delete all previous content
				db = Ti.Database.open(dbName);
				db.execute("BEGIN;");            
				db.execute('DELETE FROM '+tableName+' WHERE tag = ?',className);				
				db.execute("COMMIT;");
				db.close();
				
				// saving posts to sqlite
				_(result.events).each(function(event) {
					var sqlite_event = new Event();
					// store the file
					var relativeFileName = className+'/posts/'+event.id+'.html';
					var storeHTML = Ti.Filesystem.getFile(that.getDocumentsPath()+relativeFileName);
					storeHTML.write(event.content);	
					// standard fields
					sqlite_event.guid = event.id;
					sqlite_event.set('id_user',event.user.id);
					sqlite_event.set('id_photo',event.photo != null ? event.photo.id : null);
					sqlite_event.set('tag',className);
					sqlite_event.set('title',event.name);
					sqlite_event.set('content',event.details); // duplicate for consistency
					if (event.custom_fields != null) {
						// store description if any
						sqlite_event.set('description',event.custom_fields.description);
						// store the language
						sqlite_event.set('language',event.custom_fields.language);
						// store whole custom fields						
						sqlite_event.set('custom_fields',JSON.stringify(event.custom_fields));
					}					
					// specific fields
					_(fields).each(function(field) {
						sqlite_event.set(field,event[field]);
					});
					sqlite_event.save();
				});
									
			} // end if post

			// done resolve
			deferred.resolve();	
		}
	);
	
	return deferred.promise();
};