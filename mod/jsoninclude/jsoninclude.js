/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT License.
*/

module.exports = setup;

var macadamia = require('macadamia');
var path = require('path');

function setup(options) {
  options = macadamia.merge({ includeData:{} }, options);
  if (!options.root && (options.include || options.includeKey)) {
    throw(new Error('options.root is missing'));
  } else {
    options.root = path.resolve(options.root)+'/';
  }
  return function(req, res, next) {
    var data = macadamia.merge(res.data, options.includeData);
    var include = options.includeKey ? data[options.includeKey] : options.include;
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
      return next();
    }
    var base = path.resolve(options.root, req.path);
    include = include.map(function(include) {
      var file = (include.path[0]==='/') ? path.resolve(options.root, include.path.replace(/^\/+/,'')) : path.resolve(base, include.path);
      return {
        key:include.key,
        path:file
      };
    });
    async.map(include, function(include, callback) {
      fs.readFile(include.path, 'utf-8', function(err, content) {
        if (err) return callback(err);
        try {
          content = JSON.parse(content);
        } catch(ex) {
          content = String(content);
          include.key = include.key || 'content';
        }
        var result = include.key ? {} : content;
        if(include.key) result[include.key] = content;
        result = macadamia.merge(data, result);
        return callback(undefined, result);
      });
    }, function(err, includes) {
      if (err) return next(err);
      includes.forEach(function(include) {
        data = macadamia.merge(data, include);
      });
      res.data = data;
      next();
    });
  };
}
