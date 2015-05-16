var createKey = function(name, semver) {
    if (name === undefined) {
        return semver !== undefined ? '_' : '';
    }

    return name + '_';
};

var createSemver = function(semver) {
    return semver !== undefined ?
        semver.replace(/\./g, '') + '_' :
        '_';
};

var encode = function(key) {
    return this.ver + this.space + key;
};
var decode = function(key) {
    return key.substr(this.space.length).substr(this.ver.length);
};

var constant = function(key) { return key; };

module.exports = function(name, semver) {
    var space  = createKey(name, semver),
        ver    = createSemver(semver),
        active = space || ver;

    return {
        active: active,
        space:  space,
        ver:    ver,
        ns:     active ? encode: constant,
        esc:    active ? decode: constant
    };
};