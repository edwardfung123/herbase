const _ = require('underscore');
const iconv = require('iconv-lite');

const request = require('request');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');

const dir = path.join('tmp', 'converted_htmls');

const isDebug = process.env.NODE_ENV === 'development';

function processHtml(data) {
  //console.log(data.slice(100, 100+100));
  let $ = cheerio.load(data);
  let $content = $('.content_board');

  let herbNameSelector = `table:nth-child(1) > tbody > tr:nth-child(1) > td:nth-child(2) > b`;
  let herbName = $content.find(herbNameSelector).text().trim();

  if (!herbName) {
    console.log()
    // check if the page is empty in fact...
    let pvalue = '';
    let paragraphs = $content.find('> p').map((i, e) => {
      console.log(e.childElementCount);
      if (e.children.length === 1 && e.children[0].type === 'text') {
        pvalue += $(e).text().trim();
      }
    });
    //console.log(pvalue);
    if (pvalue.trim()) {
      // there are text in the page... but somehow we failed to get the herb name
      throw Error('No herb name is found but the content is not empty. Selector wrong?');
    } else {
      // nothing in the page. skip this one... probably so dummy page
      console.warn('No herb name is found and the content is empty too. skip this page.')
      return null;
    }
  }

  let herbNickNameSelector = `table:nth-child(1) > tbody > tr:nth-child(1) > th`;
  let herbNickNames = $content.find(herbNickNameSelector).text().trim();

  let herb = {
    name: herbName,
    nickNames: herbNickNames,
  };
  let rawText = $content.text();
  let texts = $content.contents();
  // skip the first two for menu.
  let keys = [];
  let vals = [];
  let currentState = 'init';
  let bufferedValues = [];

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
          if (isDebug) { console.log(_.pick(e, 'children')); }
          //console.log(e.children.length);
          let textChildren = _.select(e.children, (child, i) => {
            return child.type === 'text';
          });
          if (e.children.length > 0 && textChildren) {
            s = _.map(textChildren, (c, i) => { return c.data }).join('\n');
          } else {
            // this is the ads tag...
            s = '';
          }
          break;
        case 'ul':
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
    if (isDebug) { console.log(`${currentState}: ${s}`); }
    if (s[0] === '【') {
      if (currentState === 'value') {
        vals.push(bufferedValues.join('\n'));
        if (isDebug) { 
          console.log('Save the buffered values');
          console.log(`keys = ${keys}`);
          console.log(`vals = ${vals}`);
        }
      }
      bufferedValues = [];
      currentState = 'key';
      keys.push(s);
    } else {
      currentState = 'value';
      bufferedValues.push(s);
    }
    //let key = $(e).text().trim();
  };
  vals.push(bufferedValues.join('\n'));

  herb = _.defaults(herb, _.object(keys, vals));
  chineseKeysTranslation = {
    '【品種來源】': 'species',
    '【性味歸經】':'attributes', 
    '【功效】': 'effect', 
    '【主治】': 'usage', 
    '【文獻別錄】': 'reference', 
    '【用法用量】': 'dosage', 
    '【現代藥理】': 'pharmacology', 
    '【注意禁忌】': 'remark', 
    '【性狀】': 'physical_properties',
  };
  _.each(chineseKeysTranslation, (engName, chiName) => {
    if (_.has(herb, chiName)) {
      herb[engName] = herb[chiName];
      delete herb[chiName];
    } else {
      // Missing name. back fill
      console.warn(`Missing ${chiName} in ${herbName}`);
      herb[engName] = '';
    }
  });
  return herb;
}


function export_results(results) {
  if (isDebug) {
    console.log(results);
  }

  const stringify = require('csv-stringify');
  // `columns` order matters
  // `columns` key == the object's key, value == the output csv name
  let columns = {
    name: '藥名',
    nickNames: '別名',
    'species': '品種來源',
    'attributes': '性味歸經', 
    'effect': '功效', 
    'usage': '主治', 
    'reference': '文獻別錄', 
    'dosage': '用法用量', 
    'pharmacology': '現代藥理', 
    'remark': '注意禁忌',
    'physical_properties': '性狀',
  };

  let formatters = {
    effect: function(value) {
      return _.isArray(value) ? value.join('\n') : value;
    },
    dosage: function(value) {
      return _.isArray(value) ? value.join('\n') : value;
    },
    reference: function(value) {
      return _.isArray(value) ? value.join('\n') : value;
    },
  };
  let options = {
    header: true,
    columns: columns,
    formatters: formatters,
  };
  stringify(results, options, (err, output) => {
    fs.writeFile('herbs.csv', output, {encoding: 'utf8'});
  });

  fs.writeFile('herbs.json', JSON.stringify(results), {encoding: 'utf8'});
}

fs.readdir(dir, (err, files) => {
  if (err) {
    console.error(`Failed to read the directory ${dir}`);
    throw err;
  }

  // debug
  if (isDebug) {
    let fileName = process.env.FILENAME;
    if (fileName) {
      files = [fileName];
    } else {
      let start = parseInt(process.env.START || '0', 10);
      let size = parseInt(process.env.LENGTH || '10', 10);
      files = files.sort().slice(start, start + size);
    }
  }

  // Skip files that does not match .html files e.g. .DS_Store file
  files = files.filter((file) => {
    if (/.+\.html$/.test(file) === false) {
      console.log(`skipped file: ${file}`);
      return false;
    }
    return true;
  });

  // should use processed instead of results.length to track the progress.
  let processed = 0;
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
        processed += 1;
        if (herb) {
          results.push(herb);
        }
      } catch (e) {
        console.error(`Failed to process file ${file}`);
        throw e;
      }

      // All files are processed successfully.
      if (processed === files.length) {
        export_results(results);
      }
    });
  });
});
