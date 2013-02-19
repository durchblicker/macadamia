/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

var assert = require('assert');
var domain = require('domain');
var path = require('path');
var http = require('http');
var async = require('async');

var EventEmitter = require('events').EventEmitter;
var Route = require('./route.js');
var Request = require('./request.js');
var Response = require('./response.js');

function App(originalReq, originalRes, callback) {
  if (this instanceof App) return App.create.apply(null, arguments);
  originalRes.toString = function() { return '[ object ServerResponse ]'; };
  originalReq.toString = function() { return '[ object ServerRequest ]'; };
  var req = Request(originalReq);
  var res = Response(originalRes, originalReq);
  var dom = domain.create();
  dom.add(originalReq);
  dom.add(originalRes);
  dom.add(req);
  dom.add(res);
  res.application=req.application=this;
  dom.on('error', (function(err) {
    this.emit('error', err);
    if ('function' === typeof req.nextCallback) return req.nextCallback(err);

    try {
      if (res.headersSent && !res.bodySent) res.end();
    } catch(ex) {
      console.error('ERROR:', ex.stack, '\n\nWhile dealing with\n\n', err.stack);
      dom.dispose();
    }
    if (res.headersSent) return;

    if ('function' === typeof callback) {
      dom.remove(originalReq);
      dom.remove(originalRes);
      dom.remove(req);
      dom.remove(res);
      dom.dispose();
      dom = undefined;
      return callback(err);
    }

    try {
      originalRes.statusCode = err.status || 500;
      originalRes.setHeader('Content-Type', 'text/plain');
      originalRes.removeHeader('Content-Length');
      originalRes.end(err.stack);
      dom.dispose();
    } catch(ex) {
      console.error('ERROR:', ex.stack, '\n\nWhile dealing with\n\n', err.stack);
      dom.dispose();
    }
  }).bind(this));
  this.emit('request', req, res);
  events([ 'header', 'body', 'finish' ], res, this, req, res);
  function prepare(callback) { callback(undefined, undefined, req, res); }
  var handlers = this.routes.map(function(route) {
    return function(err, req, res, callback) {
      if (!dom) return callback(new Error('Domain Gone'));
      this.trace('start:route');
      var myCallback = req.nextCallback = dom.bind(function(err, request, response) {
        this.trace('done:route');
        if (myCallback===req.nextCallback) callback(undefined, err, request || req, response || res);
      }.bind(this));
      dom.bind(route)(err, req, res, myCallback);
    }.bind(this);
  }.bind(this));
  function finish(err, error, request, response) {
    request.nextCallback = function() {};
    if (!dom) return;
    if (response.headersSent && !response.bodySent) response.end();

    if ('function' === typeof callback) {
      dom.remove(originalReq);
      dom.remove(originalRes);
      dom.remove(req);
      dom.remove(res);
      dom.dispose();
      return setImmediate(function() { callback(err || error); });
    }

    setImmediate(function() {
      if (!response.headersSent) {
        if (!error) {
          error = new Error('Cannot '+request.method+' '+request.url);
          error.status = 404;
        }
        response.status(error.status || 500);
        this.emit('error', req, res, error);
        return response.text(error.stack);
      }
    }.bind(this));
  };
  async.waterfall([ prepare ].concat(handlers), finish.bind(this));
}
App.create = function() {
  var app = function() { return App.apply(app, arguments); };
  App.inherit.apply(app, [ App, App.constructor ].concat(arguments));
  App.inherit.call(app, EventEmitter);
  return app;
};
App.constructor = function() {
  this.routes=[];
  this.locals={};
  this.config={};
  this.engine={};
  this.params={};
  setImmediate(function() {
    (this.config[process.env.NODE_ENV] || this.config[''] || function() {}).call(this);
  }.bind(this));
};
App.inherit = function(from, constr) {
  for (var name in from.prototype) {
    this[name] = from.prototype[name];
  }
  return (constr || from).apply(this, Array.prototype.slice.call(arguments, 3));
};

App.prototype.route = function(methods, matchers, handler) {

  this.routes.push(Route(this, methods, matchers, handler));
};
App.prototype.GET = function(matcher, handler) {

  return this.route('GET', matcher, handler);
};
App.prototype.HEAD = App.prototype.head = function(matcher, handler) {

  return this.route('HEAD', matcher, handler);
};
App.prototype.POST = App.prototype.post = function(matcher, handler) {

  return this.route('POST', matcher, handler);
};
App.prototype.PUT = App.prototype.put = function(matcher, handler) {

  return this.route('PUT', matcher, handler);
};
App.prototype.DELETE = App.prototype.delete = function(matcher, handler) {

  return this.route('DELTE', matcher, handler);
};
App.prototype.all = App.prototype.use = function(matcher, handler) {

  return this.route([], matcher, handler);
};

App.prototype.set = function(name, value) {

  return this.locals[name] = value;
};
App.prototype.get = function(name) {
  if (arguments.length > 1) return this.GET.apply(this, arguments);
  return this.locals[name];
};
App.prototype.enable = function(name) {

  return this.set(name, true);
};
App.prototype.enabled = function(name) {

  return !!this.get(name);
};
App.prototype.disable = function(name) {

  return this.set(name, false);
};
App.prototype.disabled = function(name) {

  return !this.get(name);
};
App.prototype.configure = function(name, config) {
  if (('function' === typeof name) && !config) {
    config = name;
    name = '';
  }
  assert('function' === typeof config, 'config is not a function');
  name = String(name);
  this.config[name] = config;
  return this;
};
App.prototype.engine = function(name, engine) {
  if (('function' === typeof name) && !engine) {
    engine = name;
    name = '';
  }
  assert('function' === typeof engine, 'engine is not a function');
  name = String(name);
  this.engine[name] = engine;
  return this;
};
App.prototype.render = function(renderpath, data, callback) {
  assert('function' === typeof callback, 'app.render needs a callback');
  var base = [ path.resolve(path.resolve(this.get('views') || '.')+'/', renderpath) ];
  this.first(Object.keys(this.engine).map(function(item) {
    return base.concat([ item ]).join('.');
  }.bind(this)), fs.stat, function(renderpath) {
    renderpath = renderpath || base.join('');
    var chosen = this.engine[path.extname(renderpath)];
    if ('function' !== typeof chosen) return callback(new Error('no rendering engine found'));
    chosen(renderpath, this.merge(this.locals, data), callback);
  }.bind(this));
};
App.prototype.param = function(name, callback) {
  name = String(name);
  assert('function' === typeof callback, 'callback is not a function');
  this.params[name] = callback;
};
App.prototype.listen = function(){
  var server = http.createServer(this.bind(this));
  return server.listen.apply(server, arguments);
};

App.prototype.merge = function merge(one, two) {
  var res = {};
  one = one || {};
  two = two || {};
  Object.keys(one).forEach(this.merge.copy.bind(this, res, one));
  Object.keys(two).forEach(this.merge.copy.bind(this, res, two));
  return res;
};
App.prototype.merge.copy = function(res, one, key) {
  if (('object' === typeof one[key]) && (null !== one[key])) {
    if (Array.isArray(one[key])) {
      res[key] = [].concat(one[key]);
    } else {
      res[key] = this.merge(one);
    }
  } else if (('undefined' !== typeof one[key]) && (null !== one[key])) {
    res[key] = one[key];
  }
};

App.prototype.first = function(arr, fn, callback) {
  var val, nam;
  arr = [].concat(arr);
  async.until(function() { return val || !arr.length }, function(callback) {
    var item = arr.shift();
    fn(item, function(err, done) {
      val=err?undefined:done;
      nam=err?undefined:item;
      callback();
    });
  }, function() {
    callback(nam, val);
  });
};



App.prototype.trace = function(msg) {
  var err = new Error(String('trace'));
  err = err.stack.split(/\r?\n/).slice(2,3).shift().replace(/^.*\((.*)\).*$/,'$1').split(':');
  err[0]=path.basename(err[0]);
  err = err.join(':');
  this.emit.apply(this, [ 'trace', err ].concat(Array.prototype.slice.call(arguments,0)));
};

function events(evt, src, dst) {
  var args = Array.prototype.slice.call(arguments, 3);
  evt.forEach(function(name) {
    //console.error(src+'on('+name+', '+dst+')');
    src.on(name, dst.emit.bind.apply(dst.emit, [ dst, name ].concat(args)));
  });
}

module.exports = App.create;
module.exports.App = App;
module.exports.merge = App.prototype.merge.bind(App.prototype);
