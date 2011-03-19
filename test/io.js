var testosterone = require('testosterone')({title: 'IO helper lib', sync: true}),
    assert = testosterone.assert,
    gently = global.GENTLY = new (require('gently')),
    dialect = require('./..').dialect({locales: ['en', 'es'], current_locale: 'es', store: {mongodb: {}}}),
    io = require('./../lib/helpers/io').IO(dialect);

dialect.store = {};

testosterone

  ////////////////////////////////////////////
  // getKeyFromQuery
  ////////////////////////////////////////////

  .add(' GIVEN a call to `getKeyFromQuery` \n' +
       '  WHEN no `query.original` is provided \n' +
       '  THEN it should throw an error', function () {
    assert.throws(function () {
      io.getKeyFromQuery();
    });
    assert.throws(function () {
      io.getKeyFromQuery({foo: 'bar'});
    });
  })

  .add('  WHEN a query containing `original` and optional `count` and `context` \n' +
       '  THEN it should return a valid key', function () {
    assert.equal(io.getKeyFromQuery({original: 'foo'}), 'foo');
    assert.equal(io.getKeyFromQuery({original: 'foo', count: 0}), 'foo|p:2');
    assert.equal(io.getKeyFromQuery({original: 'foo', count: 1}), 'foo|p:1');
    assert.equal(io.getKeyFromQuery({original: 'foo', context: 'bar'}), 'foo|c:bar');
    assert.equal(io.getKeyFromQuery({original: 'foo', count: 0, context: 'bar'}), 'foo|p:2|c:bar');

    dialect.config('current_locale', 'fr');
    assert.equal(io.getKeyFromQuery({original: 'foo', count: 0}), 'foo|p:1');
  })

  ////////////////////////////////////////////
  // cacheDictionary
  ////////////////////////////////////////////

  .add(' GIVEN a call to `cacheDictionary` \n' +
       '  WHEN no `locale` is provided \n' +
       '  THEN it should throw an error', function () {
    assert.throws(function () {
      io.cacheDictionary();
    });
  })

  .add('  WHEN `locale` is provided \n' +
       '  THEN it should get the dictionary from the store \n' +
       '  AND cache it on memory', function () {
    gently.expect(dialect.store, 'get', function (query, cb) {
      assert.deepEqual(query, {locale: 'es'});
      assert.ok(query, cb);
      cb(null, [{original: 'hello', translation: 'hola'}]);
    });

    io.cacheDictionary('es', function (err, data) {
      assert.equal(err, null);
      assert.deepEqual(data, {hello: 'hola'});
    });

    assert.deepEqual(dialect.dictionaries.es, {hello: 'hola'});

    // with plural and contexts
    gently.expect(dialect.store, 'get', function (query, cb) {
      assert.deepEqual(query, {locale: 'es'});
      assert.ok(query, cb);
      cb(null, [{original: 'hello', translation: 'hola', context: 'salute', plural: 1}]);
    });

    io.cacheDictionary('es', function (err, data) {
      assert.equal(err, null);
      assert.deepEqual(data, {'hello|p:1|c:salute': 'hola'});
    });

    assert.deepEqual(dialect.dictionaries.es, {'hello|p:1|c:salute': 'hola'});
  })

  .serial(function () { });
