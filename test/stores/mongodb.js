GLOBAL.inspect = require('eyes').inspector({ styles: { all:     'yellow', label:   'underline', other:   'inverted', key:     'bold', special: 'grey', string:  'green', number:  'red', bool:    'blue', regexp:  'green' }, maxLength: 9999999999 });

var suite = require('./../../support/vows/lib/vows').describe('mongodb'),
    assert = require('assert');

suite
.addBatch({
  'GIVEN a mongo store': {
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
  }
}).run();

