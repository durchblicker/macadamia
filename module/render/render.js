/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT License.
*/

module.exports = Render;

function Render(opts) {
  opts = opts || {};
  opts.viewKey = opts.viewKey || 'view';
  opts.mimeType = opts.mimeType || 'text/html; charset=UTF-8';
  return handler.bind(null, opts);
}

function handler(opts, req, res, callback) {
  if(!res.locals[opts.viewKey]) return callback();
  try {
    res.render(res.locals[opts.viewKey], function(err, content) {
      if(err) {
        err.status = 500;
        return callback(err);
      }
      content = content || '';
      content = Buffer.isBuffer(content) ? content : new Buffer(content, 'utf-8');
      res.size(content.length);
      res.type(opts.mimeType || 'html');
      res.status(200);
      res.send(content);
      callback(null, res.statusCode);
    });
  } catch(ex) {
    callback(ex);
  }
}
