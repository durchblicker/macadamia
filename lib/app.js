/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT License.
*/
var debug = console.debug ? console.debug.bind(console) : function() {};

module.exports = App;

var Http = require('http');
var Pea = require('pea');
var Path = require('path');
var Fs = require('fs');
var parseURL = require('url').parse;
App.Route = require('./route.js');
App.Request = require('./request.js');
App.Response = require('./response.js');

function App(name, method, url) {
  if(!(this instanceof App)) return new App(name, method, url);
  App.Route.call(this, name || 'Default', method, url, App.handle.bind(this));
  Object.defineProperty(this.info, 'routes', {
    value: [],
    enumerable: true
  });
  Object.defineProperty(this, 'main', {
    value: App.main.bind(this),
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(this, 'locals', {
    get: App.locals.bind(this),
    enumerable: true,
    configurable: true
  });
  this.info.engines = {};
}

App.main = function(req, res, callback) {
  App.Request(req);
  App.Response(res);
  if('function' === typeof console.access) {
    res.on('finish', function() {
      console.access({ req:req, res:res }, 'access');
    });
  }
  Object.defineProperty(res, 'locals', {
    value: App.merge(res.locals, {
      settings: {
        method:req.method,
        url: req.URL,
        headers:req.headers
      }
    }),
    configurable: true,
    enumerable: true
  });
  this.handle(undefined, req, res, callback || function(err, status) {
    debug('=', this.toString(), req.method, req.url, '(DONE)');
    if(status) return;
    try {
      res.statusCode = (err ? err.status : res.statusCode);
      res.statusCode = res.statusCode || 404;
      res.end(err ? err.stack : ('Invalid: ' + req.method + ' ' + req.url));
    } catch(ex) {
      if(err) debug(err.stack);
      debug(ex.stack);
    }
  }.bind(this));
};

App.handle = function(req, res, callback) {
  debug('>', this.toString(), req.method, req.url);
  var app = this.parent =  req.app;
  Object.defineProperty(req, 'app', {
    value: this,
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(res, 'app', {
    value: this,
    enumerable: true,
    configurable: true
  });
  var routes = this.info.routes.map(function(route) {
    return function(err, status, cb) {
      var args = Array.prototype.slice.call(arguments);
      switch(args.length) {
        case 1:
          cb = err;
          err = undefined;
          status = undefined;
          break;
        case 2:
          cb = status;
          status = undefined;
          break;
        case 3:
          break;
        default:
          cb = args[args.length - 1];
      }
      if(status) return cb(err, status);
      route.handle(err, req, res, cb);
    };
  });
  Pea.forcedSeries(routes).then(function() {
    debug('<', req.app.toString(), req.method, req.url);
    if(app) {
      Object.defineProperty(req, 'app', {
        value: app,
        enumerable: true,
        configurable: true
      });
      Object.defineProperty(res, 'app', {
        value: app,
        enumerable: true,
        configurable: true
      });
    }
    callback.apply(null, arguments);
  });
};

App.locals = function(locals) {
  if(locals) {
    this.info.data = this.merge(this.info.data || {}, locals);
  }
  return this.info.data || {};
};

App.prototype = Object.create(App.Route.prototype);

App.prototype.app = function() {
  return this.parent ? this.parent.app() : this;
};

App.prototype.route = function(route) {
  if(!(route instanceof App.Route)) throw new Error('Invalid Route');
  this.info.routes.push(route);
  return this;
};

App.prototype.toString = function() {
  return 'App(' + this.info.name + ')';
};

App.prototype.engine = function(ext, render) {
  if('function' === typeof ext) {
    render = ext;
    ext = undefined;
  }
  if(!ext) throw new Error('Invalid Rendering-Engine (extension)');
  if('function' !== typeof render) {
    render = require(ext);
    render = render.__express || render.express || render.renderFile;
  }
  if('function' !== typeof render) throw new Error('Invalid Rendering-Engine (engine)');
  this.info.engines[ext] = render;
  return this;
};

App.prototype.render = function(view, data, callback) {
  if('function' === typeof data) {
    callback = data;
    data = {};
  }
  data = this.merge(this.info.data || {}, data);
  var ext = Path.extname(view).substr(1);
  if(!ext.length) {
    ext = this.get('view engine');
    if(ext) view += '.' + ext;
  }
  view = Path.resolve(this.get('views') || './views/', view);
  var that = this;
  Fs.stat(view, function(err) {
    if (err) return callback(err);
    var render = that.info.engines[ext] || that.info.engines[''];
    try {
      (render.length === 4) ? render(view, data, { debug:!!that.get('view debug'), beautify:!!that.get('view debug'), mangle:false }, callback) : render(view, data, callback);
    } catch(ex) {
      return callback(ex);
    }
  });
};

App.prototype.set = function(name, value) {
  this.info.data = this.info.data || {};
  this.info.data.settings = this.info.data.settings || {};
  this.info.data.settings[name] = value;
  return this;
};

App.prototype.get = function(name) {
  this.info.data = this.info.data || {};
  this.info.data.settings = this.info.data.settings || {};
  return this.info.data.settings[name];
};

App.prototype.enable = function(name) {
  this.set(name, true);
};

App.prototype.disable = function(name) {
  this.set(name, false);
};

App.prototype.enabled = function(name) {
  return !!this.get(name);
};

App.prototype.disabled = function(name) {
  return !this.get(name);
};

App.merge = App.prototype.merge = require('merge').bind(null, true);

App.prototype.listen = function(port, host) {
  var server = Http.createServer(this.main);
  return server.listen.apply(server, arguments);
};
