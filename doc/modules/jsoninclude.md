# [MacAdamia Module](.) - Index-Fix

This loads JSON data into *res.data* more or less independant of the URL. Absolute paths are resolved relative to *options.root* but relative paths are resolved relative to the current URL if it were a file inside *options.root*

## Options

 * *options.root* - The base directory where files are served from
 * *options.includeKey* - The name of the key in *res.data* that contains the include definition
   If *res.data[options.includeKey]* is a string, then that file is included, if it is an *Array* then each of the files is included.
   If it is an object, then the keys are the key in *res.data* into which the value is included.
 * *options.include* - What to include
 * *options.includeData* - the actual data to merge into *res.data*

## Examples

### options.includeData

    app.get('*.md', loadModule('jsoninclude'), { includeData:{ template:'markdown' } });

Will merge *res.data* to contain:

    {
      "template":"markdown"
    }

### options.include

    app.get('*.md', loadModule('jsoninclude', { include:'/path/to/file' }));

If the file contents are not JSON will merge *res.data* to contain:

    {
      "content":<content of the file>
    }

If the file contents are JSON it will merge it into *res.data*

### options.includeKey

    app.get('*.md', loadModule('jsoninclude', { includeKey:'#include' }));

    /*
    res.data === {
      '#include':<path to file>
    }
    */

Will merge *res.data['#include']* like the contents where specified with *options.include*

    app.get('*.md', loadModule('jsoninclude', { includeKey:'#include' }));

    /*
    res.data === {
      '#include':{
        'key':<path to file>
      }
    }
    */

Will merge the contents of the file into *res.data* so that it contains:

    {
      "key":<contents of the file merged here>
    }

