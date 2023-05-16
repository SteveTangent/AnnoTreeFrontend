AnnoTree Frontend
=====================

This is the frontend of AnnoTree, that is used to browse and explore GTDB microbial genome data. Full website is at: http://annotree.uwaterloo.ca

Installation
---
To create a standalone instance of AnnoTree that include frontend, backend, and database, it is recommended to use our [docker installer](https://bitbucket.org/doxeylab/gtdb-docker-compose/src).


The following is for developer use.

**Install**
```
npm install
```

**Set up app/Config.js**
```
cp app/Config.js.sample app/Config.js
# You need to change parameters in Config.js
# if you have the backend in debug mode running in 10.123.45.78:5001, then change SERVER_BASE_URL to "http://10.123.45.78:5001"
# NO TRAILING SLASHES
```

**Start the application in development mode**
```
npm run start
```

If `npm run start` failed, try switching node version to 6.x.

Open http://localhost:8080 in your browser.


**Build for production**

```
npm run build
```

This will generate many html,js files in the `public` folder. You can point Apache `DocumentRoot` to `public` folder to serve web pages, or symlink /var/www/html/annotree to public folder

Here is a sample apache config:

```
<VirtualHost example.com:80>
    ServerAdmin webmaster@localhost
    # here we created a symlink /var/www/html/annotree that points to public folder
    DocumentRoot /var/www/html/
    # alternatively use DocumentRoot /var/www/html/annotree
    ErrorLog ${APACHE_LOG_DIR}/gtdb_frontend_error.log
    CustomLog ${APACHE_LOG_DIR}/gtdb_frontend_access.log combined
</VirtualHost>
```

Now you can visit `example.com/annotree` to see served pages.
Please make sure that `app/Config.js` is pointed to the correct backend URL.

### Issues and contributing

Please feel free to open an issue on Bitbucket page for developers to review.
# AnnoTreeFrontend
