var extend = require('./extend');
var expiration = require('./expiration');
var keygen = require('./keygen');
var tryItem = require('./tryItem');

/**
 * @param {Object} localStorage, sessionStorage
 * @param {String} namespace
 * @param {String} semver
 */
module.exports = function storge(storage, namespace, semver) {
    var expire = expiration(storage);
    var gen = keygen(namespace, semver);
    var api = function(name, semver) {
        return storge(storage, name, semver);
    };

    /**
     * Clear all data from storage
     * @return {Storage}
     */
    // TODO: Better clear with keygen
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
                arr[idx] = tryItem.get(storage, gen.ns(arr[idx]), api.err);
            }
            return arr;
        }

        var genkey = gen.ns(key);
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

        var genkey = gen.ns(key);

        // Expiration
        if (opts) {
            if (opts.ttl !== undefined) {
                expire.set(genkey, opts.ttl);
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
                arr[idx] = tryItem.remove(gen.ns(arr[idx]));
            }
            return arr;
        }

        return tryItem.remove(storage, gen.ns(key), api.err);
    };

    return extend(api, {
        err: function() {},

        clear:      clear,
        key:        getKey,
        getItem:    getItem,
        setItem:    setItem,
        removeItem: removeItem,

        /**
         * Proxies
         */
        get: getItem,
        set: setItem,
        flush: clear,

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
         * Return storage values for JSON serialization
         * @param  {String} [key] return a specific value
         * @return {*}
         */
        // TODO: Better toJSON with keygen
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
    });
};