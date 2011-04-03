var testosterone = require('testosterone')({title: 'SQLite store', sync: true}),
    assert = testosterone.assert,
    SQLITE = require('../../lib/stores/sqlite'),
    gently = global.GENTLY = new (require('gently'));

testosterone

  ////////////////////////////////////////////
  // connect
  ////////////////////////////////////////////

  .add('GIVEN a call to `connect` \n' +
       '  WHEN no `callback` is given \n' +
       '  THEN it should provide with a default one \n' +
       '  AND return the `collection` or `error`', function () {

    var db = {},
        store = SQLITE({table: 'test'});

    // error
    gently.expect(store.db, 'open', function (database, cb) {
      assert.equal(database, 'dialect.db');
      cb('foo', null);
    });

    store.connect(function (err, coll) {
      assert.equal(err, 'foo');
      assert.equal(coll, null);
      assert.equal(store.is_connected(), false);
    });

    // data
    gently.expect(store.db, 'open', function (database, cb) {
      assert.equal(database, 'dialect.db');
      cb(null, db);
    });

    gently.expect(store.db, 'execute', function (sql, cb) {
      assert.equal(sql,
        'CREATE TABLE IF NOT EXISTS test' +
        ' (original TEXT, locale TEXT, translation TEXT,' +
        ' plural NUMBER, context TEXT, PRIMARY KEY(original, locale, plural, context))'
      );

      cb('foo', 'bar');
    });

    store.connect(function (err, data) {
      assert.equal(err, 'foo');
      assert.equal(data, 'bar');
      assert.equal(store.is_connected(), true);
    });
  })

  ////////////////////////////////////////////
  // get
  ////////////////////////////////////////////

  .add('GIVEN a call to `get` \n' +
       '  WHEN no `callback` is given \n' +
       '  THEN it should provide with a default one \n' +
       '  AND return the translation according to `query`', function () {

    var store = SQLITE();

    store.collection = {};

    // error
    gently.expect(store.db, 'execute', function (sql, cb) {
      assert.equal(sql, "SELECT * FROM dialect WHERE original = 'foo'");
      assert.ok(cb);
      cb('foo', null);
    });

    store.get({original: 'foo'}, function (err, doc) {
      assert.equal(err, 'foo');
      assert.deepEqual(doc, []);
    });

    // data
    gently.expect(store.db, 'execute', function (sql, cb) {
      assert.equal(sql, "SELECT * FROM dialect WHERE original = 'foo'");
      assert.ok(cb);
      cb(null, 'foo');
    });

    store.get({original: 'foo'}, function (err, doc) {
      assert.equal(err, null);
      assert.equal(doc, 'foo');
    });
  })

  ////////////////////////////////////////////
  // add
  ////////////////////////////////////////////

  .add('GIVEN a call to `add` \n' +
       '  WHEN no `callback` is given \n' +
       '  THEN it should provide with a default one \n' +
       '  AND add the `translation` if is not on the store', function () {

    var store = SQLITE(),
        original = {original: 'hello'},
        new_doc = {original: 'hello', translation: 'hola'};

    store.collection = {};

    // error on get
    gently.expect(store, 'get', function (doc, cb) {
      assert.deepEqual(doc, original);
      assert.ok(cb);
      cb('foo', []);
    });

    store.add(original, 'hola', function (err, doc) {
      assert.equal(err, 'foo');
      assert.equal(doc, null);
    });

    // already exists
    gently.expect(store, 'get', function (doc, cb) {
      assert.deepEqual(doc, original);
      assert.ok(cb);
      cb(null, [new_doc]);
    });

    store.add(original, 'hola', function (err, doc) {
      assert.ok(err);
    });

    // success
    gently.expect(store, 'get', function (doc, cb) {
      assert.deepEqual(doc, original);
      assert.ok(cb);
      cb(null, []);
    });

    gently.expect(store.db, 'execute', function (sql, cb) {
      assert.equal(sql, "INSERT INTO dialect (original, translation, approved) VALUES ('hello', 'hola', 0)");
      assert.ok(cb);
      cb(null, []);
    });

    store.add(original, 'hola', function (err, doc) {
      assert.equal(err, null);
      assert.deepEqual(doc, []);
    });
  })

  ////////////////////////////////////////////
  // set
  ////////////////////////////////////////////

  .add('GIVEN a call to `set` \n' +
       '  WHEN no `callback` is given \n' +
       '  THEN it should provide with a default one \n' +
       '  AND update the translations according to `query` and `translation`', function () {

    var store = SQLITE();

    store.collection = {};

    gently.expect(store.db, 'execute', function (sql, cb) {
      assert.equal(sql, "UPDATE dialect SET translation = 'bar', approved = 0 WHERE original = 'foo'");
      assert.ok(cb);
      cb('foo', 'bar');
    });

    store.set({original: 'foo'}, 'bar', function (err, doc) {
      assert.equal(err, 'foo');
      assert.deepEqual(doc, 'bar');
    });
  })

  ////////////////////////////////////////////
  // approve
  ////////////////////////////////////////////

  .add('GIVEN a call to `approve` \n' +
       '  WHEN no `callback` is given \n' +
       '  THEN it should provide with a default one \n' +
       '  AND update the translations according to `query` and `approved`', function () {

    var store = SQLITE();

    store.collection = {};

    gently.expect(store.db, 'execute', function (sql, cb) {
      assert.equal(sql, "UPDATE dialect SET approved = 1 WHERE original = 'foo'");
      assert.ok(cb);
      cb('foo', 'bar');
    });

    store.approve({original: 'foo'}, true, function (err, doc) {
      assert.equal(err, 'foo');
      assert.deepEqual(doc, 'bar');
    });
  })

  ////////////////////////////////////////////
  // destroy
  ////////////////////////////////////////////

  .add('GIVEN a call to `destroy` \n' +
       '  WHEN no `callback` is given \n' +
       '  THEN it should provide with a default one \n' +
       '  AND remove the translation according to `query`', function () {

    var store = SQLITE(),
        original = {original: 'hello'};

    store.collection = {};

    gently.expect(store.db, 'execute', function (sql, cb) {
      assert.equal(sql, "DELETE FROM dialect WHERE original = 'foo'");
      assert.ok(cb);
      cb('foo', 'bar');
    });

    store.destroy({original: 'foo'}, function (err, doc) {
      assert.equal(err, 'foo');
      assert.deepEqual(doc, 'bar');
    });
  })

  ////////////////////////////////////////////
  // count
  ////////////////////////////////////////////

  .add('GIVEN a call to `count` \n' +
       '  WHEN no `callback` is given \n' +
       '  THEN it should provide with a default one \n' +
       '  AND count the translations according to `query`', function () {

    var store = SQLITE(),
        original = {original: 'hello'};

    store.collection = {};

    // error
    gently.expect(store.db, 'execute', function (sql, cb) {
      assert.equal(sql, "SELECT COUNT(*) FROM dialect WHERE original = 'foo'");
      assert.ok(cb);
      cb('foo', null);
    });

    store.count({original: 'foo'}, function (err, doc) {
      assert.equal(err, 'foo');
      assert.deepEqual(doc, 0);
    });

    // succes
    gently.expect(store.db, 'execute', function (sql, cb) {
      assert.equal(sql, "SELECT COUNT(*) FROM dialect WHERE original = 'foo'");
      assert.ok(cb);
      cb(null, [{count: 3}]);
    });

    store.count({original: 'foo'}, function (err, doc) {
      assert.equal(err, null);
      assert.deepEqual(doc, 3);
    });
  })

  .serial(function () { });
