/*! storge-js - v1.0.4 - 2015-05-12 %>
 * https://github.com/JosephClay/storge-js
 * Copyright (c) 2013-2015 ; License: MIT */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.storge = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
var storage = require(5);

/**
 * Expose a store for local storage
 * @type {storage}
 */
var store = storage(global.localStorage);
/**
 * Expose an instace of storage for the session
 * @type {storage}
 */
store.session = storage(global.sessionStorage);

module.exports = store;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"5":5}],2:[function(require,module,exports){
var KEY = '__STORGE__';

var attempt = function(fn) {
    try { return fn(); } catch(e) {}
};

var getExpirations = function(storage) {
    var result = attempt(function() {
        return storage.getItem(KEY);
    });
    return result === undefined || result === '' ? result : JSON.parse(result);
};

var truncateExpirations = function(storage, expirations) {
    var keysInStorage = Object.keys(storage);
    for (var key in expirations) {
        if (keysInStorage.indexOf(key) === -1) {
            delete expirations[key];
        }
    }
    return expirations;
};

var setExpirations = function(storage, expirations) {
    attempt(function() {
        storage.setItem(KEY, JSON.stringify(expirations));
    });
};

module.exports = function(storage) {
    var expirations = truncateExpirations(storage, getExpirations(storage) || {});

    return {
        expired: function(key) {
            var hasExpired = key in expirations && expirations[key] >= Date.now();
            if (!hasExpired) { return hasExpired; }

            delete expirations[key];
            setExpirations(storage, expirations);

            return true;
        },
        set: function(key, duration) {
            expirations[key] = Date.now() + (duration || 0);
            setExpirations(storage, expirations);
        }
    };
};
},{}],3:[function(require,module,exports){
/**
 * Object merger
 * @param {Objects}
 * @return {Object}
 */
module.exports = function(base) {
    var args = arguments,
        idx = 1, length = args.length,
        key, merger;
    for (; idx < length; idx++) {
        merger = args[idx];

        for (key in merger) {
            base[key] = merger[key];
        }
    }

    return base;
};
},{}],4:[function(require,module,exports){
var applyNamespace = function(key) {
    return this.space + key;
};
var unapplyNamespace = function(key) {
    var ns = this.space;
    return ns === '' ? key :
        key.substr(0, ns.length) === ns ?
        key.substr(ns.length) : key;
};

module.exports = function(name) {
    return {
        space: name === undefined ? '' : name + '_',
        ns:    applyNamespace,
        esc:   unapplyNamespace
    };
};
},{}],5:[function(require,module,exports){
var extend = require(3);
var expiration = require(2);
var keygen = require(4);

var serialize = function(value) {
    return JSON.stringify(value);
};

var deserialize = function(value) {
    return value === undefined || value === '' ? value : JSON.parse(value);
};

/**
 * @param {Object} localStorage, sessionStorage
 */
module.exports = function storge(storage, namespace) {
    var api;
    var expire = expiration(storage);
    var gen = keygen(namespace);

    /**
     * Clear all data from storage
     * @return {Storage}
     */
    var clear = function() {
        try {
            storage.clear();
            return api;
        } catch(e) {
            api.err(e);
        }
    };

    /**
     * Get a key at the specified index
     * @param  {Number} idx
     * @return {String} key
     */
    var getKey = function(idx) {
        try {
            return gen.esc(storage.key(idx));
        } catch(e) {
            api.err(e);
        }
    };

    /**
     * Retrieve item from data
     * @param  {String|Array.<String>} key
     * @return {*}
     */
    var getItem = function(key) {
        // Array is passed, get all values under
        // the keys
        if (Array.isArray(key)) {
            var arr = key.slice(),
                idx = arr.length;
            while (idx--) {
                arr[idx] = tryGetItem(gen.ns(arr[idx]));
            }
            return arr;
        }

        var genkey = gen.ns(key);
        if (expire.expired(genkey)) {
            removeItem(key);
            return undefined;
        }

        return tryGetItem(genkey);
    };
    var tryGetItem = function(genkey) {
        try {
            return deserialize(storage.getItem(genkey));
        } catch(e) {
            api.err(e);
        }
    };

    /**
     * Adds to data
     * @param {String|Object} key
     * @param {*} value
     * @param {Object} [opts] for setting the expiration
     */
    var setItem = function(key, value, opts) {
        // Not a string, must be an object,
        // multiple items are being set
        if (typeof key !== 'string') {
            var k;
            for (k in key) {
                setItem(k, key[k], value);
            }
            return api;
        }

        var genkey = gen.ns(key);

        // Expiration
        if (opts) {
            if (opts.ttl !== undefined) {
                expire.set(genkey, opts.ttl);
            }
        }

        trySetItem(genkey, serialize(value));
    };
    var trySetItem = function(genkey, value) {
        try {
            storage.setItem(genkey, value);
            return api;
        } catch(e) {
            api.err(e);
        }
    };

    /**
     * Remove an item from storage by key
     * @param {String} key
     * @returns {*}
     */
    var removeItem = function(key) {
        // Array is passed, remove all values under
        // the keys
        if (Array.isArray(key)) {
            var arr = key.slice(),
                idx = arr.length;
            while (idx--) {
                arr[idx] = tryRemoveItem(gen.ns(arr[idx]));
            }
            return arr;
        }

        return tryRemoveItem(gen.ns(key));
    };
    var tryRemoveItem = function(genkey) {
        try {
            var stored = storage.removeItem(genkey);
            return stored;
        } catch(e) {
            api.err(e);
        }
    };

    return (
        api = extend(function(name) {
            return storge(storage, name);
        }, {
            clear:      clear,
            key:        getKey,
            getItem:    getItem,
            setItem:    setItem,
            removeItem: removeItem,

            err: function() {},

            /**
             * Proxies
             */
            get: getItem,
            set: setItem,
            flush: clear,

            /**
             * Remove an item from storage by key
             * @param {String} key
             * @returns {Storage}
             */
            remove: function(key) {
                removeItem(key);
                return api;
            },

            /**
             * Return storage values for JSON serialization
             * @param  {String} [key] return a specific value
             * @return {*}
             */
            toJSON: function(key) {
                if (key !== undefined) {
                    return getItem(key);
                }

                // no key, retrieve everything
                return Object.keys(storage)
                    .reduce(function(memo, key) {
                        var esckey = gen.esc(key);
                        memo[esckey] = getItem(esckey);
                        return memo;
                    }, {});
            }
        })
    );
};
},{"2":2,"3":3,"4":4}]},{},[1])(1)
});