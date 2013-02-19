/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

module.exports = create;

var async = require('async');
 var idx=0;
function create(app, methods, matchers, handler) {
  methods = (Array.isArray(methods)?methods:[methods||'']).filter(function(method) {
    return method && method.length;
  }).map(function(method) {
    return method.toUpperCase();
  });
  matchers = (Array.isArray(matchers)?matchers:[matchers]).map(function(matcher) {
    if ('function' === typeof matcher) return matcher;
    if ('function' === typeof matcher.exec) return regex(matcher);
    return string(String(matcher || ''));
  });
  idx++;
  return handle.bind({ id:'route-'+idx, app:app, methods:methods, matchers:matchers, handler:handler });
}

function handle(err, req, res, callback) {
  if (res.headersSent) return callback(err, req, res);
  if (err && (this.handler.length !== 4)) return callback(err, req, res);
  if (!err && (this.handler.length !== 3)) return callback(err, req, res);
  if (this.methods.length && (this.methods.indexOf(req.method) < 0)) return callback(err, req, res);
  req.params = undefined;
  this.matchers.forEach(function(matcher, idx) {
    if(req.params) return;
    req.params = matcher(req);
    this.app.trace(matcher+'.exec("'+req.URL.pathname+'") = ', req.params?true:false);
  }.bind(this));
  if (!req.params) return callback(err, req, res);
  var calls=Object.keys(req.params).map(function(name) {
    if ('function' !== typeof this.app.params[name]) return undefined;
    console.error(this.app.params[name]);
    return this.app.params[name].bind(this.app, name. req.params[name], req);
  }.bind(this)).filter(function(fn) { return !!fn; });
  async.parallel(calls, function(perr) {
    if (perr) return callback(perr, req, res);
    this.app.trace('params', req.params);
    this.handler.call(this.app, err?err:req, err?req:res, err?res:callback, err?callback:undefined);
  }.bind(this));
}

function regex(expr) {
  function matcher(req) {
    var match = expr.exec(req.URL.pathname);
    if (!match) return undefined;
    var res = {};
    Object.keys(match).forEach(function(name) {
      res[name] = match[name];
    });
    return res;
  };
  matcher.toString = expr.toString.bind(expr);
  return matcher;
}
function string(expr) {
  var names=[];
  string.forbidden.forEach(function(chr) { expr = expr.split(chr).join('\\'+chr); });
  expr = expr.replace(/\:(\w+)/g, function(match, name) {
    names.push(name);
    return '([^/]+?)';
  });
  expr = expr.replace(/\*\*/g, '[\\s|\\S]+?');
  expr = expr.replace(/\*/g, '[^/]+');
  expr = new RegExp('^'+expr+'$');
  function matcher(req) {
    var match = expr.exec(req.URL.pathname);
    if (!match) return undefined;
    var res = {};
    Object.keys(match).forEach(function(name) {
      res[name] = match[name];
    });
    names.forEach(function(name, idx) {
      res[name] = match[idx+1];
    });
    return res;
  };
  matcher.toString = expr.toString.bind(expr);
  return matcher;
}
string.forbidden = [ '(', ')', '?', '{', '}', '[', ']', '\\', '+', '^', '$' ];
