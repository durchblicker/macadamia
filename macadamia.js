/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

module.exports = require('./lib/app.js');
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
  app.all('**', loadModule('compress', options));
  app.all('**', loadModule('static', options));
  app.listen(1234);

  function makeTime(milli) {
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
}());


