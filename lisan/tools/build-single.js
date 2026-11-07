/* يدمج التطبيق كاملاً في ملف HTML واحد للمشاركة (واتساب، بريد، USB).
   التشغيل: node tools/build-single.js  ← ينتج lisan-offline.html */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const rd = f => fs.readFileSync(path.join(root, f), 'utf8');
const icon = 'data:image/svg+xml;base64,' + Buffer.from(rd('icon.svg')).toString('base64');
let html = rd('index.html')
  .replace(/<link rel="manifest"[^>]*>\n/, '')
  .replace(/<link rel="apple-touch-icon"[^>]*>\n/, '')
  .replace('href="icon.svg"', `href="${icon}"`)
  .replace('<link rel="stylesheet" href="styles.css">', () => `<style>\n${rd('styles.css')}\n</style>`)
  .replace('<script src="course-en.js"></script>', () => `<script>\n${rd('course-en.js')}\n</script>`)
  .replace('<script src="app.js"></script>', () => `<script>\n${rd('app.js').replace('src="icon.svg"', `src="${icon}"`)}\n</script>`);
fs.writeFileSync(path.join(root, 'lisan-offline.html'), html);
console.log('lisan-offline.html', (html.length / 1024).toFixed(0) + ' KB');
