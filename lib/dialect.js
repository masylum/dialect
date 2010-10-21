var fs = require('fs');

module.exports = function (options) {
  var dialect = {},
      locales = [],
      dictionaries = {},

      loadDictionaries = function () {
        fs.readdirSync(options.path).forEach(function (filename) {
          if (/\.js$/.test(filename)) {
            var name = filename.substr(0, filename.lastIndexOf('.'));
            dictionaries[name] = require(options.path + '/' + name);
          }
        });
      };

  options = options || {};

  dialect.config = function (key, value) {
    if (value !== undefined) {
      options[key] = value;
    }
    return options[key];
  };

  dialect.translate = function (str, option) {
    var translation = '',
        i = 0;

    if (typeof str !== 'string' || str.length === 0) {
      return '';
    }

    if (options.base_locale === options.locale) {
      return str;
    } else {
      translation = dictionaries[options.locale][str];

      if (translation === undefined) {
        // store it!
        for (i in dictionaries) {
          dictionaries[i][str] = null;
        }
      }
      return translation || str;
    }
  };

  dialect.addTranslation = function (str) {
  };

  // Load the dictionaries
  loadDictionaries();

  return dialect;
};
