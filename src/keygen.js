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
        return exists(name) ? '000_' : '';
    }

    return semver.replace(/\./g, '') + '_';
};

var constant = function(key) { return key; };

module.exports = function(name, semver) {
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

    var isNotEncoded = function(key) {
        // doesn't have enough keys to be encoded
        var keys = key.split('_');
        if (keys.length < 3) { return true; }

        // has a numeric version
        var ver = keys[1];
        return isNaN(+ver) ? true : false;
    };

    return {
        active:  active,
        ns:      active ? encode  : constant,
        esc:     active ? decode  : constant,
        matches: active ? matches : isNotEncoded
    };
};