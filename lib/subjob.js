var Promise = require('bluebird'),
    crawler = require('./crawler');

Promise.longStackTrace();
// if process recieve options TODO: more messaging

var startJob = function startJob(opt) {
  crawler.crawlOne(opt);
};

if (process.argv[2] !== undefined) {
  var options = JSON.parse(process.argv[2]);
  crawler.crawlOne(options)
  .spread(function(res) {
    //console.log(res);
    process.send({ status: 'success', message:'download finish', options: options});
    process.exit(0);
  });
} else  {
  process.send({status: 'failure', message: 'unknow message'});
  process.exit(1);
}

process.on('uncaughtException', function(err) {
  process.send('warmer child panic', err);
  process.exit(1);
});
