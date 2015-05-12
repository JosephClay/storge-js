var storage = require('./store');

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