/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT License.
*/

module.exports = Redirect;

var formatURL = require('url').format;

function Redirect(opts) {
  opts = opts || {};
  opts.search = opts.search || /^.*$/;
  opts.replace = opts.replace || '';
  opts.code = opts.code || 302;
  return handler.bind(null, opts);
}

function handler(opts, req, res, callback) {
  var url = formatURL(req.URL);
  url = url.replace(opts.search, opts.replace);
  res.redirect(opts.code, url);
  callback(null, res.statusCode);
}
