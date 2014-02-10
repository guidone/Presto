/*jshint laxbreak: true,eqnull: true,browser: true,jquery: true,devel: true,regexdash: true,multistr: true, white: false */
/*global define: true, require: true, module: true, Ti: true, L: true, Titanium: true, Class: true */
/*jshint -W079 */

var _ = require('/presto/libs/underscore');
var jQ = require('/presto/libs/deferred/jquery-deferred');
var Cloud = require('ti.cloud');
var Node = require('/presto/node');
var models = require('/presto/models');
var Stackable = require('/presto/libs/stackable');
var File = models.file.model;
var Files = models.file.list;
var logger = require('/presto/logger');

module.exports = function(contentClass,isDownloaded) {

  logger.info('**** FETCH FILES '+JSON.stringify(contentClass));

  var deferred = jQ.Deferred();
  var className = contentClass.className;
  var that = this;
  var dbName = 'presto';
  var tableName = 'files';
  var fields = ['created_at','updated_at','url','name'];


  var new_node = that.getContentNode(className);

  // same as the class name
  var objectClass = className;

  if (!new_node.isLocal) {

    logger.info('Loading from online ....');

    Cloud.Files.query({

    },function(result) {

      logger.info('Files -> '+JSON.stringify(result.files));

      // create the directory
      that._createDirectory(className+'/videos');

      // delete all previous content
      db = Ti.Database.open(dbName);
      db.execute("BEGIN;");
      db.execute('DELETE FROM '+tableName+' WHERE tag = ?',className);
      db.execute("COMMIT;");
      db.close();

      // create a download stack
      var downloader = new Stackable();
      downloader.context(that);

      // if any
      if (_.isArray(result.files) != null && result.files.length !== 0) {

        // setup notifier
        var notify = {
          current: 1,
          steps: result.files.length
        };
        deferred.notify(notify);

        // enqueue all object
        _(result.files).each(function(obj) {

          // some prep on file names
          var fileExtension = that.getFileExtension(obj.url);
          var relativeFilename = 'videos/'+obj.name+fileExtension;

          var sqlite_object = new File();
          // standard fields
          sqlite_object.guid = obj.id;
          sqlite_object.set('id_user',obj.user.id);
          sqlite_object.set('tag',className);
          // specific fields
          _(fields).each(function(field) {
            sqlite_object.set(field,obj[field]);
          });
          sqlite_object.set('json',JSON.stringify(obj));
          sqlite_object.set('file_name',obj.name+fileExtension);
          sqlite_object.save();

          // add downloader
          downloader.push(function() {

            var download = that.downloadFile(
              obj.url,
              //new_node.path+'photos/cacca'+size+'.png'
              new_node.path+relativeFilename
            );

            download.done(function() {
              notify.current += 1;
              deferred.notify(notify);
            });

            return download;
          });

        });

      // start download
      downloader.serial()
        .done(function() {
          deferred.resolve();
        })
        .fail(function() {
          deferred.reject();
        });

      } else {
        // done resolve
        deferred.resolve();
      }

    });
  } else {

    logger.info('Loading from local '+this.getStaticDocumentPath());

    // do nothing

    deferred.resolve();

  }

  return deferred.promise();
};