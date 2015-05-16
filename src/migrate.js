var version = require('./version');
var keygen = require('./keygen');
var tryItem = require('./tryItem');

var generateVersionMap = function(storage, namespace) {
    return Object.keys(storage)
        .filter(function(key) {
            return keygen.grabNs(key) === namespace;
        })
        .reduce(function(map, key) {
            var version = keygen.grabVer(key);
            var versions = map[version] = (map[version] = []);
            versions.push(key);
            return map;
        }, {
            // 0.0.0: ['hi_0.0.0_foo']
            // 1.0.0: ['hi_1.0.0_bar', 'hi_1.0.0_baz']
        });
};

var gatherDeprecatedKeys = function(versionMap, latestSemver) {
    var semvers = Object.keys(versionMap);

    // if the last version is our version, then
    // pop it off, we don't want to deprecate it
    var lastSemver = semvers[semvers.length - 1];
    if (lastSemver === latestSemver) { semvers.pop(); }

    return semvers.reduce(function(merged, mapKey) {
        return merged.concat(versionMap[mapKey]);
    }, []);
};

module.exports = function(storage, namespace, latestSemver) {
    /*
        {
            '1.0.0': { // from
                '1.0.1': { // to
                    'key': process
                }
            }
        }
    */
    var migrations = {};

    return {
        /*
           key:     string
           from:    string (semver)
           to:      string (semver)
           process: function
         */
        add: function(config) {
            var fromRef = migrations[config.from] = migrations[config.from] || {};
            var toRef = fromRef[config.to] = fromRef[config.to] || {};
            toRef[config.key] = config.process;
        },

        /**
         * Run through the migrations, migrating up
         * anything we can find (if there's not already
         * a greater version with a value)
         */
        migrate: function() {
            var migrationFromKeys = Object.keys(migrations)
                .sort(version.compare);

            migrationFromKeys.forEach(function(fromVersion) {
                var migrationToKeys = Object.keys(migrations[fromVersion])
                    .sort(version.compare);

                migrationToKeys.forEach(function(toVersion) {
                    var map = migrations[fromVersion][toVersion];
                    Object.keys(map).forEach(function(key) {
                        var process = map[key];
                        var fromKey = keygen.encode(namespace, fromVersion, key);
                        var toKey = keygen.encode(namespace, toVersion, key);

                        // if there's a value already set in the "to" position,
                        // don't overwrite it
                        if (tryItem.get(storage, toKey) !== undefined) { return; }

                        // run the migration
                        var value = tryItem.get(storage, fromKey);
                        tryItem.set(storage, toKey, process(value));
                    });
                });
            });
        },

        /**
         * Remove all old keys
         */
        deprecate: function() {
            var versionMap = generateVersionMap(storage, namespace),
                deprecatedKeys = gatherDeprecatedKeys(versionMap, latestSemver);
            deprecatedKeys.forEach(function(key) {
                tryItem.remove(storage, key);
            });
        }
    };
};