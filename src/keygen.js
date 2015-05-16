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
        return exists(name) ? '_' : '';
    }

    return semver.replace(/\./g, '') + '_';
};

var encode = function(key) {
    return this.space + this.ver + key;
};
var decode = function(key) {
    return key.substr(this.space.length).substr(this.ver.length);
};

var constant = function(key) { return key; };

module.exports = function(name, semver) {
    var space  = createKey(name, semver),
        ver    = createSemver(name, semver),
        active = exists(space) || exists(ver);

    return {
        active: active,
        space:  space,
        ver:    ver,
        ns:     active ? encode: constant,
        esc:    active ? decode: constant
    };
};