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
    //urls = urls.slice(0, 10);
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

        var newchild = startChild();
        if (newchild !== false) {
          children.push(newchild);
        }
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
var server = net.createServer(function(con) {
  con.write('status: \r\n');
  con.write('success: ' + successCount + '\tfailed: ' + failureCount + '\ttotal: ' + totalCount + '\tfinish: ' + Math.round(successCount * 100 / totalCount) + '\r\n');
  con.write('children: ' + children.length + '\r\n');
  con.pipe(con);
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

var checkEnd = function() {
  if (totalCount !== 0 && children.length === 0 && totalCount == (successCount + failureCount)) {
    return process.exit(0);
  }
};

var cleanupChild = function() {
  //console.log(children.length);
  if (children[0] !== undefined && children[0].exitCode === 0) {
    children.shift();
  }
};

process.on('exit', function() {
  cleanup();
});

process.on('SIGTERM', function() {
  cleanup();
});


// FIXME: better method needed
setInterval(checkEnd, 1000);
setInterval(cleanupChild, 50);
