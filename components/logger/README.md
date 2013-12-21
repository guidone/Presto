# logger

A centralized logger manager


# How to use it

var Logger = require("components/logger/logger");
var log = new Logger({
	level : Logger.LEVELS.INFO,
	target : Logger.TARGETS.CONSOLE,
	appendTimeStamp : true,
	tag : "EXAMPLE_TAG",
	ignoreFunctions : false,
	separationLines: 2
});

log.error("This will be logged with a time stamp and tag prefix, with error level, to the console and with two separation lines at the end");
log.warn("This will be logged with a time stamp and tag prefix, with warn level, to the console and with two separation lines at the end");
log.info("This will be logged with a time stamp and tag prefix, with info level, to the console and with two separation lines at the end");
log.debug("This will be logged with a time stamp and tag prefix, with debug level, to the console and with two separation lines at the end");

log.log("This will be logged with a time stamp and tag prefix, with info level, to the console and with two separation lines at the end");

log.set("level", "error");
log.log("This will be logged with a time stamp and tag prefix, with error level, to the console and with two separation lines at the end");

log.set("appendTimeStamp", false);
log.log("This will be logged without a time stamp but with a tag prefix, with error level, to the console and with two separation lines at the end");

log.set("tag", "");
log.log("This will be logged without a time stamp neither a tag prefix, with error level, to the console and with two separation lines at the end");

log.log("This will be logged with a time stamp and tag prefix, with warn level, to the console and with two separation lines at the end", {
    level : l.LEVELS.WARN,
    appendTimeStamp : true
});

log.set("separationLines", 0);
log.log("This will be logged without a time stamp neither a tag prefix, with error level, to the console and without any supplementar separation line at the end");

log.info(["String=", "str", "and number=", 3, "and obj=", {key: "value"}, "and array=", ["this", {is : "an array"}]]);

function callback() {
	alert("I'm a callback");
}
log.info(callback);


# How to customize it

You can customize the following options:

* level
* target
* appendTimeStamp
* tag
* ignoreFunctions
* separationLines

'level' specifies the log level. Allowed values: "error", "warn", "info", "debug". These values are listed on l.LEVELS map
'target' specifies the log target. Allowed values: "console", "file", "sqlite". These values are listed on l.TARGETS map (currently only "console" is supported)
'appendTimeStamp' specifies if to append the current time stamp as a prefix or not
'tag' is an optional prefix to append to the msg
'ignoreFunctions' is a boolean, if true functions will not get printed, if false (default) they'll be printed in logs
'separationLines' is a number and specifies the number of blank separation lines will be prompted at the end of the message

To customize these options the component exposes a setter for each of them:

log.set("level", "warn");
log.set("target", "console");
log.set("appendTimeStamp", true);
log.set("tag", "EXAMPLE_TAG");
log.set("ignoreFunctions", true);
log.set("separationLines", 2);

The defaults options are: level = "info", target = "console", appendTimeStamp = true, tag = "", ignoreFunctions = false, separationLines = 0

If you want different settings for a single log, you can pass them as a map to the method "log" as a second parameter:

log.log("This will be logged with a time stamp prefix, with warn level and to the console", {
    level : l.LEVELS.WARN,
    target : l.TARGETS.CONSOLE,
    appendTimeStamp : true,
    tag : "EXAMPLE_TAG",
    ignoreFunctions : true,
    separationLines: 1
});

Instead of a string, you can pass an array: the elements inside of it will be concatenated into a single msg, e.g.:

log.info(["String= ", " str ", " and number= ", 3, " and obj= ", {key: "value"}, " and array= ", ["this", {is : "an array"}], " and function= ", function(e) {alert(e);}]);

// [console] -- "String= str and number= 3 and obj= {key: value} and array= [this, {is : an array}] and function= function(e) {alert(e);}"

Note that the objects will be automatically stringified. If the object is a cyclic structure, it will be prompted an error message instead of it.


There are four convenient methods to log directly with a selected log level:

- error
- warn
- info
- debug

E.g.:

log.error("This will be logged with error level");
log.warn("This will be logged with warn level");
log.info("This will be logged with info level");
log.debug("This will be logged with debug level");

You can pass options to each of the four above convenient method:

	log.debug("This will be logged with a time stamp and tag prefix, with debug level and with two separation lines at the end", {
		appendTimeStamp: true,
		tag: "EXAMPLE_TAG",
		separationLines: 2
	});


# CHANGELOG

v0.0.6 - Don't log if level is less than current level; added separationLines
v0.0.5 - No more exceptions for JSON.stringify cyclic structures
v0.0.4 - Ignore/print functions
v0.0.3 - msg can be an array intead of a string, added tag 
v0.0.2 - Added error, warn, info and debug methods to log directly with a selected log level