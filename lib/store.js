/**
 * Initialize Store with the given `options`.
 *
 * @param {Object} options
 * @api public
 */

module.exports = function (options, callback) {

  if (!options || !options.store) {
    throw new Error("Please select which store you want to use with dialect");
  }

  options = options || {};

  try {
    require('./stores/' + options.store)(options, callback);
  } catch (exc) {
    if (exc.message === "Cannot find module './stores/" + options.store + "'") {
      throw new Error("This store is not available");
    } else {
      throw exc;
    }
  }
};

