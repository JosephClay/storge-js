var Storage = require('./store');

/**
 * Expose a store for local storage
 * @type {Storage}
 */
var store = new Storage('localStorage');
/**
 * Expose an instace of storage for the session
 * @type {Storage}
 */
store.session = new Storage('sessionStorage');

module.exports = store;