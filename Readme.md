# Macadamia [![NPM](https://nodei.co/npm/macadamia.png)](https://nodei.co/npm/macadamia/)

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

### Macadamia.App Object

**TODO:** write documentation. *(look in code for now)*

#### App (constructor)

**TODO:** write documentation. *(look in code for now)*

#### app.routes

**TODO:** write documentation. *(look in code for now)*

#### app.main

**TODO:** write documentation. *(look in code for now)*

#### app.locals

**TODO:** write documentation. *(look in code for now)*

#### app.route

**TODO:** write documentation. *(look in code for now)*

#### app.handle

**TODO:** write documentation. *(look in code for now)*

#### app.engine

**TODO:** write documentation. *(look in code for now)*

#### app.render

**TODO:** write documentation. *(look in code for now)*

#### app.set

**TODO:** write documentation. *(look in code for now)*

#### app.get

**TODO:** write documentation. *(look in code for now)*

#### app.enable

**TODO:** write documentation. *(look in code for now)*

#### app.disable

**TODO:** write documentation. *(look in code for now)*

#### app.enabled

**TODO:** write documentation. *(look in code for now)*

#### app.disabled

**TODO:** write documentation. *(look in code for now)*

#### app.listen

**TODO:** write documentation. *(look in code for now)*

### Alterations to HTTP-Request

**TODO:** write documentation. *(look in code for now)*

#### req.URL

**TODO:** write documentation. *(look in code for now)*

#### req.query

**TODO:** write documentation. *(look in code for now)*

#### req.cookies

**TODO:** write documentation. *(look in code for now)*

#### req.header

**TODO:** write documentation. *(look in code for now)*

#### req.get

**TODO:** write documentation. *(look in code for now)*

#### req.is

**TODO:** write documentation. *(look in code for now)*

#### req.ip

**TODO:** write documentation. *(look in code for now)*

#### req.ips

**TODO:** write documentation. *(look in code for now)*

#### req.path

**TODO:** write documentation. *(look in code for now)*

#### req.protocol

**TODO:** write documentation. *(look in code for now)*

#### req.secure

**TODO:** write documentation. *(look in code for now)*

#### req.param

**TODO:** write documentation. *(look in code for now)*

#### req.body

**TODO:** write documentation. *(look in code for now)*

### Alterations to HTTP-Response

**TODO:** write documentation. *(look in code for now)*

#### res.locals

**TODO:** write documentation. *(look in code for now)*

#### res.status

**TODO:** write documentation. *(look in code for now)*

#### res.size

**TODO:** write documentation. *(look in code for now)*

#### res.type

**TODO:** write documentation. *(look in code for now)*

#### res.header

**TODO:** write documentation. *(look in code for now)*

#### res.set

**TODO:** write documentation. *(look in code for now)*

#### res.get

**TODO:** write documentation. *(look in code for now)*

#### res.redirect

**TODO:** write documentation. *(look in code for now)*

#### res.location

**TODO:** write documentation. *(look in code for now)*

#### res.send

**TODO:** write documentation. *(look in code for now)*

#### res.json

**TODO:** write documentation. *(look in code for now)*

#### res.attachment

**TODO:** write documentation. *(look in code for now)*

#### res.download

**TODO:** write documentation. *(look in code for now)*

#### res.sendfile

**TODO:** write documentation. *(look in code for now)*

#### res.links

**TODO:** write documentation. *(look in code for now)*

#### res.cookie

**TODO:** write documentation. *(look in code for now)*

#### res.render

**TODO:** write documentation. *(look in code for now)*

### Macadamia.Route Object

**TODO:** write documentation. *(look in code for now)*

#### Route (constructor)

**TODO:** write documentation. *(look in code for now)*

#### route.name

**TODO:** write documentation. *(look in code for now)*

#### route.method

**TODO:** write documentation. *(look in code for now)*

#### route.url

**TODO:** write documentation. *(look in code for now)*

#### route.handler

**TODO:** write documentation. *(look in code for now)*

#### route.handle

**TODO:** write documentation. *(look in code for now)*

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

## License

(The MIT License)

© 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT License.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

**THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.**
