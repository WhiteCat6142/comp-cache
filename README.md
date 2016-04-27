# comp-cache
Fastest&amp;simple node.js compressed cache library

The following http headers are supported:

  * gzip
   - Accept-Encoding
   - Content-Encoding
   - Vary
  * etag
   - Etag
   - Cache-Control
   - If-None-Match
  * Timestamp
   - Last-Modified
   - If-Modified-Since
   


## Install

```bash
$ npm install comp-cache
```

## API

```js
var comp = require('comp-cache');
```

### get
the middleware that will response cached data based on request's url.

### put
the middleware that will append those methods to Express's Response object.

#### renderX(view,[locals])
the method that is almost same as res.render except adding data to cache space.

#### writeX(data)
the method that is almost same as res.write except affecting endX instead of res.end. 

#### endX([data])
the method that is almost same as res.end except adding data to cache space. 
warming: use writeX instead of write.

### add(url,data,[option])
the method that add data to cache space.

#### options

##### type
means "Content-type" in http header.

#### stamp
means unix-time of "Last-Modified" in http header.

### clear()
the method that reset all caches.

### expires
the field that decide the deadline of cached data.(ms)
defalut: 1 hour

## example

```js
"use strict";

const http = require('http');
const express = require('express');
const app = express();
const compression = require('compression');
const logger = require("morgan");
const cache = require("comp-cache");

//logger first
app.use(logger('dev'));

//set get&put
app.use(cache.get);
app.use(cache.put);

//clear at update
updater.on("update",cache.clear);

//compression should be after
app.use(compression({threshold:0}));

//heavy job you wanna cache
app.get('/test',function(req,res){
  res.setHeader('Last-Modified',new Date().toUTCString());
  res.type("text/plain; charset=utf-8");
  for(var i=0;i<10;i++){res.writeX("0"+i);}
  res.endX("10");
});

//you can use also noncache data
app.get('/nocache',function(req,res){
  for(var i=0;i<10;i++){res.write("0"+i);}
  res.end("10");
});

http.createServer(app).listen(3000, function(){
  console.log("Express server started");
});
```

## License

[MIT](LICENSE)