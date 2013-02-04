/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

module.exports = setup;

var utils = require('../../lib/utils.js');

function setup(options) {
  options = utils.merge({}, options);
  return function(req, res, next) {
    if (!res.data.template) return next();
    res.status(200).type(req.URL.pathname).render(res.data.template, {}, options, next);
  };
}
