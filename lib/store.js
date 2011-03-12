var path = './stores/';

['mongodb', 'sqlite'/*, 'json', 'redis'*/].forEach(function (store) {
  module.exports[store] = require(path + store);
});
