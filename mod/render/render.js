/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT-License.
*/

module.exports = setup;

function setup(options) {
  options = this.merge({}, options);
  return function(req, res, next) {
    if (!res.data.template) return next();
    res.status(200).type(options.type || req.URL.pathname).render(res.data.template || req.path, {}, options, next);
  };
}
