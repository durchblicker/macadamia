/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT License.
*/

module.exports = Rewrite;

function Rewrite(opts) {
  opts = opts || {};
  opts.search = opts.search || /^.*$/;
  opts.replace = opts.replace || '/';
  return handler.bind(null, opts);
}

function handler(opts, req, res, callback) {
  req.URL.pathname = req.URL.pathname.replace(opts.search, opts.replace);
  callback();
}
