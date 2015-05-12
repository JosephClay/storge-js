var storage = require('./storage');

/**
 * Expose a store for local storage
 * @type {storage}
 */
var store = storage('localStorage');
/**
 * Expose an instace of storage for the session
 * @type {storage}
 */
store.session = storage('sessionStorage');

module.exports = store;