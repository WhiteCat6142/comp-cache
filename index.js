"use strict";

const http = require('node:http');
const zlib = require('node:zlib');
const crypto = require('node:crypto');

const cache = require('memory-cache');
const list = new Map();
const hash = (data) => { crypto.createHash('sha256').update(data, 'utf8').digest('hex') };

exports.listen = (port, next) => {
    return http.createServer((req, res) => {
        exports.get(req, res, ()=>{
            exports.put(req, res, next);
         });
    }).listen(port);
};

const setHeaders = (res, etag, option) => {
    res.setHeader("Etag", etag);
    res.setHeader("Cache-Control", "public, max-age=86400, must-revalidate");
    res.vary("Accept-Encoding");
    if (option) {
        if (option.type) res.type(option.type);
        if (option.stamp) res.setHeader("Last-Modified", option.stamptext);
    }
}

exports.expires = 60 * 60 * 1000;//1h

exports.get = (req, res, next) => {
    const x = cache.get(req.url);
    const y = list.get(req.url);
    if (y === null) {
        process.nextTick(() => { next(req, res) });
        return;
    }
    const etag = req.headers['if-none-match'];
    if (y.etag === etag) {
        setHeaders(res, y.etag, y.option);
        res.sendStatus(304);
        return;
    }
    const stamp = req.headers["if-modified-since"];
    if (y.option.stamp > 0 && stamp != undefined && y.option.stamp === Date.parse(stamp)) {
        setHeaders(res, y.etag, y.option);
        res.sendStatus(304);
        return;
    }
    if (x === null) {
        process.nextTick(() => { next(req, res) });
        return;
    }
    setHeaders(res, y.etag, y.option);
    const encoding = req.headers['accept-encoding'];
    if (encoding !== undefined && encoding.indexOf("gzip") != -1) {
        res.setHeader("Content-Encoding", "gzip");
        res.end(x);
    } else {
        const gzip = zlib.createGunzip();
        gzip.pipe(res);
        gzip.end(x);
    }
};

exports.put = (req, res, next) => {
    const g = zlib.createGzip({ level: zlib.constants.Z_BEST_COMPRESSION });
    const bufs = [];
    g.on('data', (d) => { bufs.push(d); });
    const md = crypto.createHash('sha256');
    res.renderX = (view, local) => {
        return res.render(view, local, (err, html) => {
            if (err) throw err;
            res.setHeader('Content-Type', 'text/html')
            res.endX(html);
        });
    };
    res.writeX = (data) => {
        g.write(data);
        md.update(data);
    };
    res.endX = (data) => {
        if (data != undefined) {
            g.write(data);
            md.update(data);
        }
        g.end();
        const lm = res.getHeader('Last-Modified');
        const n = (lm) ? new Date(lm) : new Date();
        const option = {
            type: res.getHeader('content-type'),
            stamp: Math.round(n.getTime() / 1000),
            stamptext: n.toUTCString()
        };
        const etag = "W/\"" + md.digest('hex') + "\"";
        g.on('end', () => {
            cache.put(req.url, Buffer.concat(bufs), exports.expires);
            list.set(url, { etag: etag, option: option });
            exports.get(req, res);
        });
    };
    next();
};
exports.add = (url, data, option) => {
    const etag = "W/\"" + hash(data) + "\"";
    zlib.gzip(Buffer.from(data), (err, binary) => {
        cache.put(url, binary, exports.expires);
        list.set(url, { etag: etag, option: option });
    });
    return etag;
};
exports.clear = () => {
    cache.clear();
    list.clear();
};