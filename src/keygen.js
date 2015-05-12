var applyNamespace = function(key) {
    return this.space + key;
};
var unapplyNamespace = function(key) {
    var ns = this.space;
    return ns === '' ? key :
        key.substr(0, ns.length) === ns ?
        key.substr(ns.length) : key;
};

module.exports = function(name) {
    return {
        space: name === undefined ? '' : name,
        ns:    applyNamespace,
        esc:   unapplyNamespace
    };
};