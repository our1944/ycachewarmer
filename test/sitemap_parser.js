var parser = require('../lib/sitemap_parser');

describe('xml parser', function() {
  it('should down load all xml files', function(done) {
    parser.downloadAll('http://www.yachtico.com/index.xml').then(function(xml) {
      // all sitemap will be downloaded
      // add some test code here...
      var url = parser.parseAllUrls(xml);
      console.log(url.length);
      done();
    });
  });
});
