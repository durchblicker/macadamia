/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

module.exports = setup;

var fs = require('fs');
var path = require('path');
var utils = require('../../lib/utils.js');

var marked;
try {
  marked = require('marked');
  marked.setOptions({ breaks:true, smartLists:true });
} catch(ex) {
  throw new Error('the markdown module requires marked\nPlease install by doing:\n\tnpm install marked');
}

function setup(options) {
  options = utils.merge({}, options);
  if (!options.root) throw(new Error('missing options.root'));
  options.root = path.resolve(options.root);
  options.markdown = options.markdown || {};
  options.markdown.before = options.markdown.before || '<html>\n  <head>\n    <title>${title}</title>\n  </head>\n  <body>';
  options.markdown.after = options.markdown.after || '  </body>\n</html>\n';
  return function(req, res, next) {
    var app = this;
    var filepath = path.resolve(options.root, req.url.pathname.replace(/^\/+/,''));
    if (filepath.indexOf(options.root)!==0) return next();
    fs.stat(filepath, function(err, file) {
      if (err || !file || !file.isFile()) return next();
      file.path = filepath;
      res.set('Last-Modified',file.mtime.toUTCString());
      if (!isNaN(options.maxAge)) {
        res.set('Max-Age', options.maxAge);
        res.set('Expires', (new Date(Date.now()+ (options.maxAge * 1000))).toUTCString());
      }
      if ('object' === typeof options.headers) {
        Object.keys(options.headers).forEach(function(header) {
          if ('function' === typeof options.headers[header]) {
            options.headers[header].call(app, req, res);
          } else {
            res.set(header, options.headers[header]);
          }
        });
      }

      var etag = getETag(file, req);
      var modified = getModified(file, req);
      if (!etag || !modified) return res.status(304).size().end();

      fs.readFile(file.path, 'utf-8', function(err, content) {
        if (err || !content) return next(err);
        try {
          content = marked(content);
        } catch(ex) {
          return next(ex);
        }
        content = content.split(/\r?\n/).join('\0');
        var title = content.replace(/^[\s|\S]*\<h1[^\>]*?\>([\s|\S]*?)\<\/\s*h1[\s|\S]*$/, '$1').replace(/\<[\s|\S]+?\>/g,'').split('\0').join('\n');
        content = [ options.markdown.before , content, options.markdown.after ].join('\0').split(/\r?\n/).join('\0');
        content = content.replace(/\$\{\s*title\s*\}/gi, title);

        var basename = path.basename(file.path, path.extname(file.path));
        if (options.markdown.fixIndexLinks && (basename === options.indexName)) {
          content = content.replace(/(src|href)=\"([\s|\S]+?)\"/g, function(match, attr, link) {
            if (/\w\:\/\//.exec(link)) return match;
            if (link.indexOf('/') === 0) return match;
            link = req.url.pathname.slice(0, req.url.pathname.indexOf(path.basename(req.url.pathname)) - 1)+'/'+link;
            link = path.normalize(link);
            return attr+'="'+link+'"';
          });
        }
        content = content.split('\0').join('\n');
        content = new Buffer(content, 'utf-8');
        return res.type('html').status(200).size(content.length).send(content);
      });
    });
  };
}


function getETag(stat, req) {
  var etag = '"' + stat.size + '-' + Number(stat.mtime) + '"';
  if (req.get('if-none-match') === etag) return undefined;
  return etag;
}
function getModified(stat, req) {
  var modified = req.get('if-modified-since') ? Date.parse(req.get('if-modified-since')) : 0;
  if (stat.mtime.getTime() <= modified) return undefined;
  return stat.mtime.toUTCString();
}
