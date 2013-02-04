/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

module.exports = setup;

var fs = require('fs');
var path = require('path');
var utils = require('../../lib/utils.js');
var parseRange = require('range-parser');

function setup(options) {
  options = utils.merge({}, options);
  if (!options.root) throw(new Error('missing options.root'));
  options.root = path.resolve(options.root);
  delete options.start;
  delete options.end;
  return function(req, res, next) {
    var app = this;
    var filepath = path.resolve(options.root, req.URL.pathname.replace(/^\/+/,''));
    if (filepath.indexOf(options.root)!==0) return next();
    fs.stat(filepath, function(err, file) {
      if (err || !file || !file.isFile()) return next();
      file.path = filepath;
      res.set('Last-Modified',file.mtime.toUTCString());
      res.set('Accept-Ranges', 'bytes');
      if (!isNaN(options.maxAge)) {
        res.set('Max-Age', options.maxAge);
        res.set('Expires', (new Date(Date.now()+ (options.maxAge * 1000))).toUTCString());
      }
      if ('object' === typeof options.headers) {
        Object.keys(options.headers).forEach(function(header) {
          if ('function' === typeof options.headers[header]) {
            options.headers[header].call(app, req, res);
          } else {
            res.set(header, options.headers[header]);
          }
        });
      }
      var etag = getETag(file, req);
      var modified = getModified(file, req);
      if (!etag || !modified) return res.status(304).size().end();

      var length = file.size;
      var ranges = req.get('range') ? parseRange(file.size, req.get('range')) : -2;
      if (-1 === ranges) return res.status(416).size().set('Content-Range', 'bytes */'+file.size).end();
      if (-2 !== ranges) {
        ranges = ranges.shift();
        options.start = ranges[0].start;
        options.end = ranges[0].end;
        res.status(206).set('Content-Range', 'bytes '+ranges.start+'-'+ranges.end+'/'+file.size);
        length = options.end - options.start + 1;
      } else {
        res.status(200);
      }
      res.type(file.path).size(length).sendfile(file.path, options, next);
    });
  };
}

function getETag(stat, req) {
  var etag = '"' + stat.size + '-' + Number(stat.mtime) + '"';
  if (req.get('if-none-match') === etag) return undefined;
  return etag;
}
function getModified(stat, req) {
  var modified = req.get('if-modified-since') ? Date.parse(req.get('if-modified-since')) : 0;
  if (stat.mtime.getTime() <= modified) return undefined;
  return stat.mtime.toUTCString();
}
