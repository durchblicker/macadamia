/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT License.
*/

module.exports = Request;

var parseURL = require('url').parse;

function Request(req) {
  Object.defineProperty(req, 'URL', {
    value: parseURL(req.url, true),
    enumerable: true,
    configurable: true
  });
  req.URL.host = req.URL.host || req.headers.host || 'localhost';
  if(!req.URL.protocol) {
    if(req.connection && ('function' === typeof req.connection.verifyPeer)) {
      req.URL.protocol = 'https';
    } else {
      req.URL.protocol = 'http';
    }
  }
  req.URL.port = parseInt(req.URL.port || req.URL.host.split(':').pop(), 10);
  req.URL.port = !isNaN(req.URL.port) ? req.URL.port : (req.URL.protocol === 'https' ? 443 : 80);
  req.URL.hostname = req.URL.hostname || req.URL.host.split(':').shift();
  req.URL.host = [req.URL.hostname, req.URL.port].join(':');
  Object.defineProperty(req, 'query', {
    get: function() {
      return req.URL.query;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(req, 'cookies', {
    value: parseCookies(req.headers.cookie),
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(req, 'header', {
    value: getHeader.bind(req),
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(req, 'get', {
    value: req.header,
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(req, 'is', {
    value: isType.bind(req),
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(req, 'ip', {
    value: req.socket.remoteAddress,
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(req, 'ips', {
    value: (req.header('X-Forwarded-For') || '').split(/\s*,\s*/).filter(function(str) {
      return !!str.length;
    }).concat([req.socket.remoteAddress]),
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(req, 'path', {
    value: req.URL.pathname,
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(req, 'host', {
    value: req.URL.host,
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(req, 'protocol', {
    value: req.URL.protocol.replace(/:/, ''),
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(req, 'secure', {
    value: req.protocol === 'https',
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(req, 'param', {
    value: getParam.bind(req),
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(req, 'body', {
    value: {},
    enumerable: true,
    configurable: true,
  });
  if('function' !== typeof req.read) req.pause();
}

function parseCookies(hdr) {
  var cookies = {};
  String(hdr || '').split('; ').filter(function(str) {
    return !!str.length;
  }).forEach(function(hdr) {
    hdr = hdr.split('=');
    var name = hdr.shift();
    var value = hdr.join('=');
    try {
      value = JSON.parse(value);
    } catch(ex) {}
    cookies[name] = value;
  });
  return cookies;
}

function getHeader(name) {
  return this.headers[String(name || '').toLowerCase()];
}

function isType(type) {
  var hdr = this.header('Content-Type') || 'none';
  hdr = hdr.split('; ').shift();
  type = (type || 'none').split('; ').shift();
  return hdr.toLowerCase() === type.toLowerCase();
}

function getParam(name) {
  return(this.params || {})[String(name || '')];
}
