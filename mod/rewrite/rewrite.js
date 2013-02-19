/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

module.exports = setup;

var fs = require('fs');
var path = require('path');
var assert = require('assert');

function setup(options) {
  options = this.merge({}, options);
  assert(Array.isArray(options.rules), 'options.rules must be an array');
  options.rules = options.rules.map(function(rule) {
    var search = (search instanceof RegExp) ? search : new RegExp(String(rule.search || '^([\\s|\\S]*)$'), 'g');
    return { search:search, replace:String(rule.replace || '$1') };
  });
  assert(!options.checkTarget || (options.checkTarget && options.root), 'missing options.root');

  return function(req, res, callback) {
    var result = req.URL.pathname;
    options.rules.forEach(function(rule) {
      result = result.replace(rule.search, rule.replace);
    });

    if (options.checkTarget) {
      var file = path.resolve(options.root, result.substr(1));
      return fs.stat(file, function(err, stat) {
        if (err || !stat) return callback();

        if (options.redirect) {
          res.redirect((isNaN(options.redirect)?301:options.redirect), result);
        } else {
          req.URL.pathname = result;
          callback();
        }
      });
    }
    if (options.redirect) {
      res.redirect((isNaN(options.redirect)?301:options.redirect), result);
    } else {
      req.URL.pathname = result;
      callback();
    }
  };
}
