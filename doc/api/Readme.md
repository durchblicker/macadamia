# [MacAdamia](../) API

## Objects

There really are only 3 Object types:

 * *[App](app.md)* - The container for your app. This is where you define your handlers and the like.
 * *[Request](request.md)* - An extension of Node's [http.ServerRequest](http://nodejs.org/api/http.html#http_class_http_serverrequest) with some magic added
 * *[Response](response.md)* - An extension of Node's [http.ServerResponse](http://nodejs.org/api/http.html#http_class_http_serverresponse) with some magic added

## Server Example

This is the example Documentation-Server in [macadamia.js](../../macadamia.js)

    var options = {
      root:__dirname+'/doc/',
      errors:{ root:__dirname+'/err/' },
      index:[ '.md', '/Readme.md' ],
      indexName:'Readme',
      maxAge:0,
      markdown:{ fixIndexLinks:true }
    };
    var http = require('http');
    var app = macadamia();
    app.engine('error', loadModule('htmlerror', options));
    app.get('*.md', loadModule('noexten', options));
    app.get(/\/(?:[^\.]+)?$/, loadModule('indexfix', options));
    app.get('*.md', loadModule('markdown', options));
    app.get('**', loadModule('static', options));
    app.on('http-request', function(req, res) {
      console.log([ 'REQUEST('+makeTime(Date.now())+')'+'"'+req.url.pathname+'"', 'N/A', makeTime(res.time) , 'INIT' ].join(' - '));
    });
    app.on('http-access', function(req, res, status, time) {
      console.log([ 'ACCESS('+makeTime(Date.now())+')', '"'+req.url.pathname+'"', status, makeTime(time) ].join(' - '));
    });
    app.on('http-error', function(err, req, res, status, time) {
      console.log('ERROR('+makeTime(Date.now())+')'+[ '"'+req.url.pathname+'"', status, makeTime(time) , err ? err.message : (http.STATUS_CODES[status] || 'N/A') ].join(' - '));
    });
    var server = http.createServer(app.handle);
    server.listen(1234);

