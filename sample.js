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

/******************** 
set a lot
********************/

http.createServer(app).listen(3000, function(){
  console.log("Express server started");
});