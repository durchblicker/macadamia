/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

module.exports = Request;

var URL = require('url');
var QUERY = require('querystring');

function Request(app, req, callback) {
  var err, res;
  res = Object.create(req);
  Object.defineProperty(res, 'application', {
    value:app,
    enumerable:true
  });
  Object.defineProperty(res, 'request', {
    value:req,
    enumerable:true
  });
  Object.defineProperty(res, 'URL', {
    value:Url(req.url),
    enumerable:true,
    configurable:true
  });
  Object.defineProperty(res, 'query', {
    get:function() { return res.URL.query; },
    enumerable:true,
    configurable:true
  });
  Object.defineProperty(res, 'path', {
    get:function() { return res.URL.pathname; },
    enumerable:true,
    configurable:true
  });
  Object.defineProperty(res, 'host', {
    get:function() { return res.URL.host; },
    enumerable:true,
    configurable:true
  });
  Object.defineProperty(res, 'protocol', {
    get:function() { return res.URL.protocol; },
    enumerable:true,
    configurable:true
  });
  Object.defineProperty(res, 'secure', {
    get:function() { return res.URL.protocol === 'https'; },
    enumerable:true,
    configurable:true
  });
  Object.defineProperty(res, 'cookies', {
    value:Cookies(String(req.headers['cookie'] || '')),
    enumerable:true,
    configurable:true
  });
  Object.defineProperty(res, 'param', {
    value:function(name) {
      return this.params[name] || this.query[name] || this.form[name];
    },
    enumerable:true,
    writable:true,
    configurable:true
  });
  Object.defineProperty(res, 'get', {
    value:function(name) {
      name = name.toLowerCase();
      name = (name === 'referrer') ? 'referer' : name;
      return this.request.headers[name];
    },
    enumerable:true,
    writable:true,
    configurable:true
  });
  return ('function' === typeof callback) ? callback(undefined, res) : res;
}

function Url(url) {
  if (!(this instanceof Url)) return new Url(url);
  var self=this;
  url = URL.parse(String(url || ''), true);
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

function Cookies(str) {
  if (!(this instanceof Cookies)) return new Cookies(str);
  var cookies = this;
  String(str).split(/;\s*/).forEach(function(cookie) {
    cookie = cookie.split('=');
    Object.defineProperty(cookies, cookie[0], { value:cookie.slice(1).join('='), enumerable:true });
  });
}
