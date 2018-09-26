function processed_herbs_json_to_csv(srcFileName, dstFileName) {
  const fs = require('fs');
  fs.readFile(srcFileName, 'utf8', (err, data) => {

    const stringify = require('csv-stringify');
    // `columns` order matters
    // `columns` key == the object's key, value == the output csv name
    let columns = {
      name: '藥名',
      nickNames: '別名',
      nature: '性',
      toxic: '毒',
      taste_bitter        : '味苦',
      taste_sweet         : '味甘',
      taste_spicy         : '味辛',
      taste_salty         : '味咸',
      taste_sour          : '味酸',
      taste_hot           : '味燥',
      taste_slight_bitter : '味微苦',
      taste_plain         : '味淡',
      meridian_lung: '歸肺經',
      meridian_large_intestine: '歸大腸經',
      meridian_stomach: '歸胃經',
      meridian_spleen: '歸脾經',
      meridian_heart: '歸心經',
      meridian_small_intestine: '歸小腸經',
      meridian_bladder: '歸膀胱經',
      meridian_kidney: '歸腎經',
      meridian_pericardium: '歸心包經',
      meridian_triple_energize: '歸三焦經',
      meridian_gallbladder: '歸膽經',
      meridian_liver: '歸肝經',
      'source': '資料來源',
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
      toxic: function(value) {
        return _.isNull(value) ? '無標明' : value;
      },
    };
    let options = {
      header: true,
      columns: columns,
      formatters: formatters,
    };
    stringify(JSON.parse(data), options, (err, output) => {
      fs.writeFile(dstFileName, output, {encoding: 'utf8'});
    });
  });
}

var argv = require('minimist')(process.argv.slice(2));
let srcFileName = argv.src || 'processed_herbs.json';
let dstFileName = argv.dst || 'processed_herbs.csv';
processed_herbs_json_to_csv(srcFileName, dstFileName);