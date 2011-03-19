var testosterone = require('testosterone')({title: 'SQLizer helper lib', sync: true}),
    assert = testosterone.assert,
    gently = global.GENTLY = new (require('gently')),
    sqlizer = require('./../lib/helpers/sqlizer')({table: 'test'});

testosterone

  ////////////////////////////////////////////
  // parseDoc
  ////////////////////////////////////////////

  .add('parseDoc', function () {
    assert.equal(sqlizer.parseDoc({j: 4}),                                              'j = 4');
    assert.equal(sqlizer.parseDoc({j: '4'}),                                            "j = '4'");
    assert.equal(sqlizer.parseDoc({j: {'$exists': true}, f: null}),                     'j IS NOT null AND f IS null');
    assert.equal(sqlizer.parseDoc({j: {'$exists': false}}),                             'j IS null');
    assert.equal(sqlizer.parseDoc({j: {'$ne': null}}),                                  'j IS NOT null');
    assert.equal(sqlizer.parseDoc({j: {'$ne': 4, '$gt': 8}}),                           'j <> 4 AND j > 8');
    assert.equal(sqlizer.parseDoc({j: {'$lte': 4}, f: 4}),                              'j <= 4 AND f = 4');
    assert.equal(sqlizer.parseDoc({j: {'$lt': 4}, '$or': [{f: 4}, {g: {'$gte': 10}}]}), 'j < 4 AND (f = 4 OR g >= 10)');
    assert.equal(sqlizer.parseDoc({j: {'$in': [2, 3, 4]}}),                             'j IN (2,3,4)');
    assert.equal(sqlizer.parseDoc({j: {'$nin': [2, 3, 4]}}),                            'j NOT IN (2,3,4)');
  })

  ////////////////////////////////////////////
  // find
  ////////////////////////////////////////////

  .add('find', function () {
    assert.equal(sqlizer.find().sql,                           'SELECT * FROM test');
    assert.equal(sqlizer.find({}).sql,                         'SELECT * FROM test');
    assert.equal(sqlizer.find({j: 4}).sql,                     'SELECT * FROM test WHERE j = 4');
    assert.equal(sqlizer.find({j: 4, f: 5}, {a: 1}).sql,       'SELECT a FROM test WHERE j = 4 AND f = 5');
    assert.equal(sqlizer.find({j: 4, f: 5}, {a: 1, b: 1}).sql, 'SELECT a, b FROM test WHERE j = 4 AND f = 5');
    assert.equal(sqlizer.find({j: 4, f: 5}, {a: 2, b: 2}).sql, 'SELECT * FROM test WHERE j = 4 AND f = 5');
  })

  ////////////////////////////////////////////
  // sort
  ////////////////////////////////////////////

  .add('sort', function () {
    assert.equal(sqlizer.find({j: 4}).sort({b: 1}).sql,    'SELECT * FROM test WHERE j = 4 ORDER BY b ASC');
    assert.equal(sqlizer.find({j: 4}).sort({b: -1}).sql,   'SELECT * FROM test WHERE j = 4 ORDER BY b DESC');
    assert.equal(sqlizer.find({}).sort({a: -1, b: 1}).sql, 'SELECT * FROM test ORDER BY a DESC, b ASC');
  })

  ////////////////////////////////////////////
  // skip and limit
  ////////////////////////////////////////////

  .add('skip and limit', function () {
    assert.equal(sqlizer.find({j: 4}).skip(5).sql,          'SELECT * FROM test WHERE j = 4 LIMIT 0 OFFSET 5');
    assert.equal(sqlizer.find({j: 4}).limit(5).sql,         'SELECT * FROM test WHERE j = 4 LIMIT 5 OFFSET 0');
    assert.equal(sqlizer.find({j: 4}).skip(2).limit(5).sql, 'SELECT * FROM test WHERE j = 4 LIMIT 5 OFFSET 2');
    assert.equal(sqlizer.find({j: 4}).limit(5).skip(2).sql, 'SELECT * FROM test WHERE j = 4 LIMIT 5 OFFSET 2');
  })

  ////////////////////////////////////////////
  // count
  ////////////////////////////////////////////

  .add('count', function () {
    assert.equal(sqlizer.find({j: 4}).count().sql,                  'SELECT COUNT(*) FROM test WHERE j = 4');
  })

  ////////////////////////////////////////////
  // insert
  ////////////////////////////////////////////

  .add('insert', function () {
    assert.equal(sqlizer.insert({j: 4, f: 3}).sql,           'INSERT INTO test (j, f) VALUES (4, 3)');
    assert.equal(sqlizer.insert({j: 'foo', f: 3}).sql,       "INSERT INTO test (j, f) VALUES ('foo', 3)");
    assert.equal(sqlizer.insert([{j: 4, f: 3}, {d: 2}]).sql, 'INSERT INTO test (j, f) VALUES (4, 3); INSERT INTO test (d) VALUES (2)');
  })

  ////////////////////////////////////////////
  // update
  ////////////////////////////////////////////

  .add('update', function () {
    assert.equal(sqlizer.update({}, {'$set': {j: 4}}).sql,             'UPDATE test SET j = 4');
    assert.equal(sqlizer.update({}, {'$inc': {j: 2}}).sql,             'UPDATE test SET j = j + 2');
    assert.equal(sqlizer.update({d: 'foo'}, {'$set': {j: 'bar'}}).sql, "UPDATE test SET j = 'bar' WHERE d = 'foo'");
    assert.equal(sqlizer.update({d: 4, f: 3}, {'$inc': {j: 2}}).sql,   'UPDATE test SET j = j + 2 WHERE d = 4 AND f = 3');
  })

  ////////////////////////////////////////////
  // remove
  ////////////////////////////////////////////

  .add('remove', function () {
    assert.equal(sqlizer.remove({}).sql, 'DELETE FROM test');
    assert.equal(sqlizer.remove({j: 2}).sql, 'DELETE FROM test WHERE j = 2');
  })

  .serial(function () { });
