/**
 * Module dependencies.
 */

var DB = require('mongodb/db').Db,
    Server = require("mongodb/connection").Server;

/**
 * Initialize MongoStore with the given `options`.
 *
 * @param {Object} options
 * @api public
 */

module.exports = function (options, callback) {

  if (!options.database) {
    throw new Error("Please select your database");
  }

  var mongoStore = options,
      connection = new DB(options.database, new Server(options.host || '127.0.0.1', options.port || 27017, {}), {});

  /**
   * Attempt to fetch a translation
   *
   * @param {String} original
   * @param {String} locale
   * @param {Function} callback
   * @api public
   */
  mongoStore.get = function (original, locale, callback) {
    this.collection.findOne({locale: locale, original: original}, function (err, data) {
      try {
        callback(null, data);
      } catch (exc) {
        callback(exc);
      }
    });
  };

  /**
   * Set a translation
   *
   * @param {String} original
   * @param {String} translation
   * @param {String} locale
   * @param {Function} callback
   * @api public
   */

  mongoStore.set = function (original, translation, locale, callback) {
    try {
      this.collection.update({locale: locale, original: original}, {'$set': {translation: translation}}, {upsert: true}, function (err, data) {
        if (callback) {
          callback(err, data);
        }
      });
    } catch (exc) {
      if (exc) {
        callback(exc, null);
      }
    }
  };

  /**
   * Destroy the translation
   *
   * @param {String} original
   * @param {String} locale
   * @param {Function} callback
   * @api public
   */

  mongoStore.destroy = function (original, locale, callback) {
    this.collection.remove({locale: locale, original: original}, callback);
  };

  /**
   * Fetch number of translations.
   *
   * @param {String} locale [optional]
   * @param {Function} fn
   * @api public
   */

  mongoStore.length = function (locale, callback) {
    locale = locale || {};
    this.collection.count({locale: locale}, callback);
  };

  connection.open(function (err, db) {
    db.collection(options.collection || 'translations', function (err, collection) {
      mongoStore.collection = collection;
      if (callback) {
        callback(null, mongoStore);
      }
    });
  });
};
