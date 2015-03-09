/*jshint laxbreak: true,eqnull: true,browser: true,jquery: true,devel: true,regexdash: true,multistr: true, white: false */
/*global define: true, require: true, module: true, Ti: true, L: true, Titanium: true, Class: true */
/*jshint -W079 */

var _ = require('/presto/libs/underscore');
var jQ = require('/presto/libs/deferred/jquery-deferred');
var Cloud = require('ti.cloud');
var Node = require('/presto/node');
var models = require('/presto/models');
var Obj = models.object.model;
var Objs = models.object.list;
var logger = require('/presto/logger');

module.exports = function(contentClass,isDownloaded) {

	logger.info('**** FETCH OBJECTS '+JSON.stringify(contentClass));

	var deferred = jQ.Deferred();
	var className = contentClass.className;
	var that = this;
	var dbName = 'presto';
	var tableName = 'objects';
	var fields = ['created_at','updated_at'];

	var new_node = that.getContentNode(className);

	// same as the class name
	var objectClass = className;

	if (!new_node.isLocal) {

		logger.info('Loading from online ....');

		Cloud.Objects.query({
			classname: objectClass
		},function(result) {

			logger.info('Objects -> '+JSON.stringify(result));

			// delete all previous content
            db = Ti.Database.open(dbName);
            db.execute("BEGIN;");
            db.execute('DELETE FROM '+tableName+' WHERE tag = ?',className);
            db.execute("COMMIT;");
            db.close();

			// if any
			if (_.isArray(result[objectClass]) != null && result[objectClass].length !== 0) {

				// enqueue all object
				_(result[objectClass]).each(function(obj) {

					var sqlite_object = new Obj();

					// standard fields
					sqlite_object.guid = obj.id;
					sqlite_object.set('id_user',obj.user_id);
					sqlite_object.set('tag',className);

					// specific fields
					_(fields).each(function(field) {
						sqlite_object.set(field,obj[field]);
					});

					sqlite_object.set('json',JSON.stringify(obj));

					sqlite_object.save();

				});

				// create the directory
				// store in memory
				//new_node[objectClass] = result[objectClass];

			} // end if post

			// done resolve
			deferred.resolve();
		});
	} else {

		logger.info('Loading from local '+this.getStaticDocumentPath());

		// do nothing

		deferred.resolve();

	}


	return deferred.promise();
};
