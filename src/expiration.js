var tryItem = require('./tryItem');
var KEY = '__STORGE__';

var truncateExpirations = function(storage, expirations) {
    var keysInStorage = Object.keys(storage);
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
            var hasExpired = key in expirations && expirations[key] >= Date.now();
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