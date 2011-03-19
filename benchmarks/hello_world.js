var dialect = require('..').dialect({
      locales: ['es', 'en'],
      current_locale: 'es',
      store: {mongodb: {}} // test your store here
    }),
    funk = require('funk')(),
    funk2 = require('funk')(),
    times = 300,
    _ = dialect.get,
    original = 'Hello World!',
    translation = 'Hola Mundo!';

dialect.connect(function () {
  var i = 0,
      now = Date.now(),
      time = null;

  console.log('Setting ' + times + ' translations...');

  for (i = 0; i < times; i ++) {
    _(original);
    dialect.set({original: original, locale: 'es'}, translation, funk.nothing());

    //dialect.sync({}, function (err, foo) {
      //_(original);
      //_('Inexistant');
    //});
  }

  funk.parallel(function () {
    time = Date.now() - now;
    console.log(time + 'ms');
    console.log(parseInt(1000 / ( time / times)) + ' sets/sec');
  });

  dialect.sync({}, function (err, foo) {
    now = Date.now();
    time = null;

    console.log('Getting ' + times + ' translations...');
    for (i = 0; i < times; i ++) {
      _(original);
    }
    time = Date.now() - now;
    console.log(time + 'ms');
    console.log(parseInt(1000 / (time / times)) + ' gets/sec');
  });
});
