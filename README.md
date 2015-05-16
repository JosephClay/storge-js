storge-js
=========

local and session storage with namespacing, versioning, expiring keys and migration support

`npm install storge-js`

##Examples
localStorage
```js
var store = require('storge-js');

// can use set or setItem, get or getItem
store.set('foo', 1);
store.get('foo'); // 1

// flush
store.clear();
store.get('foo'); // undefined
```

sessionStorage
```js
var session = require('storge-js').session;

session.set('foo', 1);
session.get('foo'); // 1
```

##Expiration
Keys can expire by setting a time-to-live (in ms):
```js
store.set('foo', 1, 60 * 1000);
// or
store.set('foo', 1, { ttl: 60 * 1000 });
```
The next time the key is accessed, if it has expired it
will be removed and `undefined` will be returned. This works
across page loads.

##Namespacing and Versioning
The store can be namespaced and versioned by passing the name and semver
to storge-js. A namespaced store will not clash with other
stores (even non-namespaced and unversioned stores!).
```js
var testStore = require('storge-js')('TEST');
// shows up in localStorage as 'TEST_0.0.0_foo'
testStore.set('foo', 1);
    .get('foo'); // 1

var testStore2 = require('storge-js')('TEST', '1.1.2');
// shows up in localStorage as 'TEST_1.1.2_foo'
testStore2.set('foo', 2);
    .get('foo'); // 2

testStore2.keys(); ['foo']
// TEST_0.0.0_foo will still be in storage
testStore2.clear();
```

##Migration
Setup a migration by passing a migration config to the store. Each
migration config handles a single migration step and key:
```js
store.migration({
    from: '0.0.0',
    to:   '0.0.1',
    key:  'foo',
    process: function(oldData) {
        return newData;
    }
});
```
To migrate, simply call `.migrate()` on the store. To delete deprecated
versions, call `.deprecate()`.

##Nice to haves
No need to `JSON.stringify` or `JSON.parse` your values, storge-js does it for you
```js
store.set('foo', { bar: 1 });
store.get('foo'); // { bar: 1 }
```

Set multiple keys and values.
```js
store.set({ foo: 1, bar: 2 });
```

Get or remove multiple values.
```js
store.get(['foo', 'bar']); // [1, 2]
store.remove(['foo', 'bar']);
```

##Dangerous methods
`.flush()` will wipe the entire store, regardless of namespace and versioning.
`.backup()` will create an object of all key-value pairs in the store without
escaping store-specific keys.

#Tests
`npm install && npm test` for unit tests
`npm run browser` for in-browser testing

#License
The MIT License (MIT)

Copyright (c) 2014 Joseph Clay

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.