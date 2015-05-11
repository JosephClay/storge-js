(function(name, definition) {

    if (typeof define === 'function') { // RequireJS
        define(function() { return definition; });
    } else if (typeof module !== 'undefined' && module.exports) { // CommonJS
        module.exports = definition;
    } else { // Browser
        this[name] = definition;
    }

})('storge', function(root, undefined) {

    var _uniqueId = (function() {

            var id = 0;
            return function() {
                return id++;
            };

        }()),

        _exists = function(obj) {
            return obj !== null && obj !== undefined;
        },

        /**
         * Stores timeouts for all
         * instaces of Storage
         * @type {Object}
         * @private
         */
        _timeouts = {},

        /**
         * The storage type: local or session
         * @readonly
         * @enum {Number}
         * @alias Storage.TYPE
         */
        STORAGE_TYPE = {
            cookie:         0,
            localStorage:   1,
            sessionStorage: 2
        },

        STORAGE_TYPE_NAME = {
            0: 'cookie',
            1: 'localStorage',
            2: 'sessionStorage'
        };

    /**
     * Based off of {@link https://gist.github.com/remy/350433 Remy's} polyfill.
     *
     * Adapted to use the same Storage object for both local and session storage.
     *
     * @class Storage
     * @param {Storage.TYPE} [type]
     * @param {Object} [opts]
     */
    var Storage = function storge(type, opts) {
        opts = opts || {};

        /**
         * @type {Id}
         * @private
         */
        this._id = _uniqueId();

        /**
         * The type of storage
         * @default STORAGE_TYPE.cookie
         * @type {Storage.TYPE}
         */
        this.type = type || STORAGE_TYPE.cookie;

        /**
         * The name of the store.
         * @type {String}
         */
        this.name = opts.name || STORAGE_TYPE_NAME[this.type];

        /**
         * The type of storage we're using
         * @type {String}
         * @example localStorage || sessionStorage
         */
        this.storage = root[STORAGE_TYPE_NAME[this.type]];

        /**
         * The data stored
         * @type {Object}
         */
        this.data = {};

        /**
         * The storage length
         * @type {Number}
         */
        this.length = this.storage.length;
    };

    Storage.prototype = {

        /**
         * Clear all data from storage
         * @return {Storage}
         */
        clear: function() {
            this.data = {};
            this.length = 0;

            try {
                this.storage.clear();
                return this;
            } catch (e) {
                this.err(e);
            }
        },

        /**
         * Get a key at the specified index
         * @param  {Number} idx
         * @return {String} key
         */
        key: function(idx) {
            try {
                return this.storage.key(idx);
            } catch (e) {
                this.err(e);
                return;
            }
        },

        /**
         * Retrieve item from data
         * @param  {String|Array.<String>} key
         * @return {*}
         */
        getItem: function(key) {
            // Array is passed, get all values under
            // the keys
            if (Array.isArray(key)) {
                var idx = key.length;
                while (idx--) {
                    key[idx] = this.getItem(key[idx]);
                }
                return key;
            }

            try {
                var storedValue = this.storage.getItem(key);
                if (!_exists(storedValue)) { return storedValue; }
                return storedValue === '' ? '' : JSON.parse(storedValue);
            } catch (e) {
                this.err(e);
                return;
            }
        },

        /**
         * Proxy for getItem
         * @alias {#getItem}
         */
        get: function() {
            return this.getItem.apply(this, arguments);
        },

        /**
         * Adds to data
         * @param {String|Object} key
         * @param {*|undefined} value
         * @param {Object} [opts] for setting the expiration
         */
        setItem: function(key, value, opts) {
            // Not a string, must be an object,
            // multiple items are being set
            if (typeof key === 'string') {
                var k;
                for (k in key) {
                    this.setItem(k, key[k], value);
                }
                return;
            }

            // Expiration
            if (opts) {
                if (_exists(opts.expiration)) {
                    this._setExpiration(key, opts.expiration || 0);
                }
            }

            try {
                this.storage.setItem(key, JSON.stringify(value));
                this.length = this.storage.length;
                return;
            } catch (e) {
                this.err(e);
                return;
            }
        },

        /**
         * Proxy for setItem
         * @alias {#setItem}
         */
        store: function() {
            this.setItem.apply(this, arguments);
        },

        /**
         * Proxy for setItem
         * @alias {#setItem}
         */
        set: function() {
            this.setItem.apply(this, arguments);
        },

        /**
         * Remove all data in storage
         * @return {Storage}
         */
        flush: function() {
            return this.clear();
        },

        /**
         * Remove an item from storage by key
         * @param {String} key
         * @returns {*}
         */
        removeItem: function(key) {
            try {
                var storage = this.storage.removeItem(key);
                this.length = this.storage.length;
                return storage;
            } catch (e) {
                this.err(e);
                return;
            }
        },

        /**
         * Remove an item from storage by key
         * @param {String} key
         * @returns {Storage}
         */
        remove: function(key) {
            this.removeItem(key);
            return this;
        },

        /**
         * Removes data from a key after an interval
         * @param {String} key
         * @param {Number} duration
         * @private
         */
        _setExpiration: function(key, duration) {
            var self = this,
                timeoutKey = this._id + key;

            if (_timeouts[timeoutKey]) { clearTimeout(_timeouts[timeoutKey]); }

            _timeouts[timeoutKey] = setTimeout(function() {
                self.removeItem(key);
                delete _timeouts[timeoutKey];
            }, duration);
        },

        err: function() {},

        /**
         * Return storage values for JSON serialization
         * @param  {String} [key] return a specific value
         * @return {*}
         */
        toJSON: function(key) {
            // TODO: No key, retrieve everything
            return this.get(key);
        },

        /**
         * Debug string
         * @return {String}
         */
        toString: function() {
            return 'storage - type: ' + STORAGE_TYPE_NAME[this.type] + ', length: ' + this.length;
        }
    };

    /**
     * Expose a store for local storage
     * @type {Storage}
     */
    var store = new Storage(STORAGE_TYPE.localStorage);
    /**
     * Expose an instace of storage for the session
     * @type {Storage}
     */
    store.session = new Storage(STORAGE_TYPE.sessionStorage);

    return store;

}(window));