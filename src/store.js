/**
 * Based off of {@link https://gist.github.com/remy/350433 Remy's} polyfill.
 *
 * Adapted to use the same Storage object for both local and session storage.
 *
 * @class Storage
 * @param {Object} localStorage, sessionStorage
 */
module.exports = function storge(storage) {
    /**
     * Stores timeouts for all
     * instaces of Storage
     * @type {Object}
     * @private
     */
    var timeouts = {};

    /**
     * Removes data from a key after an interval
     * @param {String} key
     * @param {Number} duration
     * @private
     */
    var setExpiration = function(key, duration) {
        if (timeouts[key]) { clearTimeout(timeouts[key]); }

        timeouts[key] = setTimeout(function() {
            removeItem(key);
            delete timeouts[key];
        }, duration || 0);
    };

    /**
     * Clear all data from storage
     * @return {Storage}
     */
    var clear = function() {
        try {
            storage.clear();
            return api;
        } catch (e) {
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
            return storage.key(idx);
        } catch (e) {
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
            var idx = key.length;
            while (idx--) {
                key[idx] = getItem(key[idx]);
            }
            return key;
        }

        try {
            var storedValue = storage.getItem(key);
            if (storedValue !== undefined) { return storedValue; }
            return storedValue === '' ? '' : JSON.parse(storedValue);
        } catch (e) {
            api.err(e);
        }
    };

    /**
     * Adds to data
     * @param {String|Object} key
     * @param {*|undefined} value
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
            return;
        }

        // Expiration
        if (opts) {
            if (opts.expiration !== undefined) {
                setExpiration(key, opts.expiration);
            }
        }

        try {
            storage.setItem(key, JSON.stringify(value));
        } catch (e) {
            api.err(e);
        }
    };

    /**
     * Remove an item from storage by key
     * @param {String} key
     * @returns {*}
     */
    var removeItem = function(key) {
        try {
            var stored = storage.removeItem(key);
            return stored;
        } catch (e) {
            api.err(e);
        }
    };

    var api = {
        clear:      clear,
        key:        getKey,
        getItem:    getItem,
        setItem:    setItem,
        removeItem: removeItem,

        err: function() {},

        /**
         * Proxy for getItem
         * @alias {#getItem}
         */
        get: getItem,

        /**
         * Proxy for setItem
         * @alias {#setItem}
         */
        set: setItem,

        /**
         * Proxy for clear
         * @alias {#clear}
         */
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
            var idx = storage.length,
                keys = [];
            while (idx--) {
                keys[idx] = getKey(idx);
            }

            return keys.reduce(function(memo, key) {
                memo[key] = getItem(key);
                return memo;
            }, {});
        }
    };

    Object.defineProperty(api, 'length', {
        get: function() {
            return storage.length;
        }
    });

    return api;
};