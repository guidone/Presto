/*jshint laxbreak: true,eqnull: true,browser: true,jquery: true,devel: true,regexdash: true,multistr: true, white: false */
/*global define: true, require: true, module: true, Ti: true, L: true, Titanium: true, Class: true */
/*jshint -W079 */

var _ = require('/presto/libs/underscore');
var Class = require('/presto/libs/inheritance').Class;
var jQ = require('/presto/libs/deferred/jquery-deferred');
var Node = require('/presto/node');
var Cloud = require('ti.cloud');
var Stackable = require('/presto/libs/stackable');
var logger = require('/presto/logger');

var fetchPosts = require('/presto/fetchers/posts');
var fetchPhotos = require('/presto/fetchers/photos');
var fetchObjects = require('/presto/fetchers/objects');
var fetchEvents = require('/presto/fetchers/events');
var fetchFiles = require('/presto/fetchers/files');

var models = require('/presto/models');
var Photo = models.photo.model;
var Photos = models.photo.list;
var Post = models.post.model;
var Posts = models.post.list;
var Obj = models.object.model;
var Objs = models.object.list;
var Version = models.version.model;
var Versions = models.version.list;
var Event = models.event.model;
var Events = models.event.list;
var File = models.file.model;
var Files = models.file.list;


/**
* @class presto.Content
* Content manager
*/
var Content = Class.extend({

  app: null,

  /**
  * @constructor init
  * Create the content manager class
  * @param {presto.AppManager} app
  */
  init: function(app) {

    var that = this;

    that.app = app;

    return that;
  },

  className: 'content',

  _contentClassName: {},

  _content: {},

  /**
  * @method registerContent
  * Register a content stored in the cloud, or a remote webserver, files etc and how should be persisted
  * @param {presto.models.ContentClass} contentClass
  * @chainable
  */
  registerContent: function(opts) {

    var default_options = {
      className: null,
      type: 'cloud',
      persist: 'json',
      ts: new Date(),
      expire: null,
      language: true
    };

    var content = _.extend(default_options,opts);
    Ti.API.info('----- registerContent '+JSON.stringify(content));
    // store the content class name in a dictionary
    this._contentClassName[content.className] = content;

    return this;
  },

  /**
  * @method getCollection
  * Return the collection associated with the content class name of this plugin
  * @param {String} type Type of content, for example: posts, photos, comments, etc
  * @return {Backbone.Collection}
  */
  getCollection: function(className,type) {

    //var that = this;
    var collection = null;

    switch(type) {
      //case 'photo':
      case 'photos':
        collection = new Photos();
        break;
      //case 'post':
      case 'posts':
        collection = new Posts();
        break;
      case 'objects':
        collection = new Objs();
        break;
      case 'events':
        collection = new Events();
        break;
      case 'files':
        collection = new Files();
        break;
      default:
        throw 'Unable to find content type: '+type;
    }

    // sets the content class name and filter always with this
    collection.contentClassName = className;

    return collection;
  },

  /**
  * @method set
  * Set the content, given the class name
  * @param {String} classname
  * @param {Mixed} content
  * @chainable
  */
  set: function(classname,value) {
    this._content[classname] = value;
    return this;
  },

  /**
  * @method get
  * Get the content, given the class name
  * @param {String} classname
  * @return {Mixed}
  */
  get: function(classname) {
    return this._content[classname];
  },

  /**
  * @method getDocumentsPath
  * Return the documents path in the filesystem
  * @return {String}
  */
  getDocumentsPath: function() {

    return Ti.Filesystem.applicationDataDirectory;

  },

  /**
  * @method getPath
  * Return the static document path the one delivered inside the app
  * @return {String}
  */
  getStaticDocumentPath: function() {

    if (this.app.isTiShadow()) {
      // in tishadow the app path is inside documents
      return Ti.Filesystem.applicationDataDirectory+this._options.name+'/content/';
    } else {
      return Titanium.Filesystem.resourcesDirectory+'content/';
    }

  },

  /**
  * @method getContentClassPath
  * Tell the absolute address of the content, considering if the content was downloaded over the air or is built in
  * in the app, it also compatibile with TiShadow
  * @param {String} className
  * @return {Boolean}
  */
  getContentClassPath: function(className) {

    var that = this;
    var result = null;

    if (that.isDownloaded(className)) {
      //logger.info('Content class '+className+' is downloaded');
      result = Ti.Filesystem.applicationDataDirectory+className+'/';
    } else {
      //logger.info('Content class '+className+' is embedded');
      if (that.app.isTiShadow()) {
        // in tishadow the app path is inside documents
        result = Ti.Filesystem.applicationDataDirectory+this._options.name+'/content/'+className+'/';
      } else {
        result = Titanium.Filesystem.resourcesDirectory+'content/'+className+'/';
      }
    }

    return result;
  },


  createContentPlugin: function(className) {

    var dir = Ti.Filesystem.getFile(this.getDocumentsPath()+className);

    if (!dir.exists()) {
      return dir.createDirectory();
    }

    return true;
  },

  _createDirectory: function(directory) {

    var dir = Ti.Filesystem.getFile(this.getDocumentsPath()+directory);

    if (!dir.exists()) {
      return dir.createDirectory();
    }

    return true;

  },

  /**
  * @method getJSON
  * Get the json from a path, return the decoded file, null if it doesn't exist or not a valid json
  * @return {Mixed}
  */
  getJSON: function(path) {

    //logger.info('getJSON@content -> '+path);

    var file = Ti.Filesystem.getFile(path);
    var blob = null;
    var decoded = null;

    if (file.exists()) {
      blob = file.read();
      // try to decode
      try {
        decoded = JSON.parse(blob.text);
      } catch(e) {
        decoded = null;
      }
    }

    blob = null;
    file = null;

    return decoded;
  },

  /**
  * @method getFileFromPath
  * Extract the filename from a path, included extension
  * @param {String} path
  * @return {String}
  */
  getFileFromPath: function(path) {
    return path.replace(/^.*[\\\/]/, '');
  },

  /**
  * @method getFileExtension
  * Return the extension of a file
  * @param {String} file
  * @return {String}
  */
  getFileExtension: function(file) {

    var found = file.match(/\.[a-zA-Z0-9]{3,}$/);

    return found != null ? found[0] : null;

  },

  /**
  * @method downloadPhotos
  * Download a photo from an URL directly into a file, return a deferred
  * @param {String} url
  * @param {String} path The local path where to store file
  * @deferred
  */
  downloadPhotos: function(url,path) {

    var deferred = jQ.Deferred();

    //logger.info('downloadPhotos@content -> '+url);
    //logger.info('Saving filename: '+this.getFileFromPath(url));
    //logger.info('Saving path: '+path);

    var imageDownloader = Titanium.Network.createHTTPClient({
      onload: function(result) {
        if (result.success) {
          var myFile = Ti.Filesystem.getFile(path);
          myFile.write(imageDownloader.responseData,false);

          deferred.resolve();
        } else {
          deferred.reject();
        }

      },
      onerror: function(e) {
        deferred.reject();
// !todo handle errors
      },
      timeout: 3000,
      cache: false
    });
    imageDownloader.open('GET',url);
    //imageDownloader.setFile(path+this.getFileFromPath(url));
    imageDownloader.send();

    return deferred.promise();
  },

  /**
  * @method downloadFile
  * Download a file from an URL directly into a file, return a deferred
  * @param {String} url
  * @param {String} path The local path where to store file
  * @deferred
  */
  downloadFile: function(url,path) {

    return this.downloadPhotos(url,path);

  },


  /**
  * @method getFile
  * Get a plain text file from a path, null if doesn't exist
  * @return {String}
  */
  getFile: function(path) {

    //logger.info('getJSON@content -> '+path);

    var file = Ti.Filesystem.getFile(path);
    var blob = null;
    var result = null;

    if (file.exists()) {
      blob = file.read();
      result = blob.text;
    }

    blob = null;
    file = null;

    return result;
  },

  /**
  * @method setContentNode
  * Set a node object for a content class name
  * @param {String} className
  * @param {presto.Node} node
  * @chainable
  */
  setContentNode: function(className,node) {

    this._content[className] = node;

    return this;
  },

  /**
  * @method getContentNode
  * Get the node object for a content class name
  * @param {String} className
  * @return {presto.Node}
  */
  getContentNode: function(className) {

    return this._content[className];

  },

  /**
  * @method getLocalContentVersion
  * Get the version of the local copy of a content class, if doesn't exist it returns zero, which should pass the test to check
  * if a content should be downloaded
  * @param {String} className
  * return {Number}
  */
  getLocalContentVersion: function(className) {

    var versions = new Versions();
    versions.fetch({
      where: 'tag = ?',
      params: className
    });

    if (versions.length > 0) {
      return versions.at(0).get('version');
    } else {
      return 0;
    }

  },

  /**
  * @method isDownloaded
  * Tells if a content class was downloaded, if false then the content is the one delivered with the app
  * @param {String} className
  * @return {Boolean}
  */
  isDownloaded: function(className) {

    var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory+className);

    return file.exists() && file.isDirectory();

  },

  setLocalContentVersion: function(className,new_version) {

    var versions = new Versions();
    var version = null;
    versions.fetch({
      where: 'tag = ?',
      params: className
    });

    if (versions.length > 0) {
      version = versions.at(0);
      version.set('version',new_version);
      version.save();
    } else {
      version = new Version();
      version.set('version',new_version);
      version.set('tag',className);
      version.save();
    }

    return this;
  },


  /**
  * @method fetch
  * Fetch content from a content class name
  * @deferred
  */
  fetch: function(className,opts) {

    var that = this;
    var default_options = {
      version: null
    };
    var options = _.extend(default_options,opts);
    var deferred = jQ.Deferred();

    logger.info('LOADING CONTENT CLASS '+className);

    if (that._contentClassName[className]) {

      var contentClass = that._contentClassName[className];
      logger.info('-- '+JSON.stringify(contentClass));

      // check if the content class was previously downloaded but before the directory structure
      // is created, otherwise is useless
      var isDownloaded = that.isDownloaded(className);

      // create directory if not exist
      that.createContentPlugin(className);

      // create the object (clears everything with this class name)
      // deprecated
      var new_node = new Node();
      new_node.contentClassName = className;
      new_node.version = 1;
      new_node.ts = new Date();

      // download from online?
new_node.isLocal = false;
// ACS -> TiShadowClientCloud -> Development

      // store in the content manager
      that.setContentNode(className,new_node);

      // get from documents
      new_node.path = that.getDocumentsPath()+className+'/';

      // init the notify for the entire content class
      var notify = {
        className: className,
        currentStage: 0,
        numberOfStage: 0
      };

      // create a stack of execution
      var FetchStack = new Stackable();
      FetchStack.context(that);

      // accoda solo i tipi necessari

      // fetch posts
      if (contentClass.types.indexOf('posts') !== -1) {
        FetchStack.push(fetchPosts);
      }
      // fetch events
      if (contentClass.types.indexOf('events') !== -1) {
        FetchStack.push(fetchEvents);
      }
      // fetch objects
      if (contentClass.types.indexOf('objects') !== -1) {
        FetchStack.push(fetchObjects);
      }
      // fetch the files
      if (contentClass.types.indexOf('files') !== -1) {
        FetchStack.push(fetchFiles);
      }
      // lastly the photos
      if (contentClass.types.indexOf('photos') !== -1) {
        FetchStack.push(fetchPhotos);
      }


      // ignite the fecth stack with the content class descriptor
      if (FetchStack.length() !== 0) {
        notify.numberOfStage = FetchStack.length();
        notify.currentStage = 0;
        FetchStack.serial(contentClass,isDownloaded)
          .done(function() {
            if (options.version != null) {
              logger.info('Update content '+className+' -> '+options.version);
              that.setLocalContentVersion(className,options.version);
            }
            // reset message
            that.app.loader.message();
          })
          .always(function() {
            // store the node
            new_node.save();
            // in any case resolve and go on
            deferred.resolve();
          })
          .progress(function(obj) {
            //Ti.API.info('DEFERRED DEL SINGOLO FETCH -- '+JSON.stringify(obj))
            notify.currentStage =+ 1;
            notify.currentDownload = obj.current;
            notify.numberOfDownloads = obj.steps;
            deferred.notify(notify);
          });
      } else {
        logger.info('Nothing to fetch');
        deferred.resolve();
      }

    } else {
      // if nothing, then ends
      deferred.resolve();
    }

    return deferred.promise();
  },

  purge: function(classname) {

  }



});

module.exports = Content;

