var _ = require('lodash');
var fetch = require('node-fetch');
var mustache = require('mustache');
var fs = require('fs');
var unescape = require('unescape');
var dateFormat = require('dateformat');


var PAGES = 19;
var DIRECTORY = 'data'
var URL = 'http://content.guardianapis.com/sustainable-business/fairtrade-partner-zone?show-fields=body&page=';

function getVariables(item) {
  return {
    webPublicationDate: item.webPublicationDate,
    webTitle: item.webTitle,
    webUrl: item.webUrl,
    body: unescape(item.fields.body)
  };
}

function getPageUrlFor(pageNumber) {
  return `${URL}${pageNumber}`;
}

function getTemplate() {
  return new Promise(function(resolve, reject) {
      fs.readFile( __dirname + '/main.html', 'ascii', function (err, data) {
        if (err) {
          reject(err); 
        }
        resolve(data);
      });
    });
}


function writeToFile(directory, filedate, filename, body) {
  return new Promise(function(resolve, reject){
    fs.writeFile(`${directory}/${filedate}-${filename}`, body, function(err) {
      if(err) {
          reject(err);
      }
      resolve(true);
    });
  });
}

_.range(1, PAGES + 1).map(function(number){
  console.log(`Working on page ${number}`);

  fetch(getPageUrlFor(number))
  .then(function(rawResponse) { return rawResponse.json() })
  .then(function(jsonResponse) {

    var items = _.map(jsonResponse.response.results, function(item) {
      return getVariables(item);
    });

    getTemplate().then(function(template) {
      _.map(items, function(item) {
        var renderedItem = mustache.render(template, item);
        var filedate = dateFormat(item.webPublicationDate, "yyyy-mm-dd");
        var filename = item.webTitle + '.html';

        writeToFile(DIRECTORY, filedate, filename, renderedItem)
          .then(function(){ console.log(`Successfully written to file ${filename}`)})
          .catch(function(error) { console.log(`Error writing to file: ${error}`)});
      });
    });

  })
  .catch(function(error){ console.log(error) });
});