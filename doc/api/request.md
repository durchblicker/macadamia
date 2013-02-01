# [MacAdamia API](.) - Request

This is an extension of Node's [http.ServerRequest](http://nodejs.org/api/http.html#http_class_http_serverrequest) with some magic added.

## response.application

Your [App](app.md) object.

## response.request

The [Request](request.md) object.

## response.response

The [Response](response.md) object.

## request.url

The URL of the request. Contrary to the URL in a Node http.ServerRequest this url is parsed fully. [See URL](http://nodejs.org/api/url.html#url_url_format).

## request.query

A shortcut for *request.url.query*.

## request.path

A shortcut for *request.url.pathname*.

## request.host

A shortcut for *request.url.host*.

## request.protocol

A shortcut for *request.url.protocol*.

## request.secure

A shortcut for *request.url.protocol === 'https'*.

## request.cookies

An object containing the cookies that were sent with the request.

## request.get(name)

Get an HTTP-Request-Header.
