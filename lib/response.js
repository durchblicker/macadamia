/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

module.exports = Response;

var path = require('path');
var fs = require('fs');
var mime = require('mime');
var utility = require('./utils.js');

function Response(app, res, callback) {
  var obj = Object.create(res);
  var context = {
    locals:{},
    start:process.hrtime()
  };
  Object.defineProperty(obj, 'application', { value:app, enumerable:true });
  Object.defineProperty(obj, 'response', { value:res, enumerable:true });
  Object.defineProperty(obj, 'data', {
    get:function() {
      return context.locals;
    },
    set:function(value) {
      return context.locals=utility.merge(context.locals, value);
    },
    enumerable:true
  });
  Object.defineProperty(obj, 'time', {
    get: function() {
      var diff = process.hrtime(context.start);
      return ((diff[0] * 1e9) + diff[1]) / 1e6;
    },
    enumerable:true
  });

  Object.keys(Response.prototype).forEach(function(name) {
    Object.defineProperty(obj, name, {
      value:Response.prototype[name],
      enumerable:true,
      writable:true,
      configurable:true
    });
  });
  return ('function' === typeof callback) ? callback(undefined, obj) : obj;
}
Response.prototype.writeHead = function(status, reason, headers) {
  var res = this;
  if (('object' == typeof reason) && !headers) {
    headers = reason;
    reason = undefined;
  }
  if (headers) Object.keys(headers).forEach(function(name) {
    res.set(name, headers[name]);
  });
  this.emit('header');
  return this.response.writeHead.call(this, status, reason);
};
Response.prototype.status = function(code) {
  if (this.headersSent) return;
  this.response.statusCode = code;
  return this;
};
Response.prototype.get = function(name) {
  if (!name) return undefined;
  return this.response.getHeader(name);
};
Response.prototype.set = function(name, value) {
  if (this.headersSent) return this;
  var self = this;
  if ('object' === typeof name) {
    Object.keys(name).forEach(function(item) {
      self.set(item, name[item]);
    });
  } else {
    if ('undefined' === typeof value) return this;
    if (null === value) {
      this.response.removeHeader(name);
    } else {
      this.response.setHeader(name, value);
    }
  }
  return this;
};
Response.prototype.cookie = function(name, value, options) {
  options = options || {};
  var hdr = [ name, value ].join('=');
  var opt = [];
  opt.push([ 'Path', options.path || '/' ].join('='));
  if (options.domain) opt.push([ 'Domain', options.domain ].join('='));
  if (options.maxAge) opt.push([ 'Max-Age', options.maxAge ].join('='));
  if (options.secure) opt.push('Secure');
  opt = opt.join(', ');
  this.set('Set-Cookie', [ hdr, opt ].join('; '));
};
Response.prototype.clearCookie = function(name, options) {
  options = options || {};
  options.maxAge = 0;
  this.cookie(name, '', options);
};
Response.prototype.links = function(links) {
  this.set('Link', Object.keys(links).map(function(rel) {
    return [
      [ '<', links[name], '>' ].join(''),
      [ 'rel', name ].join('=')
    ].join('; ');
  }));
  return this;
};
Response.prototype.location = function(location) {
  if (location==='back') {
    location=this.request.headers['referer'] || this.request.url.resolve('/');
  } else {
    location=this.request.url.resolve(location);
  }
  this.set('Location', location);
  return this;
};
Response.prototype.redirect = function(code, location) {
  var e = new Error('Location: '+location+'('+location.length+')');
  if (isNaN(code)) {
    location = String(code);
    code = 302;
  }
  this.status(code).location(location).send('See: '+location);
};
Response.prototype.charset = 'utf-8';
Response.prototype.type = function(type) {
  var orig = type = String(type);
  if (type.indexOf('; charset=') !== -1) {
    this.charset = type.substr(type.indexOf('; charset=')+10);
    type = type.substr(0, type.indexOf('; charset='));
  }
  type = ((/^[\w|-|_]+\/[\w|-|_]+$/).exec(type) ? type : mime.lookup(type || '')) || 'application/octet-stream';
  type += ((type.indexOf('text/') === 0) || (type.indexOf('application/json') === 0)) ? ('; charset='+this.charset) : '';
  this.set('Content-Type', type);
  return this;
};
Response.prototype.size = function(size) {
  this.set('Content-Length', size ? String(size) : null);
  return this;
};
Response.prototype.attachment = function(file) {
  this.set('Content-Disposition', 'attachment'+(file ? ('; filename='+file) : ''));
  if (file) this.type(path.extname(file).substr(1));
  return this;
};
Response.prototype.render = function(template, data, options, next) {
  if (('function' === typeof options) && !next) {
    next = options;
    options = {};
  }
  var self = this;
  data = utility.merge(this.data, data);
  this.application.render(template, data, options, function(err, content) {
    if (err) return ('function' === typeof next) ? next(err) : undefined;
    self.status(self.response.statusCode || 200);
    self.send(content);
  });
};
Response.prototype.write = function(data, encoding) {
  if (this.bodySent) return this;
  this.response.write(data, encoding);
  return this;
};
Response.prototype.end = function(data, encoding) {
  if (this.bodySent) return;
  this.response.end(data, encoding);
  Object.defineProperty(this, 'bodySent', { value:true, enumerable:true });
  this.emit('done', this.request, this. response, this.statusCode, this.time);
};
Response.prototype.send = function(data, next) {
  this.status(this.response.statusCode || 200);
  if('object' === typeof data) {
    if (!Buffer.isBuffer(data)) {
      data = new Buffer(JSON.stringify(data), 'utf-8');
    }
  } else {
    data = new Buffer(String(data), 'utf-8');
  }
  this.size(data.length);
  this.end(data);
};
Response.prototype.json = function(data, next) {
  this.status(this.response.statusCode || 200);
  this.type('json');
  this.render('json', data, next);
};
Response.prototype.jsonp = function(data, next) {
  var cbn = this.request.query.callback || 'callback';
  this.status(this.statusCode || 200).type('application/javascript');
  this.send([ cbn, '(', JSON.stringify(data), ')' ].join(''));
};
Response.prototype.text = function(data, next) {
  this.status(this.response.statusCode || 200);
  this.type('text');
  this.send(data);
};
Response.prototype.sendfile = function(file, options, callback) {
  var self = this;
  if (('function' == typeof options) && !callback) {
    callbak=options;
    options = {};
  }
  options = options || {};
  file = path.resolve(options.root || process.cwd(), file);
  if (this.bodySent) return callback(new Error('content already sent'));
  fs.stat(file, function(err, stat) {
    if (err || !stat || !stat.isFile()) return ('function' === typeof callback) ? callback(err || new Error('invalid file')) : undefined;
    if (options.maxAge) self.set('Max-Age', options.maxAge);
    self.type(file);
    if (!options.start && !options.end) {
      options.start = 0;
      options.end = stat.size - 1;
    }
    self.size(options.end - options.start + 1);
    if (this.bodySent) return process.nextTick(function() {
      callback(new Error('content already sent'));
    });

    try {
      var stream = fs.createReadStream(file, options);
    } catch(err) {
      return ('function' === typeof callack) ? callback(err || new Error('ivalid file')) : undefined;
    }
    stream.pipe(self);
  });
};
Response.prototype.download = function(file, name, callback) {
  if (('function' === typeof name) && !callback) {
    callback = name;
    name = undefined;
  }
  this.status(200).type(name || file).attachment(name || file);
  this.sendfile(file, callback);
};
