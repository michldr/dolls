const fs = require('fs');
const path = require('path');

const filePath = 'e:\\almog\\src\\cities.js';
const tempPath = 'e:\\almog\\src\\_cities_temp_for_sort.js';
const outPath = 'e:\\almog\\src\\cities_sorted_out.js';

const content = fs.readFileSync(filePath, 'utf8');
fs.writeFileSync(tempPath, content + '\nmodule.exports = missionControl;\n', 'utf8');
const missionControl = require(tempPath);

const entries = Object.entries(missionControl);
entries.sort((a, b) => a[1].name.localeCompare(b[1].name, 'he'));

let out = 'const missionControl = {\n';
for (let i = 0; i < entries.length; i++) {
  const [key, val] = entries[i];
  let valStr = JSON.stringify(val, null, 4);
  // indent multiline JSON for readability
  valStr = valStr.replace(/\n/g, '\n        ');
  out += `    "${key}": ${valStr}${i < entries.length - 1 ? ',\n' : '\n'}`;
}
out += '};\n';
fs.writeFileSync(outPath, out, 'utf8');

// cleanup
try { delete require.cache[require.resolve(tempPath)]; fs.unlinkSync(tempPath); } catch (e) {}
console.log('Wrote sorted file to', outPath);
