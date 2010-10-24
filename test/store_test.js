GLOBAL.inspect = require('eyes').inspector({ styles: { all:     'yellow', label:   'underline', other:   'inverted', key:     'bold', special: 'grey', string:  'green', number:  'red', bool:    'blue', regexp:  'green' }, maxLength: 9999999999 });

var suite = require('./../support/vows/lib/vows').describe('STORE'),
    assert = require('assert');

suite
.addBatch({
  'GIVEN a store': {
    'WHEN we try to instantiate it without any params': {
      topic: [],

      'THEN it should raise an error': function (topic) {
        assert.throws(function () {
          require('./..').store.apply(this, topic);
        }, Error);
      }
    },

    'WHEN we try to instantiate it with an unexistant store': {
      topic: [{store: 'foo'}],

      'THEN it should raise an error': function (topic) {
        assert.throws(function () {
          require('./..').store.apply(this, topic);
        }, Error);
      }
    },

    'WHEN we try to instantiate it with a proper store': {
      topic: [{store: 'mongodb', database: 'bla'}],

      'THEN it should NOT raise a store error': function (topic) {
        assert.doesNotThrow(function () {
          require('./..').store.apply(this, topic);
        }, Error, "This store is not available");
      }
    }
  }
}).export(module);
