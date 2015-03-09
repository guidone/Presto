/*jshint laxbreak: true,eqnull: true,browser: true,jquery: true,devel: true,regexdash: true,multistr: true, white: false */
/*global define: true, require: true, module: true, Ti: true, L: true, Titanium: true, Class: true */
/*jshint -W079 */

var _ = require('/presto/libs/underscore');
var jQ = require('/presto/libs/deferred/jquery-deferred');
var Cloud = require('ti.cloud');
var Node = require('/presto/node');
var models = require('/presto/models');
var logger = require('/presto/logger');

var Post = models.post.model;
var Posts = models.post.list;

module.exports = function(contentClass,isDownloaded) {

	logger.info('**** FETCH POSTS '+JSON.stringify(contentClass));

	var deferred = jQ.Deferred();
	var className = contentClass.className;
	var that = this;
	var dbName = 'presto';
	var tableName = 'posts';
	var new_node = that.getContentNode(className);
	var fields = ['title','content','created_at','updated_at'];

	Cloud.Posts.query({
		  where: {tags_array: {'$in':[className]}},
      response_json_depth: 3
		},
		function(result) {

			// if any
			if (_.isArray(result.posts) != null && result.posts.length !== 0) {

				deferred.notify({
					current: 1,
					steps: 1
				});

				// create the directory
				that._createDirectory(className+'/posts');

				// delete all previous content
				db = Ti.Database.open(dbName);
				db.execute("BEGIN;");
				db.execute('DELETE FROM '+tableName+' WHERE tag = ?',className);
				db.execute("COMMIT;");
				db.close();

				// saving posts to sqlite
				_(result.posts).each(function(post) {
					var sqlite_post = new Post();
					// store the file
					var relativeFileName = className+'/posts/'+post.id+'.html';
					var storeHTML = Ti.Filesystem.getFile(that.getDocumentsPath()+relativeFileName);
					storeHTML.write(post.content);
					// standard fields
					sqlite_post.guid = post.id;
					sqlite_post.set('id_user',post.user_id);
					sqlite_post.set('id_photo',post.photo != null ? post.photo.id : null);
					sqlite_post.set('tag',className);
					sqlite_post.set('filename',relativeFileName);
					if (post.custom_fields != null) {
						// store description if any
						sqlite_post.set('description',post.custom_fields.description);
						// store the language
						sqlite_post.set('language',post.custom_fields.language);
						// store whole custom fields
						sqlite_post.set('custom_fields',JSON.stringify(post.custom_fields));
					}
					// specific fields
					_(fields).each(function(field) {
						sqlite_post.set(field,post[field]);
					});
					sqlite_post.save();
				});

			} // end if post

			// done resolve
			deferred.resolve();
		}
	);

	return deferred.promise();
};
