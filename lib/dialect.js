if (global.GENTLY) {
  require = global.GENTLY.hijack(require);
}

module.exports = function (options) {
  var DIALECT = {},

      _io = require('./helpers/io').IO(DIALECT),
      _options = options || {},

      _parse = function (str, params) {
        var matches = /(\{(.*?)\})+/g.exec(str);

        // shameless copy/inspiration from lingo (TJ)
        return str.replace(/\{([^}]+)\}/g, function (_, key) {
          return params[key];
        });
      };


  // memory cache dictionaries
  Object.defineProperty(DIALECT, 'dictionaries', {value : {}, writable: true});

  /**
   * Set or Get a config value
   *
   * This exposes the _options and set up
   * defaults values.
   *
   * @param {String} key
   *   Name of the attribute to set/get.
   * @param {*} [value]
   *   Value to store.
   * @returns
   *   The value at `key` if given
   *   or the whole _options object
   */

  DIALECT.config = function (key, value) {
    if (value !== undefined) {
      _options[key] = value;
    }
    return key ? _options[key] : _options;
  };


  /**
   * Get a translation from the memory cache.
   *
   * If the original is not available
   * add the new word to the `store`
   *
   * @param {String} original
   *   String we want to translate.
   */
  DIALECT.get = function (original) {
    var translation = null,
        key = null,
        current_dictionary = DIALECT.dictionaries[_options.current_locale],
        params = Array.isArray(original) ? original.pop() : {},
        index =  Array.isArray(original) ? original[0] : original,
        pluralize = require('./helpers/plurals')(_options.base_locale);

    if ((typeof original !== 'string' && !Array.isArray(original)) || original.length === 0) {
      throw Error("Original is not valid");
    }

    if (!current_dictionary || _options.base_locale === _options.current_locale) {
      return original;
    } else {

      key = _io.getKeyFromQuery({
        original: index,
        count: params.count,
        context: params.context
      });

      if (Object.keys(current_dictionary).length > 0) {
        translation = current_dictionary[key];
      }

      if (typeof translation !== 'string') {
        _options.store.add(
          {original: index, locale: _options.current_locale},
          translation
        );
        return _parse(Array.isArray(original) ? original[pluralize(params.count)] : original, params);
      } else {
        return _parse(translation, params);
      }

    }
  };

  /**
   * Sets the translation to the store.
   *
   * @param {Object} query {original, locale [, count] [, context]}
   * @param {String} translation
   * @param {Function} callback.
   *
   * @return dialect
   */
  DIALECT.set = function (query, translation, cb) {
    if (!query || !query.original || !query.locale) {
      throw Error("Original string and target locale are mandatory");
    }

    if (!translation || typeof translation !== 'string') {
      throw Error("Translation is mandatory");
    }

    // Database
    _options.store.set(query, {translation: translation}, cb);

    return DIALECT;
  };

  /**
   * Loads the dictionaries from the store
   * and re-caches them to memory
   *
   * @param {String} locale
   * @param {Function} cb
   * @return dialect
   */
  DIALECT.reCache = function (locale, cb) {
    if (locale === null) {
      _options.locales.forEach(function (locale) {
        _io.cacheDictionary(locale, cb);
      });
    } else {
      _io.cacheDictionary(locale, cb);
    }
    return DIALECT;
  };

  // INIT
  if (!_options || !_options.store) {
    throw Error("You need to provide a store");
  }

  // defaults
  _options.base_locale = _options.base_locale || 'en';
  _options.current_locale = _options.current_locale || 'en';
  _options.locales = _options.locales || ['en'];

  ['current_locale', 'base_locale'].forEach(function (conf) {
    DIALECT.config(conf, _options[conf]);
  });

  return DIALECT;
};
