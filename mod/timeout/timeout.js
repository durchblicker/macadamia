/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

module.exports = setup;

function setup(options) {
  options = this.merge({}, options);
  options.timeout = isNaN(options.timeout) ? 5000 : options.timeout;

  function timeout(req, res, callback) {
    setTimeout(function() {
      if (!res.headersSent) res.status(503, 'Request Timeout').type('text').send('Request Timeout');
    }, options.timeout);
    callback();
  };
}
