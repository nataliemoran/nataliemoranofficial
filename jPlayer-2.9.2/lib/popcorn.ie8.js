(function() {

  if ( !document.addEventListener && !document.removeEventListener && !document.dispatchEvent ) {
    var events = {};

    var addEventListener = function( eventName, callBack ) {

      eventName = ( eventName === "DOMContentLoaded" ) ? "readystatechange" : eventName;

      if ( Event[ eventName.toUpperCase() ] || eventName === "readystatechange" ) {
        document.attachEvent( "on" + eventName, callBack );
        return;
      }

      if ( !events[ eventName ] ) {
        events[ eventName ] = {
          events: [],
          queue: [],
          active: false
        };
      }

      if ( events[ eventName ].active ) {
        events[ eventName ].queue.push( callBack );
      } else {
        events[ eventName ].events.push( callBack );
      }
    };

    var removeEventListener = function( eventName, callBack ) {

      eventName = ( eventName === "DOMContentLoaded" ) ? "readystatechange" : eventName;

      var i = 0,
          listeners = events[ eventName ];

      if ( Event[ eventName.toUpperCase() ] || eventName === "readystatechange" ) {
        document.detachEvent( "on" + eventName, callBack );
        return;
      }

      if ( !listeners ) {
        return;
      }

      for ( i = listeners.events.length - 1; i >= 0; i-- ) {
        if ( callBack === listeners.events[ i ] ) {
          delete listeners.events[ i ];
        }
      }

      for ( i = listeners.queue.length - 1; i >= 0; i-- ) {
        if ( callBack === listeners.queue[ i ] ) {
          delete listeners.queue[ i ];
        }
      }
    };

    var dispatchEvent = function( eventObject ) {
      var evt,
          self = this,
          eventInterface,
          listeners,
          eventName = eventObject.type,
          queuedListener;

      // A string was passed, create event object
      if ( !eventName ) {

        eventName = eventObject;
        eventInterface  = Popcorn.events.getInterface( eventName );

        if ( eventInterface ) {

          evt = document.createEvent( eventInterface );
          evt.initCustomEvent( eventName, true, true, window, 1 );
        }
      }

      listeners = events[ eventName ];

      if ( listeners ) {
        listeners.active = true;

        for ( var i = 0; i < listeners.events.length; i++ ) {
          if ( listeners.events[ i ] ) {
            listeners.events[ i ].call( self, evt, self );
          }
        }

        if ( listeners.queue.length ) {
          while ( listeners.queue.length ) {
            queuedListener = listeners.queue.shift();
            
            if ( queuedListener ) {
              listeners.events.push( queuedListener );
            }
          }
        }

        listeners.active = false;

        listeners.events.forEach(function( listener ) {
          if ( !listener ) {
            listeners.events.splice( listeners.events.indexOf( listener ), 1 );
          }
        });

        listeners.queue.forEach(function( listener ) {
          if ( !listener ) {
            listeners.queue.splice( listeners.queue.indexOf( listener ), 1 );
          }
        });
      }
    };

    document.addEventListener = addEventListener;
    document.removeEventListener = removeEventListener;
    document.dispatchEvent = dispatchEvent;

  }

  if ( !Event.prototype.preventDefault ) {
    Event.prototype.preventDefault = function() {
      this.returnValue = false;
    };
  }
  if ( !Event.prototype.stopPropagation ) {
    Event.prototype.stopPropagation = function() {
      this.cancelBubble = true;
    };
  }

  window.addEventListener = window.addEventListener || function( event, callBack ) {

    event = "on" + event;

    window.attachEvent( event, callBack );
  };

  window.removeEventListener = window.removeEventListener || function( event, callBack ) {

    event = "on" + event;

    window.detachEvent( event, callBack );
  };

  HTMLScriptElement.prototype.addEventListener = HTMLScriptElement.prototype.addEventListener || function( event, callBack ) {

    event = ( event === "load" ) ? "onreadystatechange" : "on" + event;

    if( event === "onreadystatechange" ){
      callBack.readyStateCheck = callBack.readyStateCheck || function( e ){

        if( self.readyState === "loaded" ){
          callBack( e );
        }
      };
    }

    this.attachEvent( event, ( callBack.readyStateCheck || callBack ) );
  };

  HTMLScriptElement.prototype.removeEventListener = HTMLScriptElement.prototype.removeEventListener || function( event, callBack ) {

    event = ( event === "load" ) ? "onreadystatechange" : "on" + event;

    this.detachEvent( event, ( callBack.readyStateCheck || callBack ) );
  };

  document.createEvent = document.createEvent || function ( type ) {

    return {
      type : null,
      target : null,
      currentTarget : null,
      cancelable : false,
      detail: false,
      bubbles : false,
      initEvent : function (type, bubbles, cancelable)  {
        this.type = type;
      },
      initCustomEvent: function(type, bubbles, cancelable, detail) {
        this.type = type;
        this.detail = detail;
      },
      stopPropagation : function () {},
      stopImmediatePropagation : function () {}
    }
  };

  Array.prototype.forEach = Array.prototype.forEach || function( fn, context ) {

    var obj = this,
        hasOwn = Object.prototype.hasOwnProperty;

    if ( !obj || !fn ) {
      return {};
    }

    context = context || this;

    var key, len;

    for ( key in obj ) {
      if ( hasOwn.call( obj, key ) ) {
        fn.call( context, obj[ key ], key, obj );
      }
    }
    return obj;
  };

  if ( !Array.prototype.map ) {

    Array.prototype.map = function( callback, thisArg ) {

      var T, A, k;

      if ( this == null ) {
        throw new TypeError( "this is null or not defined" );
      }

      var O = Object( this );

      var len = O.length >>> 0;

      if ( {}.toString.call( callback ) != "[object Function]" ) {
        throw new TypeError( callback + " is not a function" );
      }

      if ( thisArg ) {
        T = thisArg;
      }

      A = new Array( len );

      k = 0;

      while( k < len ) {

        var kValue, mappedValue;

        if ( k in O ) {

          kValue = O[ k ];

          mappedValue = callback.call( T, kValue, k, O );

          A[ k ] = mappedValue;
        }

        k++;
      }

      return A;
    };
  }

  if ( !Array.prototype.indexOf ) {

    Array.prototype.indexOf = function ( searchElement /*, fromIndex */ ) {

      if ( this == null) {

        throw new TypeError();
      }

      var t = Object( this ),
          len = t.length >>> 0;

      if ( len === 0 ) {

        return -1;
      }

      var n = 0;

      if ( arguments.length > 0 ) {

        n = Number( arguments[ 1 ] );

        if ( n != n ) { // shortcut for verifying if it's NaN

          n = 0;
        } else if ( n != 0 && n != Infinity && n != -Infinity ) {

          n = ( n > 0 || -1 ) * Math.floor( Math.abs( n ) );
        }
      }

      if ( n >= len ) {
        return -1;
      }

      var k = n >= 0 ? n : Math.max( len - Math.abs( n ), 0 );

      for (; k < len; k++ ) {

        if ( k in t && t[ k ] === searchElement ) {

          return k;
        }
      }

      return -1;
    }
  }

  if ( typeof String.prototype.trim !== "function" ) {

    String.prototype.trim = function() {
      return this.replace(/^\s+|\s+$/g, "");
    };
  }
  
  // From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
  if (!Object.keys) {
    Object.keys = (function () {
      'use strict';
      var hasOwnProperty = Object.prototype.hasOwnProperty,
          hasDontEnumBug = !({toString: null}).propertyIsEnumerable('toString'),
          dontEnums = [
            'toString',
            'toLocaleString',
            'valueOf',
            'hasOwnProperty',
            'isPrototypeOf',
            'propertyIsEnumerable',
            'constructor'
          ],
          dontEnumsLength = dontEnums.length;

      return function (obj) {
        if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
          throw new TypeError('Object.keys called on non-object');
        }

        var result = [], prop, i;

        for (prop in obj) {
          if (hasOwnProperty.call(obj, prop)) {
            result.push(prop);
          }
        }

        if (hasDontEnumBug) {
          for (i = 0; i < dontEnumsLength; i++) {
            if (hasOwnProperty.call(obj, dontEnums[i])) {
              result.push(dontEnums[i]);
            }
          }
        }
        return result;
      };
    }());
  }
  
  if ( !Object.defineProperties ) {
    Object.defineProperties = function(obj, properties) {
      function convertToDescriptor(desc) {
        function hasProperty(obj, prop) {
          return Object.prototype.hasOwnProperty.call(obj, prop);
        }

        function isCallable(v) {
          // NB: modify as necessary if other values than functions are callable.
          return typeof v === "function";
        }

        if (typeof desc !== "object" || desc === null)
          throw new TypeError("bad desc");

        var d = {};

        if (hasProperty(desc, "enumerable"))
          d.enumerable = !!obj.enumerable;
        if (hasProperty(desc, "configurable"))
          d.configurable = !!desc.configurable;
        if (hasProperty(desc, "value"))
          d.value = obj.value;
        if (hasProperty(desc, "writable"))
          d.writable = !!desc.writable;
        if ( hasProperty(desc, "get") ) {
          var g = desc.get;

          if (!isCallable(g) && g !== "undefined")
            throw new TypeError("bad get");
          d.get = g;
        }
        if ( hasProperty(desc, "set") ) {
          var s = desc.set;
          if (!isCallable(s) && s !== "undefined")
            throw new TypeError("bad set");
          d.set = s;
        }

        if (("get" in d || "set" in d) && ("value" in d || "writable" in d))
          throw new TypeError("identity-confused descriptor");

        return d;
      }

      if (typeof obj !== "object" || obj === null)
        throw new TypeError("bad obj");

      properties = Object(properties);

      var keys = Object.keys(properties);
      var descs = [];

      for (var i = 0; i < keys.length; i++)
        descs.push([keys[i], convertToDescriptor(properties[keys[i]])]);

      for (var i = 0; i < descs.length; i++)
        Object.defineProperty(obj, descs[i][0], descs[i][1]);

      return obj;
    };
  }

})();
