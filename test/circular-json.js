//remove:
var CircularJSON = require('../build/circular-json.node.js');
//:remove

wru.test([
  {
    name: 'simulating special char',
    test: function () {
      var special = "\\x7e"; // \x7e is ~
      //wru.log(CircularJSON.stringify({a:special}));
      //wru.log(CircularJSON.parse(CircularJSON.stringify({a:special})).a);
      wru.assert('no problem with simulation', CircularJSON.parse(CircularJSON.stringify({a:special})).a === special);
      special = "~\\x7e";
      wru.assert('no problem with special', CircularJSON.parse(CircularJSON.stringify({a:special})).a === special);
    }
  },
  {
    name: "CircularJSON",
    test: function () {
      var o = {a: 'a', b: 'b', c: function(){}, d: {e: 123}},
          a, b;
      wru.assert('loaded', typeof CircularJSON == "object");
      wru.assert('works as JSON.stringify',
        (a = JSON.stringify(o)) === (b = CircularJSON.stringify(o)));
      wru.assert('works as JSON.parse',
        JSON.stringify(JSON.parse(a)) === JSON.stringify(CircularJSON.parse(b)));
      wru.assert('accept callback', CircularJSON.stringify(o, function(key, value){
        if (!key || key === 'a') return value;
      }) === '{"a":"a"}');
      wru.assert('revive callback', JSON.stringify(
        CircularJSON.parse('{"a":"a"}', function(key, value){
          if (key === 'a') return 'b';
          return value;
        })
      ) === '{"a":"b"}');
    }
  },{
    name: 'recursion',
    test: function () {
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
      wru.assert('recreated original structure',
        o.b === o.c &&
        o.c.e === o &&
        o.d.a === 123 &&
        o.d.b === o &&
        o.c.f === o.d &&
        o.b === o.c
      );
    }
  },{
    name: 'recursion And Functions',
    test: function () {
      var o = {};
      o.a = o;
      o.b = o;
      wru.assert('callback invoked',
        CircularJSON.stringify(o, function (key, value) {
          if (!key || key === 'a') return value;
        }) === '{"a":"~"}'
      );
      o = CircularJSON.parse('{"a":"~"}', function (key, value) {
        if (!key) {
          value.b = value;
        }
        return value;
      });
      wru.assert('reviver invoked',
        o.a === o && o.b === o
      );
    }
  },{
    name: 'try to screw logic',
    test: function () {
      var o = {};
      o['~'] = o;
      o['\\x7e'] = '\\x7e';
      o.test = '~';

      //wru.log(CircularJSON.stringify(o));
      //wru.log(CircularJSON.parse(CircularJSON.stringify(o)));

      o = CircularJSON.parse(CircularJSON.stringify(o));
      wru.assert('still intact', o['~'] === o && o.test === '~');
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
      wru.assert('restructured',
        o === o.a[3] &&
        o === o.o &&
        o['~'] === o.a &&
        o['~~'] === o.a &&
        o['~~~'] === o.a &&
        o.a === o.a[3].a &&
        o.a.pop() === o &&
        o.a.join('') === '~~~~~~'
      );
    }
  },{
    name: 'doNotResolve',
    test: function () {
      var o = {a:[1,2,3]};
      o.o = o;
      o.a.push(o);
      o = CircularJSON.parse(CircularJSON.stringify(o, null, null, true));
      wru.assert('no way to retrieve the path', o.o === '[Circular]');
      wru.assert('same structure though', o.a[3] === '[Circular]');
    }
  },{
    name: 'should pass the right context',
    test: function () {
      var found = false, o = {};
      o.o = o;
      CircularJSON.stringify(o, function (key, value) {
        if (!found && this === o) {
          found = true;
        }
        return value;
      });
      wru.assert(found);
    }
  }, {
    name: 'nested arrays with breaking string (BUG#7)',
    test: function() {
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
      wru.assert('string is correct', str === '{"outer":[{"a":"b","c":"d","one":{"name":"TEST","value":"~outer~0~one"},"many":["~outer~0~one"],"e":"f"}]}');
      wru.assert('object too',
        original.outer[0].one.name === output.outer[0].one.name &&
        original.outer[0].many[0].name === output.outer[0].many[0].name &&
        output.outer[0].many[0] === output.outer[0].one
      );
    }
  }, {
    name: 'nested this',
    test: function () {
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
      wru.assert('string is OK', str === '{"prop":{"value":123},"a":[{},{"b":[{"a":1,"d":2,"c":{"a":"sup"},"z":{"g":2,"a":"~a~1~b~0~c","b":{"r":4,"u":"~a~1~b~0~c","c":5},"f":6},"h":1}]}],"b":{"e":"f","t":"~a~1~b~0~c","p":4}}');
      output = CircularJSON.parse(str);
      wru.assert('so is the obejct', output.b.t.a === 'sup' && output.a[1].b[0].c === output.b.t);
    }
  }
  ,{
    name: 'json with tilde in value',
    test: function() {
      var o = {bar: 'something ~ baz'};
      var s = CircularJSON.stringify(o);
      wru.log('string: ' + s);
      wru.assert('string is correct', s === '{"bar":"something \\\\x7e baz"}');
      var oo = CircularJSON.parse(s);
      wru.log(oo);
      wru.assert('parse is correct', oo.bar === o.bar);
      
    }
  }/*
  ,{
    name: 'reviver',
    test: function() {
      var o = {'~':'~'};
      o.o = o;
      o.a = [o];
      o.r = {a:o.a};
      o.z = {a:o.a};
      var s = CircularJSON.stringify(o);
      wru.log(s);
      var calls = [];
      o = CircularJSON.parse('{"a":[{}]}', function (key, value) {
        //calls.push(key, value);
        console.log(value);
        if (value instanceof Array) {
          value[0] = new String('');
        }
        return value;
      });
      //wru.log(calls.o);
      JSON.parse('{"a":[{}]}', function (key, value) {
        console.log(value);
        if (value instanceof Array) {
          value[0] = 123;
        }
        return value;
      });
    }
  }//*/
]);
