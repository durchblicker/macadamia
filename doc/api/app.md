# [MacAdamia API](.) - App

The App object is the center of your application. It is where you control what will happen. It is in charge of dispatching requests to the appropriate handlers.

    var macadamia = require('macadamia');
    var server = require('http').createServer();
    var app = macadamia(server);
    // Setup Routes and other things here
    server.listen(1234);

## app.data

This is where you can store application level data. This data object is merged with *response.data* and the data you pass into *response.render* for rendering.

This is an object which when set will always be deep-copied.

## app.property(name[, value])

This is where you can store properties of your app. This is where you should put your configuration stuff for your custom handlers.

This is an object which when set will always be deep-copied.

If value is *undefined* it gets the current value. If value is *null* it deletes the item.

## app.flag(name[, value])

This is similar to *app.property* except that it only ever contains booleans.

If value is *undefined* it gets the current value. If value is *null* it deletes the item.

## app.engine(name[, value])

This is where you set rendering engines that can be used.

*name* is a name such as *html* or *error* or *json* this is used for resolving which rendering engine to use in *app.render*.

If value is *undefined* it gets the current value. If value is *null* it deletes the item.

## app.utility(name[, value])

This is where you can store shared utilities such as database connectors that need to be available to multiole handlers.

If value is *undefined* it gets the current value. If value is *null* it deletes the item.

## app.route(method, route, handler)

This is the basic function to setup a route.

### Route Syntax

## app.handle(name[, value])

This is the actual handler function of your app. You can also do:

    server.on('request', app.handle);

in order to attach your app to a server.

## app.render(selector, data[, options], callback)

This gets a rendering engine and renders *data* with it. *data* is first merged with *app.data*. *options* is passed straight through to the rendering engine.

## app.(use|get|put|post)([route, ]handler)

These are convenience functions to setup routes. The name of the method is the name of the HTTP-Method ;)
