var sp = require('./sitemap_parser'),
    crawler = require('./crawler'),
    config = require('../config.json'),
    cp = require('child_process'),
    net = require('net'),
    fs = require('fs'),
    queue = [],
    conCount = 0,
    successCount = 0, failureCount = 0, totalCount = 0, server;


var checkEnd = function() {
  if (totalCount !== 0 && conCount === 0 && totalCount == (successCount + failureCount)) {
    return process.exit(0);
  }
};


var cleanup = function() {

  server.close();

  if (fs.existsSync(config.pid)) {
    fs.unlinkSync(config.pid);
  }

  if (fs.existsSync(config.socket)) {
   fs.unlinkSync(config.socket);
  }
};

// open server for status check
var statsServer = function() {
  server = net.createServer(function(con) {
    con.write('status: \r\n');
    con.write('success: ' + successCount + '\tfailed: ' + failureCount + '\ttotal: ' + totalCount + '\tfinish: ' + Math.round(successCount * 100 / totalCount) + '\r\n');
    con.write('concurrency: ' + conCount + '\r\n');
    con.pipe(con);
  });

  server.listen(config.socket, function() {

  });

};



// start preparing to crawl
var urls = sp.downloadAll('http://www.yachtico.com/index.xml')
            .then(function(xmls) {
              return sp.parseAllUrls(xmls);
            });

// start child
urls.then(function(urls) {
  var options = crawler.genOptions(urls, config);

  totalCount = options.length;


  function stepForward(request) {
      request.spread(statsCounter);
      request.error(errorHandler);
      request.finally(finalHandler);
  }
  

  function finalHandler() {

    var opt;
    conCount -= 1;

    if (queue.length > 0 && conCount < config.concurrency) {
      
      conCount += 1;
      opt = queue.shift();
      //var child = cp.fork(__dirname + '/subjob.js', [JSON.stringify(opt)]);
      var request = crawler.crawlOne(opt);
      stepForward(request);
    }
    checkEnd();
  }

  function errorHandler(e) {
    failureCount +=1; 
    console.log(e);
  }



  function statsCounter(result, body) {
    if (result.statusCode === 200) {
      //console.log('finished: ' + result.request.href);
      successCount += 1;
    } else {
      failureCount += 1;
    }
  }

  options.forEach(function(opt) {

    if (conCount < config.concurrency) {
      conCount += 1;
      //var child = cp.fork(__dirname + '/subjob.js', [JSON.stringify(opt)]);
      var request = crawler.crawlOne(opt);
      stepForward(request);
    } else {
      queue.push(opt);
    }

  });

  
});

urls.then(statsServer);



process.on('exit', function() {
  cleanup();
});

process.on('SIGTERM', function() {
  cleanup();
});


// FIXME: better method needed
//setInterval(checkEnd, 1000);
