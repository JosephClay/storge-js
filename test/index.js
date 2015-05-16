var _       = require('lodash'),
    test    = require('tape'),
    keygen  = require('../src/keygen'),
    version = require('../src/version');

// ======================
// Keygen
// ======================

test('blank keygen', function(assert) {
    var gen = keygen();
    assert.equal(gen.active, false, 'keygen is not active');
    assert.equal(gen.ns('foo'), 'foo', 'keygen does not namespace');
    assert.equal(gen.esc('foo'), 'foo', 'keygen does not escape');

    assert.end();
});

test('named keygen', function(assert) {
    var gen = keygen('hi');
    assert.equal(gen.active, true, 'keygen is active');
    assert.equal(gen.ns('foo'), 'hi_0.0.0_foo', 'keygen escapes with namespace');
    assert.equal(gen.esc('hi_0.0.0_foo'), 'foo', 'keygen escapes back to original key');

    assert.end();
});

test('versioned keygen', function(assert) {
    var gen = keygen('', '1.0.0');
    assert.equal(gen.active, true, 'keygen is active');
    assert.equal(gen.ns('foo'), '_1.0.0_foo', 'keygen escapes with version');
    assert.equal(gen.esc('_1.0.0_foo'), 'foo', 'keygen escapes back to original key');

    assert.end();
});

test('named and versioned keygen', function(assert) {
    var gen = keygen('hi', '1.0.0');
    assert.equal(gen.active, true, 'keygen is active');
    assert.equal(gen.ns('foo'), 'hi_1.0.0_foo', 'keygen escapes with namespace');
    assert.equal(gen.esc('hi_1.0.0_foo'), 'foo', 'keygen escapes back to original key');

    assert.end();
});


// ======================
// Version
// ======================

test('version validity', function(assert) {
    assert.equal(version.valid(''), false, 'empty string is invalid');

    assert.equal(version.valid('1.0.0'), true, '1.0.0 is valid');

    assert.equal(version.valid('0.0'), false, 'short version is invalid');
    assert.equal(version.valid('1.0.0.1'), false, 'long version is invalid');

    assert.equal(version.valid('0.0.0'), true, 'small version is valid');
    assert.equal(version.valid('12.123456.9789746'), true, 'large version is valid');

    assert.end();
});

test('version sort', function(assert) {
    var expected = [
        '0.0.0',
        '0.0.1',
        '0.0.2',
        '0.2.0',
        '0.2.1',
        '3.0.0',
        '12345.1646846.464643640',
        '12345.1646846.464643641'
    ];
    var sorted = _.shuffle(expected).sort(version.compare);

    assert.deepEqual(expected, sorted, 'sorted from lowest to highest');

    assert.end();
});