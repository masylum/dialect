GLOBAL.inspect = require('eyes').inspector({
  styles: {                 // Styles applied to stdout
    all:     'yellow',    // Overall style applied to everything
    label:   'underline', // Inspection labels, like 'array' in `array: [1, 2, 3]`
    other:   'inverted',  // Objects which don't have a literal representation, such as functions
    key:     'bold',      // The keys in object literals, like 'a' in `{a: 1}`

    special: 'grey',      // null, undefined...
    string:  'green',
    number:  'red',
    bool:    'blue',      // true false
    regexp:  'green'      // /\d+/
  },
  maxLength: 9999999999
});

var suite = require('./../support/vows/lib/vows').describe('dialect'),
    assert = require('assert'),
    dialect = require('./..').dialect({path: __dirname + '/data', base_locale: 'pt'});

dialect.config('locale', 'es');

suite.
addBatch({
  'GIVEN portuguese stuff to be translated': {
    'WHEN its a string': {
      topic: 'Chega',

      'THEN it returns the translation': function (topic) {
        assert.equal(dialect.translate(topic), 'Basta');
      }
    },

    'WHEN is an empty string': {
      topic: '',

      'THEN it returns ""': function (topic) {
        assert.equal(dialect.translate(topic), '');
      }
    },

    'WHEN is not a string': {
      topic: [[], {}, null, undefined, 1, /abc/],

      'THEN it returns ""': function (topic) {
        topic.forEach(function (element) {
          assert.equal(dialect.translate(element), '');
        });
      }
    },

    'WHEN the string doesn\t have a translation': {
      topic: 'Saudade',

      'THEN it returns the same string': function (topic) {
        assert.equal(dialect.translate(topic), 'Saudade');
      }
    }
  }
})
.addBatch({
  'GIVEN new portuguese stuff': {
    'WHEN its a string': {
      topic: 'Os desafinados também têm um coração',

      'THEN it should store the new translation': function (topic) {
        assert.strictEqual(require(__dirname + '/data/es.js')[topic], undefined);
        assert.strictEqual(require(__dirname + '/data/en.js')[topic], undefined);
        assert.equal(dialect.translate(topic), 'Os desafinados também têm um coração');
        assert.strictEqual(require(__dirname + '/data/es.js')[topic], null);
        assert.strictEqual(require(__dirname + '/data/en.js')[topic], null);
      }
    },

    'WHEN is an empty string': {
      topic: '',

      'THEN it returns ""': function (topic) {
        assert.equal(dialect.translate(topic), '');
      }
    },

    'WHEN is not a string': {
      topic: [[], {}, null, undefined, 1, /abc/],

      'THEN it returns ""': function (topic) {
        topic.forEach(function (element) {
          assert.equal(dialect.translate(element), '');
        });
      }
    }
  }
}).run();
