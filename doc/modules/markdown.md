# [MacAdamia Module](.) - Markdown

This loads Markdown files from a base directory and converts them to HTML which it serves. It supports conditional queries (If-None-Match & If-Modified-Since).

## Options

 * *options.root* - The base directory where files are served from
 * *options.headers* - An object containing headers to set
 * *options.maxAge* - The page should expire in so many seconds
 * *options.markdown*
   * *options.markdown.before* - Text to put before the rendered Markdown
   * *options.markdown.after* - Text to put after the rendered Markdown
   * *options.markdown.fixIndexLinks* - If markdown files are used as index files (such as Readme.md on github) then the links need to be fixed. If this is enabled it uses *options.indexName* to check whether this is an index file.
   * *options.markdown.fixLinks* - Array of rules to fix links
    * *rule.search* - RegExp String to search for
    * *rule.replace* - What to replace the match with
   * *options.markdown.extension* - Replace the URLs extension with this. (i.e.: if this is '.md' for Readme.html use Readme.md)
