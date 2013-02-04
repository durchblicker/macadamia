/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

module.exports = Request;

var URL = require('url');
var QUERY = require('querystring');
var Formidable = require('formidable').IncomingForm;

function Request(app, req, callback) {
  var err, res;
  try {
    res = Object.create(req);
    Object.defineProperty(res, 'application', {
      value:app,
      enumerable:true
    });
    Object.defineProperty(res, 'request', {
      value:req,
      enumerable:true
    });
    Object.defineProperty(res, 'url', {
      value:Url(req.url),
      enumerable:true,
      configurable:true
    });
    Object.defineProperty(res, 'query', {
      get:function() { return res.url.query; },
      enumerable:true,
      configurable:true
    });
    Object.defineProperty(res, 'path', {
      get:function() { return res.url.pathname; },
      enumerable:true,
      configurable:true
    });
    Object.defineProperty(res, 'host', {
      get:function() { return res.url.host; },
      enumerable:true,
      configurable:true
    });
    Object.defineProperty(res, 'protocol', {
      get:function() { return res.url.protocol; },
      enumerable:true,
      configurable:true
    });
    Object.defineProperty(res, 'secure', {
      get:function() { return res.url.protocol === 'https'; },
      enumerable:true,
      configurable:true
    });
    Object.keys(Request.prototype).forEach(function(name) {
      Object.defineProperty(res, name, {
        value:('function' === typeof Request.prototype[name]) ? Request.prototype[name].bind(res) : Request.prototype[name],
        enumerable:true,
        writable:true,
        configurable:true
      });
    });
  } catch(ex) {
    if ('function' !== typeof callback) throw(ex);
    err=ex;
  }
  if ('function' !== typeof callback) return res;
  (function() {
    res.cookies = {};
    var cookies = String(req.headers['cookie'] || '');
    cookies.split(/,\s*/).forEach(function(cookie) {
      cookie = cookie.split(';').shift().split('=');
      res.cookies[cookie[0]] = cookie[1];
    });
  }());
  return callback(undefined, res);
}
Request.prototype.param = function(name) {
  return this.params[name] || this.query[name] || this.form[name];
};
Request.prototype.get = function(name) {
  name = name.toLowerCase();
  name = (name === 'referrer') ? 'referer' : name;
  return this.request.headers[name];
};

function Url(url) {
  if (!(this instanceof Url)) return new Url(url);
  var self=this;
  url = URL.parse(url, true);
  Object.keys(url).forEach(function(key) {
    Object.defineProperty(self, key, {
      get:function() { return url[key]; },
      set:function(val) { return url[key]=val },
      enumerable:true
    });
  });
  Object.defineProperty(this, 'toString', {
    value:URL.format.bind(URL, url),
    enumerable:true
  });
  Object.defineProperty(this, 'resolve', {
    value:function(url) {
      return URL.resolve(self.toString(), url);
    },
    enumerable:true
  });
  return this;
}
