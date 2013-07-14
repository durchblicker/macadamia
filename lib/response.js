/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT License.
*/

module.exports = Response;

var Mime = require('mime');
var Path = require('path');
var Fs = require('fs');
var Pea = require('pea');

Mime.define({'application/x-source-map; charset=UTF-8': ['map']});

function Response(res) {
  Object.defineProperty(res, 'locals', {
    value: {},
    configurable: true,
    enumerable: true
  });
  Object.defineProperty(res, 'status', {
    value: status.bind(res),
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(res, 'size', {
    value: size.bind(res),
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(res, 'header', {
    value: setHeader.bind(res),
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(res, 'set', {
    value: res.header,
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(res, 'get', {
    value: getHeader.bind(res),
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(res, 'redirect', {
    value: redirect.bind(res),
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(res, 'location', {
    value: location.bind(res),
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(res, 'send', {
    value: sendBuffer.bind(res),
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(res, 'json', {
    value: sendJSON.bind(res),
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(res, 'type', {
    value: type.bind(res),
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(res, 'attachment', {
    value: attachment.bind(res),
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(res, 'download', {
    value: download.bind(res),
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(res, 'sendfile', {
    value: sendfile.bind(res),
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(res, 'links', {
    value: links.bind(res),
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(res, 'cookie', {
    value: cookie.bind(res),
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(res, 'render', {
    value: render.bind(res),
    enumerable: true,
    configurable: true
  });
}

function status(code) {
  this.statusCode = code;
  return this;
}

function size(len) {
  len = len || 0;
  this.header('Content-Length', len);
  return this;
}

function setHeader(name, value) {
  if(('object' === typeof name) && !value) {
    Object.keys(name).forEach(function(key) {
      this.setHeader(key, name[key]);
    }.bind(this));
  } else {
    if(null === value) {
      this.removeHeader(name);
    } else {
      this.setHeader(name, value);
    }
  }
  return this;
}

function getHeader(name) {
  return this.getHeader(name);
}

function redirect(code, location) {
  location = location || code;
  code = isNaN(code) ? 302 : code;
  return this.status(code).location(location).send([code, location].join(' '));
}

function location(url) {
  return this.header('Location', url);
}

function sendBuffer(content, callback) {
  content = Buffer.isBuffer(content) ? content : new Buffer(String(content), 'utf-8');
  if(!this.statusCode) {
    this.header('Content-Length', content.length);
    this.status(200);
  }
  this.end(content);
  return ('function' === typeof callback) ? callback(null, this.statusCode) : this;
}

function sendJSON(json, callback) {
  json = new Buffer(JSON.stringify(json), 'utf-8');
  return this.type('application/json').size(json.length).send(json, callback);
}

function type(mimetype) {
  if(!mimetype || (mimetype.split('/').length !== 2)) {
    mimetype = Mime.lookup(mimetype) || mimetype || 'application/octet-stream';
  }
  var charset;
  if(mimetype.indexOf('; charset=') < 0) {
    charset = Mime.charsets.lookup(mimetype);
  }
  mimetype += charset ? ('; charset=' + charset) : '';
  return this.header('Content-Type', mimetype);
}

function attachment(file) {
  if(file) this.type(file);
  return this.header('Content-Disposition', 'attachment' + (file ? '; filename=' + file : ''));
}

function download(path, name, cb) {
  name = ('string' === typeof name) ? name : Path.basename(path);
  return this.attachment(name).sendfile(path);
}

function sendfile(path, callback) {
  var res = this;
  Pea(Fs.stat, path).failure(callback).success(function(stat) {
    res.header('Content-Length', stat.size).header('Last-Modified', stat.mtime);
    var stream = Fs.createReadStream(path);
    if(!stream) return ('function' === typeof callback) ? callback(new Error('Could not create FileReadStream')) : (function() {
      res.type('text').status(500).send('could not create stream for: '+path);
    }());
    stream.pipe(res);
    if ('function' === typeof callback) res.on('finish', function(err) {
      callback(err, err ? undefined : res.statusCode);
    });
  });
  return this;
}

function links(def) {
  var lnk = [];
  Object.keys(def || {}).forEach(function(name) {
    lnk.push(['<', def[name], '>; rel="', name, '"'].join(''));
  });
  return this.header('Links', lnk);
}

function cookie(name, value, options) {
  name = String(name || 'cookie');
  value = 'string' === typeof value ? value : JSON.stringify(value);
  options = options || {};

  value = [ [name, value].join('=') ];

  value.push(['Path', options.path || '/' ].join('='));
  if(options.domain) value.push(['Domain', options.domain].join('='));
  if(options.expires || options.maxAge) {
    options.expires = options.expires || options.maxAge;
    if(!isNaN(options.expires)) {
      options.expires = new Date(Date.now() + options.expires);
    }
    if(options.expires instanceof Date) {
      options.expires = options.expires.toUTCString();
    }
    value.push(['Expires', options.expires].join('='));
  }
  if(options.httpOnly) value.push('HttpOnly');
  if(options.secure) value.push('Secure');

  value = value.join('; ');

  name = this.getHeader('set-cookie');
  name = name || [];
  name = Array.isArray(name) ? name : [name];

  value = name.concat(value);

  return this.header('set-cookie', value);
}

function render(view, data, callback) {
  if('function' === typeof data) {
    callback = data;
    data = {};
  }
  data = this.app.merge(this.locals, data);
  this.app.render(view, data, ('function' === typeof callback) ? callback : (function(err, html) {
    if (!err) return this.type('html').status(200).send(html);
    this.type('text').status(500).send(err.stack);
  }).bind(this));
  return this;
}
