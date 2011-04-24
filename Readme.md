           ,,    ,,             ,,
         `7MM    db           `7MM                    mm
           MM                   MM                    MM
      ,M""bMM  `7MM   ,6"Yb.    MM  .gP"Ya   ,p6"bo mmMMmm
    ,AP    MM    MM  8)   MM    MM ,M'   Yb 6M'  OO   MM
    8MI    MM    MM   ,pm9MM    MM 8M"""""" 8M        MM
    `Mb    MM    MM  8M   MM    MM YM.    , YM.    ,  MM
     `Wbmd"MML..JMML.`Moo9^Yo..JMML.`Mbmmd'  YMbmd'   `Mbmo


Dialect is a painless nodejs module to manage your translations.

## Install

    npm install dialect

## Philosphy

* Scalable: The translations should be available to any number of machines.
* Fast:     Getting translations from memory.
* Reliable: Translations should be always available on a central repository/database.
* Flexible: You should be able to use your favorite storage solution.

## Example

    var dialect = require('dialect').dialect({current_locale: 'es', store: {mongodb: {}}});

    // connects to the store
    dialect.connect(function () {

      // syncs the memory dictionaries with the store
      dialect.sync({interval:3600}, function (err, foo) {
        d.get('Hello World!'); // => Hola mundo
      });
    });

## Options

* `current_locale`: Current locale used on your application.
* `base_locale`: Base locale. Serves as keys on the dictionaries.
* `locales`: Which locales are available on your application.
* `store`: Object containing the store and their options

## Store options
* `mongodb`
  * `database`: _dialect_
  * `host`: _127.0.0.1_
  * `port`: _27017_
  * `collection`: _translations_
* `sqlite`
  * `database`: _dialect.db_
  * `table`: _dialect_

## API

* `config (key, value)`: Exposes configuration values.
* `get (query)`: Gets a translation cached in memory.
* `set (query, translation, callback)`: Sets a translation on the store.
* `approve (approve?, query, callback)`: Approve or rejects a translation.
* `sync (locale, repeat, callback)`: Syncs all the approved translations of the store to the memory cache.
* `connect (callback)`: Connects to the database store.

### Plurals

Provide an array with the singular and plural forms of the string,
the last element must contain a `count` param that will determine
which plural form to use.

    dialect.config('current_locale': 'sl'); // slovenian

    [1, 2, 3].forEach(function (i) {
      dialect.get(['Beer', 'Beers', {count: i}]);
    });

    +---------------+-------------+
    | found         | not found   |
    +---------------+-------------+
    | Pivo          | Beer        |
    | Pivi          | Beers       |
    | Piva          | Beers       |
    +---------------+-------------+

You have an examle using plural forms in `examples/plurals.js`


### Contexts

A `context` is a param that allows you to give a special meaning
on a string. It helps the translator and it may generate
diferent translations depending on the context.

    dialect.config('current_locale': 'es'); // spanish

    ['female', 'male'].forEach(function (gender) {
      dialect.get(['My friends', gender]);
    });

    +---------------+-------------+
    | found         | not found   |
    +---------------+-------------+
    | Mis amigos    | My friends  |
    | Mis amigas    | My friends  |
    +---------------+-------------+

You have an examle using contexts in `examples/contexts.js`

### String interpolation

You can put any param you want on the translation strings surrounded
by moustaches `{}`. Remember that `count` and `context` have a special
meaning although they can also be used with interpolations.

    [1, 2].forEach(function (count) {
      ['female', 'male'].forEach(function (gender) {
        dialect.get([
          'You have {count} friend called {name}',
          'You have {count} friends called {name}',
          {count: count, context: context, name: 'Anna'}
        ]);
      });
    });

    +---------------------------------------+-----------------------------------------+
    | found                                 | not found                               |
    +---------------------------------------+-----------------------------------------+
    | Tienes 1 amiga que se llama Anna      | You have 1 friend called Anna           |
    | Tienes 1 amigo que se llama Anna      | You have 1 friend called Anna           |
    | Tienes 2 amigas que se llaman Anna    | You have 2 friends called Anna          |
    | Tienes 2 amigos que se llaman Anna    | You have 2 friends called Anna          |
    +---------------------------------------+-----------------------------------------+

You have an examle using contexts in `examples/interpolation.js`

### Store translations

To store a new translation, use the method `set`.

    dialect.set(
      {original: 'I love gazpacho', locale: 'es'},
      'Me encanta el gazpacho'
    );

## dialect-http

Do you need a nice environment for your translators?

[dialect http](https://github.com/masylum/dialect-http) is an amazing http server to manage your translations.

## Test

Dialect is heavily tested using [testosterone](https://www.github.com/masylum/testosterone)

    make

## Benchmarks

Dialect should not add an overhead to your application on getting translations.
Please run/add benchmarks to ensure that this module performance rocks.

    node benchmakrs/hello_world.js


## License

(The MIT License)

Copyright (c) 2010-2011 Pau Ramon <masylum@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

