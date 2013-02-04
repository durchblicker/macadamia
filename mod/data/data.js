/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

module.exports = setup;

var path = require('path');
var fs = require('fs');
var utils = require('../../lib/utils.js');

function setup(options) {
  options = utils.merge({}, options);
  if (!options.root) throw(new Error('missing options.root'));
  options.root = path.resolve(options.root);
  return function(req, res, next) {
    var file = path.resolve(options.root, req.URL.pathname.slice(1));
    if (file.indexOf(options.root) === 0) return next();
    fs.readFile(file, 'utf-8', function(err, data) {
      if (err) return next(err);
      try {
        res.data = JSON.parse(data);
      } catch(ex) {
        return next(ex);
      }
      return next();
    });
  };
}
