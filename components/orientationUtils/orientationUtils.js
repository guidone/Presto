/**
 * orientationUtils
 *
 * Orientation constants reference:
 *
 * Ti.UI.PORTRAIT = 1
 * Ti.UI.UPSIDE_PORTRAIT = 2
 * Ti.UI.LANDSCAPE_LEFT = 4
 * Ti.UI.LANDSCAPE_RIGHT = 3
 * Ti.UI.FACE_DOWN = 6
 * Ti.UI.FACE_UP = 5
 * Ti.UI.UNKNOWN = 0
 */

// ---------- EXTERNAL DEPENDENCIES ----------

var Class = require("/presto/components/inheritance/inheritance").Class;
var _ = require("/presto/components/underscore/underscore");
var Logger = require("/presto/components/logger/logger");

// ---------- PRIVATE DATA ----------

var log = new Logger({
    tag : "presto/components/orientationUtils"
});
var instance = null;

// ---------- CLASS ----------

var orientationUtils = Class.extend({

    _currentOrientation : null,
    _currentListener : null,

    init : function() {
        this._currentOrientation = this.getOrientation();
        this._currentListener = null;
        Ti.Gesture.addEventListener("orientationchange", _.bind(this.orientationChange, this));
        log.debug("orientationchange listener added");
    },

    /**
     * @return {String} "portrait" or "landscape", based on DEVICE orientation
     */
    computeOrientation : function() {
        return (Ti.Platform.displayCaps.platformHeight > Ti.Platform.displayCaps.platformWidth) ? "portrait" : "landscape";
    },

    /**
     * @return {String} "portrait" or "landscape", based on DEVICE orientation
     */
    getOrientation : function() {
        return this.getOrientationForConstant(Ti.Gesture.orientation);
    },

    /**
     * @param {int} constant One of: Titanium.UI.PORTRAIT, Titanium.UI.UPSIDE_PORTRAIT, Titanium.UI.LANDSCAPE_LEFT, Titanium.UI.LANDSCAPE_RIGHT, Titanium.UI.FACE_UP, Titanium.UI.FACE_DOWN, Titanium.UI.UNKNOWN
     */
    getOrientationForConstant : function(constant) {
        switch (constant) {
            case Ti.UI.PORTRAIT:
            case Ti.UI.UPSIDE_PORTRAIT:
                return "portrait";
            case Ti.UI.LANDSCAPE_LEFT:
            case Ti.UI.LANDSCAPE_RIGHT:
                return "landscape";
            case Ti.UI.FACE_UP:
            case Ti.UI.FACE_DOWN:
            case Ti.UI.UNKNOWN:
            default:
                return this.computeOrientation();
        }
    },

    isPortrait : function() {
        return (this.getOrientation() == "portrait");
    },

    isLandscape : function() {
        return (this.getOrientation() == "landscape");
    },

    /**
     * @param {String} orientation (optional) Can be "portrait" or "landscape". If empty will be returned all possible orientations
     * @return {Array} A list constants, representing orientation modes. Possible values: Titanium.UI.PORTRAIT, Titanium.UI.UPSIDE_PORTRAIT, Titanium.UI.LANDSCAPE_LEFT, Titanium.UI.LANDSCAPE_RIGHT
     */
    getOrientationModes : function(orientation) {
        if (!orientation) {
            return [Titanium.UI.PORTRAIT, Titanium.UI.UPSIDE_PORTRAIT, Titanium.UI.LANDSCAPE_LEFT, Titanium.UI.LANDSCAPE_RIGHT];
        } else if (orientation == "portrait") {
            return [Titanium.UI.PORTRAIT, Titanium.UI.UPSIDE_PORTRAIT];
        } else if (orientation == "landscape") {
            return [Titanium.UI.LANDSCAPE_LEFT, Titanium.UI.LANDSCAPE_RIGHT];
        } else {
            return [];
        }
    },

    /**
     * @param {Function} listener The new orientation change callback
     * @throws {Error} if listener is not a function
     */
    setOrientationListener : function(listener) {
        if (!_.isFunction(listener)) {
            throw "listener is not a function";
        }
        this._currentListener = listener;
    },

    orientationChange : function(e) {
        var orientation = this.getOrientationForConstant(e.orientation);
        if (this._currentListener) {
            if (orientation != this._currentOrientation) {
                this._currentListener(orientation);
            }
        }
        this._currentOrientation = orientation;
    }
});

// singleton pattern
module.exports = (function(params) {
    if (instance === null) {
        instance = new orientationUtils();
    }
    return instance;
})();