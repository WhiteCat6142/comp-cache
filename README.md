# comp-cache
Fastest&amp;simple node.js compressed cache library

The following http headers are supported:

  - gzip
   - Accept-Encoding
   - Content-Encoding
   - Vary
  - etag
   - Etag
   - Cache-Control
   - If-None-Match
  - Timestamp
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

#### endX(data)
the method that is almost same as res.end except adding data to cache space. 
warming: it doesn't sense other methods like re.write .

### add(url,data,[option])
the method that add data to cache space.

#### options

##### type
means "Content-type" in http header.

### clear()
the method that reset all caches.

### expires
the field that decide the deadline of cached data.(ms)
defalut: 1 hour


## License

[MIT](LICENSE)