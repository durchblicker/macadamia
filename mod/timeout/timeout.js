/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

module.exports = setup;

var utils = require('../../lib/utils.js');


function setup(options) {
  options = utils.merge({}, options);
  options.timeout = isNaN(options.timeout) ? 5000 : options.timeout;
  return timeout;
  function timeout(req, res, next) {
    var timeout = setTimeout(function() {
      req.error(503, 'Request Timeout');
    }, options.timeout);
    res.on('header', function() {
      timeout=clearTimeout(timeout);
    });
    next();
  };
}
