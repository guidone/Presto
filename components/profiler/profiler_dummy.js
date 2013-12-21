var begTime = new Date().getTime();
var _ = require('/presto/components/underscore/underscore');
var _labels = {};



/**
* @class components.profiler
* Generica classe singleton per tracciare i tempi di esecuzione
*/
module.exports = {

	chrono: function() {
		// do nothing
	},

	/**
	* @method start
	* Inizializza il profiler e resetta tutti i tempi
	*/
	start: function() {
		// do nothing
	},

	/**
	* @method trace
	* Traccia il tempo rispetto al marker precedente in millisecondi
	* @param {String} label
	*/
	trace:function(label) {
		// do nothing
	},


	/**
	* @method end
	* Termina il tracciamento e riepiloga tutte le label
	*/
	end: function() {
		// do nothing
	},

	/**
	* @method total
	* Restituisce il totale del tempo di esecuzione
	* @return {Number}
	*/
	total: function() {
		// do nothing
	},

	logs: function() {
		// do nothing
	}

};