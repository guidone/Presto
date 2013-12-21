/**
* @class Stackable 
* Create a stack of executable functions/deferred object and combine them in a uniqe deferred
* object that can be used to parallelize, serialize (and more) the operations
* 
* Common usage to build a stack:
* 	// Create a stack with n functions and a context
* 	stack = $funtion(<func1>,<func2>,..,context); 
*  
* 	// create a stack with just one function
* 	stack = $function(<func1>);
*
* 	// returns itself, like $, then it's possible to chain
* 	stack = $function(stack);
* 
* 	// append a function to a stack or an existing callback function. Nothing will change
* 	if the caller uses apply/call for the callback
* 	$function(options.callback).push(<func>);
*
* 	// append/prepend a function to the stack, function can be indifferently synchronous
* 	// function or asynchronous function (a generator for Deferred/Promise object)
* 	stack.push(function() {
* 		// do something
* 		}) 
* 	 
* And this is how to use the stack
* 	stack.serial()
* 		.done(function(res1,res2,...,resN) {
* 			// do something
* 			});
* There are other way of running our stack, for example
*
* - **.parallel()** to run the functions in parallel and wait for completion
*
* - **.first()** to run all the functions in parallel and resolve/fail as soon as the first of them does
*
* - **.filter()** to run the function sequentially and pass the result of each to the next function in the stack, acting like a filter
*
* - **.call(context,params)** works like the standard .call() for JavaScript functions
*
* - **.apply(context,[param1,param2,...,paramN])** works like the standard .apply() for JavaScript functions
* 
* An example of function of the stack
* 
* function(param1,param2,..,paramN,execution) {
* 	
* 	$(this); // I'm the context
* 	
* 	return something;
* 	
* 	}
* 
* Each function of the stack receives the same number of arguments used in .cascade(), .filter(),
* .synch(), .apply() and .call() plus one: a stack object which allows the following operation
* 
* 
* execution.index() - return the index of the function in the stack
* execution.end() - stops the execution of the stack at the end of the current function 
* execution.get(key) - get a value for a key in the hash of the stack (for example set from a previous
* 	function of the stack). Cleared at each execution
* execution.set(key,value) - set a key/value pair in the hash of the stack
* @author Guido Bellomo <guido.bellomo@gmail.com>
* @constructor
* Create a new stackable object
* @param {Function} [functions] List of functions and/or generators for deferred object
* @param {Object} [context] The context used by the functions/deferred objects 
*/

var _ = require('/presto/libs/underscore');
var Stackable = null;

(function($) {

Stackable = function(context,synch) {
	
	var idx = 0;
	var _context = context;
	var _stackedFunctions = [];
	var _callback = null;
	var _failback = null;
	var _mode = 'cascade';
	var _allowedMode = [
		'cascade',
		'filter',
		'serial',
		'parallel',
		'first',
		'until'
		];
	var _vars = {};
	var _asynchIdx = 0;
	var _results = [];
	var _results_failed = [];
	var _results_completed = [];
	var _stack = {
		
		index: function() {
			return idx;
			},
		end: function() {
			idx = _stackedFunctions.length;
			},
		get: function(key) {
			return _vars[key];
			},
		set: function(key,value) {
			_vars[key] = value;
			}
		};
	
	function _copyArguments(args) {		
		var idx = 0;
		var result = [];
		for (idx = 0; idx < args.length; ++idx)
			result.push(args[idx]);
		return result;		
		}

	function isFunction(o) {
		return typeof(o) == 'function' && (!Function.prototype.call ||
		typeof(o.call) == 'function');
		}

	function _isPromise(obj) {
		return obj != null && obj.promise != null && isFunction(obj.promise);		
		}
	
	function _isFailed() {
		var i = 0;
		for(i = 0; i < _results_failed.length; i++) {
			if (_results_failed[i]) return true;
			}
		return false;
		}

	function _isCompleted() {
		var i = 0;
		for(i = 0; i < _results_completed.length; i++) {
			if (!_results_completed[i]) return false;
			}
		return true;
		}
	
	function _clearResults() {
		var i = 0;
		for(i = 0; i < _stackedFunctions.length; i++) {
			_results[i] = undefined; // not null
			_results_failed[i] = false;
			_results_completed[i] = false;
			}
		}	

	function _igniteSynchro(idx,args,result,notify) {	

		var tmp_result = null;
		
		// if end of stack, then return and/or callback
		if (idx >= _stackedFunctions.length) {
			// end, callback if any
			if ($.isFunction(_callback))
				_callback.call(_context,result);			
			// exits
			return result;
			}

		tmp_result = _stackedFunctions[idx].apply(_context,args);

		if (_isPromise(tmp_result)) {
			$.when(tmp_result)
				.done(function(result) {
					_results[idx] = result;
					// trigger next
					_igniteSynchro(idx+1,args,result,notify);	
					})
				.fail(function(result) {
					_results[idx] = result;
					_results_failed[idx] = true;
					// trigger next
					_igniteSynchro(idx+1,args,result,notify);
					})
				.progress(function(obj) {
					if (_.isFunction(notify)) {
						notify(obj);
					}
				})

			}
		else {
			// skip to next			
			_results[idx] = tmp_result;
			_igniteSynchro(idx+1,args,tmp_result,notify);
			}
			
		}

	function _igniteUntil(idx,args,result) {	

		var tmp_result = null;
		
		// if end of stack, then return and/or callback
		if (idx >= _stackedFunctions.length) {
			// end, callback if any
			if ($.isFunction(_callback))
				_callback.call(_context,result);			
			// exits
			return result;
		}

		tmp_result = _stackedFunctions[idx].apply(_context,args);

		if (_isPromise(tmp_result)) {
			$.when(tmp_result)
				.done(function(result) {
					_results[idx] = result;
					// trigger next
					_igniteUntil(idx+1,args,result);	
				})
				.fail(function(result) {
					_results[idx] = result;
					_results_failed[idx] = true;
					// trigger next
					if ($.isFunction(_failback))
						_failback.call(_context,result);
				});
				
		} else {
			// skip to next			
			_results[idx] = tmp_result;
			_igniteUntil(idx+1,args,tmp_result);
		}
			
	}


	function _igniteFunnel(idx,arg,result) {	

		var tmp_result = null;

		// if end of stack, then return and/or callback
		if (idx >= _stackedFunctions.length) {
			// end, callback if any
			if ($.isFunction(_callback))
				_callback.call(_context,result);			
			// exits
			return result;
			}

		// execute the function in the stack
		tmp_result = _stackedFunctions[idx].call(_context,arg);

		if (_isPromise(tmp_result)) {
			$.when(tmp_result)
				.done(function(result) {
					// set not failed
					_results_failed[idx] = false;
					// recursively call
					_igniteFunnel(idx+1,result,result);	
					})
				.fail(function(error) {
					// set failed
					_results_failed[idx] = true;
					// ok skip to the end
					// recursively call
					_igniteFunnel(_stackedFunctions.length+2,error,error);
					});
					
			// return null since the functions ends here
			return null;		
			}
		else {
			// skip to next			
			_results_failed[idx] = false;
			// recursively call
			_igniteFunnel(idx+1,tmp_result,tmp_result);
			
			return null;
			}
			
		}

	function _recursivePush(items) {
		var k = 0;
		for(k = 0; k < items.length;++k)
			if (isFunction(items[k]))
				_stackedFunctions.push(items[k]);
			else if ($.isArray(items[k]))
				_recursivePush(items[k]);
		
		}

	// init
	if (arguments.length > 0 && typeof arguments[0] == 'object' && isFunction(arguments[0].stckbl_test)) {
		// it's me, return myself
		return arguments[0];
		}
	else {
		_recursivePush(arguments);
		var last = arguments.length-1;
		/*
		var k = 0;
		for(k = 0; k < arguments.length;++k)
			if (isFunction(arguments[k]))
				_stackedFunctions.push(arguments[k]);
			else _context = _context != null ? arguments[k] : _context;
		*/
			
		_context = !isFunction(arguments[last]) ? arguments[last] : _context;
		}	
	
	return {
		
		/**
		* @method dump
		* Dump the status of the stack object
		* @return {Object} The dump object
		* @return {Array} return.stack The array of the stacked functions
		* @return {Object} return.context The context of the stack
		*/
		dump: function() {
			return {
				stack: _stackedFunctions,
				context: _context
				};
			},

		/**
		* @method push
		* Append a function or a deferred object to the stack
		* @param {Function} function function to add
		*/
		push: function(func) {
			_stackedFunctions.push(func);
			return this;		
			},
		
		/**
		* @method mode
		* Set the operational mode of the function stack
		*
		* - **serial**: functions will be executed sequentially in the same order they were pushed into the stack
		*
		* - **parallel**: functions will be executed at the same time, will resolve/fail when the last one is completed 
		* (if just one fail, then the whole stackable object will fail)
		*
		* - **first**: will resolve/fail as soon as the first function of the stack will resolve or fail, every function of
		* the stack will be executed at the same time
		*
		* - **filter**: filter mode, the result of a function is passed as argument to the next function, will resolve/fail
		* as soon as the last function will resolve/fail		
		* @param {String} mode The operational mode, could be: serial,parallel,first,filter
		*/ 
		mode: function(mode) {			
			if ($.inArray(mode,_allowedMode) != -1)
				_mode = mode;
			return this;
			},
		
		/**
		* @method callback
		* Set the callback for asynchronous stack
		* @param {Function} function the callback, the context is defined by the Stackable#context
		*/
		callback: function(callback) {
			if ($.isFunction(callback))
				_callback = callback;
			return this;
		},
		
		failback: function(failback) {
			if ($.isFunction(failback)) {
				_failback = failback;
			}
			return this;			
		},
		
		/**
		* @method unshift
		* Remove and return the last element of the stack
		* @return {Function}
		*/
		unshift: function() {
			return _stackedFunctions.unshift();
			},
		
		/**
		* @method pop
		* Remove and return the first element of the stack
		* @return {Function}
		*/
		pop: function() {
			return _stackedFunctions.pop();
			},	
		
		/**
		* @method context
		* Get or set the context of the stack, it's the "this" inside the functions called during the execution 
		* @param {Object} object The object/class, if null it will return the current context
		*/
		context: function(obj) {
			_context = obj;
			return this;
			},
		
		/**
		* @method length
		* Return the number of elements in the stack
		* @return {Number}
		*/
		length: function() {
			return _stackedFunctions.length;
			},
			
		stckbl_test: function() { // just a test to verify a stackable object
			return 'stackableObject';
			},
		
		/**
		* @method serial
		* Executes in sequence the functions in the stack, arguments will be passed to each elements of the stack
		* @return {Mixed} The arguments is populated with the result of each function of the stack
		* @deferred
		*/	
		serial: function(args) {
			
			var deferred = $.Deferred();			
			var tmpArguments = _copyArguments(arguments);
			tmpArguments.push(_stack);
			// clear
			_clearResults();
			// set the callback
			this.callback(function(result) {
				// resolve the deferred object
				if (!_isFailed()) {
					deferred.resolveWith(_context,_results);	
				} else {
					deferred.rejectWith(_context,_results);
				} 								
			});			
			_asynchIdx = 0;
			_igniteSynchro(
				_asynchIdx,
				tmpArguments,
				null,
				function(obj) {
					deferred.notify(obj);	
			});			

			// return the promise
			return deferred.promise();
		},	

		/**
		* @method until
		* Executes in sequence the functions in the stack, arguments will be passed to each elements of the stack,
		* if fails as the first function in the stack fails
		* @return {Mixed} The arguments is populated with the result of each function of the stack
		* @deferred
		*/	
		until: function(args) {
			
			var deferred = $.Deferred();			
			var tmpArguments = _copyArguments(arguments);
			tmpArguments.push(_stack);
			// clear
			_clearResults();
			// set the callback
			this.callback(function(result) {
				// resolve the deferred object
				deferred.resolveWith(_context,_results);	
			});
			this.failback(function(result) {
				deferred.rejectWith(_context,[result]); // is an array
			});		
			_asynchIdx = 0;
			_igniteUntil(_asynchIdx,tmpArguments);			

			// return the promise
			return deferred.promise();
		},


		
		/** 
		* @method filter
		* Execute the stack of function in order with the promise pattern (asynchronous function)
		* each result is the argument of the next function, the last function returns results
		* to the callback. Since function can return a single value, a single argument is allowed in funnel mode
		* @param {Mixed} argument The single value argument
		* @return {Mixed} The arguments is populated with the result of each function of the stack
		* @deferred
		* @since 1.0
		*/
		filter: function(arg) {
			
			var deferred = $.Deferred();
			var tmpArguments = [arg,_stack];

			// clear
			_clearResults();

			this.callback(function(result) {
				// resolve the deferred object
				if (!_isFailed()) {
					deferred.resolveWith(_context,[result]); // here pass the last	
					}
				else {
					deferred.rejectWith(_context,[result]); // here pass the last
					} 								
				});	

			_asynchIdx = 0;
			_igniteFunnel(_asynchIdx,arg);
			
			return deferred.promise();
			},


		/**
		* @method parallel
		* Start all the function/deferred together and return a new combined deferred object which will resolve or fail 
		* as soon as all the deferred objects in the stack will resolve or reject
		* @return {Any} The arguments is populated with the result of each function of the stack
		* @deferred
		* @since 2.0
		*/
		parallel: function() {
			
			var deferred = $.Deferred();			
			var tmpArguments = _copyArguments(arguments);
			tmpArguments.push(_stack);
			// clear
			_clearResults();
			
			$(_stackedFunctions).each(function(idx) {
				
				var tmp_result = _stackedFunctions[idx].apply(_context,tmpArguments);

				if (_isPromise(tmp_result)) {
					$.when(tmp_result)
						.done(function(result) {
							// store result
							_results[idx] = result;
							_results_completed[idx] = true;
							})
						.fail(function(result) {
							// store result and fail
							_results[idx] = result;
							_results_failed[idx] = true;
							_results_completed[idx] = true;
							})
						.always(function() {
							// check if completed, otherwise do nothing
							if(_isCompleted()) {
								// resolve the deferred object
								if (!_isFailed()) {
									deferred.resolveWith(_context,_results);	
									}
								else {
									deferred.rejectWith(_context,_results);
									}								
								}
							});		
					}
				else {
					// skip to next			
					_results[idx] = tmp_result;
					_results_completed[idx] = true;
					if(_isCompleted()) {
						// resolve the deferred object
						if (!_isFailed()) {
							deferred.resolveWith(_context,_results);	
							}
						else {
							deferred.rejectWith(_context,_results);
							}								
						}					
					}
				
				});
			
			
			return deferred.promise();
			},

		/**
		* @method first
		* Start all the function/deferred together and return a new combined deferred object which will resolve or fail 
		* as soon as the first deferred object in the stack will resolve or reject
		* @return {Mixed} The result of the fist function that completes
		* @deferred
		*/
		first: function() {

			var deferred = $.Deferred();			
			var tmpArguments = _copyArguments(arguments);
			tmpArguments.push(_stack);
			var _isFirstCompleted = false;
			// clear
			_clearResults();
			
			$(_stackedFunctions).each(function(idx) {
				
				var tmp_result = _stackedFunctions[idx].apply(_context,tmpArguments);

				if (_isPromise(tmp_result)) {
					$.when(tmp_result)
						.done(function(result) {
							// store result
							_results[idx] = result;
							})
						.fail(function(result) {
							// store result and fail
							_results[idx] = result;
							_results_failed[idx] = true;
							})
						.always(function() {
							// check if completed, otherwise do nothing
							if(!_isFirstCompleted) {
								_isFirstCompleted = true;
								// resolve the deferred object
								if (!_isFailed()) {
									deferred.resolveWith(_context,_results);	
									}
								else {
									deferred.rejectWith(_context,_results);
									}								
								}
							});		
					}
				else {
					// skip to next			
					_results[idx] = tmp_result;
					if(!_isFirstCompleted) {
						_isFirstCompleted = true;
						// resolve the deferred object
						if (!_isFailed()) {
							deferred.resolveWith(_context,_results);	
							}
						else {
							deferred.rejectWith(_context,_results);
							}								
						}					
					}
				
				});
						
			return deferred.promise();
			},
			
		/**
		* @method get
		* Get the value of the key/value pairs stored in the stack by functions
		* @param {String} Key Key to get
		* @return {Object}	
		*/
		get: function(key) {
			return _vars[key];
			},

		/**
		* @method promise
		* Just for backward compatibility, works like Stackable#serial
		* @deprecated 2.0 Just for backward compatibility
		*/
		promise: function() {		
			return this.serial(arguments);
			},

		/**
		* @method cascade
		* Just for backward compatibility, works like Stackable#serial
		* @deprecated 2.0 Just for backward compatibility
		*/
		cascade: function() {		
			return this.serial(arguments);
			},
		
		/**
		* @method call
		* Simulate the call method any functions in JavaScript
		* @param {Object} object The context used by the functions of the stack
		* @param {Mixed} [params] List of arguments
		*/
		call: function() {

			var tmpArguments = null;
			if (arguments.length > 0) {
				tmpArguments = _copyArguments(arguments);
				_context = tmpArguments.shift(); 
				}			

			// call apply
			this.apply(_context,tmpArguments);
			
			return this;				
			},
		
		/**
		* @method apply
		* Simulate the apply method any functions in JavaScript
		* @param {Object} object The context used by the functions of the stack
		* @param {Array} [params] Array of parameters to pass to functions of teh stack
		*/
		apply: function(context,args) {

			_context = context;
			
			// store callback some where	
			var _callbackCopy = _callback;	
			
			if (_mode == null || _mode == 'cascade' || _mode == 'serial') {
				this.serial(args)
					.done(function() {
						_callbackCopy.apply(_content,arguments);
						});
				}
			else if (_mode == 'parallel') {
				this.parallel(args)
					.done(function() {
						_callbackCopy.apply(_content,arguments);
						});
				}
			else if (_mode == 'filter') {
				this.filter(args.length != 0 ? args[0] : null)
					.done(function() {
						_callbackCopy.apply(_content,arguments);
						});
				}
			
			return this;
			}
		
		};
	};
	})(require('/presto/libs/deferred/jquery-deferred'));
	
	
var $function = Stackable;

module.exports = Stackable;