var assert = require('assert');

exports.common = require('./../helpers/stores')({store: 'mongodb', database: 'dev'});

exports.spec = {
  'GIVEN a new mongo store': {
    'WHEN we try to instantiate it without a database': {
      topic: [{store: 'mongodb'}],

      'THEN it should raise an error': function (topic) {
        assert.throws(function () {
          require('./../..').store.apply(this, topic);
        }, Error);
      }
    },

    'WHEN we try to instantiate it with a database': {
      topic: [{store: 'mongodb', database: 'dev'}, function () {}],

      'THEN it should NOT raise an error': function (topic) {
        assert.doesNotThrow(function () {
          require('./../..').store.apply(this, topic);
        }, Error);
      }
    }
  },

  'GIVEN a correct mongo store': {
    topic: function () {
      var self = this;
      require('./../..').store({store: 'mongodb', database: 'dev'}, function (error, mongoStore) {
        mongoStore.collection.remove();
        self.callback(null, mongoStore);
      });
    },

    'WHEN we INSERT a translation': {
      topic: function (mongoStore) {
        var self = this;
        mongoStore.set('Hello', 'Hola', 'es', function (err, data) {
          self.callback(err, data, mongoStore);
        });
      },

      // CLEAN this. I still don't get how vow deals with async...
      'THEN it should be inserted correctly to the database': function (error, element, mongoStore) {
        mongoStore.get('Hello', 'es', function (err, data) {
          assert.equal(data.locale, 'es');
          assert.equal(data.original, 'Hello');
          assert.equal(data.translation, 'Hola');

          var funk = require('./../../support/funk/lib/funk')();

          mongoStore.length('es', funk.add(function (err, length) {
            assert.equal(length, 1);
          }));

          mongoStore.length('en', funk.add(function (err, length) {
            assert.isZero(length);
          }));

          funk.parallel(function () {
            mongoStore.destroy('Hello', 'es', function (err, data) {
              // not found
              mongoStore.get('Hello', 'es', function (err, data) {
                assert.isUndefined(data);
              });

              mongoStore.length('es', function (err, length) {
                assert.isZero(length);
              });
            });
          });
        });
      }
    }
  }
};
