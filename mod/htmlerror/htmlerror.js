/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

module.exports = setup;

var utils = require('../../lib/utils.js');
var fs = require('fs');
var path = require('path');

function setup(options) {
  options = utils.merge({}, options);
  options.errors = options.errors || {};
  if (!options.errors.root) throw(new Error('missing options.errors.root'));
  options.errors.root = path.resolve(options.errors.root);
  return function(tpl, data, opts, callback) {
    var file = options.errors[data.status] || (data.status+'.html');
    file = path.resolve(options.errors.root, file);
    fs.readFile(file, 'utf-8', function(err, content) {
      if (err) return callback(err);
      content = content.split(/\r?\n/).join('\0');
      content = content.replace(/\<\!--\s*STACK-TRACE--\>/gi, data.error || '');
      content = content.split('\0').join('\n');
      return callback(undefined, content);
    });
  };
}
