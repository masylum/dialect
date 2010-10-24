GLOBAL.inspect = require('eyes').inspector({ styles: { all:     'yellow', label:   'underline', other:   'inverted', key:     'bold', special: 'grey', string:  'green', number:  'red', bool:    'blue', regexp:  'green' }, maxLength: 9999999999 });

var suite = require('./../support/vows/lib/vows').describe('STORELESS DIALECT (JSON)'),
    assert = require('assert'),
    fs = require('fs'),
    dialect = require('./..').dialect({path: __dirname + '/data', base_locale: 'pt', locales: ['pt', 'es', 'en']});

dialect.config('current_locale', 'es');

// Fill /data dictionaries
(function () {
  var json = '', i = null;
  dialect.config('locales').forEach(function (locale) {
    var data = fs.readFileSync(dialect.config('path') + 'default/' + locale + '.js', 'utf8').toString();
    fs.writeFileSync(dialect.config('path') + locale + '.js', data, 'utf8');
  });
}());

suite
.addBatch({
  'GIVEN an instance of dialect without a path param': {
    topic : {},

    'THEN it should raise an error': function (topic) {
      assert.throws(function () {
        require('./..').dialect(topic);
      }, Error);
    }
  }
})
.addBatch({
  'GIVEN portuguese stuff to be translated': {
    'WHEN its a string': {
      topic: 'Chega',

      'THEN it returns the translation': function (topic) {
        assert.equal(dialect.getTranslation(topic), 'Basta');
      }
    },

    'WHEN is an empty string': {
      topic: '',

      'THEN it returns ""': function (topic) {
        assert.equal(dialect.getTranslation(topic), '');
      }
    },

    'WHEN is not a string': {
      topic: [[], {}, null, undefined, 1, /abc/],

      'THEN it returns ""': function (topic) {
        topic.forEach(function (element) {
          assert.equal(dialect.getTranslation(element), '');
        });
      }
    },

    'WHEN the string doesn\'t have a translation': {
      topic: 'Saudade',

      'THEN it returns the same string': function (topic) {
        assert.equal(dialect.getTranslation(topic), 'Saudade');
      }
    }
  }
})
.addBatch({
  'GIVEN new portuguese stuff': {
    'WHEN its a string': {
      topic: 'Os desafinados também têm um coração',

      'THEN it should store the new translation': function (topic) {
        assert.strictEqual(JSON.parse(fs.readFileSync(__dirname + '/data/en.js').toString())[topic], undefined);
        assert.strictEqual(JSON.parse(fs.readFileSync(__dirname + '/data/es.js').toString())[topic], undefined);
        assert.equal(dialect.getTranslation(topic), 'Os desafinados também têm um coração', function () {
          assert.strictEqual(JSON.parse(fs.readFileSync(__dirname + '/data/en.js').toString())[topic], null);
          assert.strictEqual(JSON.parse(fs.readFileSync(__dirname + '/data/es.js').toString())[topic], null);
        });
      }
    },

    'WHEN is an empty string': {
      topic: '',

      'THEN it returns ""': function (topic) {
        assert.equal(dialect.getTranslation(topic), '');
      }
    },

    'WHEN is not a string': {
      topic: [[], {}, null, undefined, 1, /abc/],

      'THEN it returns ""': function (topic) {
        topic.forEach(function (element) {
          assert.equal(dialect.getTranslation(element), '');
        });
      }
    }
  }
}).export(module);
