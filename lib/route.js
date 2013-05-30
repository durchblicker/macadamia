/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT License.
*/

var debug = console.debug ? console.debug.bind(console) : function() {};

module.exports = Route;

var Minimatch = require("minimatch").Minimatch;

function Route(name, method, url, handler) {
  if(!(this instanceof Route)) return new Route(name, method, url, handler);
  if((name === 'prototype') && !method && !url && !handler) return this;
  var info = {};
  Object.defineProperty(info, 'name', {
    value: String(name || 'Route'),
    enumerable: true
  });
  Object.defineProperty(info, 'method', {
    value: Route.match(method),
    enumerable: true
  });
  Object.defineProperty(info, 'url', {
    value: Route.match(url),
    enumerable: true
  });
  Object.defineProperty(info, 'handler', {
    value: handler,
    enumerable: true
  });
  Object.defineProperty(this, 'info', {
    value: info,
    enumerable: true,
    configurable: true
  });
}

Route.prototype.handle = function(err, req, res, callback) {
  if(!this.info.method(req.method)) {
    //debug('-', this.toString(), req.method, req.url, '(METHOD)');
    return callback(err);
  }
  var urlmatch = this.info.url(req.URL ? req.URL.pathname : req.url);
  if(!urlmatch) {
    //debug('-', this.toString(), req.method, req.url, '(URL)');
    return callback(err);
  }

  Object.defineProperty(req, 'params', {
    value: ('object' === typeof urlmatch) ? urlmatch : {},
    enumerable: true,
    configurable: true
  });
  switch(this.info.handler.length) {
    case 3:
      if(err) {
        //debug('-', this.toString(), req.method, req.url, '(TYPE)');
        return callback(err);
      }
      debug('+', this.toString(), req.method, req.url);
      return this.info.handler(req, res, callback);
    case 4:
      if(!err) {
        //debug('-', this.toString(), req.method, req.url, '(TYPE)');
        return callback();
      }
      debug('+', this.toString(), req.method, req.url);
      return this.info.handler(err, req, res, callback);
    default:
      debug('-' + this.info.handler.length, this.toString(), req.method, req.url);
      return callback(err);
  }
};

Route.prototype.toString = function() {
  return 'Route(' + this.info.name + ')';
};

Route.match = function(def) {
  if(def instanceof RegExp) return Route.regex.bind(null, def);
  //if(('string' === typeof def) && contains(def, ['*', '?', '{' ])) return Route.pattern.bind(null, new Minimatch(def));
  if(('string' === typeof def) && contains(def, ['*', '?', '{', ':'])) return Route.makeParams(def);
  if('string' === typeof def) return Route.string.bind(null, def);
  if('function' === typeof def) return Route.fn.bind(null, def);
  if(Array.isArray(def)) return Route.makeMulti(def);
  return Route.any.bind(null);
};

Route.regex = function(regex, match) {
  return !!regex.exec(match);
};

Route.pattern = function(pattern, match) {
  return !!pattern.match(match);
};

Route.string = function(string, match) {
  return string.toLowerCase() === String(match || '').toLowerCase();
};

Route.fn = function(fn, match) {
  try {
    return !!fn(match);
  } catch(ex) {
    return false;
  }
};

Route.makeMulti = function(def) {
  return Route.multi.bind(null, def.map(Route.match));
};

Route.multi = function(rules, match) {
  var res = false;
  rules.forEach(function(rule) {
    res = res || rule(match);
  });
  return res;
};

Route.any = function(match) {
  return true;
};

function contains(str, chars) {
  return chars.filter(function(chr) {
    return str.indexOf(chr) > -1;
  }).length;
}

Route.makeParams = function(def) {
  function parsePath(path, keys) {
    path = path.replace(/\/\(/g, '(?:/')
      .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?(\*)?/g, function(_, slash, format, key, capture, optional, star) {
      keys.push({
        name: key,
        optional: !! optional
      });
      slash = slash || '';
      return '' + (optional ? '' : slash) + '(?:' + (optional ? slash : '') + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')' + (optional || '') + (star ? '(/*)?' : '');
    })
      .replace(/([\/.])/g, '\\$1')
      .replace(/\*/g, '(.*)');
    return new RegExp('^' + path + '$', 'i');
  }

  function match(path) {
    var keys = this.keys,
      params = this.params = {},
      parts = [],
      m = this.regexp.exec(path);

    if(!m) return false;

    for(var i = 1, len = m.length; i < len; ++i) {
      var key = keys[i - 1];

      var val = 'string' == typeof m[i] ? decodeURIComponent(m[i]) : m[i];

      if(key) {
        params[key.name] = val;
      } else {
        parts.push(val);
      }
    }

    parts.forEach(function(part, idx) {
      params[idx] = part;
    });
    return params;
  }
  var ctx = {
    keys: [],
    params: {}
  };
  ctx.regexp = parsePath(def, ctx.keys);
  return match.bind(ctx);
}
