/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

var debugRoute = false;

module.exports = App;

var path = require('path');
var http = require('http');
var async = require('async');
var request = require('./request.js');
var response = require('./response.js');
var utility = require('./utils.js');
var EventEmitter = require('events').EventEmitter;
var domain = require('domain');
var Readable = require('stream').Readable;

function App() {
  if (!(this instanceof App)) return new App();
  var context = {
    properties:{},
    flags:{},
    routes:[],
    engines:{},
    locals:{},
    utils:{}
  };
  Object.defineProperty(this, 'context', { value:context, enumerable:true });
  Object.defineProperty(this, 'data', {
    get:function() {
      return context.locals;
    },
    set:function(value) {
      return context.locals=utility.merge(context.locals, value);
    },
    enumerable:true
  });
  Object.defineProperty(this, 'handle', { value:App.prototype.handle.bind(this), enumerable:true });

  this.engine('json', require('./engine/json.js'));
  this.engine('text', require('./engine/text.js'));
  this.engine('error', require('./engine/error.js'));
}
App.prototype = new EventEmitter();
App.prototype.property = function(name, value) {
  name = String('name');
  var result = this.context.properties[name];
  if ('undefined' === typeof value) return result;
  if (null === typeof value) {
    delete this.context.properties[name];
  } else {
    this.context.properties[name] = value;
  }
  return result;
};
App.prototype.flag = function(name, value) {
  name = String('name');
  var result = this.context.flags[name]?true:false;
  if ('undefined' === typeof value) return result;
  this.context.flags[name] = value?true:false;
  return result;
};
App.prototype.utility = function(name, value) {
  name = String('name');
  var result = this.context.utils[name];
  if ('undefined' === typeof value) return result;
  if (null === typeof value) {
    delete this.context.utils[name];
  } else {
    this.context.utils[name] = value;
  }
  return result;
};
App.prototype.engine = function(ext, engine) {
  if (('function' === ext) && !engine) {
    engine = ext;
    ext = '';
  }
  this.context.engines[ext.toLowerCase()]=engine;
  return this;
};
App.prototype.route = function(method, route, handler) {
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
  this.context.routes.push(handler);
  return this;
};
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
App.prototype.handle = function(req, res, next) {
  var app = this;
  if (!Readable) req.pause();
  var dom = domain.create();
  dom.on('error', function(err) {
    console.error(err.stack);
    err.status = 500;
    if ('function' === typeof req.nextRoute) req.nextRoute(err);
    app.emit.bind(app, 'error');
  });
  async.waterfall([ prepare ].concat(app.context.routes.map(router).concat([ passError ])), dom.bind(errorHandler));
  function prepare(callback) {
    dom.add(req = request(app, req));
    dom.add(res = response(app, res));
    Object.defineProperty(req, 'response', { value:res, enumerable:true });
    Object.defineProperty(res, 'request', { value:req, enumerable:true });
    res.once('error', app.emit.bind(app, 'http-error'));
    res.once('done', app.emit.bind(app, 'http-access'));
    return callback(undefined, undefined, req, res);
  }
  function router(route, idx) {
    var done = false;
    return dom.bind(function(err, req, res, callback) {
      req.nextRoute = res.nextRoute = function nextRoute(err) {
        req.nextRoute = res.nextRoute = noop;
        if (done) return;
        done = true;
        callback(undefined, err, req, res);
      };
      try {
        route.call(app, err, req, res, function(err) { res.nextRoute(err); });
      } catch(ex) {
        callback(ex);
      }
    });
  }
  function passError(err, req, res, callback) {
    req.nextRoute = res.nextRoute = noop;
    return callback(err);
  }
  function errorHandler(err) {
    if ('function' === typeof next) {
      if (err) return next(err);
      if (!res.headersSent) return next();
      return;
    }
    req.nextRoute = res.nextRoute = noop;
    var status = err?(err.status || 500):404;
    var reason = http.STATUS_CODES[status];
    console.error(status, reason, err);
    res.emit('error', err, req, res, status, res.time);
    if (!res.headersSent) res.status(status);
    if (!res.bodySent) {
      res.render('error', {
        status:status,
        reason:reason,
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
};
App.prototype.render = function(tpl, data, options, callback) {
  if (('function' === typeof options) && !callback) {
    callback = options;
    options = {};
  }
  var exten=path.extname(tpl).substr(1);
  var render = this.context.engines[tpl] || this.context.engines[exten] || this.context.engines[''];
  if ('function' !== typeof render) return callback(new Error('no rendering engine'));
  render.call(this, tpl, utility.merge(this.context.locals, data), utility.merge(this.context.properties[exten], options), callback);
};

function routeHandler(method, route, handler) {
  return function(err, req, res, next) {
    if (err) return next(err);
    if (('undefined' !== typeof method) && (method !== req.method)) return next();
    var match = route.exec(req.URL.pathname);
    if (!match) return next();
    if(debugRoute) console.log('Handler-Route('+method+':'+route.name+') - ', route, ' - "'+req.URL.pathname+'" - ', match);
    req.params = {};
    route.params.forEach(function(name, idx) { req.params[name] = match[idx+1]; });
    try {
      return handler.call(this, req, res, next);
    } catch(err) {
      console.error('Caught: ',err);
      return next(err);
    }
  };
}
function routeError(method, route, handler) {
  return function(err, req, res, next) {
    if (!err) return next();
    if (('undefined' !== method) && (method !== req.method)) return next(err);
    var match = route.exec(req.URL.pathname);
    if(debugRoute) console.log('Error-Route('+route.name+') - ', route, ' - "'+req.URL.pathname+'" - ', match);
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
  route = String(route).replace(/^\/+|\/+$/,'').split('/');
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

function noop() { console.error('NoOp'); }
