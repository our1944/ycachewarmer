var Promise = require('bluebird'),
    cp = require('child_process'),
    _ = require('lodash'),
    request = Promise.promisify(require('request'));

function crawlOne(options) {
  return request(options);
}

function genOptions(urls, config) {

  return urls.reduce(function(resultUrls, currUrl, index, arr) {

    var opts, cookie = config.cookie || {} ;
    resultUrls = resultUrls || [];

    // no cookie specified, return a object only contains url
    if (_.isEmpty(cookie)) {

      return resultUrls.push({
        url: currUrl
      });
    }

    // generate options according to cookies
    cookieArray = _.reduce(cookie, function(result, cookieVal, cookieKey) {

      cookieVal = _.flatten([cookieVal]);

      return _.reduce(result, function(memo, curr) {

        // loop through existing result array
        return Array.concat(memo, _.map(cookieVal, function(val) {

          // expand each result value with current cookieVal array
          return curr + ' ' + cookieKey + '=' + val + ';';
        }));

      }, []);

    }, [""]);

    // add url to each item in flatterned cookie array
    opts = cookieArray.map(function(val) {

      return {
        url: currUrl,
        headers: {
          Cookie: val
        }
      };
    });

    return Array.concat(resultUrls, opts);
  }, []);

  // some non-functional way of doing things above

  //for (var i = 0; i < urls.length; i ++) {
    //for (var j = 0; j < config.lang.length; j++) {
      //for (var k = 0; k < config.currency.length; k++) {
        //var opt = {};
        //opt.url = urls[i];
        //opt.headers = {
          //'Cookie': 'country_code=de; language=' + config.lang[j] + '; currency_zone=' + config.currency[k]
        //};
        //opts.push(opt);
      //}
    //} 
  //}
}

exports.crawlOne = crawlOne;
exports.genOptions = genOptions;
