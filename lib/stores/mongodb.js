var DB = require('mongodb').Db,
    Server = require('mongodb').Server;

/**
 * Initialize Store with the given `options`.
 *
 * @param {Object} options [database, host, port, collection, [username], [password], [options]]
 * @return store
 */

module.exports = function (options) {

  var STORE = {},

      _default = function (thing) {
        return thing || function () { };
      },

      _is_connected = false;

  options = options || {};

  Object.defineProperty(STORE, 'db', {value : new DB(
    options.database || 'dialect',
    new Server(
      options.host || '127.0.0.1',
      options.port || 27017,
      options.options || {}
    ),
    {strict: true}
  )});

  /**
   * Exposes is_connected
   *
   * @return is_connected
   */
  STORE.is_connected = function () {
    return _is_connected;
  };

  /**
   * Connects to the Store
   *
   * @param {Function} callback
   * @return store
   * @todo refactor to use funk/serial
   */
  STORE.connect = function (callback) {

    callback = _default(callback);

    function connect(err, collection) {
      _is_connected = true;
      STORE.collection = collection;
      callback(err, collection);
    }

    function authenticate(callback) {

      // no need to try authenticating when we have no credentials
      if(typeof(options.username) === 'undefined' || typeof(options.password) === 'undefined'){
        callback(null, STORE.db);
      }
      else {
        STORE.db.authenticate(options.username, options.password, callback);        
      }
    } 

    if (!_is_connected) {
      STORE.db.open(function (err, db) {
        if (err) {
          callback(err, null);
        } 
        else {
          authenticate(function (err, db) {
            if (err) {
              callback(err, null);
            }
            // connection ready, as well as optional authentication, check collection
            else {
              STORE.db.collection(options.collection || 'translations', function (err, collection) {
                  if (err) {
                     STORE.db.createCollection(options.collection || 'translations', function (err, collection) {
                      connect(err, collection);
                     });
                  } else {
                    connect(err, collection);
                  }
                });
              }
          });
        }
      });
    }
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

    callback = _default(callback);
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

    callback = _default(callback);

    STORE.collection.findOne(doc, function (err, data) {
      if (err) {
        callback(err);
      } else {

        if (!data) {
          doc.translation = translation;
          doc.approved = false;
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

    callback = _default(callback);
    query = query || {};

    translation.approved = false;

    STORE.collection.update(query, {'$set': translation}, {upsert: true}, callback);

    return STORE;
  };

  /**
   * Approve or rejects a translation
   *
   * @param {Object} query {original, locale}
   * @param {String} translation
   * @param {Function} callback
   * @return store
   */
  STORE.approve = function (query, approved, callback) {

    callback = _default(callback);
    query = query || {};

    STORE.collection.update(query, {'$set': {approved: approved}}, {}, callback);

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

    callback = _default(callback);
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

    callback = _default(callback);
    query = query || {};

    STORE.collection.count(query, callback);

    return STORE;
  };

  return STORE;
};
