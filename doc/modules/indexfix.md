# [MacAdamia Module](/modules) - Index-Fix

For matching URLs it attaches the strings in *options.index* and looks for the first file pointed to by that URL. It then rewrites the URL to point to that file.

 > It rewrites */modules* to */modules.md* in the Documentation-Server for example

## Options

 * *options.root* - The base directory where files are served from
 * *options.index* - an *Array* containing the paths to try for directories
