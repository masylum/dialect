/**
 * Module dependencies.
 */

var sqlite = require('sqlite');

/**
 * Initialize sqliteStore with the given `options`.
 *
 * @param {Object} options
 * @api public
 */
module.exports = function (options, callback) {

  var client = new sqlite.Database(),
      sqliteStore = {},
      table = options.table || 'dialect';

  function buildQuery(query, prefix) {
    var values = {},
        keys = Object.keys(query),
        placeholders = keys.map(function (name) {
          var key = (prefix || '$') + name,
              op = query[name] === null ? ' is ' : ' = ',
              k,
              value = query[name];

          if (value !== null && typeof value === 'object') {
            Object.keys(value).forEach(function (name) {
              var ops = {
                '$ne': value[name] === null ? ' is not ' : ' <> ',
                '$lt': ' < ',
                '$gt': ' > ',
                '$lte': ' <= ',
                '$gte': ' >= '
              };
              value = value[name];
              op = ops[name] || ' = ';
            });
            values[key] = query[name];
          }

          values[key] = value;
          return name + op + key;
        });
    return {values: values, keys: keys, placeholders: placeholders};
  }

  /**
   * Attempt to fetch a translation
   *
   * @param {Object} query {original, locale}
   * @param {Function} callback
   * @api public
   */
  sqliteStore.get = function (query, callback) {
    var where = buildQuery(query);

    client.execute(
      'SELECT * FROM ' + table + ' WHERE ' + where.placeholders.join(' AND '),
      where.values,
      function (error, rows) {
        if (callback) {
          callback(error, error ? [] : rows);
        }
      }
    );
  };

  /**
   * Add a translation
   *
   * @param {Object} query {original, locale}
   * @param {String} translation
   * @param {Function} callback
   * @api public
   */
  sqliteStore.add = function (query, translation, callback) {
    var self = this, doc, params, where;

    if (Array.isArray(query.original)) {
      // COUNT
      if (query.original.length === 3) {
        doc = [];
        doc[0] = {original: query.original[0], locale: query.locale, translation: translation, count: 'singular', context: query.context || null};
        doc[1] = {original: query.original[1], locale: query.locale, translation: translation, count: 'plural', context: query.context || null};
      } else if (query.original.length === 2) {
        doc = {original: query.original, locale: query.locale, translation: translation, count: '', context: query.context || null};
      }
      else {
        doc = {original: query.original, locale: query.locale, translation: translation, count: '', context: query.context || null};
      }
    } else {
      doc = {original: query.original, locale: query.locale, translation: translation};
    }

    function insertValues(doc, callback) {
      var build = buildQuery(doc);

      client.execute(
        'INSERT INTO ' + table + ' (' + build.keys.join(', ') + ') ' +
        ' VALUES (' + Object.keys(build.values).join(', ') + ')',
        build.values,
        function (err, data) {
          if (callback) {
            callback(err);
          }
        }
      );
    }

    where = buildQuery({original: query.original, locale: query.locale});

    client.execute(
      'SELECT ' + where.keys.join(', ') + ' FROM ' + table +
      ' WHERE ' + where.placeholders.join(' AND ') + ' LIMIT 1',
      where.values,
      function (error, data) {
        if (!error && (!data || data.length === 0)) {
          var insert, count = 1, err,
              fireCallback = function (error) {
                count -= 1;
                if (error) {
                  err = error;
                }
                if (count <= 0) {
                  if (callback) {
                    callback(err, sqliteStore);
                  }
                }
              };

          if (Array.isArray(doc)) {
            count = doc.length;
            doc.forEach(function (doc) {
              insertValues(doc, fireCallback);
            }, doc);
          }
          else {
            insertValues(doc, fireCallback);
          }

        }
        else {
          if (callback) {
            callback(error, sqliteStore);
          }
        }
      }
    );
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
  sqliteStore.set = function (query, translation, callback) {
    var where = buildQuery(query, '$w_'),
        update = buildQuery(
          typeof translation === 'string' ? {translation : translation} : translation,
          '$u_'
        ),
        values = update.values;

    Object.keys(where.values).forEach(function (name) {
      values[name] = where.values[name];
    });
    client.execute(
      'UPDATE ' + table + ' SET ' + update.placeholders.join(', ') +
      ' WHERE ' + where.placeholders.join(' AND '),
      values,
      function (error, data) {
        if (callback) {
          callback(error, sqliteStore);
        }
      }
    );
  };

  /**
   * Destroy the session associated with the given `hash`.
   *
   * @param {String} query
   * @param {String} callback
   * @return {Object} client
   * @api public
   */
  sqliteStore.destroy = function (query, callback) {
    var where = buildQuery(query);

    client.execute(
      'DELETE FROM ' + table + ' WHERE ' + where.placeholders.join(' AND '),
      where.values,
      callback
    );
  };

  /**
   * Fetch number of translations.
   *
   * @param {Function} callback
   * @api public
   */
  sqliteStore.length = function (callback) {
    client.execute(
      'SELECT COUNT(*) AS count FROM ' + table,
      function (err, data) {
        callback(err, !err && data && data.length ? data[0].count : null);
      }
    );
  };

  /**
   * Fetch number of translations that match the query.
   *
   * @param {Object} query
   * @param {Function} callback
   * @api public
   */
  sqliteStore.count = function (query, callback) {
    var where = buildQuery(query);

    client.execute(
      'SELECT COUNT(*) AS count FROM ' + table + ' WHERE ' + where.placeholders.join(' AND '),
      where.values,
      function (err, data) {
        callback(err, !err && data && data.length ? data[0].count : null);
      }
    );
  };

  /**
   * Get the client
   *
   * @param
   * @api public
   */
  sqliteStore.getClient = function (callback) {
    return client;
  };

  client.open(options.database, function (error) {
    if (error) {
      throw error;
    }
    client.execute(
      'CREATE TABLE IF NOT EXISTS ' + table + ' (original TEXT, locale TEXT, translation TEXT, count TEXT, context TEXT, PRIMARY KEY(original, locale, count))',
      function (err, data) {
        if (callback) {
          callback(null, sqliteStore);
        }
      }
    );
  });
};
