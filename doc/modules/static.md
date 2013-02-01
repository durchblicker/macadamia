# [MacAdamia Module](.) - Static

This serves static files from a base directory. It supports conditional queries (If-None-Match && If-Modified-Since) as well as byte ranges (Range).

## Options

 * *options.root* - The base directory where files are served from
 * *options.headers* - An object containing headers to set
 * *options.maxAge* - The page should expire in so many seconds

