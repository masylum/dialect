var dialect = require('..').dialect({
      locales: ['es', 'en','fr'],
      current_locale: 'es',
      store: {mongodb: {}}
    }),
    _ = dialect.get,
    original = 'Hello World!',
    translation = 'Hola Mundo!';
    translation_fr = 'Bonjour tout le monde!';

dialect.connect(function () {
  console.log(_(original));

  dialect.set({original: original, locale: 'fr'}, translation_fr);
  dialect.approve({original: original, locale: 'fr'}, true);

  dialect.set({original: original, locale: 'es'}, translation);
  dialect.approve({original: original, locale: 'es'}, true);

  dialect.sync({interval: 3600}, function (err, foo) {
    console.log(_(original));
    console.log(_(original,'fr'));
    console.log(_('Inexistant'));
    process.exit();
  });
});
