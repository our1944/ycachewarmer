var Promise = require('bluebird'),
    cp = require('child_process'),
    request = Promise.promisify(require('request'));

var crawlOne = function crawlOne(options) {
  return request(options);
};

var genOptions = function genOptions(urls, config) {
  var opts = [];
  for (var i = 0; i < urls.length; i ++) {
    for (var j = 0; j < config.lang.length; j++) {
      for (var k = 0; k < config.currency.length; k++) {
        var opt = {};
        opt.url = urls[i];
        opt.headers = {
          'Cookie': 'country_code=de; language=' + config.lang[j] + '; currency_zone=' + config.currency[k]
        };
        opts.push(opt);
      }
    } 
  }
  return opts;
};

exports.crawlOne = crawlOne;
exports.genOptions = genOptions;
