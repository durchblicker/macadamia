/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

var async=require('async');
var fs = require('fs');
var path = require('path');

exports.merge = function(one, two) {
  one = one || {};
  two = two || {};
  var res = {};
  Object.keys(one).forEach(function(key) {
    if ('object' === typeof one[key]) {
      if (Array.isArray(one[key])) {
        res[key] = [].concat(one[key]);
      } else {
        res[key] = exports.merge({},one[key]);
      }
    } else {
      res[key] = one[key]  ;
    }
  });
  Object.keys(two).forEach(function(key) {
    if ('object' === typeof two[key]) {
      if (Array.isArray(two[key])) {
        res[key] = [].concat(two[key]);
      } else {
        res[key] = exports.merge({},two[key]);
      }
    } else {
      res[key] = two[key]  ;
    }
  });
  return res;
};

exports.flatten = function(obj, prefix) {
  var res = {};
  Object.keys(obj).forEach(function(key) {
    if ('object' === typeof obj[key]) {
      var children = (obj[key] === null) ? {} : exports.flatten(obj[key], prefix ? [ prefix, key ].join('.') : key);
      Object.keys(children).forEach(function(key) { res[key] = children[key]; });
    } else {
      res[prefix ? [ prefix, key ].join('.') : key] = obj[key];
    }
  });
  return res;
};

exports.findFile = function(paths, callback) {
  paths = [ function(callback) { return callback(undefined, null); } ].concat(paths.map(function(path) {
    return function(stat, callback) {
      if (stat) return callback(undefined, stat);
      fs.stat(path, function(err, stat) {
        if (err || !stat) return callback(undefined, null);
        stat.path = path;
        return callback(undefined, stat);
      });
    };
  }));
  async.waterfall(paths, function(err, stat) {
    if (err || !stat) return callback(err || new Error('file not found'));
    return callback(undefined, stat);
  });
};
