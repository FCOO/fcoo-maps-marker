# web-application-data


## Description
This repository contains a full copy of the data-files used in production by FCOO web-applications

**All files must be placed in sub-directories**

If the data-files is only used by one package the sub-directory could/should be named as the package

The different web-applications reads the files from https://app.fcoo.dk/static/ using [fcoo-data-files](https://github.com/FCOO/fcoo-data-files) to get correct path.

    var filePath = window.fcoo.dataFilePath("theSubDir", "fileName.json"); 
    //return "https://app.fcoo.dk/static/theSubDir/fileName.json"

## Update

1. Clone this repository 
2. Update the files
3. Commit and push this repository
4. Upload the files to [app-apache-frontend-prod01.fcoo.dk]() / https://app.fcoo.dk/static/

## Directories

### fcoo-i18next-phrases
i18next-translation of source-names and links, parameter and unit names, error-codes etc.


## Contact information

Niels Holt nho@fcoo.dk
