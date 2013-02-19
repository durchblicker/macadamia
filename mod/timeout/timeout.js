/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

module.exports = setup;

function setup(options) {
  options = this.merge({}, options);
  options.timeout = isNaN(options.timeout) ? 5000 : options.timeout;

  function timeout(req, res, callback) {
    setTimeout(function() {
      var err = new Error('Request Timeout');
      err.status = 503;
      req.nextCallback(err);
    }, options.timeout);
    callback();
  };
}
