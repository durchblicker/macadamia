/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

module.exports = setup;

var zlib = require('zlib');
var utils = require('../../lib/utils.js');

var compressors = {
  gzip:zlib.createGzip,
  deflate:zlib.createDeflate
};

function setup(options) {
  options = utils.merge({}, options);
  options.compress = options.compress || {};
  return function(req, res, next) {
    var app = this;
    var compressor;
    var write = res.write;
    var end = res.end;

    res.set('Vary', 'Accept-Encoding');
    res.write = function(data, encoding) {
      if (!this.headersSent) this.response.writeHead(this.statusCode);
      return compressor ? compressor.write(new Buffer(data, encoding)) : write.call(res, data, encoding);
    };
    res.end = function(data, encoding) {
      if (data) this.write(data, encoding);
      return compressor ? compressor.end() : end.call(res);
    };
    var emit = res.response.emit;

    res.response.on('header', function() {
      var method;
      var accept = (req.get('accept-encoding') || '').trim();
      if (!accept.length) return;
      if (req.method === 'HEAD') return;
      if ((res.get('Content-Encoding') || 'identity') !== 'identity') return;
      if (Array.isArray(options.compress.types) && options.compress.types.indexOf((res.get('Content-Type')||'').split(';').shift()) === -1) return;
      if (accept == '*') accept = 'gzip';
      method = Object.keys(compressors).filter(function(method) { return accept.indexOf(method) > -1; }).shift();
      if (!method) return;
      compressor = compressors[method](options.compress);
      res.set('Content-Encoding', method);
      res.set('Content-Length', null);

      compressor.on('data', function(data){ write.call(res, data); });
      compressor.on('end', function(){ end.call(res); });
      compressor.on('drain', function() { res.emit('drain'); });
    });
    next();
  };
}
