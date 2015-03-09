/*jshint laxbreak: true,eqnull: true,browser: true,jquery: true,devel: true,regexdash: true,multistr: true, white: false */
/*global define: true, require: true, module: true, Ti: true, L: true, Titanium: true, Class: true */
/*jshint -W079 */

var _ = require('/presto/libs/underscore');
var jQ = require('/presto/libs/deferred/jquery-deferred');
var Cloud = require('ti.cloud');
var Node = require('/presto/node');
var Stackable = require('/presto/libs/stackable');
var models = require('/presto/models');
var logger = require('/presto/logger');

var Photo = models.photo.model;
var Photos = models.photo.list;
var Post = models.post.model;
var Posts = models.post.list;
var Event = models.event.model;
var Events = models.event.list;

/*
TODO

- check md5 e non scaricaricare due volte
- rollbackare se errore in duplicazione colonna, altrimenti locka il db
*/

module.exports = function(contentClass,isDownloaded) {

	logger.info('**** FETCH IMAGES '+JSON.stringify(contentClass)+' isDownloaded:'+isDownloaded);

	var deferred = jQ.Deferred();
	var className = contentClass.className;
	var that = this;
	var dbName = 'presto';
	var tableName = 'photos';
	var fields = ['filename','size','processed','created_at','updated_at','content_type','md5'];
	var errorCount = 0;

	// which sizes to download
	var imageSizes = contentClass.imageSizes != null ? contentClass.imageSizes : ['medium_640'];

	var new_node = that.getContentNode(className);

	// Collect photo id for all collections that have a photo
	function getExternalPhotos(className) {

		var result = [];
		var posts = new Posts();
		posts.fetch({
			limit: null, // all
			where: 'tag = ?', // just this tag
			params: className
		});

		posts.each(function(post) {
			result.push(post.get('id_photo'));
		});

		var events = new Events();
		events.fetch({
			limit: 1000, // all
			where: 'tag = ?',
			params: className
		});

		events.each(function(event) {
			result.push(event.get('id_photo'));
		});

		// do not duplicate
		result = _.uniq(result);

		return result;
	}

	// init notify object
	var notify = {
		current: 0,
		steps: 1
	};
	//logger.info('Loading from online ....');
	var externalIds = getExternalPhotos(className);
	logger.info('Also have external photos: '+JSON.stringify(externalIds));

	// build the query for downloading the photo, also download pictures for other content class like posts
	var whereClause = null;
	if (externalIds.length !== 0) {
		whereClause = {'$or': [{tags_array: {'$in':[className]}},{id: {'$in':externalIds}}]};
	} else {
		whereClause = {tags_array: {'$in':[className]}};
	}
	//logger.info('Searching photos with the clause -> '+JSON.stringify(whereClause));

	var md5_list = [];
	// if the content is downloaded and not builtin, then check also for images
	// already downloaded with md5 signature
	if (isDownloaded) {
		var photos = new Photos();
		photos.fetch({
			where: 'tag = ?',
			params: className,
			limit: 1000
		});
		photos.each(function (item) {
			md5_list.push(item.get('md5'));
		});
	}
	Ti.API.info('MD5 HASH LIST: '+md5_list);

	// query for pictures
	Cloud.Photos.query({
		where: whereClause,
    limit: 1000
	},function(result) {

		// if any
		if (_.isArray(result.photos) != null && result.photos.length !== 0) {

      logger.info('Found photos: '+result.photos.length);
			// notify the deferred, number of steps now is the number of images to download          n
			notify.current = 1;
			notify.steps = result.photos.length*imageSizes.length;
			deferred.notify(notify);

			// create the directory
			that._createDirectory(className+'/photos');

			// delete all previous content
			//logger.info('** Deleting photos for '+className);
			db = Ti.Database.open(dbName);
			db.execute("BEGIN;");
			db.execute('DELETE FROM '+tableName+' WHERE tag = ?',className);
			db.execute("COMMIT;");
			db.close();

			// store in memory
			new_node.photos = result.photos;

			// create a download stack
			var downloader = new Stackable();
			downloader.context(that);

			//logger.info('photossss'+JSON.stringify(result.photos))

			// enqueue all photos
			_(result.photos).each(function(photo) {

				var sqlite_photo = new Photo();

				// standard fields
				sqlite_photo.guid = photo.id;
				sqlite_photo.set('id_user',photo.user_id);
				sqlite_photo.set('tag',className);
				if (photo.custom_fields != null) {
					// store custom fields as title
					sqlite_photo.set('title',photo.custom_fields.title);
					sqlite_photo.set('description',photo.custom_fields.description);
					// store the language
					sqlite_photo.set('language',photo.custom_fields.language);
					// store whole custom fields
					sqlite_photo.set('custom_fields',JSON.stringify(photo.custom_fields));
				}

				// specific fields
				_(fields).each(function(field) {
					sqlite_photo.set(field,photo[field]);
				});

				// cycle the formats and add a downloader
				_(imageSizes).each(function(size) {

					// some prep on file names
					var fileExtension = that.getFileExtension(photo.filename);
					var fileWithoutExtension = photo.filename.replace(fileExtension,'');
					fileWithoutExtension = fileWithoutExtension.replace(/[. ]/g,'_');
					var relativeFilename = 'photos/'+fileWithoutExtension+'_'+size+fileExtension;

					// save on backbone
					sqlite_photo.set(size,relativeFilename);

					// add downloader only if md5 not changed
					if (_.contains(md5_list,photo.md5)) {

						Ti.API.info('Image: '+photo.id+' skipped, is not changed');

					} else {
						// push the downloader
						downloader.push(function() {
							//logger.info('- downloading '+photo.urls[size]);

							var download = that.downloadPhotos(
								photo.urls[size],
								new_node.path+relativeFilename
							);

							download.done(function() {
								notify.current += 1;
								deferred.notify(notify);
							});

							return download;
						});
					}
				});


				// save
				try {
					sqlite_photo.save();
				} catch(e) {
					Ti.API.error('Failed fetching image: '+photo.filename+' ('+photo.id+') -> duplicated');
					logger.info('Sql error: '+JSON.stringify(e));
					errorCount++;
				}

			});

			// start download
			downloader.serial()
				.done(function() {
					//logger.info('OK, done downloading.');
					if (errorCount === 0) {
						deferred.resolve();
					} else {
						deferred.reject();
					}
				})
				.fail(function() {
// sistemare errore	con rollback
					deferred.reject();
				});



		} else {
			deferred.resolve();
		}


	});



	return deferred.promise();
};
