/*! storge-js - v2.0.3 - 2015-05-18 %>
 * https://github.com/JosephClay/storge-js
 * Copyright (c) 2013-2015 ; License: MIT */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.storge = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
var storage = require(6);

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
},{"6":6}],2:[function(require,module,exports){
var tryItem = require(7);
var KEY = '__STORGE__';

var truncateExpirations = function(storage, expirations) {
    var keysInStorage = tryItem.keys(storage);
    for (var key in expirations) {
        if (keysInStorage.indexOf(key) === -1) {
            delete expirations[key];
        }
    }
    return expirations;
};

module.exports = function(storage) {
    var expirations = truncateExpirations(storage, tryItem.get(storage, KEY) || {});

    return {
        expired: function(key) {
            var hasExpired = key in expirations && expirations[key] <= Date.now();
            if (!hasExpired) { return hasExpired; }

            delete expirations[key];
            tryItem.set(storage, KEY, expirations);

            return true;
        },
        set: function(key, duration) {
            expirations[key] = Date.now() + (duration || 0);
            tryItem.set(storage, KEY, expirations);
        }
    };
};
},{"7":7}],3:[function(require,module,exports){
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
var extend  = require(3);
var version = require(8);

var exists = function(param) {
    return param !== undefined && param !== '';
};

var createKey = function(name, semver) {
    if (!exists(name)) {
        return exists(semver) ? '_' : '';
    }

    return name + '_';
};

var createSemver = function(name, semver) {
    if (!exists(semver)) {
        return exists(name) ? '0.0.0_' : '';
    }

    if (!version.valid(semver)) {
        throw 'invalid semver provided: ' + semver;
    }

    return semver + '_';
};

var constant = function(key) { return key; };

var isNotEncoded = function(key) {
    var keys = key.split('_');
    // doesn't have enough keys to be encoded
    if (keys.length < 3) { return true; }

    var ver = keys[1];
    // not a semantic version = not encoded
    return !version.valid(ver);
};

module.exports = extend(function(name, semver) {
    var space    = createKey(name, semver),
        ver      = createSemver(name, semver),
        active   = exists(space) || exists(ver),
        rMatches = new RegExp('^' + space + ver);

    var encode = function(key) {
        return space + ver + key;
    };

    var decode = function(key) {
        return key.substr(space.length).substr(ver.length);
    };

    var matches = function(key) {
        return rMatches.test(key);
    };

    return {
        active:    active,
        space:     space,
        ver:       ver,

        enc:       active ? encode  : constant,
        esc:       active ? decode  : constant,

        matches:   active ? matches : isNotEncoded
    };
}, {
    grabVer: function(key) {
        return key.split('_')[1];
    },
    grabNs: function(key) {
        return key.split('_')[0];
    },
    enc: function(space, ver, key) {
        return space + ver + key;
    }
});
},{"3":3,"8":8}],5:[function(require,module,exports){
var version = require(8);
var keygen  = require(4);
var tryItem = require(7);

var generateVersionMap = function(storage, namespace) {
    return tryItem.keys(storage)
        .filter(function(key) {
            return keygen.grabNs(key) === namespace;
        })
        .reduce(function(map, key) {
            var version = keygen.grabVer(key);
            var versions = map[version] = (map[version] = []);
            versions.push(key);
            return map;
        }, {
            // 0.0.0: ['hi_0.0.0_foo']
            // 1.0.0: ['hi_1.0.0_bar', 'hi_1.0.0_baz']
        });
};

var gatherDeprecatedKeys = function(versionMap, latestVer) {
    var versions = Object.keys(versionMap);

    // if the last version is our version, then
    // pop it off, we don't want to deprecate it
    var lastVer = versions[versions.length - 1];
    if (lastVer === latestVer) { versions.pop(); }

    return versions.reduce(function(merged, mapKey) {
        return merged.concat(versionMap[mapKey]);
    }, []);
};

module.exports = function(storage, namespace, latestVer) {
    /*
        {
            '1.0.0': { // from
                '1.0.1': { // to
                    'key': process
                }
            }
        }
    */
    var migrations = {};

    return {
        /*
           key:     string
           from:    string (semver)
           to:      string (semver)
           process: function
         */
        add: function(config) {
            var fromRef = migrations[config.from] = migrations[config.from] || {};
            var toRef = fromRef[config.to] = fromRef[config.to] || {};
            toRef[config.key] = config.process;
        },

        /**
         * Run through the migrations, migrating up
         * anything we can find (if there's not already
         * a greater version with a value)
         */
        migrate: function() {
            var migrationFromKeys = Object.keys(migrations)
                .sort(version.compare);

            migrationFromKeys.forEach(function(fromVersion) {
                var migrationToKeys = Object.keys(migrations[fromVersion])
                    .sort(version.compare);

                migrationToKeys.forEach(function(toVersion) {
                    var map = migrations[fromVersion][toVersion];
                    Object.keys(map).forEach(function(key) {
                        var process = map[key];
                        var fromKey = keygen.encode(namespace, fromVersion, key);
                        var toKey = keygen.encode(namespace, toVersion, key);

                        // if there's a value already set in the "to" position,
                        // don't overwrite it
                        if (tryItem.get(storage, toKey) !== undefined) { return; }

                        // run the migration
                        var value = tryItem.get(storage, fromKey);
                        tryItem.set(storage, toKey, process(value));
                    });
                });
            });
        },

        /**
         * Remove all old keys
         */
        deprecate: function() {
            var versionMap = generateVersionMap(storage, namespace),
                deprecatedKeys = gatherDeprecatedKeys(versionMap, latestVer);
            deprecatedKeys.forEach(function(key) {
                tryItem.remove(storage, key);
            });
        }
    };
};
},{"4":4,"7":7,"8":8}],6:[function(require,module,exports){
var storgeRef;
var extend     = require(3);
var expiration = require(2);
var keygen     = require(4);
var tryItem    = require(7);
var migrate    = require(5);

var factory = function(storage, name, semver) {
    return storgeRef(storage, name, semver);
};

/**
 * @param {Object} localStorage, sessionStorage
 * @param {String} namespace
 * @param {String} semver
 */
storgeRef = module.exports = function storge(storage, namespace, semver) {
    var expire = expiration(storage);
    var gen = keygen(namespace, semver);
    var migration = migrate(storage, gen.space, gen.ver);

    var api = function(name, semver) {
        return factory(storage, name, semver);
    };

    /**
     * Clear data from storage
     */
    var clear = function() {
        getKeys().forEach(function(key) {
            tryItem.remove(storage, key);
        });
        return api;
    };

    /**
     * Get keys from storage
     * @return {Array[String]}
     */
    var getKeys = function() {
        return tryItem.keys(storage)
            .filter(gen.matches);
    };

    /**
     * Get a key at the specified index
     * @param  {Number} index
     * @return {String} key
     */
    var getKey = function(index) {
        var key = tryItem.key(index);
        return key !== undefined ? gen.esc(key) : undefined;
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
                arr[idx] = tryItem.get(storage, gen.enc(arr[idx]), api.err);
            }
            return arr;
        }

        var genkey = gen.enc(key);
        if (expire.expired(genkey)) {
            removeItem(key);
            return undefined;
        }

        return tryItem.get(storage, genkey, api.err);
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

        var genkey = gen.enc(key);

        // Expiration
        if (opts) {
            if (opts.ttl !== undefined) {
                expire.set(genkey, opts.ttl);
            }
            if (typeof opts === 'number') {
                expire.set(genkey, opts);
            }
        }

        tryItem.set(storage, genkey, value, api.err);
        return api;
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
                arr[idx] = tryItem.remove(gen.enc(arr[idx]));
            }
            return arr;
        }

        return tryItem.remove(storage, gen.enc(key), api.err);
    };

    return extend(api, {
        err: function() {},

        clear:      clear,
        keys:       getKeys,
        key:        getKey,
        getItem:    getItem,
        setItem:    setItem,
        removeItem: removeItem,

        /**
         * Proxies
         */
        get: getItem,
        set: setItem,

        /**
         * Dangerous, clears all of the
         * storage, reguardless of namespace
         * and versioning
         */
        flush: function() {
            tryItem.clear();
            return api;
        },

        /**
         * removeItem returns the removed item,
         * this one chains
         * @param {String} key
         * @returns {Storage}
         */
        remove: function(key) {
            removeItem(key);
            return api;
        },

        /**
         * Async methods
         */
        getAsync: function(key) {
            return new Promise(function(resolve) {
                resolve(getItem(key));
            });
        },
        setAsync: function(key, value, opts) {
            return new Promise(function(resolve) {
                setItem(key, value, opts);
                resolve();
            });
        },
        removeAsync: function(key) {
            return new Promise(function(resolve) {
                resolve(removeItem(key));
            });
        },
        clearAsync: function() {
            return new Promise(function(resolve) {
                clear();
                resolve();
            });
        },
        keyAsync: function(index) {
            return new Promise(function(resolve) {
                resolve(getKey(index));
            });
        },
        keysAsync: function() {
            return new Promise(function(resolve) {
                resolve(getKeys());
            });
        },

        /**
         * Migration
         */
        migration: function(config) {
            if (Array.isArray(config)) { config.forEach(migration.add); return api; }
            migration.add(config);
            return api;
        },
        migrate: function() {
            if (!gen.active) { return api; }
            migration.migrate();
            return api;
        },
        deprecate: function() {
            if (!gen.active) { return api; }
            migration.deprecate();
            return api;
        },

        /**
         * Return storage values for JSON serialization
         * @param  {String} [key] return a specific value
         * @return {*|Object}
         */
        toJSON: function(key) {
            if (key !== undefined) {
                return getItem(key);
            }

            // no key, retrieve everything
            return getKeys().reduce(function(memo, key) {
                memo[gen.esc(key)] = tryItem.get(storage, key);
                return memo;
            }, {});
        },

        /**
         * Dangerous, back up all of
         * storage, reguardless of namespace
         * and versioning
         */
        backup: function() {
            return tryItem.keys(storage).reduce(function(memo, key) {
                memo[key] = tryItem.get(storage, key);
                return memo;
            }, {});
        }
    });
};
},{"2":2,"3":3,"4":4,"5":5,"7":7}],7:[function(require,module,exports){
var serialize = function(value) {
    return JSON.stringify(value);
};

var deserialize = function(value) {
    return value === undefined || value === '' ? value : JSON.parse(value);
};

module.exports = {
    keys: function(storage) {
        try {
            return Object.keys(storage);
        } catch(e) {
            return [];
        }
    },

    key: function(storage, index, err) {
        try {
            return storage.key(index);
        } catch(e) {
            if (err) { err(e); }
        }
    },

    clear: function(storage, err) {
        try {
            storage.clear();
        } catch(e) {
            if (err) { err(e); }
        }
    },

    get: function(storage, genkey, err) {
        try {
            return deserialize(storage.getItem(genkey));
        } catch(e) {
            if (err) { err(e); }
        }
    },

    set: function(storage, genkey, value, err) {
        try {
            storage.setItem(genkey, serialize(value));
        } catch(e) {
            if (err) { err(e); }
        }
    },

    remove: function(storage, genkey, err) {
        try {
            return storage.removeItem(genkey);
        } catch(e) {
            if (err) { err(e); }
        }
    },
};
},{}],8:[function(require,module,exports){
var toNum = function(str) { return +str; };
var isNum = function(num) { return (typeof num === 'number'); };

module.exports = {
    valid: function(v) {
        var parts = v.split('.').map(toNum);
        return parts.length === 3 && parts.every(isNum);
    },

    compare: function(v1, v2) {
        var v1parts = v1.split('.').map(toNum),
            v2parts = v2.split('.').map(toNum);

        for (var idx = 0; idx < v1parts.length; idx++) {
            if (v2parts.length === idx) {
                return 1;
            }

            if (v1parts[idx] === v2parts[idx]) {
                continue;
            }

            if (v1parts[idx] > v2parts[idx]) {
                return 1;
            }

            return -1;
        }

        if (v1parts.length !== v2parts.length) {
            return -1;
        }

        return 0;
    }
};
},{}]},{},[1])(1)
});