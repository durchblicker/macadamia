/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT License.
*/

module.exports = MacadamiaError;

function MacadamiaError(opts) {
  opts = opts || {};
  if(!isNaN(opts.trigger) && (opts.trigger > 399) && (opts.trigger < 600)) return trigger.bind(null, opts);
  return handler.bind(null, opts);
}

function handler(opts, err, req, res, callback) {
  var data = {
    status: err.status || 500,
    message: err.message,
    stack: (err.stack || '').split(/\r?\n/).slice(1).map(function(line) {
      return line.trim().replace(/^at\s+/, '');
    })
  };
  res.render(opts.view || 'error', data, function(err, content) {
    if(err) return callback(err);
    content = content || '';
    content = Buffer.isBuffer(content) ? content : new Buffer(content, 'utf-8');
    res.size(content.length);
    res.type(opts.mimeType || 'html');
    res.status(data.status);
    res.send(content);
    callback(null, res.statusCode);
  });
}

function trigger(opts, req, res, callback) {
  var err = new Error(opts.message || 'Triggered Error');
  err.status = opts.trigger;
  callback(err);
}
