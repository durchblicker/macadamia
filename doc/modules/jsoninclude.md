# [MacAdamia Module](.) - Index-Fix

This loads JSON data into *res.data* more or less independant of the URL. Absolute paths are resolved relative to *options.root* but relative paths are resolved relative to the current URL if it were a file inside *options.root*

## Options

 * *options.root* - The base directory where files are served from
 * *options.includeKey* - The name of the key in *res.data* that contains the include definition
   If *res.data[options.includeKey]* is a string, then that file is included, if it is an *Array* then each of the files is included.
   If it is an object, then the keys are the key in *res.data* into which the value is included.
 * *options.include* - What to include
