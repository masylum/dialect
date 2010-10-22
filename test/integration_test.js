GLOBAL.inspect = require('eyes').inspector({ styles: { all:     'yellow', label:   'underline', other:   'inverted', key:     'bold', special: 'grey', string:  'green', number:  'red', bool:    'blue', regexp:  'green' }, maxLength: 9999999999 });

var Suite = require('./../support/vows/lib/vows'),
    assert = require('assert');

['mongodb', 'redis'].forEach(function (store) {
  var suite = Suite.describe(store.toUpperCase() + ' integration tests');

  suite
    .addBatch(require(__dirname + '/stores/' + store + '_test').common)
    .addBatch(require(__dirname + '/stores/' + store + '_test').spec)
    .export(module);
});
