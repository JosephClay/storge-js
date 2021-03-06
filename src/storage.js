var storgeRef;
var extend     = require('./extend');
var expiration = require('./expiration');
var keygen     = require('./keygen');
var tryItem    = require('./tryItem');
var migrate    = require('./migrate');

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