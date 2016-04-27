"use strict";

const zlib = require('zlib');
const cache = require('memory-cache');
const crypto = require('crypto');
const streamBuffers = require('stream-buffers');

function setHeaders(res,etag,option){
    res.setHeader("Etag",etag);
    res.setHeader("Cache-Control","public, max-age=86400, must-revalidate");
    res.vary("Accept-Encoding");
    if(option){
        if(option.type)res.type(option.type);
        if(option.stamp)res.setHeader("Last-Modified",option.stamptext);
    }
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
        const stamp =req.headers["if-modified-since"];
        if(x.option.stamp&&stamp&&x.option.stamp===Date.parse(stamp)){
            res.sendStatus(304);
            return;
        }
        const encoding =req.headers['accept-encoding'];
        if(encoding&&encoding.indexOf("gzip")!=-1){
            res.setHeader("Content-Encoding","gzip");
            res.end(x.body);
        }else{
            const gzip = zlib.createGunzip();
            const inp = new streamBuffers.ReadableStreamBuffer();
            inp.put(x.body);
            inp.stop();
            inp.pipe(gzip).pipe(res);
        }
};
exports.put=function(req,res,next){
   var g=zlib.createGzip({level:zlib.Z_BEST_COMPRESSION});
   var out=new streamBuffers.WritableStreamBuffer();
   g.pipe(out);
   var md=crypto.createHash('md5');
   res.renderX=function(view,local){
       return res.render(view,local,function(err,html){
           if(err)throw err;
           res.setHeader('Content-Type','text/html')
           res.endX(html);
       });
    };
   res.writeX=function(data) {
       const d =new Buffer(data);
       g.write(d);
       md.update(d);
   };
   res.endX=function(data){
       if(data){
       const d =new Buffer(data);
       g.write(d);
       md.update(d);
       }
       g.end();
       const lm=res.getHeader('Last-Modified');
       const n=(lm)?new Date(lm):new Date();
       const option={
           type:res.getHeader('content-type'),
           stamp:Math.round(n.getTime()/1000),
           stamptext:n.toUTCString()
        };
    const etag = "W/\""+md.digest('hex')+"\"";
    g.flush(function() {
        out.on('finish',function() {
        cache.put(req.url,{body:out.getContents(),etag:etag,option:option},exports.expires);
        exports.get(req,res);
        });
        });
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