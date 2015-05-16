var extend = require('./extend');
var version = require('./version');

var exists = function(param) {
    return param !== undefined && param !== '';
};

var createKey = function(name, semver) {
    if (!exists(name)) {
        return exists(semver) ? '_' : '';
    }

    return name + '_';
};

var createSemver = function(name, semver) {
    if (!exists(semver)) {
        return exists(name) ? '0.0.0_' : '';
    }

    if (!version.valid(semver)) {
        throw ('invalid semver provided: ' + semver);
    }

    return semver + '_';
};

var constant = function(key) { return key; };

var isNotEncoded = function(key) {
    var keys = key.split('_');
    // doesn't have enough keys to be encoded
    if (keys.length < 3) { return true; }

    var ver = keys[1];
    // not a semantic version = not encoded
    return !version.valid(ver);
};

module.exports = extend(function(name, semver) {
    var space    = createKey(name, semver),
        ver      = createSemver(name, semver),
        active   = exists(space) || exists(ver),
        rMatches = new RegExp('^' + space + ver);

    var encode = function(key) {
        return space + ver + key;
    };

    var decode = function(key) {
        return key.substr(space.length).substr(ver.length);
    };

    var matches = function(key) {
        return rMatches.test(key);
    };

    return {
        active:    active,
        space:     space,
        ver:       ver,

        enc:       active ? encode  : constant,
        esc:       active ? decode  : constant,

        matches:   active ? matches : isNotEncoded
    };
}, {
    grabVersion: function(key) {
        return key.split('_')[1];
    },
    grabNs: function(key) {
        return key.split('_')[0];
    },
    enc: function(space, ver, key) {
        return space + ver + key;
    }
});