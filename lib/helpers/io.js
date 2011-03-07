if (global.GENTLY) {
  require = global.GENTLY.hijack(require);
}

var fs = require('fs'),
    plurals = require('./plurals'),
    funk = require('funk');

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

    if (query.count) {
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
   *  Target dictionary we want to cache, if not set use config('locales')
   * @param {Function} cb
   *  Callback when its done with async
   * @returns IO
   */
  IO.cacheDictionary = function (locale, cb) {

    DIALECT.config('store').get({locale: locale}, function (err, data) {
      var dictionary = {},
          key = null,
          i = null;

      if (err) {
        cb(err, null);
      } else {
        for (i in data) {
          key = IO.getKeyFromQuery({
            original: data[i].original,
            count: data[i].count,
            context: data[i].context
          });
          dictionary[data[key].original] = data[i].translation;
        }

        // loads the dictionary to memory
        DIALECT.dictionaries[locale] = dictionary;

        cb(err, data);
      }
    });

    return IO;
  };

  return IO;
};
