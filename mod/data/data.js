/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT License.
*/

module.exports = setup;

var fs = require('fs');
var path = require('path');
var assert = require('assert');

function setup(options) {
  options = this.merge({ includeData:{}, defaultData:{} }, options);
  assert(options.root, 'options.root is missing');
  options.root = path.resolve(options.root)+'/';

  return function(req, res, callback) {
    var data = res.data;
    data = this.merge(data, options.data);
    (options.url ? loadFile.bind(this, options.root, req.URL.pathname.substr(1), null) : setImmediate)(function(err, base) {
      if (err) return callback(err);
      data = this.merge(data, base || {});
      var include = options.fileKey ? data[options.fileKey] : options.file;
      switch (typeof include) {
        case 'undefined':
          include = [];
          break;
        case 'object':
          if (null === include) include = []; break;
          if (Array.isArray()) {
            include = include.map(function(file) {
              return { key:undefined, path:String(file) };
            });
          } else {
            include = Object.keys(include).map(function(key) {
              return { key:key, path:String(include[key]) };
            });
          }
          break;
        default:
          include = [ String(include) ];
      }
      if (!include.length) {
        res.data = data;
        return callback();
      }
      var base = path.resolve(options.root, req.path);
      include = include.map(function(include) {
        include = { key:include.key, path:(include.path[0]==='/') ? path.resolve(options.root, include.path.replace(/^\/+/,'')) : path.resolve(base, include.path) };
        return function(cb) {
          loadFile(options.root, include.path, include.key, function(err, content) {
            if (err) return cb(err);
            data = this.merge(data, content);
            cb();
          }.bind(this));
        }.bind(this);
      }.bind(this));

      async.series(include, function(err) {
        if (err) return callback(err);
        res.data = data;
        callback();
      });
    }.bind(this));
  };
}

function loadFile(root, file, key, callback) {
  file = path.resolve(root, file);
  fs.readFile(file, 'utf-8', function(err, content) {
    if (err) return callback(err);
    var res = {};
    try {
      content = JSON.parse(content);
      key ? res[key]=content : res=content;
    } catch(ex) {
      res[key || 'content']=content;
    }
    callback(undefined, res);
  });
}
