storge-js
=========

simple local and session storage wrapper

```js
npm install storge-js
```

Examples
=========

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

keys can also expire:
```js
var store = require('storge-js');

store.set('foo', 1, {
  ttl: 60 * 1000 // in ms
});
```
