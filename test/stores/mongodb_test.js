GLOBAL.inspect = require('eyes').inspector({ styles: { all:     'yellow', label:   'underline', other:   'inverted', key:     'bold', special: 'grey', string:  'green', number:  'red', bool:    'blue', regexp:  'green' }, maxLength: 9999999999 });
var assert = require('assert');

exports.getCleanDatabase = function (callback) {
  require(__dirname + '/../..').store({store: 'mongodb', database: 'test'}, function (error, mongoStore) {
    mongoStore.collection.remove({}, function (err, data) {
      callback(null, mongoStore);
    });
  });
};

exports.common = require('./../helpers/stores')({store: 'mongodb', database: 'test'});

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
      topic: [{store: 'mongodb', database: 'test'}, function () {}],

      'THEN it should NOT raise an error': function (topic) {
        assert.doesNotThrow(function () {
          require('./../..').store.apply(this, topic);
        }, Error);
      }
    }
  },

  'GIVEN a correct mongo store': {
    topic: function () {
      exports.getCleanDatabase(this.callback);
    },

    'WHEN we INSERT a translation': {
      topic: function (mongoStore) {
        mongoStore.set('Hello', 'Hola', 'es', this.callback);
      },

      // CLEAN this rubish. I still don't get how vow deals with async...
      'THEN it should be inserted correctly to the database': function (error, mongoStore) {
        mongoStore.get({original: 'Hello', locale: 'es'}, function (err, data) {
          assert.equal(data[0].locale, 'es');
          assert.equal(data[0].original, 'Hello');
          assert.equal(data[0].translation, 'Hola');

          var funk = require('./../../support/funk/lib/funk')();

          mongoStore.length('es', funk.add(function (err, length) {
            assert.equal(length, 1);
          }));

          mongoStore.length('en', funk.add(function (err, length) {
            assert.isZero(length);
          }));

          funk.parallel(function () {
            mongoStore.destroy({original: 'Hello', locale: 'es'}, function (err, data) {
              // not found
              mongoStore.get({original: 'Hello', locale: 'es'}, function (err, data) {
                assert.isEmpty(data);
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
