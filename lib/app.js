/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

var debugRoute = false;

module.exports = App;

var path = require('path');
var async = require('async');
var request = require('./request.js');
var response = require('./response.js');
var utility = require('./utils.js');
var EventEmitter = require('events').EventEmitter;
var domain = require('domain');
var Readable = require('stream').Readable;

function App() {
  if (!(this instanceof App)) return new App();
  var app = this;
  var ctx = {
    properties:{},
    flags:{},
    routes:[],
    engines:{},
    locals:{},
    utils:{}
  };
  Object.defineProperty(this, 'property', {
    value:function(name, value) {
      name = String('name');
      var result = ctx.properties[name];
      if ('undefined' === typeof value) return result;
      if (null === typeof value) {
        delete ctx.properties[name];
      } else {
        ctx.properties[name] = value;
      }
      return result;
    },
    enumerable:true
  });
  Object.defineProperty(this, 'flag', {
    value:function(name, value) {
      name = String('name');
      var result = ctx.flags[name]?true:false;
      if ('undefined' === typeof value) return result;
      ctx.flags[name] = value?true:false;
      return result;
    },
    enumerable:true
  });
  Object.defineProperty(this, 'utility', {
    value:function(name, value) {
      name = String('name');
      var result = ctx.utils[name];
      if ('undefined' === typeof value) return result;
      if (null === typeof value) {
        delete ctx.utils[name];
      } else {
        ctx.utils[name] = value;
      }
      return result;
    },
    enumerable:true
  });
  Object.defineProperty(this, 'engine', {
    value:function(ext, engine) {
      if (('function' === ext) && !engine) {
        engine = ext;
        ext = '';
      }
      ctx.engines[ext.toLowerCase()]=engine;
      return app;
    },
    enumerable:true
  });
  Object.defineProperty(this, 'route', {
    value:function(method, route, handler) {
      method = ('string' === typeof method)?method.toUpperCase():undefined;
      route = parseRoute(route);
      switch (handler.length) {
        case 3:
          handler = routeHandler(method, route, handler);
          break;
        case 4:
          handler = routeError(method, route, handler);
          break;
        default:
          handler = undefined;
      }
      if ('function' !== typeof handler) {
        throw(new Error('Invalid Route: ('+(typeof handler)+') '+handler));
      }
      ctx.routes.push(handler);
      return app;
    },
    enumerable:true
  });
  Object.defineProperty(this, 'handle', {
    value:function(req, res) {
      //if (!Readable) req.pause();
      var dom = domain.create();
      dom.on('error', app.emit.bind(app, 'error'));
      async.waterfall([ prepare ].concat(ctx.routes.map(router)), dom.bind(errorHandler));
      function prepared(callback, err, streams) {
        if (err) {
          app.emit('http-invalid', err, req);
          res.statusCode=500;
          res.setHeader('Content-Type','text/plain; charset=utf-8');
          res.end(err.stack);
          return;
        }
        req=streams[0];
        res=streams[1];
        dom.add(req);
        dom.add(res);
        Object.defineProperty(req, 'errorDomain', { value:dom });
        Object.defineProperty(res, 'errorDomain', { value:dom });
        app.emit('http-request', req, res);
        res.once('error', app.emit.bind(app, 'http-error'));
        res.once('done', app.emit.bind(app, 'http-access'));
        Object.defineProperty(streams[0], 'response', { value:streams[1], enumerable:true });
        Object.defineProperty(streams[1], 'request', { value:streams[0], enumerable:true });
        return callback(undefined, undefined, req, res);
      }
      function prepare(callback) {
        async.parallel([
          dom.bind(request.bind(app, app, req)),
          dom.bind(response.bind(app, app, res))
        ], dom.bind(prepared.bind(app, callback)));
      }
      function router(route) {
        return dom.bind(function(err, req, res, callback) {
          try {
            route(err, req, res, function(err) { callback(undefined, err, req, res); });
          } catch(ex) {
            callback(ex);
          }
        });
      }
      function errorHandler(err) {
        var status = err?(err.status || 500):404;
        res.emit('error', err, req, res, status, res.time);
        if (!res.headersSent) res.status(status);
        if (!res.bodySent) {
          res.render('error', {
            status:status,
            error:err
          }, {}, dom.bind(function(eerr) {
            if (!res.headersSent) {
              res.type('text');
              res.removeHeader('content-length');
            }
            if (!res.bodySent) {
              var stuff=[];
              if (!err) {
                stuff.push('The request page was not found!');
              } else {
                stuff.push('Internal Server Error:');
                stuff.push(err.stack);
              }
              stuff.push('');
              stuff.push('In addition the following was encountered:');
              stuff.push(eerr.stack);
              res.send(stuff.join('\n'));
            }
          }));
        }
      }
    },
    enumerable:true
  });
  Object.defineProperty(this, 'render', {
    value:function(tpl, data, options, callback) {
      if (('function' === typeof options) && !callback) {
        callback = options;
        options = {};
      }
      var exten=path.extname(tpl).substr(1);
      var render = ctx.engines[tpl] || ctx.engines[exten] || ctx.engines[''];
      if ('function' !== typeof render) return callback(new Error('no rendering engine'));
      render.call(this, tpl, utility.merge(ctx.locals, data), utility.merge(ctx.properties[exten], options), callback);
    },
    enumerable:true
  });
  Object.defineProperty(this, 'data', {
    get:function() {
      return ctx.locals;
    },
    set:function(value) {
      return ctx.locals=utility.merge(ctx.locals, value);
    },
    enumerable:true
  });
  this.engine('json', require('./engine/json.js'));
  this.engine('text', require('./engine/text.js'));
  this.engine('error', require('./engine/error.js'));
}
App.prototype = new EventEmitter();
App.prototype.use = function(route, handler) {
  if (('function' === typeof route) && (!handler)) {
    handler = route;
    route = '**';
  }
  return this.route(undefined, route, handler);
};
App.prototype.get = function(route, handler) {
  if (('function' === typeof route) && (!handler)) {
    handler = route;
    route = '**';
  }
  return this.route('GET', route, handler);
};
App.prototype.put = function(route, handler) {
  if (('function' === typeof route) && (!handler)) {
    handler = route;
    route = '**';
  }
  return this.route('PUT', route, handler);
};
App.prototype.post = function(route, handler) {
  if (('function' === typeof route) && (!handler)) {
    handler = route;
    route = '**';
  }
  return this.route('POST', route, handler);
};

function routeHandler(method, route, handler) {
  return function(err, req, res, next) {
    if (err) return next(err);
    if (('undefined' !== method) && (method !== req.method)) return next();
    var match = route.exec(req.url.pathname);
    if(debugRoute) console.log('Handler-Route('+route.name+') - ', route, ' - "'+req.url.pathname+'" - ', match);
    if (!match) return next();
    req.params = {};
    route.params.forEach(function(name, idx) { req.params[name] = match[idx+1]; });
    try {
      return handler.call(this, req, res, next);
    } catch(err) {
      return next(err);
    }
  };
}
function routeError(method, route, handler) {
  return function(err, req, res, next) {
    if (!err) return next();
    if (('undefined' !== method) && (method !== req.method)) return next(err);
    var match = route.exec(req.url.pathname);
    if(debugRoute) console.log('Error-Route('+route.name+') - ', route, ' - "'+req.url.pathname+'" - ', match);
    if (!match) return next();
    req.params = {};
    route.params.forEach(function(name, idx) { req.params[name] = match[idx+1]; });
    try {
      return handler.call(this, err, req, res, next);
    } catch(ex) {
      ex.previous = err;
      return next(ex);
    }
  };
}
function parseRoute(route) {
  var name = String(route);
  if (route instanceof RegExp) {
    route.name = name;
    route.params = [ 1,2,3,4,5,6,7,8,9,10 ];
    return route;
  }
  route = route.split('/');
  var match, params = [];
  route = route.map(function(part) {
    if (match = parseRoute.param.exec(part)) {
      params.push(match[1]);
      return '([^\\/]+)';
    }
    switch(part) {
      case '**': return '(?:[\\s|\\S]*?)?';
      case '*': return '(?=\\/)[\\s|\\S]*?(?=\\/)';
      default: return part.split('').map(function(ch) {
        switch (ch) {
          case '*': return '[\\s|\\S]*?';
          case '+': return '[^\\/]*?';
          default: return ((parseRoute.clean.indexOf(ch) > -1) ? '\\' : '') + ch;
        }
      }).join('');
    }
  });
  route = route.join('\\/');
  var regex = new RegExp([ '^', route ].join('\\/'));
  regex.params = params;
  regex.name = name;
  return regex;
}
parseRoute.param = /^\:(\w+)$/;
parseRoute.clean = [ '\\', '*', '+', '?', '.' ];
