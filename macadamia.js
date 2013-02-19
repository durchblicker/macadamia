/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

var macadamia = module.exports = require('./lib/app.js');
module.exports.MacadamiaRequest = require('./lib/request.js').MacadamiaRequest;
module.exports.MacadamiaResponse = require('./lib/response.js').MacadamiaResponse;
module.exports.module = loadModule;

function loadModule(name, options) {
  var mod = require('./mod/'+name);
  return mod.call(module.exports, options);
}

if (require.main === module) (function() {
  var options = {
    root:__dirname+'/doc/',
    maxAge:0
  };

  var app = module.exports();
  app.get(/\/[\s|\S]+\/$/, macadamia.module('rewrite', { redirect:301, rules:[ { search:/\/$/, replace:'' } ] }));
  app.get(/\/[^\.]+$/, macadamia.module('rewrite', { rules:[ { search:/^([\s|\S]+)$/, replace:'$1.md' }], checkTarget:true, root:__dirname+'/doc/' }));
  app.get(/\/[^\.]+$/, macadamia.module('rewrite', { rules:[ { search:/^([\s|\S]+)$/, replace:'$1/Readme.md' }], checkTarget:true, root:__dirname+'/doc/' }));
  app.get(/^\/$/, macadamia.module('rewrite', { rules:[ { replace:'/Readme.md' }], checkTarget:true, root:__dirname+'/doc/' }));
  app.get('**', macadamia.module('static', options));
  app.listen(1234);
  app.on('request', log.bind(app, 'request'));
  app.on('finish', log.bind(app, 'finish'));
  app.on('error', log.bind(app,'error'));
  app.on('trace', trace.bind(app,'trace'));

  function makeTime(milli) {
    milli = milli / 1e6;
    var d = new Date(milli);
    return [
      [
        ('00'+d.getUTCHours()).slice(-2),
        ('00'+d.getUTCMinutes()).slice(-2),
        ('00'+d.getUTCSeconds()).slice(-2)
      ].join(':'),
      ('000'+d.getUTCMilliseconds()).slice(-3)
    ].join('.');
  }
  function log(event, req, res, err) {
    var args = [
      (event+'       ').substr(0,7),
      ('000'+(res.statusCode || '')).substr(-3),
      req.url,
      makeTime(res.time)
    ];
    if (err) args.push(err.message);
    console.log(args.join(' - '));
  }
  function trace(msg, loc) {
    console.error.apply(console, [msg+'('+loc+')'].concat(Array.prototype.slice.call(arguments, 2)));
  }
}());


