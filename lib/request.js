/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

module.exports = Request;

var URL = require('url');
var QUERY = require('querystring');

function Request(app, req) {
  var obj = Object.create(req);
  Object.defineProperty(obj, 'application', {
    value:app,
    enumerable:true
  });
  Object.defineProperty(obj, 'request', {
    value:req,
    enumerable:true
  });
  Object.defineProperty(obj, 'URL', {
    value:Url(req.url),
    enumerable:true,
    configurable:true
  });
  Object.defineProperty(obj, 'query', {
    get:function() { return obj.URL.query; },
    enumerable:true,
    configurable:true
  });
  Object.defineProperty(obj, 'path', {
    get:function() { return obj.URL.pathname; },
    enumerable:true,
    configurable:true
  });
  Object.defineProperty(obj, 'host', {
    get:function() { return obj.URL.host; },
    enumerable:true,
    configurable:true
  });
  Object.defineProperty(obj, 'protocol', {
    get:function() { return obj.URL.protocol; },
    enumerable:true,
    configurable:true
  });
  Object.defineProperty(obj, 'secure', {
    get:function() { return obj.URL.protocol === 'https'; },
    enumerable:true,
    configurable:true
  });
  Object.defineProperty(obj, 'cookies', {
    value:Cookies(String(req.headers['cookie'] || '')),
    enumerable:true,
    configurable:true
  });
  Object.defineProperty(obj, 'param', {
    value:function(name) {
      return this.params[name] || this.query[name] || this.form[name];
    },
    enumerable:true,
    configurable:true
  });
  Object.defineProperty(obj, 'get', {
    value:function(name) {
      name = name.toLowerCase();
      name = (name === 'referrer') ? 'referer' : name;
      return this.request.headers[name];
    },
    enumerable:true,
    configurable:true
  });
  Object.defineProperty(obj, 'error', {
    value:function(status, message) {
      status = status || 500;
      status = isNaN(status) ? 500 : status;
      status = (status < 400) ? 500 : status;
      status = (status > 599) ? 500 : status;
      if (!(message instanceof Error)) message = new Error(String(message || http.STATUS_CODES[status]));
      message.status = status;
      obj.nextRoute(message);
    },
    enumerable:true,
    configurable:true
  });
  return obj;
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
