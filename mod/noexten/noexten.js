/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

module.exports = setup;

var utils = require('../../lib/utils.js');

function setup(options) {
  var exten = [
    '\\.',
    Array.isArray(options.indexExtensions) ? [
      '(?:',
      options.indexExtensions.join('|'),
      ')'
    ].join('') : '[\\s|\\S]+',
    '$'
  ].join('');
  return macadamia.module('rewrite', {
    rewrite:{
      redirect:301,
      rules:[
        { search:new RegExp('^/'+options.indexName+exten), replace:'/' },
        { search:new RegExp('/'+options.indexName+exten), replace:'' },
        { search:new RegExp(exten), replace:'' }
      ]
    }
  });
}
