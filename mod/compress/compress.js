/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

module.exports = setup;

var zlib = require('zlib');
var MacadamiaResponse = require('../../lib/response.js').MacadamiaResponse;

var compressors = {
  gzip:zlib.createGzip,
  deflate:zlib.createDeflate
};

function setup(options) {
  var types = [
    'application/javascript',
    'application/json',
    'text/'
  ];
  function isCompressable(req, res) {
    if ((res.get('content-encoding') || 'identity') !== 'identity') return false;
    var mime = res.get('Content-Type');
    if (!types.filter(function(type) {
      if ('string' === typeof type) return (mime.substr(0, type.length) === type);
      if (type instanceof RegExp) return type.exec(mime);
      return false;
    }).length) return false;
    var accept = (req.get('accept-encoding') || '').trim();
    accept = (('*' === accept) ? 'gzip' : accept).split(/\s*,\s*/);
    accept = Object.keys(compressors).filter(function(method) { return accept.indexOf(method) > -1; }).shift();
    if (!accept || !accept.length) return false;
    return accept;
  }
  function handler(req, res, callback) {
    res.add('Vary','Accept-Encoding');
    if (req.method === 'HEAD') return callback();
    res.on('headers', function() {
      var method = isCompressable(req, res);
      if (method) {
        res.set('Content-Encoding', method);
        res.size('n/a');
        var compressor = compressors[method]();
        compressor.toString = string.bind(compressor, method);
        res.transformer.push(compressor);
      }
    });
    callback(undefined, req, res);
  }
  return handler;
}
function string(method) {
  return '[ object '+(method==='deflate'?'Deflate':'GZip')+' ]';
}



