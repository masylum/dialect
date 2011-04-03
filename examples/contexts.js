var dialect = require('..').dialect({
      locales: ['es', 'en'],
      current_locale: 'es',
      store: {mongodb: {}}
    }),
    _ = dialect.get;

dialect.connect(function () {
  console.log(_(['Fight', {context: 'name'}]));
  console.log(_(['Fight', {context: 'verb'}]));

  dialect.set({original: 'Fight', locale: 'es', context: 'name'}, 'Lucha');
  dialect.set({original: 'Fight', locale: 'es', context: 'verb'}, 'Luchar');

  dialect.approve({original: 'Fight', locale: 'es', context: 'name'}, true);
  dialect.approve({original: 'Fight', locale: 'es', context: 'verb'}, true);

  dialect.sync({interval: 3600}, function (err, foo) {
    console.log(_(['Fight', {context: 'name'}]));
    console.log(_(['Fight', {context: 'verb'}]));
    process.exit();
  });
});
