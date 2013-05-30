/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT License.
*/

module.exports = require('./lib/app.js');
module.exports.module = getModule;
module.exports.parseAge = parseAge;

function getModule(id) {
  return require('./module/' + id);
}

function parseAge(str) {
  if(!isNaN(str)) return str;
  str = String(str || '1 day').toLowerCase().split(/\s+/);
  str[0] = str[0].trim();
  if(str[0].indexOf('/') > -1) {
    str[0] = str[0].split('/');
    str[0] = String(parseInt(str[0][0], 10) / parseInt(str[0][1], 10));
  }
  var count = parseFloat(str[0], 10);
  count = isNaN(count) ? 1 : count;
  var unit = str[1].trim().replace(/s$/, '');
  unit = parseAge[unit] || 0;
  unit = isNaN(unit) ? 0 : unit;
  return Math.round(count * unit);
}
parseAge['millisecond'] = 1;
parseAge['second'] = 1000 * parseAge['millisecond'];
parseAge['minute'] = 60 * parseAge['second'];
parseAge['hour'] = 60 * parseAge['minute'];
parseAge['day'] = 24 * parseAge['hour'];
parseAge['week'] = 7 * parseAge['day'];
parseAge['month'] = 30 * parseAge['day'];
parseAge['quarter'] = 3 * parseAge['month'];
parseAge['year'] = 364.25 * parseAge['day'];
