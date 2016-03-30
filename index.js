"use strict";

const zlib = require('zlib');
const cache = require('memory-cache');
const crypto = require('crypto');

function setHeaders(res,etag,option){
    res.setHeader("Etag",etag);
    if(option&&option.type)res.setHeader("Content-Type",option.type);
    res.setHeader("Cache-Control","public, max-age=86400, must-revalidate");
    res.setHeader("Vary","Accept-Encoding");
}

exports.expires=60*60*1000;//1h

exports.get = function(req,res,next){
        const x = cache.get(req.url);
        if(!x){
            next();
            return;
        }
        setHeaders(res,x.etag,x.option);
        const etag =req.headers['if-none-match'];
        if(x.etag===etag){
            res.sendStatus(304);
            return;
        }
        const encoding =req.headers['accept-encoding'];
        if(encoding&&encoding.indexOf("gzip")!=-1){
            res.setHeader("Content-Encoding","gzip");
            res.end(x.body);
        }else{
            zlib.gunzip(x.body, function (err, binary) {
                res.end(binary);
            });
        }
};
exports.put=function(req,res,next){
   const option = {type:"text/html"};
   res.renderX=function(view,local){
       return res.render(view,local,function(err,html){
           const etag=exports.add(req.url,html,option);
           setHeaders(res,etag,option);
           res.end(html);
       });
    };
   res.endX=function(data){
       const option={type:res.getHeader('content-type')};
       const etag=exports.add(req.url,data,option);
       setHeaders(res,etag,option)
       return res.end(data);
   };
   next();
};
exports.add=function(url,data,option){
    const etag = "W/\""+crypto.createHash('md5').update(data, 'utf8').digest('hex')+"\"";
    zlib.gzip(new Buffer(data),function (err, binary) {
        cache.put(url,{body:binary,etag:etag,option:option},exports.expires);
    });
    return etag;
};
exports.clear=function(){
    cache.clear();
};