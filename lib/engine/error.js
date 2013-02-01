/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

module.exports = error;

function error(tpl, data, options, callback) {
  data.message = (data.status === 404) ? '' : '';
  var stuff=[];
  stuff.push('<html>');
  stuff.push('  <head><title>'+data.message+'</title></head>');
  stuff.push('  <body>');
  stuff.push('    <h1>'+data.message+'</h1>');
  if (data.error) stuff.push('    <pre>'+data.error+'</pre>');
  stuff.push('  </body>');
  stuff.push('</html>');
  process.nextTick(function() {
    return callback(undefined, stuff.join('\n'));
  });
}
