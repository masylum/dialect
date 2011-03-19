var testosterone = require('testosterone')({title: 'Dialect core', sync: true}),
    assert = testosterone.assert,
    gently = global.GENTLY = new (require('gently')),
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
       '  THEN it should throw an error', function () {
    assert.throws(function () {
      dialect();
    });
  })

  .add('  WHEN no `base_locale` or `current_locale` given \n' +
       '  THEN it should use `en` as default', function () {
    var options = {store: {mongodb: {}}},
        d = dialect(options);

    assert.deepEqual(d.config('base_locale'), 'en');
    assert.deepEqual(d.config('current_locale'), 'en');
  })

  .add('  WHEN no `locales` given \n' +
       '  THEN it should use `[en]` as default', function () {
    var options = {store: {mongodb: {}}},
        d = dialect(options);

    assert.deepEqual(d.config('locales'), ['en']);
  })

  ////////////////////////////////////////////
  // config
  ////////////////////////////////////////////

  .add(' GIVEN a call to config \n' +
       '  WHEN just param `key` is given \n' +
       '  THEN it should return `_option[key]`', function () {
    var options = {store: {mongodb: {}}, base_locale: 'en'},
        d = dialect(options);

    assert.equal(d.config('base_locale'), 'en');
  })

  .add('  WHEN no params given \n' +
       '  THEN it should return the whole `_option`', function () {
    var options = {store: {mongodb: {}}, base_locale: 'en'},
        d = dialect(options);

    assert.deepEqual(d.config(), {store: {mongodb: {}}, base_locale: 'en', current_locale: 'en', locales: ['en']});
  })

  .add('  WHEN `key` and `value` params given \n' +
       '  THEN it should set the `_option[key]` to `value`', function () {
    var options = {store: {mongodb: {}}, base_locale: 'en'},
        d = dialect(options);

    d.config('base_locale', 'es');

    assert.equal(d.config('base_locale'), 'es');
  })

  ////////////////////////////////////////////
  // sync
  ////////////////////////////////////////////

  .add('GIVEN a call to `sync` \n' +
       '  WHEN asking for a `locale` \n' +
       '  THEN should call `cacheDicionary` of `IO`', function () {

    var store = {mongodb: {}},
        options = {locales: ['en', 'es'], store: store},
        io = _stubIO(),
        d = dialect(options),
        cb = function () { };

    gently.expect(io, 'cacheDictionary', function (locale, cb) {
      assert.equal(locale, 'en');
      assert.ok(cb);
    });

    d.sync({locale: 'en'}, cb);
  })

  .add('  WHEN not asking for a `locale` \n' +
       '  THEN should call `cacheDicionary` for each locale', function () {

    var store = {mongodb: {}},
        options = {locales: ['en', 'es'], store: store},
        io = _stubIO(),
        d = dialect(options),
        cb = function () { };

    options.locales.forEach(function (l) {
      gently.expect(io, 'cacheDictionary', function (locale, cb) {
        assert.equal(locale, l);
        assert.ok(cb);
      });
    });
    d.sync({}, cb);

  })

  .add('  WHEN passing a `interval` \n' +
       '  THEN should call `cacheDicionary` every `interval` seconds', function () {

    var store = {mongodb: {}},
        options = {locales: ['en', 'es'], store: store},
        io = _stubIO(),
        d = dialect(options),
        cb = function () { };

    gently.expect(io, 'cacheDictionary', function (locale, cb) {
      assert.equal(locale, 'es');
      assert.ok(cb);
      cb();
    });

    gently.expect(require('timers'), 'setInterval', function (fn, delay) {
      assert.ok(fn);
      assert.equal(delay, 3000);
    });

    d.sync({locale: 'es', interval: 3000}, cb);
  })

  ////////////////////////////////////////////
  // set
  ////////////////////////////////////////////

  .add('GIVEN a call to `set` \n' +
       '  WHEN `query.original` or `query.locale` or `translation` is missing \n' +
       '  THEN an error should be thrown', function () {

    var options = {locales: ['en', 'es'], store: {mongodb: {}}},
        d = dialect(options);

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
       '  THEN should set the translation to the `store`', function () {

    var store = {mongodb: {}},
        query = {original: 'hello', locale: 'foo'},
        translation = 'foola',
        options = {locales: ['en', 'es'], store: store},
        callback = function (err, data) {
          assert.equal(err, 'foo');
          assert.equal(data, 'bar');
        },
        d = dialect(options);

    gently.expect(d.store, 'set', function (q, u, cb) {
      assert.deepEqual(q, query);
      assert.deepEqual(u, {translation: translation});
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
       '  THEN an error should be thrown', function () {

    var options = {locales: ['en', 'es'], store: {mongodb: {}}},
        d = dialect(options);

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
       '  THEN should return the parsed translation from memory', function () {

    var options = {locales: ['en', 'es', 'sl'], store: {mongodb: {}}, current_locale: 'es'},
        d = dialect(options);

    d.dicionaries = {};

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
       '  AND should return original in singular or plural form', function () {

    var store = {mongodb: {}},
        options = {locales: ['en', 'es'], current_locale: 'es', store: store},
        d = dialect(options),
        stub_add = function (original) {
          gently.expect(d.store, 'add', function (q, u, cb) {
            assert.deepEqual(q, {original: original, locale: 'es'});
            assert.deepEqual(u, undefined);
          });
        };

    d.dictionaries = {es: {foo: 'bar'}};

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
