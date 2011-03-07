/**
 * Module dependencies.
 */

var DB = require('mongodb/lib/mongodb/db').Db,
    Server = require('mongodb/lib/mongodb/connection').Server;

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
   * @param {Object} query {original, locale}
   * @param {Function} callback
   * @api public
   */
  mongoStore.get = function (query, callback) {
    this.collection.find(query, function (err, cursor) {
      cursor.toArray(callback);
    });
  };

  /**
   * Add a translation
   *
   * @param {Object} query {original, locale}
   * @param {String} translation
   * @param {Function} callback
   * @api public
   */
  mongoStore.add = function (query, translation, callback) {
    var self = this, doc, params;
    try {

      if (Array.isArray(query.original)) {

        // COUNT
        if (query.original.length === 3) {
          doc = [];
          doc[0] = {original: query.original[0], locale: query.locale, translation: translation, count: 'singular'};
          doc[1] = {original: query.original[1], locale: query.locale, translation: translation, count: 'plural'};
          params = query.original[2];
        } else if (query.original.length === 2) {
          doc = {original: query.original, locale: query.locale, translation: translation};
          params = query.original[1];
        }

        // CONTEXT
        if (params.context) {
          (function () {
            var setContext = function (d) {
              d.context = null;
            };
            if (Array.isArray(doc)) {
              doc.forEach(setContext);
            } else {
              setContext(doc);
            }
          }());
        }
      } else {
        doc = {original: query.original, locale: query.locale, translation: translation};
      }

      this.collection.findOne({original: query.original, locale: query.locale}, function (err, data) {
        if (!data) {
          self.collection.insert(
            doc,
            function (err, data) {
              if (callback) {
                callback(err, mongoStore);
              }
            }
          );
        } else {
          if (callback) {
            callback(null, mongoStore);
          }
        }
      });
    } catch (exc) {
      if (exc) {
        callback(exc, null);
      }
    }
  };

  /**
   * Set a translation
   * If the translation is new, set it to null
   *
   * @param {Object} query {original, locale}
   * @param {String} translation
   * @param {Function} callback
   * @api public
   */
  mongoStore.set = function (query, update, callback) {
    try {
      this.collection.update(
        query,
        {'$set': update},
        function (err, data) {
          if (callback) {
            callback(err, mongoStore);
          }
        }
      );
    } catch (exc) {
      if (exc) {
        callback(exc, null);
      }
    }
  };

  /**
   * Destroy the translation
   *
   * @param {Object} query {original, locale}
   * @param {String} locale
   * @param {Function} callback
   * @api public
   */

  mongoStore.destroy = function (query, callback) {
    this.collection.remove(query, callback);
  };

  /**
   * Fetch number of translations.
   *
   * @param {Object} query {locale, translation...} [optional]
   * @param {Function} fn
   * @api public
   */

  mongoStore.count = function (query, callback) {
    query = query || {};
    this.collection.count(query, callback);
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
