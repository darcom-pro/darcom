/* يدمج التطبيق كاملاً في ملف واحد.
   التشغيل: node tools/build-single.js
   ← lisan-offline.html  : ملف مستقل للمشاركة (واتساب، بريد، USB) ويعمل دون إنترنت
   ← lisan-artifact.html : نسخة رابط claude.ai (مع المزامنة عبر الحساب) */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const rd = f => fs.readFileSync(path.join(root, f), 'utf8');
const icon = 'data:image/svg+xml;base64,' + Buffer.from(rd('icon.svg')).toString('base64');
const css = rd('styles.css'), course = rd('store.js') + '\n' + rd('fsrs.js') + '\n' + rd('course-en.js'), app = rd('app.js').replace(/src="icon\.svg"/g, `src="${icon}"`);

let html = rd('index.html')
  .replace(/<link rel="manifest"[^>]*>\n/, '')
  .replace(/<link rel="apple-touch-icon"[^>]*>\n/, '')
  .replace('href="icon.svg"', `href="${icon}"`)
  .replace('<link rel="stylesheet" href="styles.css">', () => `<style>\n${css}\n</style>`)
  .replace('<script src="store.js"></script>\n', '').replace('<script src="fsrs.js"></script>\n', '')
  .replace('<script src="course-en.js"></script>', () => `<script>\n${course}\n</script>`)
  .replace('<script src="app.js"></script>', () => `<script>\n${app}\n</script>`);
fs.writeFileSync(path.join(root, 'lisan-offline.html'), html);

const art = `<title>لِسان</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;700&family=Nunito:wght@600;800;900&display=swap" rel="stylesheet">
<style>
html{direction:rtl}
${css}
</style>
<div id="app" dir="rtl" lang="ar"></div>
<div id="toast" role="status" aria-live="polite"></div>
<script>
${course}
</script>
<script>
${app}
</script>
`;
fs.writeFileSync(path.join(root, 'lisan-artifact.html'), art);
console.log('lisan-offline.html', (html.length / 1024).toFixed(0) + ' KB · lisan-artifact.html', (art.length / 1024).toFixed(0) + ' KB');
