/**
 * Alias subpath import (`dist/cjs/*`) to top-level path mapping (`rxjs/*`)
 * Previously this was done by placing cjs to top-level package when it's published -
 * Now build uses `dist` as explicit output subpath so we generate top-level alias here instead.
 */
const fs = require('fs-extra');
const path = require('path');

const aliasRoot = ['observable'];

aliasRoot.map((alias) => path.resolve(__dirname, `../lib/${alias}`)).forEach((alias) => {
   // if (fs.pathExistsSync(alias)) {
   //    fs.removeSync(alias);
   // }
   fs.ensureDirSync(alias);
});

aliasRoot.forEach((alias) => {
   const pkgManifest = {
      'name': `redux-kangking/${alias}`,
      'types': `./index.d.ts`,
      'main': `./index.js`,
      'module': `../esm/${alias}/index.js`,
      'sideEffects': false
   };

   fs.writeJsonSync(path.resolve(__dirname, `../lib/${alias}/package.json`), pkgManifest, {spaces: 2});
});
