# Macadamia

Macadamia is a slightly more opinionated than [Express](http://expressjs.com). Express has so many quirky features that, while good, makes it feel more like a hassle than a help. I called it Macadamia because you need to be nuts to reinvent the wheel. Never the less, making a wheel can be a pleasurable experience especially when that wheel is so much better than the one before.

## Installation

    npm install macadamia

## API

    var Macadamia = require('macadamia');
    var app = Macadamia('Name of App');
    app.engine('rendering-engine');
    app.set('views', '/path/to/views');
    app.set('view engine', 'default view engine');
    app.route(Macadamia.Route('static', ['GET', 'HEAD'], '**', Macadamia.module('static')({ <options> })));
    app.listen(1234);

    // Macadamia.Route(<name>, <method-match>, <path-match>, <handler>)
    // function handler(req, res, callback) { … }
    // function route_match(string) { return <true|false> }


### Modules

There are a couple of modules that are packaged with Macadamia.

#### redirect

Redirects URLs to another URL.

Options:

 * *source* : RegExp to search for
 * *replace* : String to replace with
 * *code* : HTTP-Status-Code to use for redirection (default: 302)

#### rewrite

Rewrites URL for later routes.

Options:

 * *source* : RegExp to search for
 * *replace* : String to replace with

#### static

Serves static files from disk.

Options:

 * *root*  : path to serve files from (String)
 * *maxAge* : milliseconds in the future to set expires header

#### jsonrequest

Parses the HTTP-Request-Body if the *Content-Type* is either *application/json* or *text/json* and puts it into *req.body*.

Options:

 * *check* : Boolean to indicate whether to error out if the body is invalid JSON

#### urlformrequest

Parses the HTTP-Request-Body if the *Content-Type* is *application/x-www-form-urlencoded* and puts it into *req.body*.

Options:

 * *check* : Boolean to indicate whether to error out if the body is invalid Form-Data

#### render

Renders *res.locals* using the rendering engine.

Options:

 * *viewKey* : which key in the locals has the view-name (default: view)
 * *mimeType* : what mime-type the output will be (default: text/html; charset=UTF-8)

#### error

Either triggers an error if *trigger* is set or renders the error out if not.

 * *trigger* : if set the handler causes an error with that status-code (useful for causing 404)
 * *view* : this is the view to use to render the error (default: error)
 * *mimeType* : the mime-type the rendered error should have (default: text/html; charset=UTF-8)

### Macadamia.App Object
### Alterations to HTTP-Request
### Alterations to HTTP-Response
### Macadamia.Route Object
