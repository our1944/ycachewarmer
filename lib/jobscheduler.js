var sp = require('./sitemap_parser'),
    crawler = require('./crawler'),
    config = require('../config.json'),
    cp = require('child_process'),
    net = require('net'),
    fs = require('fs'),
    children = [],
    successCount = 0, failureCount = 0, totalCount = 0;


var urls = sp.downloadAll('http://www.yachtico.com/index.xml')
            .then(function(xmls) {
              return sp.parseAllUrls(xmls);
            });

urls.then(function(urls) {
    var options = crawler.genOptions(urls, config);
    //console.log(urls);
    //console.log(options);
    return options;

  })
  // start child
  .then(function(options) {

    totalCount = options.length;

    var startChild = function() {

      var opt = options.pop();
      // no more elements
      if (opt === undefined) {
        return false;
      }

      var c = cp.fork(__dirname + '/subjob.js', [JSON.stringify(opt)]);
      c.on('exit', function() {
        // clean up exited children
        for (var i = 0; i < children.length; i++) {
          if (children[i].exitCode === 0) {
            children = children.slice(i, 1);
          } 
        }
        var newchild = startChild();
        children.push(newchild);
      });

      c.on('message', function(m) {
        if (m.status !== undefined && m.status === 'success') {
          successCount += 1;
        }
        else {
          failureCount += 1;
        }
      });

      return c;
    };
    
    for (var i = 0; i < config.concurrency; i++) {
      var child = startChild();
      if (child !== false) {
        children.push(child);
      }
    }
  });

// open server for status check
var server = net.createServer(function(c) {
  c.write('status: \r\n');
  c.write('success: ' + successCount + '\tfailed: ' + failureCount + '\ttotal: ' + totalCount + '\tfinish: ' + Math.round(successCount * 100 / totalCount) + '\r\n');
  c.write('children: ' + children.length + '\r\n');
  c.pipe(c);
});

server.listen(config.socket, function() {

});

var cleanup = function() {
  for (var i = 0; i < children.length; i++) {
    children[i].kill();
  }

  server.close();

  if (fs.existsSync(config.pid)) {
    fs.unlinkSync(config.pid);
  }

  if (fs.existsSync(config.socket)) {
   fs.unlinkSync(config.socket);
  }
};

process.on('exit', function() {
  cleanup();
});

process.on('SIGTERM', function() {
  cleanup();
});
