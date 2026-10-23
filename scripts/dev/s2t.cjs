/* 一次性：把 app/components/lib/scripts 下所有 .ts/.tsx 的中文轉為繁體（台灣用語） */
const fs = require('fs');
const path = require('path');
const OpenCC = require('opencc-js');
const convert = OpenCC.Converter({ from: 'cn', to: 'twp' });

const roots = ['app', 'components', 'lib', 'scripts'];
const files = [];
for (const r of roots) {
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(e.name)) files.push(p);
    }
  })(r);
}

let changed = 0;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const out = convert(src);
  if (out !== src) { fs.writeFileSync(f, out); changed++; }
}
console.log(`converted ${changed}/${files.length} files`);
