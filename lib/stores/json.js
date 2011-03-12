var fs = require('fs');

/**
 * Initialize Store with the given `options`.
 *
 * @param {Object} options [path]
 * @return store
 */

module.exports = function (options) {

  var STORE = {},

      _default = function (callback) {
        callback = callback || function () { };
      };

  options = options || {};

  /**
   * Connects to the Store
   *
   * @param {Function} callback
   * @return store
   */
  STORE.connect = function (callback) {

    _default(callback);

    fs.readdir(options.path, function (err, files) {
      files.forEach(function (file) {
        fs.readFile(options.path + '/' + file, function (err, data) {
          console.log(data);
        });
      });
    });

    STORE.db.open(function (err, db) {
      if (err) {
        callback(err, null);
      } else {
        db.collection(options.collection || 'translations', function (err, collection) {
          STORE.collection = collection;
          callback(err, collection);
        });
      }
    });

    return STORE;
  };

  /**
   * Attempt to fetch a translation
   *
   * @param {Object} query
   * @param {Function} callback
   * @return store
   */
  STORE.get = function (query, callback) {

    _default(callback);
    query = query || {};

    STORE.collection.find(query, function (err, cursor) {
      if (err) {
        callback(err, null);
      } else {
        cursor.toArray(callback);
      }
    });

    return STORE;
  };

  /**
   * Add a translation
   *
   * @param {Object} doc {original, locale, [, plural] [, context]}
   * @param {String} translation
   * @param {Function} callback
   * @return store
   */
  STORE.add = function (doc, translation, callback) {

    _default(callback);

    STORE.collection.findOne(doc, function (err, data) {
      if (err) {
        callback(err);
      } else {

        if (!data) {
          doc.translation = translation;
          STORE.collection.insert(doc, callback);
        } else {
          callback(Error('This translation already exists'), null);
        }

      }
    });

    return STORE;
  };

  /**
   * Set a translation
   * If the translation is new, set it to null
   *
   * @param {Object} query {original, locale}
   * @param {String} translation
   * @param {Function} callback
   * @return store
   */
  STORE.set = function (query, translation, callback) {

    _default(callback);
    query = query || {};

    STORE.collection.update(query, {'$set': translation}, callback);

    return STORE;
  };

  /**
   * Destroy the translation
   *
   * @param {Object} query {original, locale}
   * @param {Function} callback
   * @return store
   */

  STORE.destroy = function (query, callback) {

    _default(callback);
    query = query || {};

    STORE.collection.remove(query, callback);

    return STORE;
  };

  /**
   * Fetch number of translations.
   *
   * @param {Object} query {locale, translation...} [optional]
   * @param {Function} callback
   * @return store
   */

  STORE.count = function (query, callback) {

    _default(callback);
    query = query || {};

    STORE.collection.count(query, callback);

    return STORE;
  };

  return STORE;
};

