var http = require('http')
var url = require('url')
var fs = require('fs')
var path = require('path')
var baseDirectory = __dirname   // or whatever base directory you want

var port = 4001;

http.createServer(function (request, response) {
    try {
     
        var requestUrl = url.parse(request.url)

        // need to use path.normalize so people can't access directories underneath baseDirectory
        var fsPath = baseDirectory + path.normalize(requestUrl.pathname)

        var options = {};
        if (request.headers.range && request.headers.range.startsWith('bytes=')) {
          let matches = /bytes=(\d*)-(\d*)/g.exec(request.headers.range);
          options.start = parseInt(matches[1]);
          options.end = parseInt(matches[2])+1;
          response.setHeader('Content-Length', options.end - options.start);
        }
        if (request.url.endsWith(".svg")) {
          response.setHeader('Content-Type', "image/svg+xml");
        }

        var fileStream = fs.createReadStream(fsPath, options)
        fileStream.pipe(response)
        fileStream.on('open', function() {
          response.writeHead(200)
        })
        fileStream.on('error',function(e) {
             response.writeHead(404)     // assume the file doesn't exist
             response.end()
        })
   } catch(e) {
        response.writeHead(500)
        response.end()     // end the response so browsers don't hang
        console.log(e.stack)
   }
}).listen(port)

console.log("listening on port " + port)