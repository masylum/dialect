var assert = require('assert');

// ALL stores should add those tests
module.exports = function (args) {
  return {
    'GIVEN a store': {
      topic: function () {
        require('./../..').store(args, this.callback);
      },

      'THEN it should have a GET method': function (store) {
        assert.isFunction(store.get);
      },

      'THEN it should have a SET method': function (store) {
        assert.isFunction(store.set);
      },

      'THEN it should have a DESTROY method': function (store) {
        assert.isFunction(store.destroy);
      },

      'THEN it should have a LENGTH method': function (store) {
        assert.isFunction(store.length);
      }
    }
  };
}
