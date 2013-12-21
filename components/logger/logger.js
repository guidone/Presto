/**
 * Handles logs
 */

// --- EXTERNAL LIBS ---

var _ = require("components/underscore/underscore");
var Class = require("components/inheritance/inheritance").Class;

// --- PRIVATE ATTRIBUTES/FUNCTIONS ---

var TAG = "logger";
var KEYS = {
    LEVEL : "level",
    TARGET : "target",
    APPEND_TIME_STAMP : "appendTimeStamp",
    TAG : "tag",
    IGNORE_FUNCTIONS : "ignoreFunctions",
    SEPARATION_LINES: "separationLines"
};
var DEFAULTS = {
    level : "debug",
    target : "console",
    appendTimeStamp : true,
    tag : "",
    ignoreFunctions : false,
    separationLines: 0
};

var LEVELS = {
    ERROR : "error",
    WARN : "warn",
    INFO : "info",
    DEBUG : "debug"
};
var LEVEL_POINTS = {
    error: 3,
    warn: 2,
    info: 1,
    debug: 0
};
var TARGETS = {
    CONSOLE : "console",
    FILE : "file",
    SQLITE : "sqlite"
};

// --- CLASS IMPLEMENTATION ---

/**
 * @class components.Logger
 * This library offers the app a centralized loggin system
 */
var Logger = Class.extend({
    
    // --- ATTRIBUTES ---
    
    /*
    _attributesMap : {
        level : DEFAULTS.level,
        target : DEFAULTS.target,
        appendTimeStamp : DEFAULTS.appendTimeStamp,
        tag : DEFAULTS.tag,
        ignoreFunctions : DEFAULTS.ignoreFunctions
    },
    */
    
    // --- INIT ---
    
    init : function(params) {
        var that = this;
        this._attributesMap = {
            level : DEFAULTS.level,
            target : DEFAULTS.target,
            appendTimeStamp : DEFAULTS.appendTimeStamp,
            tag : DEFAULTS.tag,
            ignoreFunctions : DEFAULTS.ignoreFunctions,
            separationLines: DEFAULTS.separationLines
        };
        params = params || {};
        _.each(params, function(value, key) {
            that.set(key, value);
        });
    },
    
    get : function(key) {
        return this._attributesMap[key];
    },
    
    set : function(key, value) {
        this._attributesMap[key] = this.validate(key, value) ? value : DEFAULTS[key]; 
    },
    
    // --- METHODS ---
    
    validate : function(key, value) {
        switch (key) {
            case KEYS.LEVELS:
                return _.contains(LEVELS, value);
            case KEYS.TARGET:
                return _.contains(TARGETS, value);
            case KEYS.APPEND_TIME_STAMP:
            case KEYS.TAG:
                return (typeof value == "string");
            case KEYS.IGNORE_FUNCTIONS:
                return (typeof value == "boolean");
            case KEYS.SEPARATION_LINES:
                return ((typeof value == "number") && (Math.floor(value) == value) && (value >= 0));
            default:
                return true;
        }
    },

    /**
     * @method log
     * Logs a message to the selected target (e.g.: "console") with the specified level (e.g.: "warn")
     * @param {String} msg (mandatory) The message to log
     * @param {Object} options (optional) A dictionary with the following params: level, target, appendTimeStamp (e.g.: {level: "info", target: "console", aooendTimeStamp: true})
     */
    log : function(msg, options) {
        var LOG_TAG = TAG + "/log";
        options = options || {};
        msg = msg || "";

        /*
        var validation_results = {
            level : this.validate(KEYS.LEVEL, options.level),
            target : this.validate(KEYS.TARGET, options.target),
            appendTimeStamp : this.validate(KEYS.APPEND_TIME_STAMP, options.appendTimeStamp),
            tag : this.validate(KEYS.TAG, options.tag),
            ignoreFunctions : this.validate(KEYS.IGNORE_FUNCTIONS, options.ignoreFunctions)
        };

        var currentAttributes = {
            level : this.get(KEYS.LEVEL),
            target : this.get(KEYS.TARGET),
            appendTimeStamp : this.get(KEYS.APPEND_TIME_STAMP),
            tag : this.get(KEYS.TAG),
            ignoreFunctions : this.get(KEYS.IGNORE_FUNCTIONS)
        };
        */
        
        options.level = this.validate(KEYS.LEVEL, options.level) ? options.level : this.get(KEYS.LEVEL);
        options.target = this.validate(KEYS.TARGET, options.target) ? options.target : this.get(KEYS.TARGET);
        options.appendTimeStamp = this.validate(KEYS.APPEND_TIME_STAMP, options.appendTimeStamp) ? options.appendTimeStamp : this.get(KEYS.APPEND_TIME_STAMP);
        options.tag = this.validate(KEYS.TAG, options.tag) ? options.tag : this.get(KEYS.TAG);
        options.ignoreFunctions = this.validate(KEYS.IGNORE_FUNCTIONS, options.ignoreFunctions) ? options.ignoreFunctions : this.get(KEYS.IGNORE_FUNCTIONS);
        options.separationLines = this.validate(KEYS.SEPARATION_LINES, options.separationLines) ? options.separationLines : this.get(KEYS.SEPARATION_LINES);
        
        if (LEVEL_POINTS[options.level] < LEVEL_POINTS[this.get("level")]) return;

        /*
        if (!this.validate(KEYS.LEVEL, options.level)) {
            options.level = this.get(KEYS.LEVEL);
        }
        if (!this.validate(KEYS.TARGET, options.target)) {
            options.target = this.get(KEYS.TARGET);
        }
        if (!this.validate(KEYS.APPEND_TIME_STAMP, options.appendTimeStamp)) {
            options.appendTimeStamp = this.get(KEYS.APPEND_TIME_STAMP);
        }
        if (!this.validate(KEYS.TAG, options.tag)) {
            options.tag = this.get(KEYS.TAG);
        }
        if (!this.validate(KEYS.TAG, options.tag)) {
            options.ignoreFunctions = this.get(KEYS.IGNORE_FUNCTIONS);
        }
        */
        
        if (_.isArray(msg)) {
            var msgStr = "";
            _.each(msg, function(elem) {
                if (!options.ignoreFunctions && _.isFunction(elem)) {
                    msgStr += elem;
                } else if(_.isObject(elem)) {
                    try {
                        msgStr += JSON.stringify(elem);
                    } catch (exc) {
                        Ti.API.error("components.Logger: " + exc);
                        return " <" + exc + "> ";
                    }
                } else {
                    msgStr += elem;
                }
            });
            msg = msgStr;
        }
        if (options.tag) {
            msg = options.tag + " " + msg;
        }
        if (options.appendTimeStamp) {
            msg = (new Date()) + " " + msg;
        }
        if (options.separationLines) {
            for (var i=0; i<options.separationLines; i++) {
                msg += "\n";
            }
        }
        switch(options.target) {
            case TARGETS.CONSOLE:
                Ti.API[options.level](msg);
                break;
            case TARGETS.FILE:
                Ti.API.warn("components.Logger: Log to file not implemented yet!");
                break;
            case TARGETS.SQLITE:
                Ti.API.warn("components.Logger: Log to sqlite not implemented yet!");
                break;
        }
    },
    error : function(msg, options) {
        options = (_.isObject(options) && !_.isEmpty(options)) || {};
        _.omit(options, "level");
        _.extend(options, {
            level : LEVELS.ERROR
        });
        this.log(msg, options);
        /*
        this.log(msg, {
            level : LEVELS.ERROR
        });
        */
    },
    warn : function(msg, options) {
        options = (_.isObject(options) && !_.isEmpty(options)) || {};
        _.omit(options, "level");
        _.extend(options, {
            level : LEVELS.WARN
        });
        this.log(msg, options);
        /*
        this.log(msg, {
            level : LEVELS.WARN
        });
        */
    },
    info : function(msg, options) {
        options = (_.isObject(options) && !_.isEmpty(options)) || {};
        _.omit(options, "level");
        _.extend(options, {
            level : LEVELS.INFO
        });
        this.log(msg, options);
        /*
        this.log(msg, {
            level : LEVELS.INFO
        });
        */
    },
    debug : function(msg, options) {
        options = (_.isObject(options) && !_.isEmpty(options)) || {};
        _.omit(options, "level");
        _.extend(options, {
            level : LEVELS.DEBUG
        });
        this.log(msg, options);
        /*
        this.log(msg, {
            level : LEVELS.DEBUG
        });
        */
    },
    toJSON : function() {
        return {
            level : this.getLevel(),
            target : this.getTarget(),
            appendTimeStamp : this.getAppendTimeStamp()
        };
    }
});

// Static attributes/methods

Logger.LEVELS = LEVELS;
Logger.TARGETS = TARGETS;
Logger.KEYS = KEYS;

module.exports = Logger;