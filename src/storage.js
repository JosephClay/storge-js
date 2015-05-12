/**
 * @param {Object} localStorage, sessionStorage
 */
module.exports = function storge(storage) {
    var namespace = '';
    var keyGen = function(key) {
        return namespace + key;
    };
    var deGen = function(key) {
        return namespace === '' ? key :
            key.substr(0, namespace.length) === namespace ?
            key.substr(namespace.length) : key;
    };

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
            removeItem(keyGen(key));
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
            return deGen(storage.key(idx));
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
                key[idx] = getItem(keyGen(key[idx]));
            }
            return key;
        }

        try {
            var storedValue = storage.getItem(keyGen(key));
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
            storage.setItem(keyGen(key), JSON.stringify(value));
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
            var stored = storage.removeItem(keyGen(key));
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
            return Object.keys(storage)
                .reduce(function(memo, key) {
                    memo[deGen(key)] = getItem(key);
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