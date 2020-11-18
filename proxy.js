const http = require('http');
const https = require('https');
//const fs = require('fs');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
  console.log('%s %s', req.method, req.url);

  if (!['GET', 'POST', 'OPTIONS'].includes(req.method)) {
    res.statusCode = 405;
    res.end();
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method == 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Auto-Redirect');
    //res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie');
    res.setHeader('Access-Control-Max-Age', '3600');
    res.end();
    return;
  }

  var getCharset = (headers) => {
    let content_type = headers['content-type'],
        rematch;
    if (content_type && (rematch = content_type.toLowerCase().match(/charset=([^; ]+)/)))
      return rematch[1];
    return 'utf8';
  };

  var url;
  try {
    url = new URL(req.url.slice(1));
  } catch(err) {
    res.statusCode = 406;
    res.end();
    return;
  }
  const options = { method: req.method };
  var oreq = https.request(url, options, (ores) => {
    //const fos = fs.createWriteStream(`${url.hostname}.txt`);

    //ores.setEncoding(getCharset(ores.headers));
    ores.on('data', (chunk) => {
      //fos.write(chunk);
      res.write(chunk);
    });

    ores.on('end', () => {
      //fos.end();
      res.end();
    });

    ores.on('error', (error) => {
      console.warn(error);
    });

    if (ores.statusCode == 302 && req.headers['auto-redirect'] == 'false') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.write(JSON.stringify({
        'auto-redirect': false,
        headers: ores.headers
      }));
    } else {
      res.statusCode = ores.statusCode;
      for (key in ores.headers)
        res.setHeader(key, ores.headers[key]);
    }
  });

  for (key in req.headers)
    oreq.setHeader(key, req.headers[key]);
  oreq.setHeader('host', url.host);
  //oreq.setHeader('origin', url.origin);
  //oreq.setHeader('sec-fetch-site', 'same-origin');
  if (url.hostname.startsWith('streamtape') && url.pathname.startsWith('/e/')) {
    oreq.setHeader('sec-fetch-dest', 'document');
    oreq.setHeader('sec-fetch-mode', 'navigate');
    oreq.setHeader('sec-fetch-site', 'none');
    oreq.setHeader('sec-fetch-user', '?1');
    oreq.setHeader('upgrade-insecure-requests', '1');
    oreq.removeHeader('origin');
    console.log(oreq.headers);
  }

  //req.setEncoding(getCharset(req.headers));
  req.on('data', (chunk) => {
    oreq.write(chunk);
  });

  req.on('end', () => {
    oreq.end();
  });
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});