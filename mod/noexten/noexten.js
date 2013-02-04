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
    var location = req.url.pathname.replace(regex,'');
    location = location.length ? location : '/';
    console.log('Rewrite: ',req.url.pathname,' ', location);
    res.redirect(301, location);
  }
}
