var tressa = tressa || require('tressa');

// running for 100% code coverage
var indexOf = Array.prototype.indexOf;
delete Array.prototype.indexOf;
var CircularJSON = CircularJSON || require('../build/circular-json.node.js');
Array.prototype.indexOf = indexOf;

tressa.title('CircularJSON');

(function () {
  var special = "\\x7e"; // \x7e is ~
  //tressa.log(CircularJSON.stringify({a:special}));
  //tressa.log(CircularJSON.parse(CircularJSON.stringify({a:special})).a);
  tressa.assert(CircularJSON.parse(CircularJSON.stringify({a:special})).a === special, 'no problem with simulation');
  special = "~\\x7e";
  tressa.assert(CircularJSON.parse(CircularJSON.stringify({a:special})).a === special, 'no problem with special char');
}());

(function () {
  var o = {a: 'a', b: 'b', c: function(){}, d: {e: 123}},
      a, b;
  tressa.assert(
    (a = JSON.stringify(o)) === (b = CircularJSON.stringify(o)),
    'works as JSON.stringify'
  );
  tressa.assert(
    JSON.stringify(JSON.parse(a)) === JSON.stringify(CircularJSON.parse(b)),
    'works as JSON.parse'
  );
  tressa.assert(
    CircularJSON.stringify(o, function(key, value){
      if (!key || key === 'a') return value;
    }) === '{"a":"a"}',
    'accept callback'
  );
  tressa.assert(
    JSON.stringify(
      CircularJSON.parse('{"a":"a"}', function(key, value){
        if (key === 'a') return 'b';
        return value;
      })
    ) === '{"a":"b"}',
    'revive callback'
  );
}());

(function () {
  var o = {}, before, after;
  o.a = o;
  o.c = {};
  o.d = {
    a: 123,
    b: o
  };
  o.c.e = o;
  o.c.f = o.d;
  o.b = o.c;
  before = CircularJSON.stringify(o);
  o = CircularJSON.parse(before);
  tressa.assert(
    o.b === o.c &&
    o.c.e === o &&
    o.d.a === 123 &&
    o.d.b === o &&
    o.c.f === o.d &&
    o.b === o.c,
    'recreated original structure'
  );
}());

(function () {
  var o = {};
  o.a = o;
  o.b = o;
  tressa.assert(
    CircularJSON.stringify(o, function (key, value) {
      if (!key || key === 'a') return value;
    }) === '{"a":"~"}',
    'callback invoked'
  );
  o = CircularJSON.parse('{"a":"~"}', function (key, value) {
    if (!key) {
      value.b = value;
    }
    return value;
  });
  tressa.assert(
    o.a === o && o.b === o,
    'reviver invoked'
  );
}());

(function () {
  var o = {};
  o['~'] = o;
  o['\\x7e'] = '\\x7e';
  o.test = '~';

  o = CircularJSON.parse(CircularJSON.stringify(o));
  tressa.assert(o['~'] === o && o.test === '~', 'still intact');
  o = {
    a: [
      '~', '~~', '~~~'
    ]
  };
  o.a.push(o);
  o.o = o;
  o['~'] = o.a;
  o['~~'] = o.a;
  o['~~~'] = o.a;
  o = CircularJSON.parse(CircularJSON.stringify(o));
  tressa.assert(
    o === o.a[3] &&
    o === o.o &&
    o['~'] === o.a &&
    o['~~'] === o.a &&
    o['~~~'] === o.a &&
    o.a === o.a[3].a &&
    o.a.pop() === o &&
    o.a.join('') === '~~~~~~',
    'restructured'
  );

}());

(function () {
  var o = {a:[1,2,3]};
  o.o = o;
  o.a.push(o);
  o = CircularJSON.parse(CircularJSON.stringify(o, null, null, true));
  tressa.assert(o.o === '[Circular]', 'no way to retrieve the path');
  tressa.assert(o.a[3] === '[Circular]', 'same structure though');
}());

(function () {
  var found = false, o = {};
  o.o = o;
  CircularJSON.stringify(o, function (key, value) {
    if (!found && this === o) {
      found = true;
    }
    return value;
  });
  tressa.assert(found);
}());

(function () {

  // make sure only own properties are parsed
  Object.prototype.shenanigans = true;

  var
    item = {
      name: 'TEST'
    },
    original = {
      outer: [
        {
          a: 'b',
          c: 'd',
          one: item,
          many: [item],
          e: 'f'
        }
      ]
    },
    str,
    output
  ;
  item.value = item;
  str = CircularJSON.stringify(original);
  output = CircularJSON.parse(str);
  tressa.assert(str === '{"outer":[{"a":"b","c":"d","one":{"name":"TEST","value":"~outer~0~one"},"many":["~outer~0~one"],"e":"f"}]}', 'string is correct');
  tressa.assert(
    original.outer[0].one.name === output.outer[0].one.name &&
    original.outer[0].many[0].name === output.outer[0].many[0].name &&
    output.outer[0].many[0] === output.outer[0].one,
    'object too'
  );

  delete Object.prototype.shenanigans;

}());

(function () {
  var
    unique = {a:'sup'},
    nested = {
      prop: {
        value: 123
      },
      a: [
        {},
        {b: [
          {
            a: 1,
            d: 2,
            c: unique,
            z: {
              g: 2,
              a: unique,
              b: {
                r: 4,
                u: unique,
                c: 5
              },
              f: 6
            },
            h: 1
          }
        ]}
      ],
      b: {
        e: 'f',
        t: unique,
        p: 4
      }
    },
    str = CircularJSON.stringify(nested),
    output
  ;
  tressa.assert(str === '{"prop":{"value":123},"a":[{},{"b":[{"a":1,"d":2,"c":{"a":"sup"},"z":{"g":2,"a":"~a~1~b~0~c","b":{"r":4,"u":"~a~1~b~0~c","c":5},"f":6},"h":1}]}],"b":{"e":"f","t":"~a~1~b~0~c","p":4}}', 'string is OK');
  output = CircularJSON.parse(str);
  tressa.assert(output.b.t.a === 'sup' && output.a[1].b[0].c === output.b.t, 'so is the object');
}());

(function () {
  var o = {bar: 'something ~ baz'};
  var s = CircularJSON.stringify(o);
  tressa.assert(s === '{"bar":"something \\\\x7e baz"}', 'string is correct');
  var oo = CircularJSON.parse(s);
  tressa.assert(oo.bar === o.bar, 'parse is correct');
}());

(function () {
  var o = {};
  o.a = {
    aa: {
      aaa: 'value1'
    }
  };
  o.b = o;
  o.c = {
    ca: {},
    cb: {},
    cc: {},
    cd: {},
    ce: 'value2',
    cf: 'value3'
  };
  o.c.ca.caa = o.c.ca;
  o.c.cb.cba = o.c.cb;
  o.c.cc.cca = o.c;
  o.c.cd.cda = o.c.ca.caa;

  var s = CircularJSON.stringify(o);
  tressa.assert(s === '{"a":{"aa":{"aaa":"value1"}},"b":"~","c":{"ca":{"caa":"~c~ca"},"cb":{"cba":"~c~cb"},"cc":{"cca":"~c"},"cd":{"cda":"~c~ca"},"ce":"value2","cf":"value3"}}', 'string is correct');
  var oo = CircularJSON.parse(s);
  tressa.assert(
  oo.a.aa.aaa = 'value1'
    && oo === oo.b
    && o.c.ca.caa === o.c.ca
    && o.c.cb.cba === o.c.cb
    && o.c.cc.cca === o.c
    && o.c.cd.cda === o.c.ca.caa
    && oo.c.ce === 'value2'
    && oo.c.cf === 'value3',
    'parse is correct'
  );
}());

(function () {
  var
    original = {
      a1: {
        a2: [],
        a3: [{name: 'whatever'}]
      },
      a4: []
    },
    json,
    restored
  ;

  original.a1.a2[0] = original.a1;
  original.a4[0] = original.a1.a3[0];

  json = CircularJSON.stringify(original);
  restored = CircularJSON.parse(json);

  tressa.assert(restored.a1.a2[0] === restored.a1, '~a1~a2~0 === ~a1');
  tressa.assert(restored.a4[0] = restored.a1.a3[0], '~a4 === ~a1~a3~0');
}());

if (typeof Symbol !== 'undefined') {
  (function () {
    var o = {a: 1};
    var a = [1, Symbol('test'), 2];
    o[Symbol('test')] = 123;
    tressa.assert(JSON.stringify(o) === CircularJSON.stringify(o), 'Symbol is OK too');
    tressa.assert(JSON.stringify(a) === CircularJSON.stringify(a));
  }());
}

(function () {
  var args = [{a:[1]}, null, '  '];
  tressa.assert(CircularJSON.stringify.apply(null, args) === JSON.stringify.apply(null, args), 'extra args same as JSON');
}());


if (!tressa.exitCode && typeof document !== 'udnefined') {
  document.body.style.backgroundColor = '#0FA';
}
tressa.end();