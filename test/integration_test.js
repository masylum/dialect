GLOBAL.inspect = require('eyes').inspector({ styles: { all:     'yellow', label:   'underline', other:   'inverted', key:     'bold', special: 'grey', string:  'green', number:  'red', bool:    'blue', regexp:  'green' }, maxLength: 9999999999 });

var fs = require('fs'),
    assert = require('assert'),
    funk = require('./../support/funk/lib/funk'),
    num_tests = 0,
    passed_tests = 0,
    exits = 0,

    test = function (funktion, args) {
      num_tests += 1;
      try {
        passed_tests += 1;
        funktion.apply(this, args);
      } catch (exc) {
        passed_tests -= 1;
        inspect(exc);
      }
    },

    exit = function () {
      exits += 1;
      if (exits === 4) {
        inspect('Tests finshed!');
        inspect(passed_tests + '/' + num_tests);
        process.exit(0);
      }
    };

['mongodb'/*, 'redis'*/].forEach(function (store_name) {
  var dialect = null;

  dialect = require('./..').dialect({
    path: __dirname + '/data/integration',
    base_locale: 'en',
    current_locale: 'es',
    locales: ['en', 'es']
  });

  // initialize JSON files to {}
  dialect.config('locales').forEach(function (locale) {
    fs.writeFileSync(dialect.config('path') + locale + '.js', '{}', 'utf8');
  });

  // get Store and empty the DB
  require('./..').store({store: 'mongodb', database: 'test'}, function (error, store) {
    store.collection.remove({}, function (err, data) {

      // GIVEN a store
      // =============
      var original = '',
          translation = '',
          locale = '';

      // THEN it should be available and empty
      // =====================================
      assert.notEqual(store, null);

      store.length('es', function (error, length) {
        test(assert.equal, [length, 0]);
      });

      store.length('en', function (error, length) {
        test(assert.equal, [length, 0]);
      });

      // THEN the local JSON should be also empty
      // =======================================
      dialect.config('locales').forEach(function (locale) {
        var json = JSON.parse(fs.readFileSync(dialect.config('path') + locale + '.js').toString());
        test(assert.equal, [Object.keys(json).length, 0]);
      });

      // WHEN we configure dialect to use out store
      // ==========================================
      dialect.config('store', store);

      // THEN it should be available
      test(assert.notEqual, [dialect.config('store'), null]);

      // WHEN we want a translation from original to our current_locale
      // ======================================================
      original = 'I love gazpacho';

      dialect.getTranslation(original, function () {
        var fk = funk();

        // THEN it should save it to the Store, JSON and Memory for each locale as NULL
        // ============================================================================
        dialect.config('locales').forEach(function (locale) {
          dialect.config('store').get({original: original, locale: locale}, fk.add(function (err, data) {

            // DB
            test(assert.equal, [data[0].locale, locale]);
            test(assert.equal, [data[0].original, original]);
            if (locale === dialect.config('base_locale')) {
              test(assert.equal, [data[0].original, data[0].translation]);
            } else {
              test(assert.equal, [data[0].translation, null]);
            }

            // JSON
            if (locale === dialect.config('base_locale')) {
              test(assert.equal, [original, JSON.parse(fs.readFileSync(dialect.config('path') + locale + '.js').toString())[original]]);
            } else {
              test(assert.equal, [JSON.parse(fs.readFileSync(dialect.config('path') + locale + '.js').toString())[original], null]);
            }

            // Memory (Missing translations always get same str)
            test(assert.equal, [dialect.getTranslation(original), original]);
          }));
        });

        fk.parallel(function () {

          // WHEN a translator introduces a translation to a target locale
          // =============================================================
          translation = 'Me encanta el gazpacho';
          locale = 'es';

          dialect.setTranslation({original: original, locale: locale}, translation, function () {
            // THEN it should save it to the Store, JSON and Memory for each locale
            // ====================================================================
            dialect.config('store').get({original: original, locale: locale}, function (err, data) {

              // DB
              test(assert.equal, [data[0].locale, locale]);
              test(assert.equal, [data[0].original, original]);
              test(assert.equal, [data[0].translation, translation]);

              // JSON available on this local machine, but on other they need to sync
              test(assert.equal, [JSON.parse(fs.readFileSync(dialect.config('path') + locale + '.js').toString())[original], translation]);

              // Memory available on this local machine
              test(assert.equal, [dialect.getTranslation(original), translation]);

              exit();
            });
          });
        });

      });
    });
  });
});

['mongodb'/*, 'redis'*/].forEach(function (store_name) {
  var dialect = null;

  dialect = require('./..').dialect({
    path: __dirname + '/data/integration',
    base_locale: 'pt',
    current_locale: 'ca',
    locales: ['pt', 'ca']
  });

  // initialize JSON files
  fs.writeFileSync(dialect.config('path') + 'pt.js', '{"E muito bom": "E muito bom"}', 'utf8');
  fs.writeFileSync(dialect.config('path') + 'ca.js', '{"E muito bom": "Esta molt be"}', 'utf8');

  // get Store and empty the DB
  require('./..').store({store: 'mongodb', database: 'test_2'}, function (error, store) {
    store.collection.remove({}, function (err, data) {

      // GIVEN a store
      // =============
      var original = 'E muito bom', translation = 'Esta molt be';

      // WHEN we configure dialect to use out store
      // ==========================================
      dialect.config('store', store);

      // THEN it should be available
      test(assert.notEqual, [dialect.config('store'), null]);

      // WHEN we want a translation but is not available on the DB nor in memory
      // =======================================================================

      // THEN it should get it from JSON files
      // =====================================
      test(assert.equal, [dialect.getTranslation(original), translation]);

      exit();
    });
  });
});

['mongodb'/*, 'redis'*/].forEach(function (store_name) {
  var dialect = null;

  dialect = require('./..').dialect({
    path: __dirname + '/data/integration',
    base_locale: 'it',
    current_locale: 'fr',
    locales: ['it', 'fr']
  });

  // initialize JSON files
  fs.writeFileSync(dialect.config('path') + 'it.js', '{}', 'utf8');
  fs.writeFileSync(dialect.config('path') + 'fr.js', '{}', 'utf8');

  // get Store and empty the DB
  require('./..').store({store: 'mongodb', database: 'test_3'}, function (error, store) {
    store.collection.remove({}, function (err, data) {
      store.collection.insert(
      [ {original: 'Ciao', locale: 'it', translation: 'Ciao'},
        {original: 'Ciao', locale: 'fr', translation: 'Alo'} ], function (err, data) {

        // GIVEN a store
        // =============
        var original = 'Ciao', translation = 'Alo', translated_string = '';

        // THEN it should be available and empty
        // =====================================
        assert.notEqual(store, null);

        // WHEN we configure dialect to use out store
        // ==========================================
        dialect.config('store', store);

        // WHEN we want a translation but memory and JSON are gone (probably cache expiring)
        // =================================================================================

        // THEN it should get it from DB files and populate JSON and memory again
        // ======================================================================
        translated_string = dialect.getTranslation(original, function (err, data) {
          test(assert.equal, [JSON.parse(fs.readFileSync(dialect.config('path') + 'it.js').toString())[original], original]);
          test(assert.equal, [JSON.parse(fs.readFileSync(dialect.config('path') + 'fr.js').toString())[original], translation]);
          exit();
        });

        // Dialect returns the original until the DB and JSON
        // are sync again.
        test(assert.equal, [translated_string, original]);
      });
    });
  });
});

// TEST OPTIONS!
////////////////
['mongodb'/*, 'redis'*/].forEach(function (store_name) {
  var dialect = null;

  dialect = require('./..').dialect({
    path: __dirname + '/data/integration',
    base_locale: 'en_us',
    current_locale: 'es_es',
    locales: ['en_en', 'es_es']
  });

  // initialize JSON files to {}
  dialect.config('locales').forEach(function (locale) {
    fs.writeFileSync(dialect.config('path') + locale + '.js', '{}', 'utf8');
  });

  // get Store and empty the DB
  require('./..').store({store: 'mongodb', database: 'test_4'}, function (error, store) {
    store.collection.remove({}, function (err, data) {

      var options = {count: 1, context: 'females', what: 'good'},
      original = [
        'You have {count} {what} friend',
        'You have {count} {what} friends',
        options
      ],
      translation = 'Tienes 1 buena amiga'; // If this works, I'm a genius

      dialect.config('store', store);

      // WHEN we want a translation from original to our current_locale
      // ======================================================

      dialect.getTranslation(original, function () {
        var fk = funk();

        // THEN it should save it to the Store, JSON and Memory for each locale as NULL
        // ============================================================================
        dialect.config('locales').forEach(function (locale) {

          // DB
          dialect.config('store').get({original: original[0], locale: locale}, fk.add(function (err, data) {
            test(assert.equal, [data[0].locale, locale]);
            test(assert.equal, [data[0].original, original[0]]);
            test(assert.equal, [data[0].count, 'singular']);
            test(assert.equal, [data[0].context, null]);

            if (locale === dialect.config('base_locale')) {
              test(assert.equal, [data[0].original, data[0].translation]);
            } else {
              test(assert.equal, [data[0].translation, null]);
            }
          }));

          dialect.config('store').get({original: original[1], locale: locale}, fk.add(function (err, data) {
            test(assert.equal, [data[0].locale, locale]);
            test(assert.equal, [data[0].original, original[1]]);
            test(assert.equal, [data[0].count, 'plural']);
            test(assert.equal, [data[0].context, null]);

            if (locale === dialect.config('base_locale')) {
              test(assert.equal, [data[0].original, data[0].translation]);
            } else {
              test(assert.equal, [data[0].translation, null]);
            }
          }));

          // JSON
          (function () {
            var path = dialect.config('path') + locale + '.js',
                json = JSON.parse(fs.readFileSync(path).toString());

            test(assert.equal, [json[original[0]].count, 'singular']);
            test(assert.equal, [json[original[0]].context, null]);
            test(assert.equal, [json[original[1]].count, 'plural']);
            test(assert.equal, [json[original[1]].context, null]);

            if (locale === dialect.config('base_locale')) {
              test(assert.equal, [json[original[0]].translation, original[0]]);
              test(assert.equal, [json[original[1]].translation, original[1]]);
            } else {
              test(assert.equal, [json[original[0]].translation, null]);
              test(assert.equal, [json[original[1]].translation, null]);
            }
          }());

          // Memory (Missing translations always get same str)
          test(assert.equal, [dialect.getTranslation(original), original]);
        });

        fk.parallel(function () {
          exit();
        /*

          // WHEN a translator introduces a translation to a target locale
          // =============================================================
          translation = 'Me encanta el gazpacho';
          locale = 'es';

          dialect.setTranslation({original: original, locale: locale}, translation, function () {
            // THEN it should save it to the Store, JSON and Memory for each locale
            // ====================================================================
            dialect.config('store').get({original: original, locale: locale}, function (err, data) {

              // DB
              test(assert.equal, [data[0].locale, locale]);
              test(assert.equal, [data[0].original, original]);
              test(assert.equal, [data[0].translation, translation]);

              // JSON available on this local machine, but on other they need to sync
              test(assert.equal, [JSON.parse(fs.readFileSync(dialect.config('path') + locale + '.js').toString())[original], translation]);

              // Memory available on this local machine
              test(assert.equal, [dialect.getTranslation(original), translation]);

            });
          });
          */
        });

      });
    });
  });
});
