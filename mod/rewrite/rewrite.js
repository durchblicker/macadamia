/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

module.exports = setup;

var fs = require('fs');
var path = require('path');
var utils = require('../../lib/utils.js');

function setup(options) {
  options = utils.merge({}, options);
  options.rewrite = options.rewrite || {};
  if (!Array.isArray(options.rewrite.rules)) throw(new Error('options.rewrite.rules must be an array'));
  options.rewrite.rules = options.rewrite.rules.map(function(rule) {
    return {
      search:new RegExp(rule.search || '^([\\s|\\S]*)$', 'g'),
      replace:String(rule.replace || '$1')
    };
  });
  if (options.rewrite.checkTarget) {
    options.root = path.resolve(options.root);
    if (!options.root) throw(new Error('missing options.root'));
  }
  return function(req, res, next) {
    var result = req.path;
    options.rewrite.rules.forEach(function(rule) {
      result = result.replace(rule.search, rule.replace);
    });
    if (options.checkTarget) {
      var file = path.resolve(options.root, result.substr(1));
      return fs.stat(file, function(err, stat) {
        if (err || !stat) return next();
        if (options.rewrite.redirect) {
          res.redirect((isNaN(options.rewrite.redirect)?301:options.rewrite.redirect), result);
        } else {
          req.url.pathname = result;
          next();
        }
      });
    }
    if (options.rewrite.redirect) {
      res.redirect((isNaN(options.rewrite.redirect)?301:options.rewrite.redirect), result);
    } else {
      req.url.pathname = result;
      next();
    }
  };
}
