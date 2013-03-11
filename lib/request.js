/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

module.exports = enhance;

var Url = require('url');

function enhance(request) {
  request.pause();
  Object.defineProperty(request, 'get', {
    value: getHeader.bind(request),
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(request, 'header', {
    value: parseHeader.bind(request),
    enumerable: true,
    configurable: true
  });
  var URL = request.URL || (function() {
    var url = Url.parse(request.url, true);
    url.host = url.host || request.get('host') || [request.connection.localAddress, request.connection.localPort].join(':');
    url.hostname = url.hostname || url.host.split(':').shift();
    url.port = url.port || request.connection.localPort;
    url.protocol = url.protocol || (('function' === typeof request.connection.verifyPeer) ? 'https:' : 'http:');
    url = Url.parse(Url.format(url), true);
    Object.defineProperty(url, 'toString', {
      value: Url.format.bind(Url, url),
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(url, 'resolve', {
      value: Url.resolve.bind(Url, url),
      enumerable: true,
      configurable: true
    });
    return url;
  }());
  Object.defineProperty(request, 'URL', {
    value: URL,
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(request, 'protocol', {
    get: getter.bind(null, URL, 'protocol'),
    set: setter.bind(null, URL, 'protocol'),
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(request, 'host', {
    get: getter.bind(null, URL, 'host'),
    set: setter.bind(null, URL, 'host'),
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(request, 'path', {
    get: getter.bind(null, URL, 'pathname'),
    set: setter.bind(null, URL, 'pathname'),
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(request, 'secure', {
    value: ('https:' === URL.protocol),
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(request, 'query', {
    get: getter.bind(null, URL, 'query'),
    set: setter.bind(null, URL, 'query'),
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(request, 'cookies', {
    value: cookies(request.get('cookie')),
    enumerable: true,
    configurable: true
  });

  Object.defineProperty(request, 'is', {
    value: isType,
    enumerable: true,
    configurable: true
  });

  Object.defineProperty(request, 'data', {
    value: getData,
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(request, 'text', {
    value: getText,
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(request, 'json', {
    value: getJSON,
    enumerable: true,
    configurable: true
  });

  request.toString = function() {
    return '[ object MacadamiaRequest ]';
  };
  return request;
}

function getHeader(name) {

  return this.headers[String(name || '').toLowerCase()];
}

function parseHeader(name) {
  var val = this.get(name);
  val = Array.isArray(val) ? val : [val || ''];
  return val.map(function(val) {
    val = val.split('; ');
    var res = {
      value: val.shift(),
      attributes: {}
    };
    val.forEach(function(att) {
      att = att.split('=');
      att = [att[0], att.slice(1).join('=')];
      res.attributes[att[0]] = att[1];
    });
    res.value = res.value.length ? res.value : undefined;
    return res;
  });
}

function isType(type) {
  return(String(this.header('content-type').shift().value || '').toLowerCase() === type.toLowerCase());
}

function cookies(str) {
  var res = {};
  str = String(str || {}).split('; ');
  str.forEach(function(str) {
    str = str.split('=');
    res[str[0]] = str[1];
  });
  return res;
}

function getData(callback) {
  if(!this.readable) return callback(undefined, new Buffer(0));
  var buffer = [];
  var length = 0;
  this.on('data', function(chunk) {
    buffer.push(chunk);
    length += chunk.length;
  }.bind(this));
  this.on('end', function() {
    buffer = Buffer.concat(buffer, length);
    return callback(undefined, buffer);
  });
  this.once('error', callback);
  this.resume();
}

function getText(callback) {
  this.data(function(err, buffer) {
    callback(err, err ? undefined : buffer.toString(this.header('content-type').shift().attributes.charset || 'utf-8'));
  }.bind(this));
}

function getJSON(callback) {
  if(!this.is('application/json') && !this.is('text/json')) {
    return setImmediate(function() {
      callback(new Error('Not JSON'));
    });
  }
  this.text(function(err, text) {
    if(err) return callback(err);
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
  obj[name] = value;
  return obj[name];
}
