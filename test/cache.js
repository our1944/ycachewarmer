var Promise = require('bluebird'),
    assert = require('assert'),
    request = Promise.promisify(require('request'));

describe('test caching hit', function() {
  it('should warm cache', function(done) {

    var url = 'http://www.yachtico.com/search?location=berlin';
    var hit0, hit1;
    request({
      url: url,
      headers: {
        'Cookie': 'language=en; currency_zone=USD; country_code=de'
      }
    })
    .spread(function(res) {
      console.log(res.headers);
      request({
        url: url,
        headers: {
          'Cookie': 'language=en; currency_zone=USD; country_code=de'
        }
      }) 
      .spread(function(res) {
          console.log(res.headers);
          done();
      });
    });
  });
});
