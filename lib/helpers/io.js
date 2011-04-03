if (global.GENTLY) {
  require = global.GENTLY.hijack(require);
}

var plurals = require('./plurals');

module.exports.IO = function (DIALECT) {
  var IO = {},

    /**
     * Gets the plural form
     *
     * @param {Integer} count
     * @returns a plural form
     */
    _getPluralForm = function (count) {
      return plurals(DIALECT.config('current_locale'))(count) + 1;
    };

  /**
   * Gets a query and returns a dictionary key
   *
   * @param {String} query
   * @returns a dictionary key
   */
  IO.getKeyFromQuery = function (query) {
    var key = query.original;

    if (!key) {
      throw Error("Original must be provided");
    }

    if (query.count !== undefined) {
      key += '|p:' + _getPluralForm(query.count);
    }

    if (query.context) {
      key += '|c:' + query.context;
    }

    return key;
  };

  /**
   * Caches the dictionaries from the Store to the JSON files
   *
   * @param {String} locale
   *  Target dictionary we want to cache
   * @param {Function} cb
   *  Callback when its done with async
   * @returns IO
   */
  IO.cacheDictionary = function (locale, cb) {

    if (!locale) {
      throw Error("You must provide a locale");
    }

    DIALECT.store.get({locale: locale, approved: true}, function (err, data) {
      var dictionary = {},
          key = null,
          i = null;

      if (err) {
        cb(err, null);
      } else {
        for (i in data) {
          key = IO.getKeyFromQuery({
            original: data[i].original,
            count: data[i].plural,
            context: data[i].context
          });
          dictionary[key] = data[i].translation;
        }

        // loads the dictionary to memory
        DIALECT.dictionaries[locale] = dictionary;

        cb(err, dictionary);
      }
    });

    return IO;
  };

  return IO;
};
