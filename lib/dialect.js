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

  Object.defineProperty(DIALECT, 'store', {value : null, writable: true});
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
   * Connects the store
   *
   * @param {Function} cb
   * @return dialect
   */
  DIALECT.connect = function (cb) {
    if (DIALECT.store.is_connected()) {
      cb('already connected', null);
    } else {
      DIALECT.store.connect(cb);
    }
    return DIALECT;
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
        needs_plural = Array.isArray(original) && original.length === 2,
        index =  Array.isArray(original) ? original[0] : original,
        pluralize = require('./helpers/plurals')(_options.base_locale);

    if ((typeof original !== 'string' && !Array.isArray(original)) || original.length === 0) {
      throw Error("Original is not valid");
    }

    if (!current_dictionary || _options.base_locale === _options.current_locale) {
      return _parse(needs_plural ? original[pluralize(params.count)] : index, params);
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
        DIALECT.store.add(
          {original: index, locale: _options.current_locale},
          translation
        );
        return _parse(needs_plural ? original[pluralize(params.count)] : index, params);
      } else {
        return _parse(translation, params);
      }

    }
  };

  /**
   * Approves or rejects a translation
   *
   * @param {Object} query {original, locale [, count] [, context]}
   * @param {Boolean} aproved
   * @param {Function} callback.
   *
   * @return dialect
   */
  DIALECT.approve = function (query, approved, cb) {
    if (!query || !query.original || !query.locale) {
      throw Error("Original string and target locale are mandatory");
    }

    if (typeof approved === 'function' || approved === undefined) {
      throw Error("Approved is mandatory");
    }

    // Database
    DIALECT.store.approve(query, !!approved, cb);

    return DIALECT;
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

    if (typeof translation !== 'string') {
      throw Error("Translation is mandatory");
    }

    if (translation.length === 0) {
      translation = null;
    }

    // Database
    DIALECT.store.set(query, {translation: translation}, cb);

    return DIALECT;
  };

  /**
   * Loads the dictionaries from the store
   * and caches them to memory
   *
   * @param {String} locale
   * @param {Function} cb
   * @return dialect
   */
  DIALECT.sync = function (options, cb) {
    var executed = false,
        funk = require('funk')(),

        run_once = function (cb) {
          return function () {
            if (!executed) {
              executed = true;
              cb();
            }
          };
        },

        fn = function (cb) {
          if (options.locale === undefined) {
            _options.locales.forEach(function (locale) {
              _io.cacheDictionary(locale, funk.nothing());
            });
            funk.parallel(run_once(cb));
          } else {
            _io.cacheDictionary(options.locale, run_once(cb));
          }
        };

    if (options.interval) {
      fn(function () {
        cb();
        DIALECT.interval = setInterval(fn, options.interval, function () { });
      });
    } else {
      fn(cb);
    }

    return DIALECT;
  };


  // INIT
  if (!_options || !_options.store) {
    throw Error("You need to provide a store");
  } else {
    try {
      (function () {
        var lib = typeof _options.store === 'string' ? _options.store : Object.keys(_options.store)[0];
        DIALECT.store = require('./stores/' + lib)(_options.store[lib]);
      }());
    } catch (exc) {
      throw exc;
    }
  }

  // defaults
  _options.base_locale = _options.base_locale || 'en';
  _options.current_locale = _options.current_locale || 'en';
  _options.locales = _options.locales || [_options.base_locale, _options.current_locale];

  return DIALECT;
};
