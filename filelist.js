let s = parseInt(process.env.s, 10);
let e = parseInt(process.env.e, 10);

let base = 'http://yibian.hopto.org/yao/?yno=';
for (let i = s; i < e + 1; i++) {
  console.log(`${base}${i}`);
}
