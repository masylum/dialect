var testosterone = require('testosterone')({title: 'Mongodb store'}),
    assert = testosterone.assert,
    STORE = require('../../lib/stores/mongodb'),
    gently = global.GENTLY = new (require('gently'));

testosterone

  ////////////////////////////////////////////
  // connect
  ////////////////////////////////////////////

  .add('GIVEN a call to `connect` \n' +
       '  WHEN no `callback` is given \n' +
       '  THEN it should provide with a default one \n' +
       '  AND return the `collection` or `error`', function (spec) {

    spec(function () {
      var db = {},
          store = STORE();

      // error
      gently.expect(store.db, 'open', function (cb) {
        cb('foo', null);
      });

      store.connect(function (err, coll) {
        assert.equal(err, 'foo');
        assert.equal(coll, null);
        assert.equal(store.collection, null);
      });

      // data
      gently.expect(store.db, 'open', function (cb) {
        cb(null, db);
      });

      gently.expect(db, 'collection', function (coll, cb) {
        cb('blah', 'bar');
      });

      store.connect(function (err, coll) {
        assert.equal(err, 'blah');
        assert.equal(coll, 'bar');
        assert.equal(store.collection, 'bar');
      });

    })();
  })

  ////////////////////////////////////////////
  // get
  ////////////////////////////////////////////

  .add('GIVEN a call to `get` \n' +
       '  WHEN no `callback` is given \n' +
       '  THEN it should provide with a default one \n' +
       '  AND return the translation according to `query`', function (spec) {

    spec(function () {
      var store = STORE();

      store.collection = {};

      // error
      gently.expect(store.collection, 'find', function (query, cb) {
        assert.deepEqual(query, {});
        assert.ok(cb);
        cb('foo', null);
      });

      store.get(null, function (err, doc) {
        assert.equal(err, 'foo');
        assert.equal(doc, null);
      });

      // data
      gently.expect(store.collection, 'find', function (query, cb) {
        var cursor = {};
        assert.deepEqual(query, {foo: 'bar'});
        assert.ok(cb);

        gently.expect(cursor, 'toArray', function (cb) {
          cb('foo', [{hey: 'ya'}]);
        });
        cb(null, cursor);
      });

      store.get({foo: 'bar'}, function (err, doc) {
        assert.equal(err, 'foo');
        assert.deepEqual(doc, [{hey: 'ya'}]);
      });

    })();
  })

  ////////////////////////////////////////////
  // add
  ////////////////////////////////////////////

  .add('GIVEN a call to `add` \n' +
       '  WHEN no `callback` is given \n' +
       '  THEN it should provide with a default one \n' +
       '  AND add the `translation` if is not on the store', function (spec) {

    spec(function () {
      var store = STORE(),
          original = {original: 'hello'},
          new_doc = {original: 'hello', translation: 'hola'};

      store.collection = {};

      // error
      gently.expect(store.collection, 'findOne', function (query, cb) {
        assert.deepEqual(query, original);
        assert.ok(cb);
        cb('foo', null);
      });

      store.add(original, 'hola', function (err, doc) {
        assert.equal(err, 'foo');
        assert.equal(doc, null);
      });

      // no error, no data
      gently.expect(store.collection, 'findOne', function (query, cb) {
        assert.deepEqual(query, original);
        assert.ok(cb);
        cb(null, {original: 'hello', translation: 'hola'});
      });

      store.add(original, 'hola', function (err, doc) {
        assert.ok(err);
        assert.equal(doc, null);
      });

      // data
      gently.expect(store.collection, 'findOne', function (query, cb) {
        assert.deepEqual(query, original);
        assert.ok(cb);
        gently.expect(store.collection, 'insert', function (doc, cb) {
          assert.deepEqual(doc, new_doc);
          assert.ok(cb);
          cb(null, new_doc);
        });
        cb(null, null);
      });

      store.add(original, 'hola', function (err, doc) {
        assert.equal(err, null);
        assert.equal(doc, new_doc);
      });

    })();
  })

  ////////////////////////////////////////////
  // set
  ////////////////////////////////////////////

  .add('GIVEN a call to `set` \n' +
       '  WHEN no `callback` is given \n' +
       '  THEN it should provide with a default one \n' +
       '  AND update the translations according to `query` and `update`', function (spec) {

    spec(function () {
      var store = STORE(),
          original = {original: 'hello'},
          translation = {translation: 'hola'},
          new_doc = {original: 'hello', translation: 'hola'};

      store.collection = {};

      gently.expect(store.collection, 'update', function (query, update, cb) {
        assert.deepEqual(query, original);
        assert.deepEqual(update, {'$set': translation});
        assert.ok(cb);
        cb('foo', new_doc);
      });

      store.set(original, translation, function (err, doc) {
        assert.equal(err, 'foo');
        assert.equal(doc, new_doc);
      });

    })();
  })

  ////////////////////////////////////////////
  // destroy
  ////////////////////////////////////////////

  .add('GIVEN a call to `destroy` \n' +
       '  WHEN no `callback` is given \n' +
       '  THEN it should provide with a default one \n' +
       '  AND remove the translation according to `query`', function (spec) {

    spec(function () {
      var store = STORE(),
          original = {original: 'hello'};

      store.collection = {};

      gently.expect(store.collection, 'remove', function (query, cb) {
        assert.deepEqual(query, original);
        assert.ok(cb);
        cb('foo', original);
      });

      store.destroy(original, function (err, doc) {
        assert.equal(err, 'foo');
        assert.equal(doc, original);
      });

    })();
  })

  ////////////////////////////////////////////
  // count
  ////////////////////////////////////////////

  .add('GIVEN a call to `count` \n' +
       '  WHEN no `callback` is given \n' +
       '  THEN it should provide with a default one \n' +
       '  AND count the translations according to `query`', function (spec) {

    spec(function () {
      var store = STORE(),
          original = {original: 'hello'};

      store.collection = {};

      gently.expect(store.collection, 'count', function (query, cb) {
        assert.deepEqual(query, original);
        assert.ok(cb);
        cb('foo', 3);
      });

      store.count(original, function (err, doc) {
        assert.equal(err, 'foo');
        assert.equal(doc, 3);
      });

    })();
  })

  .serial(function () { });
