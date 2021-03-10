const path = require('path');
const fs = require('fs-extra');

const files = [
   'package.json', 'index.d.ts', 'README.md', 'LICENSE.md'
];

try {
   // console.log('开始拷贝文件...');

   files.map(f => [path.resolve(__dirname, `../${f}`), path.resolve(__dirname, `../lib/${f}`)]).forEach(([src, dest]) => {
      fs.copySync(src, dest);
      console.log(`${src} ==>  ${dest}`);
   });

   // console.log('成功拷贝文件!');
} catch (err) {
   console.error(err);
}
