storge-js
=========

simple local and session storage wrapper

```js
npm install storge-js
```

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

##Namespacing
the store can be namespaced by invoking storge with a string
```js
var testStore = require('storge-js')('TEST');

testStore.set('foo', 1); // shows up in localStorage as 'TEST_foo'
    .get('foo'); // 1
```

##Expiration
keys can expire by setting a time-to-live:
```js
store.set('foo', 1, {
  ttl: 60 * 1000 // in ms
});
```
The next time the key is accessed, if it has expired it
will be removed and `undefined` will be returned. This works
across page loads.

##Nice to haves
set multiple keys and values
```js
store.set({
    foo: 1,
    bar: 2
});
```

get or remove multiple values
```js
store.get(['foo', 'bar']); // [1, 2]
store.remove(['foo', 'bar']);
```

