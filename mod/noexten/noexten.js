/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

module.exports = setup;

var utils = require('../../lib/utils.js');

function setup(options) {
  options = utils.merge({}, options);
  var regex = new RegExp('(?:\/'+(options.indexName || 'index')+')?\.\S+$');
  return function(req, res, next) {
    if (!regex.exec(req.url.pathname)) return next();
    res.redirect(req.url.pathname.replace(regex,''));
  }
}
