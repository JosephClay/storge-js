var KEY = '__STORGE__';

var attempt = function(fn) {
    try { return fn(); } catch(e) {}
};

var getExpirations = function(storage) {
    var result = attempt(function() {
        return storage.getItem(KEY);
    });
    return result === undefined || result === '' ? result : JSON.parse(result);
};

var setExpirations = function(storage, expirations) {
    attempt(function() {
        storage.setItem(KEY, JSON.stringify(expirations));
    });
};

module.exports = function(storage) {
    var expirations = getExpirations(storage) || {};

    return {
        expired: function(key) {
            var hasExpired = key in expirations && expirations[key] >= Date.now();
            if (!hasExpired) { return hasExpired; }

            delete expirations[key];
            setExpirations(storage, expirations);

            return true;
        },
        set: function(key, duration) {
            expirations[key] = Date.now() + (duration || 0);
            setExpirations(storage, expirations);
        }
    };
};