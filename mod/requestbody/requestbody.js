/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

module.exports = setup;

var utils = require('../../lib/utils.js');
var QUERY = require('querystring');
var Readable = require('stream').Readable;

var Formidable;
try {
  Formidable = require('formidable').IncomingForm;
} catch(ex) {
  console.log('To parse multipart/form-data you need to install formidable.');
}

function setup(options) {
  options = utils.merge({}, options);
  options.maxRequestSize = options.maxRequestSize || Number.POSITIVE_INFINITY;
  return function(req, res, next) {
    var len = req.get('Content-Length') || 0;
    if (len > options.maxRequestSize) return next(new Error('Request-Size too large (>'+options.maxRequestSize+'bytes)'));
    var type = req.get('Content-Type') || 'application/octet-stream';
    if (!Formidable && (type.indexOf('multipart/form-data') === 0)) return multipartFomidable.call(this, options, req, res, next);
    if (type.indexOf('application/x-www-form-urlencoded') === 0) return urlencodedForm.call(this, options, req, res, next);
    if (type.indexOf('application/json') === 0) return jsonData.call(this, options, req, res, next);
    if (type.indexOf('text/json') === 0) return jsonData.call(this, options, req, res, next);
    return generalData.call(this, options, req, res, next);
  };
}

function urlencodedForm(options, req, res, next) {
  generalData.call(this, options, req, res, function(err) {
    if (err) return next(err);
    var formData = QUERY.parse(req.bodyString);
    Object.defineProperty(req, 'bodyObject', {
      value:formData,
      enumerable:true,
      configurable:true
    });
    return next();
  });
}
function jsonData(options, req, res, next) {
  generalData.call(this, options, req, res, function(err) {
    if (err) return next(err);
    try {
      Object.defineProperty(req, 'bodyObject', {
        value:JSON.parse(req.bodyString),
        enumerable:true,
        configurable:true
      });
    } catch(ex) {
      return next(ex);
    }
    return next();
  });
}
function generalData(options, req, res, next) {
  var maxLength = options.maxRequestSize;
  var length = 0;
  var data = [];
  req.on('data', function(chunk) {
    if ('undefined' === typeof data) return;
    data.push(chunk);
    length += chunk.length;
    if (length > maxLength) {
      this.pause();
      data = undefined;
      next(new Error('maximum request size exceeded'));
    }
  });
  req.on('end', function() {
    if ('undefined' === typeof data) return;
    data = Buffer.concat(data, length);
    Object.defineProperty(req, 'body', {
      get:function() { return new Buffer(data); },
      enumerable:true,
      configurable:true
    });
    Object.defineProperty(req, 'bodyString', {
      get:function() { return data.toString('utf-8'); },
      enumerable:true,
      configurable:true
    });
    Object.defineProperty(req, 'bodyObject', {
      value:{},
      enumerable:true,
      configurable:true
    });
    if (Readable) Object.defineProperty(req, 'bodyStream', {
      get:function() { return Body(data); },
      enumerable:true,
      configurable:true
    });
    return next();
  });
  if (!Readable) req.resume();
}

function multipartFomidable(options, req, res, next) {
  var form = new Formidable();
  var formData = {};
  form.on('field', function(name, value) {
    if ('undefined' === typeof formData) return;
    if ('undefined' === typeof formData[name]) {
      formData[name] = value;
    } else if (Array.isArray(formData[name])) {
      formData[name].push(value);
    } else {
      formData[name] = [ formData[name] ];
      formData[name].push(value);
    }
  });
  form.on('file', function(name, file) {
    if ('undefined' === typeof formData) return;
    var value = {
      name:file.name || name,
      path:file.path,
      size:file.size || 0,
      type:file.type || 'application/octet-stream'
    };
    if ('undefined' === typeof formData[name]) {
      formData[name] = value;
    } else if (Array.isArray(formData[name])) {
      formData[name].push(value);
    } else {
      formData[name] = [ formData[name] ];
      formData[name].push(value);
    }
  });
  form.on('aborted', form.emit.bind(form, 'error', new Error('aborted')));
  form.on('error', function(err) { return next(err); });
  form.on('end', function() {
    if ('undefined' === typeof formData) return;
    Object.defineProperty(req, 'body', {
      get:function() { return new Buffer(JSON.stringify(formData)); },
      enumerable:true,
      configurable:true
    });
    Object.defineProperty(req, 'bodyString', {
      get:function() { return JSON.stringify(formData); },
      enumerable:true,
      configurable:true
    });
    Object.defineProperty(req, 'bodyObject', {
      value:formData,
      enumerable:true,
      configurable:true
    });
    if (Readable) Object.defineProperty(req, 'bodyStream', {
      get:function() { return Body(new Buffer(JSON.stringify(formData))); },
      enumerable:true,
      configurable:true
    });
    return next();
  });
  form.parse(req);
  if (!Readable) req.resume();
}

try {
  function Body(data) {
    if (!(this instanceof Body)) return new Body(this);
    Readable.call(this);
    Object.defineProperty(this, 'data', { value:data });
    Object.defineProperty(this, 'position', { value:0, writable:true });
  }
  Body.prototype = new Readable();
  Body.prototype._read = function(size, callback) {
    if (this.position > this.data.length) return process.nextTick(function() {
      callback(null, null);
    });
    var res = this.data.slice(this.position, this.position + size);
    this.position += size;
    return process.nextTick(function() {
      callback(undefined, res);
    });
  };
} catch(ex) {}

