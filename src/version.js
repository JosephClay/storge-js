var toNum = function(str) { return +str; };
var isNum = function(num) { return (typeof num === 'number'); };

module.exports = {
    valid: function(v) {
        var parts = v.split('.').map(toNum);
        return parts.length === 3 && parts.every(isNum);
    },

    compare: function(v1, v2) {
        var v1parts = v1.split('.').map(toNum),
            v2parts = v2.split('.').map(toNum);

        for (var idx = 0; idx < v1parts.length; idx++) {
            if (v2parts.length === idx) {
                return 1;
            }

            if (v1parts[idx] === v2parts[idx]) {
                continue;
            }

            if (v1parts[idx] > v2parts[idx]) {
                return 1;
            }

            return -1;
        }

        if (v1parts.length !== v2parts.length) {
            return -1;
        }

        return 0;
    }
};