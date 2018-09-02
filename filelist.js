let s = parseInt(process.env.s, 10);
let e = parseInt(process.env.e, 10);

let base = 'http://yibian.hopto.org/yao/?yno=';
for (let i = s; i < e + 1; i++) {
  // newline and spaces between url and options are important
  console.log(`${base}${i}\n  out=index.${i}.html`);
}
