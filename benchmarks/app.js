var fs = require('fs'),
    http = require('http'),
    dialect = require('./..').dialect({
      path: __dirname + '/data',
      base_locale: 'en_us',
      current_locale: 'es_es',
      locales: ['en_en', 'es_es']
    });

dialect.config('locales').forEach(function (locale) {
  fs.writeFileSync(dialect.config('path') + locale + '.js', '{}', 'utf8');
});

require('./..').store({store: 'mongodb', database: 'bench'}, function (error, store) {

  store.collection.remove({}, function (err, data) {

    var options = {count: 1, context: 'females', name: 'Anna'},
        original = [
          'You have {count} friend called {name}',
          'You have {count} friends called {name}',
          options
        ],
        i = 0,
        tests = 100000,
        translation = 'Tienes {count} amiga llamada {name}',
        output = original[0],
        now = Date.now();

    dialect.config('store', store);

    dialect.getTranslation(original, function () {
      dialect.setTranslation({
        original: original[0],
        locale: dialect.config('current_locale'),
        context: 'female',
        count: 'singular'
      }, translation, function () {
        console.log('running...');
        for(;i < tests; i += 1) {
          dialect.getTranslation(original);
        }
        var time = Date.now() - now;
        console.log(time + 'ms');
        console.log(time/tests + 'ms per request');
      });
    });
  });
});
