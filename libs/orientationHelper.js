/**
 * @name orientationHelper.js
 * @description Used to know current device orientation
 * @verison 1.0.0
 * 
 */

function computeOrientation() {
	var screenWidth = Titanium.Platform.displayCaps.platformWidth;
	var screenHeight = Titanium.Platform.displayCaps.platformHeight;

	if(screenWidth > screenHeight) {
		return {
			type : 'landscape',
			constant : Titanium.UI.LANDSCAPE_LEFT
		};
	} else {
		return {
			type : 'portrait',
			constant : Titanium.UI.PORTRAIT
		};
	}

};

exports.getOrientation =  function (previousOrientation) {
	
	var _utilsLogEnabled = false;
	
	var actualOrientation = Titanium.Gesture.orientation;
	if(previousOrientation === undefined || previousOrientation === null) {
		var previousOrientation = {
			type : 'unknown',
			constant : Titanium.UI.UNKNOWN
		};
	}
		var newOrientation = {
			type : previousOrientation['type'],
			constant : previousOrientation['constant']
		};
	
	if(previousOrientation['constant'] !== actualOrientation || (actualOrientation == Titanium.UI.UNKNOWN)) {

		switch (actualOrientation) {
			case Titanium.UI.PORTRAIT:
				 if(_utilsLogEnabled)
						Log.debug('Titanium.gesture.orientation: PORTRAIT');
				
				newOrientation['type'] = 'portrait';
				newOrientation['constant'] = Titanium.UI.PORTRAIT;
				break;
			case Titanium.UI.UPSIDE_PORTRAIT:
				
				 if(_utilsLogEnabled)
					Log.debug('Titanium.gesture.orientation: UPSIDE PORTRAIT');
				
				newOrientation['type'] = 'portrait';
				newOrientation['constant'] = Titanium.UI.UPSIDE_PORTRAIT;
				break;
			case Titanium.UI.LANDSCAPE_LEFT:
				 if(_utilsLogEnabled)
					Log.debug('Titanium.gesture.orientation: LANDSCAPE LEFT');
				
				newOrientation['type'] = 'landscape';
				newOrientation['constant'] = Titanium.UI.LANDSCAPE_LEFT;
				break;
			case Titanium.UI.LANDSCAPE_RIGHT:
				 if(_utilsLogEnabled)
					Log.debug('Titanium.gesture.orientation: LANDSCAPE RIGHT');
				
				newOrientation['type'] = 'landscape';
				newOrientation['constant'] = Titanium.UI.LANDSCAPE_RIGHT;
				break;
			case Titanium.UI.FACE_UP:
				 if(_utilsLogEnabled)
					Log.debug('Titanium.gesture.orientation: FACE UP');
				
				// solo se la precedente non e' definita imnposto il nuovo orientamento ad unknown
				if(previousOrientation['constant'] == Titanium.UI.UNKNOWN) {
					 if(_utilsLogEnabled)
						Log.debug('previous orientation = unknown chiamo checkscreen');
					
					newOrientation = computeOrientation()
				}
				// altrimenti setto come nuovo orientamento quello precedente
				else {
					newOrientation = previousOrientation;
				}
				break;
			case Titanium.UI.FACE_DOWN:
				 if(_utilsLogEnabled)
					Log.debug('Titanium.gesture.orientation: FACE DOWN');
				
				// solo se la precedente non e' definita imnposto il nuovo orientamento ad unknown
				if(previousOrientation['constant'] == Titanium.UI.UNKNOWN) {
					 if(_utilsLogEnabled)
						Log.debug('previous orientation = unknown chiamo checkscreen');
					
					newOrientation = computeOrientation()
				}
				// altrimenti setto come nuovo orientamento quello precedente
				else {
					newOrientation = previousOrientation;
				}
				break;
			case Titanium.UI.UNKNOWN:
				 if(_utilsLogEnabled)
					Log.debug('Titanium.gesture.orientation: UNKNOWN');
				
				// solo se la precedente non e' definita imnposto il nuovo orientamento ad unknown
				if(previousOrientation['constant'] == Titanium.UI.UNKNOWN) {
					 if(_utilsLogEnabled)
						Log.debug('previous orientation = unknown chiamo checkscreen');
					
					newOrientation = computeOrientation()
				}
				// altrimenti setto come nuovo orientamento quello precedente
				else {
					newOrientation = previousOrientation;
				}
				break;
			default:
				newOrientation = previousOrientation;
		}	// fine switch
	}// fine if previous != actual
	return newOrientation;
};