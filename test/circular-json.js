//remove:
var CircularJSON = require('../build/circular-json.node.js');
//:remove

wru.test([
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
      o.test = '~';
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
  }/*
  ,{
    name: 'reviver',
    test: function() {
      var o = {'~':'~'};
      o.o = o;
      o.a = [o];
      var s = CircularJSON.stringify(o);
      console.log(s);
      var calls = [];
      o = CircularJSON.parse(s, function (key, value) {
        calls.push(key, value);
        if (value instanceof Array) {
          calls.o = value[0].constructor;
        }
        return value;
      });
      console.log(calls.o);
    }
  }//*/
]);
