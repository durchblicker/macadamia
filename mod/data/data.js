/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

module.exports = setup;

var assert = require('assert');
var path = require('path');
var fs = require('fs');

function setup(options) {
  options = this.merge({}, options);
  assert(!!options.root,  'missing options.root');
  options.root = path.resolve(options.root);
  return function(req, res, next) {
    var file = path.resolve(options.root, req.URL.pathname.slice(1));
    if (file.indexOf(options.root) !== 0) return next();
    fs.stat(file, function(err, stat) {
      if (err) return next(err);
      res.set('Last-Modified', stat.mtime.toUTCString());
      fs.readFile(file, 'utf-8', function(err, data) {
        if (err) return next(err);
        try {
          data=JSON.parse(data);
          res.data = this.merge(res.data, data);
        } catch(ex) {
          return next(ex);
        }
        return next();
      }.bind(this));
    }.bind(this));
  };
}
