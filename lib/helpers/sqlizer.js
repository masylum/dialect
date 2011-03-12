module.exports = function (options) {
  var SQLizer = {},

      _objectNotEmpty = function (o) {
        return o && Object.keys(o).length > 0;
      },

      _quotize = function (f) {
        if (Array.isArray(f)) {
          return f.map(function (e) {
            return typeof e === 'string' ? "'" + e + "'": e;
          });
        } else {
          return typeof f === 'string' ? "'" + f + "'": f;
        }
      },

      _parseOptions = function (query) {
        var result = [];

        if (typeof query !== 'object' || query === null) {
          return [(query === null ? ' IS ' : ' = ') + _quotize(query)];
        } else {
          Object.keys(query).forEach(function (key) {
            var value = query[key], ops;

            switch (key) {
            case '$in':
            case '$nin':
              ops = {
                '$in': ' IN ',
                '$nin': ' NOT IN '
              };
              result.push(ops[key] + '(' + _quotize(value).join(',') + ')');
              break;
            case '$exists':
              result.push(' IS ' + (value ? 'NOT ' : '') + 'null');
              break;
            case '$ne':
            case '$lt':
            case '$gt':
            case '$lte':
            case '$gte':
              ops = {
                '$ne': value === null ? ' IS NOT ' : ' <> ',
                '$lt': ' < ',
                '$gt': ' > ',
                '$lte': ' <= ',
                '$gte': ' >= '
              };
              result.push(ops[key] + _quotize(value));
              break;
            default:
              throw Error('`' + key + '` not implemented yet');
            }
          });

          return result;
        }
      };

  if (!options.table) {
    throw Error('You must specify a table');
  }

  SQLizer.table = options.table;

  SQLizer.parseDoc = function (query) {
    var result = [];

    Object.keys(query).forEach(function (key) {
      var value = query[key];

      // ['> 4', '< 8', '= 4']
      if (key === '$or') {
        (function () {
          var or = [];
          value.forEach(function (val) {
            or.push(SQLizer.parseDoc(val));
          });
          result.push('(' + or.join(' OR ') + ')');
        }());
      } else {
        _parseOptions(value).forEach(function (val) {
          result.push(key + val);
        });
      }
    });

    return result.join(' AND ');
  };

  SQLizer.find = function (query, fields) {
    var i,
        selects = [];

    SQLizer.sql = 'SELECT ';

    if (!_objectNotEmpty(fields)) {
      SQLizer.sql += '*';
    } else {
      for (i in fields) {
        if (fields[i] === 1) {
          selects.push(i);
        }
      }
      SQLizer.sql += selects.length ? (selects.join(', ')) : '*';
    }

    SQLizer.sql += ' FROM ' + SQLizer.table;

    if (_objectNotEmpty(query)) {
      SQLizer.sql += ' WHERE ' + SQLizer.parseDoc(query);
    }

    return SQLizer;
  };

  SQLizer.sort = function (doc) {
    var i,
        sorts = [];

    if (_objectNotEmpty(doc)) {
      SQLizer.sql += ' ORDER BY ';

      for (i in doc) {
        sorts.push(i + ' ' + (doc[i] > 0 ? 'ASC' : 'DESC'));
      }

      SQLizer.sql += sorts.join(', ');
    }

    return SQLizer;
  };

  SQLizer.limit = function (num) {
    if (/(LIMIT) \d( OFFSET \d)/.test(SQLizer.sql)) {
      SQLizer.sql = SQLizer.sql.replace(/(LIMIT) \d( OFFSET \d)/, '$1 ' + num + '$2');
    } else {
      SQLizer.sql += ' LIMIT ' + num + ' OFFSET 0';
    }

    return SQLizer;
  };

  SQLizer.skip = function (num) {
    if (/(LIMIT \d) (OFFSET )\d/.test(SQLizer.sql)) {
      SQLizer.sql = SQLizer.sql.replace(/(LIMIT \d) (OFFSET )\d/, '$1 $2' + num);
    } else {
      SQLizer.sql += ' LIMIT 0 OFFSET ' + num;
    }

    return SQLizer;
  };

  SQLizer.count = function (num) {
    if (/SELECT (.*) FROM/.test(SQLizer.sql)) {
      SQLizer.sql = SQLizer.sql.replace(/(SELECT) .* (FROM)/, '$1 COUNT(*) $2');
    }

    return SQLizer;
  };

  SQLizer.insert = function (docs) {
    var parse = function (doc) {
      var i,
          values = [],
          sql = 'INSERT INTO ' + SQLizer.table + ' (' + Object.keys(doc).join(', ') + ')';

      for (i in doc) {
        values.push(doc[i]);
      }

      sql += ' VALUES (' + _quotize(values).join(', ') + ')';

      return sql;
    };

    if (Array.isArray(docs)) {
      SQLizer.sql = docs.map(parse).join('; ');
    } else {
      SQLizer.sql = parse(docs);
    }

    return SQLizer;
  };

  SQLizer.update = function (where, update) {
    var i,
        value = null,
        updates = [],

        _parseUpdate = function (key, value) {
          var i = Object.keys(value)[0],
              v = value[i];

          switch (key) {
          case '$set':
            return i + ' = ' + _quotize(v);
          case '$inc':
            if (v !== 0) {
              return i + ' = ' + i + (v > 0 ? ' + ' : ' - ') + v;
            } else {
              return '';
            }
          }
        };

    SQLizer.sql = 'UPDATE ' + SQLizer.table + ' SET ';

    if (_objectNotEmpty(update)) {
      for (i in update) {
        value = update[i];
        if (typeof value === 'object') {
          updates.push(_parseUpdate(i, value));
        }
      }
    }

    SQLizer.sql += updates.join(', ');

    if (_objectNotEmpty(where)) {
      SQLizer.sql += ' WHERE ' + SQLizer.parseDoc(where);
    }

    return SQLizer;
  };

  SQLizer.remove = function (where) {

    SQLizer.sql = 'DELETE FROM ' + SQLizer.table;

    if (_objectNotEmpty(where)) {
      SQLizer.sql += ' WHERE ' + SQLizer.parseDoc(where);
    }

    return SQLizer;
  };

  return SQLizer;
};
