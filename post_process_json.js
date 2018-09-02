const _ = require('underscore');

let meridians = '(肺|大腸|胃|脾|心|小腸|膀胱|腎|心包|三焦|膽|肝)';
let meridianRegex = new RegExp(`[入|歸]?(${meridians}(、${meridians})*)[經]?`);
console.log(meridianRegex.toString());

let tastes = '(苦|甘|辛|咸|酸|燥|微苦|淡)';
let tasteRegex = new RegExp(`(${tastes}(、${tastes})*)`);
console.log(tasteRegex.toString());

let natureRegex = /(大寒|寒|微寒|涼|微涼|微溫|溫|熱|大熱|平|平、微寒|平、微溫)/;

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
}

const TASTE_CHINESE_ENG = _.invert(TASTE_ENG_CHINESE);

const HERB_TASTE_DEFAULTS = _.object(_.map(TASTE_ENG_CHINESE, (v, k) => {
  return [`taste_${k}`, 0];
}));

const HERB_MERIDIAN_DEFAULTS = _.object(_.map(MERIDIAN_ENG_CHINESE, (v, k) => {
  return [`meridian_${k}`, 0];
}));

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
    toxic: '',
  },
  HERB_TASTE_DEFAULTS,
  HERB_MERIDIAN_DEFAULTS
  );
  console.log(`attributes = ${herb.attributes}`);
  if (herb.attributes) {
    processHerbAttributes(processed);
  }

  // Verify tastes, meridians, natures, toxic are set.
  return processed;
}

let herbs = require('./herbs.json');
herbs = herbs.slice(20, 20+10);
let processedHerbs = _.map(herbs, processHerb);

console.log(processedHerbs);
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
