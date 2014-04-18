var crawler = require('../lib/crawler'),
    assert = require('assert'),
    config = {
      'cookie': {
        'language' : ['en', 'es', 'de'],
        'currency_zone': ['EUR', 'USD']
      },
      'urls': ['http://www.google.com']
    },
    options;

describe('generating url options', function() {
  it('should generate correct options', function() {
    options = crawler.genOptions(config.urls, config);
    assert.equal(options.length, config.urls.length * config.cookie.language.length * config.cookie.currency_zone.length);
  })
});