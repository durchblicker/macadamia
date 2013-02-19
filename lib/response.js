/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com> Licensed under MIT License.
*/

module.exports = wrap;
module.exports.MacadamiaResponse = MacadamiaResponse;

var Writable = require('stream').Writable;
var util = require('util');

var URL = require('url');
var HTTP = require('http');
var fs = require('fs');
var mime = require('mime');


function wrap(response, request) {
  return new MacadamiaResponse(response, request);
}

function MacadamiaResponse(response, request) {
  this.id = response.id = response.id || Date.now();
  Writable.call(this);
  var ctx={ data:{}, bodySent:false };

  Object.defineProperty(this, 'wrapped', { value:response });
  Object.defineProperty(this, 'request', { value:request||response.request });

  Object.defineProperty(this, 'statusCode', {
    get:getter.bind(null, response,'statusCode'),
    set:setter.bind(null, response, 'statusCode'),
    enumerable:true
  });
  Object.defineProperty(this, 'sendDate', {
    get:getter.bind(null, response,'sendDate'),
    set:setter.bind(null, response, 'sendDate'),
    enumerable:true
  });
  Object.defineProperty(this, 'headersSent', {
    get:getter.bind(null, response,'headersSent'),
    enumerable:true
  });
  Object.defineProperty(this, 'data', {
    get:getter.bind(null, ctx, 'data'),
    set:function(data) { ctx.data = this.merge(ctx.data, data); }.bind(this)
    enumerable:true
  });
  Object.defineProperty(this, 'bodySent', {
    get:getter.bind(null, ctx, 'bodySent'),
    enumerable:true
  });
  Object.defineProperty(this, 'time', {
    get:time.bind(this, process.hrtime()),
    enumerable:true
  });

  Object.defineProperty(this, '_write', { value:write.bind(this, response), enumerable:false, configurable:true });
  Object.defineProperty(this, 'writeContinue', { value:writeContinue.bind(this, response), enumerable:true, configurable:true });
  Object.defineProperty(this, 'setHeader', { value:setHeader.bind(this, response), enumerable:true, configurable:true });
  Object.defineProperty(this, 'getHeader', { value:getHeader.bind(this, response), enumerable:true, configurable:true });
  Object.defineProperty(this, 'addHeader', { value:addHeader.bind(this, response), enumerable:true, configurable:true });
  Object.defineProperty(this, 'removeHeader', { value:removeHeader.bind(this, response), enumerable:true, configurable:true });
  Object.defineProperty(this, 'addTrailers', { value:addTrailers.bind(this, response), enumerable:true, configurable:true });

  this.on('finish', function() {
    ctx.bodySent=true;
    this.application.trace('done:body');
    response.end();
  }.bind(this));
  events([ 'drain', 'close' ], response, this);

  return this;
}
util.inherits(MacadamiaResponse, Writable);

MacadamiaResponse.prototype.set = function(name, value) {
  if ('object' === typeof name) {
    Object.keys(name).forEach(function(item) {
      this.set(item, name[item]);
    }.bind(this));
    return this;
  }
  this.setHeader(name, value);
  return this;
};
MacadamiaResponse.prototype.add = function(name, value) {
  if ('object' === typeof name) {
    Object.keys(name).forEach(function(item) {
      this.add(item, name[item]);
    }.bind(this));
    return this;
  }
  this.addHeader(name, value);
  return this;
};
MacadamiaResponse.prototype.get = function(name) {

  return this.getHeader(name);
};
MacadamiaResponse.prototype.del = function(name) {
  this.removeHeader(name);
  return this;
};
MacadamiaResponse.prototype.status = function(status) {
  this.statusCode=isNaN(status) ? this.statusCode : status;
  return this;
};
MacadamiaResponse.prototype.size = function(size) {
  isNaN(size) ? this.del('Content-Length') : this.set('Content-Length', size);
  return this;
};
MacadamiaResponse.prototype.charset = 'utf-8';
MacadamiaResponse.prototype.type = function(type) {
  //console.error('Type('+type+') => '+mime.lookup(type));
  type = mime.lookup(type);
  if (('text/' === type.substr(0,5)) || ('application/javascript' === type) || ('application/json' === type)) type += '; charset='+this.charset;
  this.setHeader('Content-Type', type);
  return this;
};
MacadamiaResponse.prototype.cookie = function(name, value, options) {
  options = options || {};
  options.path = options.path || '/';
  value = [
    [ name, value ].join('='),
    [ 'Path', options.path ].join('=')
  ];
  if (options.domain) value.push([ 'Domain', options.domain ].join('='));
  if (options.expires) value.push([ 'Expires', ((d instanceof Date) ? options.expires : new Date(options.expires)).toUTCString() ].join('='));
  if (options.secure) value.push('Secure');
  if (options.httpOnly) value.push('HttpOnly');

  this.addHeader('Set-Cookie', value.join('; '));
  return this;
};
MacadamiaResponse.prototype.clearCookie = function(name, value, options) {
  options = options || {};
  options.path = options.path || '/';
  options.expires = new Date(0);
  return this.cookie(name, '', options);
};
MacadamiaResponse.prototype.link = function(name, value) {
  this.addHeader('Link', [
    [ '<', name, '> '].join(''),
    [ 'rel', value ].join('=')
  ].join('; '));
  return this;
};
MacadamiaResponse.prototype.links = function(links) {
  this.removeHeader(links);
  if (('object' === typeof links) && (null !== links)) {
    Object.keys(links).forEach(function(name) {
      this.link(name, links[name]);
    });
  }
  return this;
};
MacadamiaResponse.prototype.location = function(url) {
  url = (url==='back') ? (this.request.getHeader('referer') || '/') : url;
  url = URL.resolve(this.request.url, url);
  this.setHeader('Location', url);
  return this;
};
MacadamiaResponse.prototype.redirect = function(code, url) {
  if (!url) {
    url = code;
    code = 301;
  }
  return this.status(code).location(url).type('text/plain; charset=utf-8').send([ HTTP.STATUS_CODES[code], url ].join(': '));
};
MacadamiaResponse.prototype.attachment = function(name) {
  this.setHeader('Content-Disposition', 'attachment' + (!name?'':[ '; filename', name ].join('=')));
  return this.type(name || 'application/octet-stream');
};
MacadamiaResponse.prototype.send = function(data) {
  data = Buffer.isBuffer(data) ? data : new Buffer(String(data));
  this.size(data.length);
  this.write(data);
  this.end();
  return;
};
MacadamiaResponse.prototype.file = function(filename, options, callback) {
  if (('function' == typeof options) && !callback) {
    callback=options;
    options = {};
  }

  options = options || {};
  fs.stat(filename, function(err, stat) {
    if (err) return callback(err);
    this.setHeader('Last-Modified', stat.mtime.toUTCString());
    if (options.maxAge) this.setHeader('Expires', (new Date(Date.now() + (options.maxAge * 1000))).toUTCString());
    if (!options.start && !options.end) {
      options.start = 0;
      options.end = stat.size - 1;
    }
    this.size(options.end - options.start + 1);
    try {
      fs.createReadStream(filename, options).pipe(this);
    } catch(ex) {
      console.error(ex);
      return callback(ex);
    }
    this.wrapped.on('finish', callback);
  }.bind(this));
};
MacadamiaResponse.prototype.json = function(data) {
  this.status(this.statusCode || 200).type('application/json; charset=utf-8');
  return this.send(JSON.stringify(data));
};
MacadamiaResponse.prototype.jsonp = function(data) {
  var cbn = (this.request.URL || URL.parse(this.request.url, true)).query.callback || 'callback';
  this.type('application/javascript; charset=utf-8');
  this.send([ cbn, '(', JSON.stringify(data), ')' ].join(''));
};
MacadamiaResponse.prototype.text = function(data) {
  this.status(this.statusCode || 200).type('text');
  return this.send(data);
};
MacadamiaResponse.prototype.html = function(data) {
  this.status(this.statusCode || 200).type('text/html; charset=utf-8');
  return this.send(data);
};
MacadamiaResponse.prototype.sendfile = function(filename, options, callback) {
  this.status(this.statusCode || 200).type(filename);
  return this.file(filename, options, callback);
};
MacadamiaResponse.prototype.download = function(filename, name, callback) {
  if (('function' === typeof name) && !callback) {
    callback = name;
    name = undefined;
  }
  this.status(this.statusCode || 200).type(name || filename).attachment(name || filename);
  return this.file(filename, callback);
};

MacadamiaResponse.prototype.toString = function() {

  return '[ object MacadamiaResponse('+this.id+') ]';
};

function write(ctx, chunk, callback) {
  if (!this.headersSent) {
    this.emit('header');
    ctx.writeHead(this.statusCode || 200);
    this.emit('body');
    this.application.trace('start:body');
  }
  var res=ctx.write(chunk, callback);
  return res;
}
function writeContinue(ctx) {

  return ctx.writeContinue();
}
function writeHead(ctx, status, reason, headers) {
  this.statusCode = status;
  headers = ((('object' === typeof reason) && (!headers)) ? reason : headers) || {};
  Object.keys(headers).forEach(function(name) {
    this.setHeader(name, headers[name]);
  }.bind(this));
  return this;
}
function setHeader(ctx, name, value) {
  if (this.headersSent) return this.emit('error', new Error('Headers already sent'));
  return ctx.setHeader(name, value);
}
function getHeader(ctx, name) {

  return ctx.getHeader(name);
}
function addHeader(ctx, name, value) {
  var current = this.getHeader(name);
  current = (('undefined' === typeof current) || (null === current)) ? [] : (Array.isArray(current) ? current : [ current ]);
  value = Array.isArray(value) ? value : [ value ];
  value = current.concat(value);
  value = value.length > 1 ? value : value.shift();
  return this.setHeader(name, value);
}
function removeHeader(ctx, name) {
  if (this.headersSent) return this.emit('error', new Error('Headers already sent'));
  ctx.removeHeader(name);
}
function addTrailers(ctx, headers) {
  if (this.headersSent) return this.emit('error', new Error('Headers already sent'));
  headers = headers || {};
  this.removeHeader('Trailer');
  Object.keys(headers).forEach((function(name) {
    this.addHeader('Trailer', name);
  }).bind(this));
  return ctx.addTrailers(headers);
}

function time(start) {
  var diff = process.hrtime(start);
  return (diff[0] * 1e9) + diff[1];
}

function getter(ctx, name) {
  return ctx[name];
}
function setter(ctx, name, value) {
  return ctx[name]=value;
}
function events(evt, src, dst) {
  evt.forEach(function(name) {
    //console.error(src+'on('+name+', '+dst+')');
    src.on(name, dst.emit.bind(dst, name));
  });
}
