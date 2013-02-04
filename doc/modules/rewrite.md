# [MacAdamia Module](.) - Rewrite

## Options

 * *options.rewrite.checkTarget* - Make sure that the file that is rewritten to actually exists (requires *options.root*)
 * *options.rewrite.redirect* - Redirect instead using this HTTP-Status
 * *options.rewrite.rules* - An array of rewrite rules
   * *rule.search* - a regular expression string to search for
   * *rule.replace* - what to use as the replacement for the match
