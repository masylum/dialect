var sqlite = require('sqlite'),
    sqlizer = require('../helpers/sqlizer');

/**
 * Initialize Store with the given `options`.
 *
 * @param {Object} options [database, table]
 * @return store
 */
module.exports = function (options) {

  options = options || {};

  var STORE = {},

      _table = options.table || 'dialect',

      _default = function (callback) {
        return callback || function () { };
      },

      _is_connected = false,
      _connecting = false;

  Object.defineProperty(STORE, 'db', {value : new sqlite.Database()});

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
   */
  STORE.connect = function (callback) {

    callback = _default(callback);

    STORE.db.on('dialectReady', callback);

    if (_connecting) {
      return;
    }

    STORE.db.open(options.database || 'dialect.db', function (err) {
      if (err) {
        callback(err, null);
      } else {
        STORE.db.execute(
          'CREATE TABLE IF NOT EXISTS ' + _table +
          ' (original TEXT, locale TEXT, translation TEXT,' +
          ' plural NUMBER, context TEXT, PRIMARY KEY(original, locale, plural, context))',
          function (err, data) {
            if (data) {
              _is_connected = true;
            }

            _connecting = false;
            STORE.db.emit('dialectReady', err, data);
          }
        );
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

    callback = _default(callback);

    STORE.db.execute(
      sqlizer({table: _table}).find(query).sql,
      function (error, rows) {
        callback(error, error ? [] : rows);
      }
    );

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

    STORE.get(doc, function (err, data) {
      if (err) {
        callback(err, null);
      } else {

        if (!data || data.length === 0) {
          doc.translation = translation;
          doc.approved = false;
          STORE.db.execute(sqlizer({table: _table}).insert(doc).sql, callback);
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

    STORE.db.execute(sqlizer({table: _table}).update(
      query,
      {'$set': {translation: translation, approved: false}}).sql,
      callback
    );

    return STORE;
  };

  /**
   * Approve or rejects a translation
   *
   * @param {Object} query {original, locale}
   * @param {Boolean} approved
   * @param {Function} callback
   * @return store
   */
  STORE.approve = function (query, approved, callback) {

    callback = _default(callback);

    STORE.db.execute(sqlizer({table: _table}).update(query, {'$set': {approved: approved}}).sql, callback);

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

    STORE.db.execute(sqlizer({table: _table}).remove(query).sql, callback);

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

    STORE.db.execute(sqlizer({table: _table}).find(query).count().sql, function (err, data) {
      callback(err, !err && data && data.length ? data[0].count : 0);
    });

    return STORE;
  };

  return STORE;
};
