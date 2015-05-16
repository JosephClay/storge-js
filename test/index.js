var test = require('tape'),
    keygen = require('../src/keygen');

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
