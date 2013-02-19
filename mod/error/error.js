/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

module.exports = setup;

var fs = require('fs');
var path = require('path');

function setup(options) {
  options = this.merge({}, options);
  return function(err, req, res, callback) {
    err.status = err.status || 500;
    err = this.merge(err, options);
    res.data = this.merge(data, err);
    callback();
  }
}
