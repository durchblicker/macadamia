/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

module.exports = setup;

var fs = require('fs');
var path = require('path');
var utils = require('../../lib/utils.js');

function setup(options) {
  options = utils.merge({}, options);
  if (!options.root) throw(new Error('missing options.root'));
  options.root = path.resolve(options.root);
  options.index = options.index || [ '.html' ,'/index.html' ];
  return function(req, res, next) {
    if ((req.url.pathname[req.url.pathname.length - 1] === '/') && (req.url.pathname.length > 1)) return res.redirect(301, req.url.pathname.replace(/\/+$/,''));
    if (path.extname(req.url.pathname).length) return next();
    var paths = options.index.map(function(item) {
      return path.resolve(options.root, [ req.url.pathname, item ].join('').replace(/^\/+/,''));
    }).filter(function(item) {
      return item.indexOf(options.root)===0;
    });
    utils.findFile(paths, function(err, stat) {
      if (err || !stat) return next();
      req.url.pathname = '/'+path.relative(options.root, stat.path);
      next();
    });
  }
}
