var begTime = new Date().getTime();
var _ = require('/presto/components/underscore/underscore');
var _labels = {};



/**
* @class components.profiler
* Generica classe singleton per tracciare i tempi di esecuzione
*/
var Profiler = {

	chrono: function(f,label) {

		var startTime = new Date().getTime();
		label = label != null ? label : 'n.d.';

		var result = f();

		var endTime = new Date().getTime();
		var duration = (endTime - begTime);

		Ti.API.info('chrono for '+label+' -> '+label+' '+duration.toFixed(0) + ' ms');

		return result;
	},

	/**
	* @method start
	* Inizializza il profiler e resetta tutti i tempi
	*/
	start: function() {
		begTime = new Date().getTime();
		_labels = {};
	},

	/**
	* @method trace
	* Traccia il tempo rispetto al marker precedente in millisecondi
	* @param {String} label
	*/
	trace:function(label) {
		label = label || '';
		var endTime = new Date().getTime();
		var duration = (endTime - begTime);
		begTime = endTime;
		Ti.API.info('trace -> '+label+' '+duration.toFixed(0) + ' ms');

		if (_labels[label] == null) {
			_labels[label] = 0;
		}
		_labels[label] += duration;

	},


	/**
	* @method end
	* Termina il tracciamento e riepiloga tutte le label
	*/
	end: function() {

		var total = this.total();

		_(_labels).each(function(value,key) {
			var perc = (value/total)*100;
			Ti.API.info('[TRACER] '+key+' '+perc.toFixed(1)+'% ('+value.toFixed(0)+'ms)');
		})
		Ti.API.info('[TRACER] total: '+total.toFixed(0)+' ms');

	},

	/**
	* @method total
	* Restituisce il totale del tempo di esecuzione
	* @return {Number}
	*/
	total: function() {

		var total = 0;

		_(_labels).each(function(value,key) {
			total += value;
		});

		return total;
	},

	logs: function() {
		return _labels;
	}

};

module.exports = Profiler;