/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

module.exports = enhance;

var URL = require('url');

function enhance(request) {
  Object.defineProperty(request, 'get', {
    value:getHeader.bind(request),
    enumerable:true,
    configurable:true
  });
  Object.defineProperty(request, 'header', {
    value:parseHeader.bind(request),
    enumerable:true,
    configurable:true
  });

  Object.defineProperty(request, 'URL', {
    value:(function() {
      var url = URL.parse(request.url);
      url.host = url.host || request.get('host') || [ request.connection.localAddress, request.connection.localPort ].join(':');
      url.hostname = url.hostname || url.host.split(':').shift();
      url.port = url.port || request.connection.localPort;
      url.protocol = url.protocol || (('function' === typeof request.connection.verifyPeer) ? 'https:' : 'http:');
      url = URL.parse(URL.format(url), true);
       Object.defineProperty(url, 'toString', {
        value:URL.format.bind(URL, url),
        enumerable:true,
        configurable:true
      });
      Object.defineProperty(url, 'resolve', {
        value:URL.resolve.bind(URL, url),
        enumerable:true,
        configurable:true
      });
      return url;
    }()),
    enumerable:true,
    configurable:true
  });
  Object.defineProperty(request, 'protocol', {
    get:getter.bind(request.URL, 'protocol'),
    set:setter.bind(request.URL, 'protocol'),
    enumerable:true,
    configurable:true
  });
  Object.defineProperty(request, 'host', {
    get:getter.bind(request.URL, 'host'),
    set:setter.bind(request.URL, 'host'),
    enumerable:true,
    configurable:true
  });
  Object.defineProperty(request, 'path', {
    get:getter.bind(request.URL, 'pathname'),
    set:setter.bind(request.URL, 'pathname'),
    enumerable:true,
    configurable:true
  });
  Object.defineProperty(request, 'secure', {
    value:('https:' === request.URL.protocol),
    enumerable:true,
    configurable:true
  });
  Object.defineProperty(request, 'query', {
    get:getter.bind(request.URL, 'query'),
    set:setter.bind(request.URL, 'query'),
    enumerable:true,
    configurable:true
  });
  Object.defineProperty(request, 'cookies', {
    value:cookies(request.get('cookie')),
    enumerable:true,
    configurable:true
  });

  Object.defineProperty(request, 'data', {
    value:getData,
    enumerable:true,
    configurable:true
  });
  Object.defineProperty(request, 'text', {
    value:getText,
    enumerable:true,
    configurable:true
  });
  Object.defineProperty(request, 'json', {
    value:getJSON,
    enumerable:true,
    configurable:true
  });

  request.toString = function() { return '[ object MacadamiaRequest ]'; };
  return request;
}

function getHeader (name) {

  return this.headers[String(name || '').toLowerCase()];
}
function parseHeader(name) {
  var val = this.get(name);
  val = Array.isArray(val) ? val : [ val || '' ];
  return val.map(function(val) {
    val = val.split('; ');
    var res = { value:val.shift(), attributes:{} };
    val.forEach(function(att) {
      att = att.split('=');
      att = [ att[0], att.slice(1).join('=') ];
      res.attributes[att[0]] = att[1];
    });
    res.value = res.value.length ? res.value : undefined;
    return res;
  });
}
function isType(name) {
  return (String(this.header('content-type').shift().value || '').toLowerCase() === type.toLowerCase());
}
function cookies(str) {
  var res = {};
  str = String(str || {}).split('; ');
  str.forEach(function(str) {
    str = str.split('=');
    res[str[0]]=str[1];
  });
  return res;
}

function getData(callback) {
  if (!this.readable) return callback(undefined, new Buffer(0));
  var buffer=[];
  var length=0;
  this.on('readable', function() {
    var chunk=this.read();
    buffer.push(chunk);
    length += chunk.length;
  }.bind(this));
  this.on('end', function() {
    buffer = Buffer.concat(buffer, length);
    return callback(undefined, buffer);
  });
  this.once('error', callback);
}
function getText(callback) {
  this.data(function(err, buffer) {
    callback(err, err ? undefined : buffer.toString(this.header('content-type').shift().attributes.charset || 'utf-8'));
  }.bind(this));
}
function getJSON(callback) {
  if (!this.is('application/json') && !this.is('text/json')) return setImmediate(callback.bind(this, new Error('Not JSON')));
  this.text(function(err, text) {
    if (err) return callback(err);
    try {
      text = JSON.parse(text);
    } catch(ex) {
      return callback(ex);
    }
    callback(undefined, text);
  });
}

function getter(obj, name) {

  return obj[name];
}
function setter(obj, name, value) {

  return obj[name]=value;
}
