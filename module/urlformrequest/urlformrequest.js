/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT License.
*/

module.exports = URLFormRequest;

var parseQuery = require('qs').parse;
var suckstream = require('suckstream');

function URLFormRequest(opts) {
  opts = opts || {};
  opts.check = Boolean(opts.check === undefined ? true : opts.check);
  return handler.bind(null, opts);
}

function handler(opts, req, res, callback) {
  if(!req.is('application/x-www-form-urlencoded')) return callback();
  suckstream(req, function(err, data) {
    if(err && opts.check) return callback(err);
    if(!data && opts.check) return callback(new Error('No Data'));
    data = data || '{}';
    data = data.toString('utf-8');
    try {
      data = parseQuery(data);
    } catch(ex) {
      if(opts.check) return callback(ex);
      data = {};
    }
    Object.defineProperty(req, 'body', {
      value: data,
      enumerable: true,
      configurable: true,
    });
    callback();
  });
}
