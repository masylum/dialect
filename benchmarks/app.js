// benchmark
require('./..').store({store: 'mongodb', database: 'bench'}, function (error, store) {
  var dialect = require('./..').dialect({
    base_locale: 'en_us',
    current_locale: 'es_es',
    locales: ['en_en', 'es_es'],
    store: store
  });

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

    dialect.get(original, function () {
      dialect.set({
        original: original[0],
        locale: dialect.config('current_locale'),
        context: 'female',
        count: 'singular'
      }, translation, function () {
        console.log('running...');

        for (;i < tests; i += 1) {
          dialect.get(original);
        }

        var time = Date.now() - now;
        console.log(time + 'ms');
        console.log(time / tests + 'ms per request');
      });
    });
  });
});
