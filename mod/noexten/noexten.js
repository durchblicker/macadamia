/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

module.exports = setup;

var utils = require('../../lib/utils.js');

function setup(options) {
  options = utils.merge({}, options);
  var regex = new RegExp('(?:/'+(options.indexName || 'index')+')?\\.\\S+$');
  return function(req, res, next) {
    if (!regex.exec(req.url.pathname)) return next() || console.log(regex, ' no match');
    console.log('Rewrite: ',req.url.pathname,' ',req.url.pathname.replace(regex,''));
    res.redirect(301, req.url.pathname.replace(regex,''));
  }
}
