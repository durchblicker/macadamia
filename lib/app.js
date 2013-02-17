/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/


var assert = require('assert');
var domain = require('domain');
var path = require('path');
var http = require('http');
var async = require('async');

var Route = require('./route.js');
var Request = require('./request.js');
var Response = require('./response.js');

function create() {
  var obj = Object.create(new App());

  var handle = obj.handle.bind(Object);
  handle.application = obj;
  Object.keys(App.prototype).forEach(function(name) {
    handle[name]=App.prototype[name].bind(obj);
  });
  return handle;
}

function App() {
  this.routes=[];
  this.locals={};
  this.config={};
  this.engine={};
  this.params={};
  setImmediate(function() {
    (this.config[process.env.NODE_ENV] || this.config[''] || function() {}).call(this);
  }.bind(this));
}

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

App.prototype.handle = function(originalReq, originalRes, callback) {
  originalRes.toString = function() { return '[ object ServerResponse ]'; };
  var req = Request(originalReq);
  var res = Response(originalRes, originalReq);
  var dom = domain.create();
  dom.add(originalReq);
  dom.add(originalRes);
  dom.add(req);
  dom.add(res);
  dom.on('error', (function(err) {
    //this.emit('error', err);
    console.error('Domain Error:',err.stack);
    try {
      if (res.headersSent && !res.bodySent) res.end();
      if (res.headersSent) return;
    } catch(ex) {
      console.error('ERROR:', ex.stack, '\n\nWhile dealing with\n\n', err.stack);
      dom.dispose();
    }

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
  function prepare(callback) { callback(undefined, undefined, req, res); }
  var handlers = this.routes.map(function(route) {
    return function(err, req, res, callback) {
      if (!dom) return callback(new Error('Domain Gone'));
      dom.bind(route)(err, req, res, function(err, request, response) {
        callback(undefined, err, request || req, response || res);
      });
    };
  });
  function finish(err, error, request, response) {
    if (!dom) return;
    if (response.headersSent && !response.bodySent) response.end();

    if ('function' === typeof callback) {
      dom.remove(originalReq);
      dom.remove(originalRes);
      dom.remove(req);
      dom.remove(res);
      dom.dispose();
      return callback(err || error);
    }

    if (!response.headersSent) {
      if (!error) {
        error = new Error('Cannot '+request.method+' '+request.url);
        error.status = 404;
      }
      return response.status(error.status || 500).text(error.stack);
    }
  }
  async.waterfall([ prepare ].concat(handlers), finish);
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
  var server = http.createServer(this.handle.bind(this));
  return server.listen.apply(server, arguments);
};

App.prototype.trace = function(msg) {
  var err = new Error(String('trace'));
  err = err.stack.split(/\r?\n/).slice(2,3).shift().replace(/^.*\((.*)\).*$/,'$1').split(':');
  err[0]=path.basename(err[0]);
  err = err.join(':');
  console.error(err+' '+msg.split(/\r?\n/).join(' '));
};


module.exports = create;
module.exports.App = App;
module.exports.merge = App.prototype.merge.bind(App.prototype);
