/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT License.
*/

module.exports = Static;

var Fs = require('fs');
var Path = require('path');
var Pea = require('pea');
var parseRange = require('range-parser');

function Static(opts) {
  opts = opts || {};
  opts.root = Path.resolve(opts.root || process.cwd());
  opts.maxAge = isNaN(opts.maxAge) ? 0 : opts.maxAge;
  return handler.bind(null, opts);
}

function handler(opts, req, res, callback) {
  var options = [req.URL.pathname];
  if(!Path.extname(req.URL.pathname).length) {
    options.push(req.URL.pathname + '.html');
    options.push(req.URL.pathname.replace(/\/$/, '') + '/index.html');
  }
  options = options.map(function(path) {
    return Path.resolve(opts.root, path.substr(1));
  }).filter(function(path) {
    return(path.indexOf(opts.root + '/') === 0) && (Path.basename(path)[0] !== '.');
  });
  if(!options.length) return callback();
  Pea.first(options, stat).success(function(stat) {
    res.set('Last-Modified', stat.mtime.toUTCString());
    res.set('Accept-Ranges', 'bytes');
    res.set('Expires', (new Date(Date.now() + opts.maxAge)).toUTCString());
    res.set('E-Tag', stat.etag);

    if(!isModified(req, stat)) {
      res.status(304).end();
      return callback(undefined, 304);
    }

    var range = getRange(stat.size, req.header('range'));
    res.status(range.status).size(range.length);
    if(range.range) res.set('Content-Range', range.range);
    res.type(stat.path);

    if(!range.length || (req.method === 'HEAD')) {
      res.end();
      return callback(undefined, res.statusCode);
    }

    var stream = Fs.createReadStream(stat.path, {
      start: range.start,
      end: range.end
    });
    if(!stream) return callback(new Error('Could not create FileReadStream'));
    stream.pipe(res);
    res.on('finish', function(err) {
      callback(err, err ? undefined : res.statusCode);
    });
  }).fail(pass);
  function pass() { callback(); }
}

function stat(path, callback) {
  Fs.stat(path, function(err, stat) {
    if(err) return callback(err);
    if (stat.isDirectory()) return callback(new Error('Directory'));
    stat.path = path;
    stat.etag = '"' + stat.size + '-' + Number(stat.mtime) + '"';
    callback(null, stat);
  });
}

function isModified(req, stat) {
  var limit = req.header('if-modified-since');
  var etag = req.header('if-none-match');
  if(limit) {
    limit = (limit instanceof Date) ? limit : new Date(Date.parse(limit));
    return stat.mtime.getTime() > limit.getTime();
  }
  return etag ? (etag !== stat.etag) : true;
}

function getRange(total, header) {
  if(!header) return {
    status: 200,
    length: total
  };
  var ranges = parseRange(total, header);
  if(-1 === ranges) return {
    status: 416,
    range: 'bytes */' + total
  };
  ranges = ranges.shift();
  return {
    status: 206,
    start: ranges.start,
    end: ranges.end,
    length: ranges.end - ranges.start + 1,
    range: 'bytes ' + ranges.start + '-' + ranges.end + '/' + total
  };
}
