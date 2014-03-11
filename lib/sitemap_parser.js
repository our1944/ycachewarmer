var Promise = require('bluebird'),
    xml2js = Promise.promisifyAll(require('xml2js')),
    request = Promise.promisify(require('request'));

/**
 * download one xml sitemap doc
 */
var downloadXml = function downloadXml(url) {
  return request(url)
    .spread(function(res, body) {
      return xml2js.parseStringAsync(body);
    }); 
};

/**
 * TODO add error handling code
 */
var downloadAll = function downloadAll(url) {
  return downloadXml(url)
    .then(function(sitemap) {
      if (sitemap.sitemapindex === undefined) return sitemap;
      // assuming the structure will be sitemapindex.sitemap[{loc:..., lastmod:...}]
      return Promise.map(sitemap.sitemapindex.sitemap, function(item, index, length) {
        if (item.loc !== undefined) {
          return downloadXml(item.loc[0]);
        }
        return item;
      });
    });
};

/**
 * read the xml files and parse all urls out of it, return an array of parsed urls
 */
var parseUrl = function parseUrl(xml) {
  var urls = [];
  
  for (var i = 0; i < xml.urlset.url.length; i++) {
    urls.push(xml.urlset.url[i].loc[0]);
  }
  return urls;
};

var parseAllUrls = function parseAllUrls(xmls) {
  var urls = [];
  for (var i= 0; i < xmls.length; i++) {
    urls = urls.concat(parseUrl(xmls[i]));
  }

  return urls;
};

exports.parseUrl = parseUrl;
exports.parseAllUrls = parseAllUrls;
exports.downloadXml = downloadXml;
exports.downloadAll = downloadAll;
