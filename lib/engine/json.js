/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

module.exports = json;

function json(tpl, data, options, callback) {
  var err, result;
  try {
    result = JSON.stringify(data, options.replacer, options.indent);
  } catch(ex) {
    err=ex;
  }
  process.nextTick(function() {
    return callback(err, result);
  });
}
