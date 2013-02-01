/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

module.exports = text;

function text(tpl, data, options, callback) {
  var err, result;
  try {
    result = String(data);
  } catch(ex) {
    err=ex;
  }
  process.nextTick(function() {
    return callback(err, result);
  });
}
