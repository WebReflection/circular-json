CircularJSON
============

[![build status](https://secure.travis-ci.org/WebReflection/circular-json.png)](http://travis-ci.org/WebReflection/circular-json)

### A Working Solution To A Common Problem
A usage example:

```JavaScript
var object = {};
object.arr = [
  object, object
];
object.arr.push(object.arr);
object.obj = object;

var serialized = CircularJSON.stringify(object);
// '{"arr":["~","~","~arr"],"obj":"~"}'
// NOTE: CircularJSON DOES NOT parse JS
// it handles receiver and reviver callbacks

var unserialized = CircularJSON.parse(serialized);
// { arr: [ [Circular], [Circular] ],
// obj: [Circular] }

unserialized.obj === unserialized;
unserialized.arr[0] === unserialized;
unserialized.arr.pop() === unserialized.arr;
```

A quick summary:

  * same as `JSON.stringify` and `JSON.parse` methods with same type of arguments (same JSON API, an extra optional argument has been added to `.stringify()` to support simple placeholder)
  * reasonably fast in both serialization and deserialization
  * compact serialization for easier and slimmer transportation across environments
  * [tested and covered](test/circular-json.js) over nasty structures too
  * compatible with all JavaScript engines
  * possibility to do not resolve circular references via extra argument. As example, `CircularJSON.stringify(data, null, null, true)` can produce an output with `"[Circular]"` placeholder as other implementations might do.


### Dependencies
A proper **JSON** object must be globally available if the browser/engine does not support it.

Dependencies free if you target IE8 and greater or any server side JS engine.

Bear in mind `JSON.parse(CircularJSON.stringify(object))` will work but not produce the expected output.

It is also *a bad idea* to `CircularJSON.parse(JSON.stringify(object))` because of those manipulation used in `CircularJSON.stringify()` able to make parsing safe and secure.

As summary: `CircularJSON.parse(CircularJSON.stringify(object))` is the way to go, same is for `JSON.parse(JSON.stringify(object))`.


### Which Version
The usual structure for my repos, the one generated via [gitstrap](https://github.com/WebReflection/gitstrap), so:

  * all browsers, generic, as [global CircularJSON object](build/circular-json.js)
  * [node.js module](build/circular-json.node.js), also via `npm install circular-json` and later on `var CircularJSON = require('circular-json')`
  * [AMD module](build/circular-json.amd.js) loader, as CircularJSON object

The **API** is the **same as JSON Object** so nothing new to learn here while [full test coverage](test/circular-json.js) is also in the usual place with some example included.


### Why Not the [@izs](https://twitter.com/izs) One
The module [json-stringify-safe](https://github.com/isaacs/json-stringify-safe) seems to be for `console.log()`  but it's completely pointless for `JSON.parse()`, being latter one unable to retrieve back the initial structure. Here an example:

```JavaScript
// a logged object with circular references
{
  "circularRef": "[Circular]",
  "list": [
    "[Circular]",
    "[Circular]"
  ]
}
// what do we do with above output ?
```

Just type this in your `node` console: `var o = {}; o.a = o; console.log(o);`. The output will be `{ a: [Circular] }` ... good, but that ain't really solving the problem.

However, if that's all you need, the function used to create that kind of output is probably faster than `CircularJSON` and surely fits in less lines of code.


### Why Not {{put random name}} Solution
So here the thing: circular references can be wrong but, if there is a need for them, any attempt to ignore them or remove them can be considered just a failure.

Not because the method is bad or it's not working, simply because the circular info, the one we needed and used in the first place, is lost!

In this case, `CircularJSON` does even more than just solve circular and recursions: it maps all same objects so that less memory is used as well on deserialization as less bandwidth too!
It's able to redefine those references back later on so the way we store is the way we retrieve and in a reasonably performant way, also trusting the snappy and native `JSON` methods to iterate.