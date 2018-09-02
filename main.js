const iconv = require('iconv-lite');

const request = require('request');
const cheerio = require('cheerio');

request({
  url: 'http://yibian.hopto.org/yao/?yno=2',
  encoding: null,
}, (err, resp, body) => {
  body = iconv.decode(new Buffer(body), "big5");
  let $ = cheerio.load(body);
  let herbName = $('body > table > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(2) > td.content_board > table:nth-child(1) > tbody > tr:nth-child(1) > td:nth-child(2) > b').text();
  let texts = $('.db_sub_mnu_board ~ p').slice(1, 5).map((i, e) => {return $(e).text();}).get();
  //texts.unshift(herbName);
  //console.log(texts);
  console.log([herbName, texts[1], texts[3]].join('\t'));
});
