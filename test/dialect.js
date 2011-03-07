var testosterone = require('testosterone')({title: 'Dialect core'}),
    assert = testosterone.assert,
    gently = global.GENTLY = new (require('gently')),
    fs = require('fs'),
    dialect = require('./..').dialect,

    _stubIO = function () {
      var io = {};
      gently.expect(gently.hijacked['./helpers/io'], 'IO', function () {
        gently.restore(gently.hijacked['./helpers/io'], 'IO');
        return io;
      });
      return io;
    };

testosterone

  ////////////////////////////////////////////
  // General
  ////////////////////////////////////////////

  .add('GIVEN a dialect object being created \n' +
       '  WHEN no store is given \n' +
       '  THEN it should throw an error', function (spec) {
    spec();
    assert.throws(function () {
      dialect();
    });
  })

  .add('  WHEN no `base_locale` or `current_locale` given \n' +
       '  THEN it should use `en` as default', function (spec) {
    var options = {store: {}},
        d = dialect(options);

    spec(function () {
      assert.deepEqual(d.config('base_locale'), 'en');
      assert.deepEqual(d.config('current_locale'), 'en');
    })();
  })

  .add('  WHEN no `locales` given \n' +
       '  THEN it should use `[en]` as default', function (spec) {
    var options = {store: {}},
        d = dialect(options);

    spec(function () {
      assert.deepEqual(d.config('locales'), ['en']);
    })();
  })

  ////////////////////////////////////////////
  // config
  ////////////////////////////////////////////

  .add(' GIVEN a call to config \n' +
       '  WHEN just param `key` is given \n' +
       '  THEN it should return `_option[key]`', function (spec) {
    var options = {store: {}, base_locale: 'en'},
        d = dialect(options);

    spec(function () {
      assert.equal(d.config('base_locale'), 'en');
    })();
  })

  .add('  WHEN no params given \n' +
       '  THEN it should return the whole `_option`', function (spec) {
    var options = {store: {}, base_locale: 'en'},
        d = dialect(options);

    spec(function () {
      assert.deepEqual(d.config(), {store: {}, base_locale: 'en', current_locale: 'en', locales: ['en']});
    })();
  })

  .add('  WHEN `key` and `value` params given \n' +
       '  THEN it should set the `_option[key]` to `value`', function (spec) {
    var options = {store: {}, base_locale: 'en'},
        d = dialect(options);

    d.config('base_locale', 'es');

    spec(function () {
      assert.equal(d.config('base_locale'), 'es');
    })();
  })

  ////////////////////////////////////////////
  // reCache
  ////////////////////////////////////////////

  .add('GIVEN a call to `reCache` \n' +
       '  WHEN asking for a `locale` \n' +
       '  THEN should call `cacheDicionary` of `IO`', function (spec) {

    var store = {},
        options = {locales: ['en', 'es'], store: store},
        io = _stubIO(),
        d = dialect(options),
        cb = function () { };

    spec();

    gently.expect(io, 'cacheDictionary', function (locale, cb) {
      assert.equal(locale, 'en');
      assert.ok(cb);
    });
    d.reCache('en', cb);
  })

  ////////////////////////////////////////////
  // set
  ////////////////////////////////////////////

  .add('GIVEN a call to `set` \n' +
       '  WHEN `query.original` or `query.locale` or `translation` is missing \n' +
       '  THEN an error should be thrown', function (spec) {

    var options = {locales: ['en', 'es'], store: {}},
        d = dialect(options);

    spec();

    assert.throws(function () {
      d.set(null, null);
    });

    assert.throws(function () {
      d.set({original: 'foo'}, null);
    });

    assert.throws(function () {
      d.set({locale: 'foo'}, null);
    });

    assert.throws(function () {
      d.set({original: 'foo', locale: 'foo'}, null);
    });
  })

  .add('  WHEN `query.original` and `query.locale` and `translation` are valid \n' +
       '  THEN should set the translation to the `store`', function (spec) {

    var store = {},
        query = {original: 'hello', locale: 'foo'},
        translation = 'foola',
        options = {locales: ['en', 'es'], store: store},
        callback = function (err, data) {
          assert.equal(err, 'foo');
          assert.equal(data, 'bar');
        },
        d = dialect(options);

    spec();

    gently.expect(store, 'set', function (q, u, cb) {
      assert.deepEqual(q, query);
      assert.deepEqual(u, translation);
      assert.deepEqual(cb, callback);
      cb('foo', 'bar');
    });

    d.set({original: 'hello', locale: 'foo'}, translation, callback);
  })

  ////////////////////////////////////////////
  // get
  ////////////////////////////////////////////

  .add('GIVEN a call to `get` \n' +
       '  WHEN `original` is not provided or invalid (String|Array)  \n' +
       '  THEN an error should be thrown', function (spec) {

    var options = {locales: ['en', 'es'], store: {}},
        d = dialect(options);

    spec();

    assert.throws(function () {
      d.get();
    });

    [null, {foo: 'bar'}, true, '', [], /foo/].forEach(function (val) {
      assert.throws(function () {
        d.get(val);
      });
    });
  })

  .add('  WHEN `original` is valid and cached on memory \n' +
       '  THEN should return the parsed translation from memory', function (spec) {

    var options = {locales: ['en', 'es', 'sl'], store: {}, current_locale: 'es'},
        d = dialect(options);

    d.dicionaries = {};

    spec();

    // no params
    d.dictionaries.es = {'One cat': 'Un gato'};
    assert.equal(d.get('One cat'), 'Un gato');

    // params
    d.dictionaries.es = {'One {animal}': 'Un {animal}'};
    assert.equal(d.get(['One {animal}', {animal: 'gato'}]), 'Un gato');

    // plural
    d.dictionaries.es = {
      'My {animal}|p:1': 'Mi {animal}',
      'My {animal}|p:2': 'Mis {animal}'
    };
    assert.equal(d.get(['My {animal}', {animal: 'gatos', count: 2}]), 'Mis gatos');

    // more than 2 plurals
    d.config('current_locale', 'sl');
    d.dictionaries.sl = {
      '{count} beer|p:1': '{count} pivo',
      '{count} beer|p:2': '{count} pivi',
      '{count} beer|p:3': '{count} piva'
    };
    assert.equal(d.get(['{count} beer', '{count} beers', {count: 1}]), '1 pivo');
    assert.equal(d.get(['{count} beer', '{count} beers', {count: 2}]), '2 pivi');
    assert.equal(d.get(['{count} beer', '{count} beers', {count: 3}]), '3 piva');

    // context
    d.config('current_locale', 'es');
    d.dictionaries.es = {
      'Smart {animal}|c:clever': '{animal} espavilado',
      'Smart {animal}|c:elegant': '{animal} elegante'
    };
    assert.equal(d.get(['Smart {animal}', {animal: 'gato', context: 'elegant'}]), 'gato elegante');

    // all together
    d.dictionaries.es = {
      'My Smart {animal}|p:1|c:clever': 'Mi {animal} espavilado',
      'My Smart {animal}|p:2|c:clever': 'Mis {animal} elegantes',
      'My Smart {animal}|p:1|c:elegant': 'Mi {animal} elegante',
      'My Smart {animal}|p:2|c:elegant': 'Mis {animal} elegantes'
    };
    assert.equal(d.get(['My Smart {animal}', {animal: 'gatos', count: 2, context: 'elegant'}]), 'Mis gatos elegantes');
  })

  .add('  WHEN `original` is valid but not cached on memory \n' +
       '  THEN should try to store the new word on the `store` \n' +
       '  AND should return original in singular or plural form', function (spec) {

    var store = {},
        options = {locales: ['en', 'es'], current_locale: 'es', store: store},
        d = dialect(options),
        stub_add = function (original) {
          gently.expect(store, 'add', function (q, u, cb) {
            assert.deepEqual(q, {original: original, locale: 'es'});
            assert.deepEqual(u, undefined);
            assert.ok(cb);
            cb();
          });
        };

    d.dictionaries = {es: {foo: 'bar'}};

    spec();

    // no params
    stub_add('One cat');
    assert.equal(d.get('One cat'), 'One cat');

    // singular
    stub_add('cat');
    assert.equal(d.get(['cat', 'cats', {count: 1}]), 'cat');

    // plural
    stub_add('cat');
    assert.equal(d.get(['cat', 'cats', {count: 2}]), 'cats');
    stub_add('cat');
    assert.equal(d.get(['cat', 'cats', {count: 3}]), 'cats');
  })

  .serial(function () { });
