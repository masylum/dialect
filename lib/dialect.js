var fs = require('fs');

module.exports = function (options) {
  var dialect = {},
      funk = require('./../support/funk/lib/funk'),
      lingo = require('./../support/lingo'),
      Language = lingo.Language,
      dictionaries = {},
      current_language = null,
      base_language = null,

      parse = function (str, params) {
        var matches = /(\{(.*?)\})+/g.exec(str);

        // shameless copy/inspiration from lingo (TJ)
        return str.replace(/\{([^}]+)\}/g, function (_, key) {
          return params[key];
        });
      },

      loadDictionariesToMemory = function (reload) {
        options.locales.forEach(function (locale) {
          if (reload || !dictionaries[locale]) {
            dictionaries[locale] = JSON.parse(fs.readFileSync(
              options.path + locale + '.js'
            ).toString() || '{}');
          }
        });
      },

      loadDictionariesToJSON = function (locale, reload, callback) {
        if (options.store) {
          options.store.get({locale: locale}, function (err, data) {
            var json = {}, i = null;
            for (i in data) {
              json[data[i].original] = {
                translation: data[i].translation,
                count: data[i].count,
                context: data[i].context
              };
            }

            fs.writeFileSync(
              options.path + locale + '.js',
              JSON.stringify(json)
            );

            if (reload) {
              dictionaries[locale] = json;
            }

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
          var json = '';

          try {
            json = JSON.parse(data.toString());
          } catch (exc) {
            callback(exc, null);
          }

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
              loadDictionariesToJSON(locale, true, fk.nothing());
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

    //defaults
    switch (key) {
    case 'base_locale':
      key = value || 'en';
      break;
    }

    if (value !== undefined) {
      options[key] = value;

      // post config
      switch (key) {
      case 'base_locale':
        base_language = dialect.getLanguage(value);
        break;
      case 'current_locale':
        current_language = dialect.getLanguage(value);
        break;
      case 'path':
        options.path = value.replace(/([^\/])$/, '$1/');
        break;
      }
    }

    return options[key];
  };

  /**
   * Gets a locale language
   *
   * @param {String} locale
   * @api public
   */
  dialect.getLanguage = function (locale) {
    return new Language(locale);
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
        params = Array.isArray(original) ? original.slice(-1)[0] : {},
        index = 0,
        str_original = original,
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

      if (params.count) {
        index = current_language.isPlural(params.count) ? 0 : 1;
        str_original = Array.isArray(original) ? original[index] : original;
      }

      if (Object.keys(dictionaries[options.current_locale]).length > 0) {
        translation = dictionaries[options.current_locale][str_original];
        if (typeof translation === 'object') {
          translation = translation.translation; // lol
        }
      } else {
        translation = undefined;
      }

      if (translation === undefined) {
        storeNewTranslation(original, callback);
      } else {
        if (callback) {
          callback(null, original);
        }
      }
      return parse(translation || str_original, params);
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
    var fk = funk(),
        update = {translation: translation};

    // COUNT
    if (query.count) {
      query = {original: query.original, locale: query.locale, count: query.count};
    }

    // CONTEXT
    if (query.context) {
      update.context = query.context;
    }

    // Memory
    if (Object.keys(dictionaries).length === 0) {
      loadDictionariesToMemory();
    }
    dictionaries[query.locale][query.original] = update;

    // DB
    if (options.store) {
      options.store.set(query, update, fk.nothing()); // fire and forget
    }

    // JSON store
    addTranslationToJSON(query, update, fk.nothing());

    fk.parallel(function () {
      if (callback) {
        callback(null, 'ok');
      }
    });
  };

  /**
   * Syncs the JSON with the Store
   *
   * @param {String} locale (optional)
   * @param {Function} callback (optional)
   * @api public
   */
  dialect.regenerateJSON = function (locale, callback) {
    var fk = funk();

    if (typeof locale === 'function') {
      callback = locale;
    }
    if (typeof locale === 'function' || !locale) {
      options.locales.forEach(function (locale) {
        loadDictionariesToJSON(locale, true, fk.nothing());
      });

      fk.parallel(callback);
    } else {
      loadDictionariesToJSON(locale, true, callback);
    }
  };


  // INIT
  if (!options || !options.path) {
    throw new Error("You need to provide the path where you want to store the JSON dictionaries");
  }

  ['path', 'current_locale', 'base_locale'].forEach(function (conf) {
    dialect.config(conf, options[conf]);
  });

  return dialect;
};
