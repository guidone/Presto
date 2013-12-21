# orientationUtils

This lib helps on stuff related with device orientation

# Example use

var orientationUtils = require("components/orientationUtils/orientationUtils");
var currentOrientation = orientationUtils.getOrientation();

var win = Ti.UI.createWindow({
    orientationModes : orientationUtils.getOrientationModes(currentOrientation),
    backgroundColor : orientationUtils.isPortrait() ? "red" : "blue"
});
var fadeAnimation = Ti.UI.createAnimation({
    backgroundColor : orientationUtils.isLandscape() ? "red" : "blue",
    duration : 1000
});
fadeAnimation.addEventListener("complete", function() {
    win.orientationModes = orientationUtils.getOrientationModes()
});
var view = Ti.UI.createView({
    width : 400,
    height : 400
});
win.add(view);

view.animate(fadeAnimation);

function changeOrientation(orientation) {
    win.backgroundColor = (orientation == "portrait") ? "red" : "blue";
    view.backgroundColor = (orientation == "landscape") ? "red" : "blue";
}
orientationUtils.setOrientationListener(changeOrientation);

win.open();

# API

--- Instance Methods ---

- getOrientation()
- isPortrait()
- isLandscape()
- setOrientationListener(listener)
- getOrientationModes(orientation)

'getOrientation' Gets the current device orientation ("portrait" or "landscape")
'isPortrait' Returns true if device is in portrait orientation
'isLandscape' Returns true if device is in landscape orientation
'setOrientationListener' Set the listener (a callback function) to execute on orientation change. The listener is called back passing the current orientation ("portrait" or "landscape")
'getOrientationModes' Gets the available orientation modes (Titanium.UI.PORTRAIT, Titanium.UI.UPSIDE_PORTRAIT, Titanium.UI.LANDSCAPE_LEFT, Titanium.UI.LANDSCAPE_RIGHT), given an orientation ("portrait" or "landscape")

# CHANGELOG

v0.0.3 - orientationChange fix
v0.0.2 - Added getOrientationModes
v0.0.1 - Methods list: getOrientation, isPortrait, isLandscape, setOrientationListener