const _ = require('underscore');
const iconv = require('iconv-lite');

const request = require('request');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');

const dir = path.join('tmp', 'converted_htmls');

function processHtml(data) {
  //console.log(data.slice(100, 100+100));
  let $ = cheerio.load(data);
  let herbNameSelector = `
body > table > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(2) > td.content_board > table:nth-child(1) > tbody > tr:nth-child(1) > td:nth-child(2) > b
  `;
  let herbName = $(herbNameSelector).text().trim();
  if (!herbName) {
    throw Error('No herb name found. Selector wrong?');
  }

  let herb = {
    name: herbName,
  };
  let $content = $('.content_board');
  let rawText = $content.text();
  let texts = $content.contents();
  // skip the first two for menu.
  let keys = [];
  let vals = [];
  for (let i = 2; i < texts.length; i++) {
    let e =  texts[i];
    //console.log(e.nodeType);
    //console.log(e.tagName);
    let s = '';
    if (e.nodeType === 3) {
      s = e.data.trim();
    } else if (e.nodeType === 1) {
      switch (e.tagName) {
        case 'p':
          s = $(e).text().trim();
          break;
        case 'ol':
          s = $(e).find('li').map((i, e) => { return $(e).text().trim() }).get().join('\n');
          break;
        default:
          break;
      }
    }
    if (!s) {
      continue;
    }
    //console.log(s);
    if (s[0] === '【') {
      keys.push(s);
    } else {
      vals.push(s);
    }
    //let key = $(e).text().trim();
  };

  herb = _.defaults(herb, _.object(keys, vals));
  return herb;
}

fs.readdir(dir, (err, files) => {
  if (err) {
    console.error(`Failed to read the directory ${dir}`);
    throw err;
  }

  // debug
  files = files.slice(0, 10);

  // Skip files that does not match .html files e.g. .DS_Store file
  files = files.filter((file) => {
    if (/.+\.html$/.test(file) === false) {
      console.log(`skipped file: ${file}`);
      return false;
    }
    return true;
  });

  let results = [];
  files.map((file) => {
    console.log(`processing file: ${file}`);

    fs.readFile(path.resolve(dir, file), 'utf8', (err, data) => {
      if (err) {
        console.error(`Failed to read the file ${dir}/${file}`);
        console.error(err);
        process.exit(-1);
      }

      try {
        let herb = processHtml(data);
        results.push(herb);
        if (results.length === files.length) {
          console.log(results);
        }
      } catch (e) {
        console.error(`Failed to process file ${file}`);
        throw e;
      }
    });
  });
});
