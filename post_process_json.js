const _ = require('underscore');

let meridians = '(肺|大腸|胃|脾|心|小腸|膀胱|腎|心包|三焦|膽|肝)';
let meridianRegex = new RegExp(`[入|歸]?(${meridians}(、${meridians})*)[經]?`);
console.log(meridianRegex.toString());

let tastes = '(苦|甘|辛|咸|酸|燥|微苦|淡)';
let tasteRegex = new RegExp(`(${tastes}(、${tastes})*)`);
console.log(tasteRegex.toString());

let natureRegex = /(大寒|寒|微寒|涼|微涼|微溫|溫|熱|大熱|平|平、微寒|平、微溫)/;

let toxics = /((有?(大毒|微毒|毒))|(無毒))/;
let toxicRegex = new RegExp(toxics);
console.log(toxicRegex.toString());

const MERIDIAN_ENG_CHINESE = {
    lung: '肺',
    large_intestine: '大腸',
    stomach: '胃',
    spleen: '脾',
    heart: '心',
    small_intestine: '小腸',
    bladder: '膀胱',
    kidney: '腎',
    pericardium: '心包',
    triple_energize: '三焦',
    gallbladder: '膽',
    liver: '肝',
}

const MERIDIAN_CHINESE_ENG = _.invert(MERIDIAN_ENG_CHINESE);

const TASTE_ENG_CHINESE = {
    bitter        : '苦',
    sweet         : '甘',
    spicy         : '辛',
    salty         : '咸',
    sour          : '酸',
    hot           : '燥',
    slight_bitter : '微苦',
    plain         : '淡',
};

const TASTE_CHINESE_ENG = _.invert(TASTE_ENG_CHINESE);

const TOXIC_ENG_CHINESE = {
  not_toxic: '無毒',
  slightly_toxic: '有微毒',
  toxic: '有毒',
  strongly_toxic: '大毒',
};

const TOXIC_CHINESE_ENG = _.invert(TOXIC_ENG_CHINESE);

const HERB_TASTE_DEFAULTS = _.object(_.map(TASTE_ENG_CHINESE, (v, k) => {
  return [`taste_${k}`, 0];
}));

const HERB_MERIDIAN_DEFAULTS = _.object(_.map(MERIDIAN_ENG_CHINESE, (v, k) => {
  return [`meridian_${k}`, 0];
}));

// const HERB_TOXIC_DEFAULTS = _.object(_.map(TOXIC_ENG_CHINESE, (v, k) => {
//   return [`toxic_${k}`, null];
// }));

const HERB_TOXIC_DEFAULTS = {
  'toxic': null,
}

function processHerbAttributes(herb) {
  let attributes = herb.attributes;
  let attributesParts = Array.prototype.concat.apply([], _.map(attributes.split(/。」|。/), (s) => {
    let i = s.indexOf('：「');
    if (i >= 0) {
      // from some other textbook. just ignore the content?
      return '';
      //s = s.substring(i + 2);
    }
    return s.split(/，/);
  }));
  attributesParts = _.select(attributesParts, (p) => p);
  attributesParts = _.map(attributesParts, (p) => p.trim());
  console.log(`attributesParts = ${attributesParts}`);
  _.each(attributesParts, (p) => {
    let meridianGroups = meridianRegex.exec(p);
    let tasteGroups = tasteRegex.exec(p);
    let natureGroups = natureRegex.exec(p);
    let toxicGroups = toxicRegex.exec(p);
    if (meridianGroups) {
      console.log(`${p} looks like meridian. ${meridianGroups[1]}`);
      let meridians = meridianGroups[1].split('、');
      //console.log(meridians);
      _.each(meridians, (m) => {
        let organ = MERIDIAN_CHINESE_ENG[m];
        let key = `meridian_${organ}`;
        //console.log(organ);
        herb[key] = 1;
      });
    }
    if (tasteGroups) {
      console.log(`${p} looks like taste. ${tasteGroups[1]}`);
      let tastes = tasteGroups[1].split('、');
      console.log(tastes);
      _.each(tastes, (t) => {
        let taste = TASTE_CHINESE_ENG[t];
        let key = `taste_${taste}`;
        console.log(key);
        herb[key] = 1;
      });
    }
    if (natureGroups) {
      console.log(`${p} looks like nature. ${natureGroups[1]}`);
      herb.nature = natureGroups[0];
    }

    if (toxicGroups) {
      console.log(`${p} looks like toxic. ${toxicGroups[1]}`);
      herb.toxic = toxicGroups[0];
    }
  });
}

function processHerb(herb) {
  // computed properties
  // From 性味歸經 -> 性，味_，歸_經
  let processed = _.defaults({}, herb, {
    nature: '',         // 性
    // see https://blog.fntsr.tw/articles/2016/09/18/name-of-meridian-and-its-alphabetic-code/
    vessel_governor: '', // 督脈
    vessel_conception: '', // 任脈
  },
  HERB_TASTE_DEFAULTS,
  HERB_MERIDIAN_DEFAULTS,
  HERB_TOXIC_DEFAULTS
  );
  console.log(`attributes = ${herb.attributes}`);
  if (herb.attributes) {
    processHerbAttributes(processed);
  }

  // Verify tastes, meridians, natures, toxic are set.
  return processed;
}


function main(srcFileName, dstFileName, offset, hits) {
  offset = offset < 0 ? 0 : offset;
  hits = hits < 0 ? -1 : hits;
  const fs = require('fs');

  fs.readFile(srcFileName, 'utf8', (err, data) => {
    let herbs = JSON.parse(data);

    if (hits < 0) {
      herbs = herbs.slice(offset);
    } else {
      herbs = herbs.slice(offset, offset + hits);
    }

    let processedHerbs = _.map(herbs, processHerb);
    fs.writeFile(dstFileName, JSON.stringify(processedHerbs),(err) => {
      if (err) throw err;
      console.log(`herbs written to ${filename}`);
    }, 'utf8');

  });
}

var argv = require('minimist')(process.argv.slice(2));
let srcFileName = argv.src || 'herbs.json';
let dstFileName = argv.dst || 'processed_herbs.json';
let offset = parseInt(argv.offset || '0', 10);
let hits = parseInt(argv.hits || '-1', 10);
main(srcFileName, dstFileName, offset, hits);

//console.log(_.map(processedHerbs, (h) => {
//  return _.pick(h, 'name', 'attributes', 'nature',
//    'meridian_lung',
//    'meridian_large_intestine,',
//    'meridian_stomach',
//    'meridian_spleen',
//    'meridian_heart',
//    'meridian_small_intestine',
//    'meridian_bladder',
//    'meridian_kidney',
//    'meridian_pericardium',
//    'meridian_triple_energize',
//    'meridian_gallbladder',
//    'meridian_liver',
//    );
//}));
