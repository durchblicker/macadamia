# [MacAdamia API](.) - Response

This is an extension of Node's [http.ServerResponse](http://nodejs.org/api/http.html#http_class_http_serverresponse) with some magic added.

## response.application

Your [App](app.md) object.

## response.request

The [Request](request.md) object.

## response.response

The [Response](response.md) object.

## response.data

The local data that is used in *response.render*

## response.time

The time in milliseconds since the request was received.

## response.status(code)

Set the HTTP-Status-Code for the respons.

## response.get(name)

Get a Response-Header.

## response.set(name, value)

Set a Response-Header. Passing in *null* as a value removes the header.

## response.cookie(name, value, options)

Set a cookie (Set-Cookie header).

### Options

## response.clearCookie(name, options)

Remove a cookie.

## response.location(location)

Set the *Location* header.

## response.redirect([code, ]location)

Redirect to a new URL. The default redirect Status-Code is *302*.

## response.charset

Set the charset for the response. Default is *utf-8*.

## response.type(type)

Set the *Content-Type* for the response.

## response.size(size)

Set the *Content-Length* for the response.

## response.attachment(file)

Set the headers appropriate for a download (Content-Disposition)

## response.render(selector, data, options, next)

Render data merged with *response.data* and *app.data* using a rendering engine selected using *selector*. And send the content.

If an error occurrs call *next(err)* otherwise you are done.

### Rendering Engine Selection

## response.send(data, next)

Send data to the browser. This closes the response.

If an error occurrs call *next(err)* otherwise you are done.

## response.json(data, next)

Send data as JSON to the browser (Content-Type: application/json). This closes the response.

If an error occurrs call *next(err)* otherwise you are done.

## response.jsonp(data, next)

Send data as JSON to the browser as a JSON-P callback.(Content-Type: application/javascript). This closes the response.

    callback({})

the name of the function is passed to the handler in *request.query.callback*.

If an error occurrs call *next(err)* otherwise you are done.

## response.text(data, next)

Send data as text (Content-Type: text/plain). This closes the response.

If an error occurrs call *next(err)* otherwise you are done.

## response.sendfile(file, options, next)

Send a file to the browser.

If an error occurrs call *next(err)* otherwise you are done.

### Sendfile Options

## response.download(file, name, next)

Send a file to the browser as a download.

If an error occurrs call *next(err)* otherwise you are done.

