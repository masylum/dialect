var dialect = require('..').dialect({
      locales: ['es', 'en'],
      current_locale: 'es',
      store: {mongodb: {}}
    }),
    _ = dialect.get;

dialect.connect(function () {
  [1, 2, 3].forEach(function (i) {
    console.log(_(['{count} Beer', '{count} Beers', {count: i}]));
  });

  dialect.set({original: '{count} Beer', locale: 'es', plural: 1}, '{count} pivo');
  dialect.set({original: '{count} Beer', locale: 'es', plural: 2}, '{count} pivi');
  dialect.set({original: '{count} Beer', locale: 'es', plural: 3}, '{count} piva');

  dialect.approve({original: '{count} Beer', locale: 'es', plural: 1}, true);
  dialect.approve({original: '{count} Beer', locale: 'es', plural: 2}, true);
  dialect.approve({original: '{count} Beer', locale: 'es', plural: 3}, true);

  dialect.sync({interval: 3600}, function (err, foo) {
    [1, 2, 3].forEach(function (i) {
      console.log(_(['{count} Beer', '{count} Beers', {count: i}]));
    });
    process.exit();
  });
});
