var fs = require('fs');

module.exports = function (options) {
  var dialect = {},
      funk = require('./../support/funk/lib/funk'),
      dictionaries = {},

      loadDictionariesToMemory = function (reload) {
        options.locales.forEach(function (locale) {
          if (reload || !dictionaries[locale]) {
            dictionaries[locale] = JSON.parse(fs.readFileSync(
              options.path + locale + '.js'
            ).toString() || '{}');
          }
        });
      },

      loadDictionariesToJSON = function (reload, callback) {
        var fk = funk();

        if (options.store) {
          options.locales.forEach(function (locale) {
            options.store.get({locale: locale}, fk.add(function (err, data) {
              var json = {}, i = null;
              for (i in data) {
                if (Object.keys(data[i]).length === 4) {
                  json[data[i].original] = data[i].translation;
                } else {
                  json[data[i].original] = {
                    translation: data[i].translation,
                    count: data[i].count,
                    context: data[i].context
                  };
                }
              }
              fs.writeFileSync(
                options.path + locale + '.js',
                JSON.stringify(json)
              );
              if (reload) {
                dictionaries[locale] = json;
              }
            }));
          });

          fk.parallel(function () {
            callback(null, 'ok');
          });
        } else {
          callback(null, 'ok');
        }
      },

      /**
       * Stores a new translation to a JSON file
       *
       * @param {Object} query {original, locale}
       * @param {String} translation
       * @param {Function} callback
       * @api public
       */
      addTranslationToJSON = function (query, translation, callback) {
        // JSON store
        fs.readFile(options.path + query.locale + '.js', function (err, data) {
          var json = JSON.parse(data.toString());
          json[query.original] = translation;
          fs.writeFile(options.path + query.locale + '.js', JSON.stringify(json), callback);
        });
      },

      /**
       * Stores the new translation to
       * Memory, JSON and Store
       * News translations are null or same string
       *
       * @param {String} original
       * @param {Function} callback
       * @api public
       */
      storeNewTranslation = function (original, callback) {
        var fk = funk();

        options.locales.forEach(function (locale) {
          var translation = (locale === options.base_locale ? original : null),
              i = null,
              json = '';

          // Memory store
          dictionaries[locale][original] = translation;

          // DB store
          if (options.store) {
            options.store.add({original: original, locale: locale}, translation, fk.add(function (err, data) {
              loadDictionariesToJSON(true, fk.nothing());
            }));
          } else {
            addTranslationToJSON({original: original, locale: locale}, translation, fk.nothing());
          }
        });

        fk.parallel(function () {
          if (callback) {
            callback(null, original);
          }
        });
      };

  dialect.config = function (key, value) {
    if (value !== undefined) {
      options[key] = value;
    }
    return options[key];
  };

  /**
   * Get a translation.
   * If the translation is not available on the local JSON
   * dictionaries, we update it to return null
   * and we fire-and-forget to save this new word to our store.
   *
   * @param {String} Original string we want to translate
   * @param {Function} Callback. Used only on testing as dialect doesn't care about the store.
   * @api public
   */
  dialect.getTranslation = function (original, callback) {
    var translation = '',
        i = 0;

    if ((typeof original !== 'string' && !Array.isArray(original)) || original.length === 0) {
      return '';
    }

    if (options.base_locale === options.current_locale) {
      return original;
    } else {

      // load dictionaries if not already loaded
      if (Object.keys(dictionaries).length === 0) {
        loadDictionariesToMemory();
      }
      translation = dictionaries[options.current_locale][original];

      if (translation === undefined) {
        storeNewTranslation(original, callback);
      }
      return translation || original;
    }
  };

  /**
   * Sets a translation.
   *
   * We fire-and-forget to save this translation.
   * We also update the current JSON/Memory,
   * usefull if your app is just using one machine.
   *
   * If not, you need a cron to expire JSON to make
   * this new translation available.
   *
   * @param {Object} query {original, locale}
   * @param {String} translation
   * @param {Function} Callback. Used only on testing as dialect doesn't care about the store.
   * @api public
   */
  dialect.setTranslation = function (query, translation, callback) {
    var fk = funk();

    // DB
    if (options.store) {
      options.store.set(query, translation, fk.nothing()); // fire and forget
    }

    // JSON store
    addTranslationToJSON(query, translation, fk.nothing());

    // Memory
    dictionaries[query.locale][query.original] = translation;

    fk.parallel(function () {
      if (callback) {
        callback(null, 'ok');
      }
    });
  };


  // INIT
  if (!options || !options.path) {
    throw new Error("You need to provide the path where you want to store the JSON dictionaries");
  } else {
    options.path = options.path.replace(/(.*)\/?/, '$1/');
  }

  options.base_locale = options.base_locale || 'en';

  return dialect;
};
