/* =========================================================
   لسان — محرك التطبيق
   يعمل بالكامل على الجهاز: لا خوادم، لا حسابات، لا اشتراكات.
   التخزين: localStorage على الجهاز نفسه (مع تصدير/استيراد احتياطي).
   ========================================================= */
(function () {
'use strict';

/* ---------------- أدوات عامة ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const app = $('#app');
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const en = s => `<bdi class="en" dir="ltr">${esc(s)}</bdi>`;
const dkey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const today = () => dkey(new Date());
const addDays = (k, n) => { const [y, m, d] = k.split('-').map(Number); return dkey(new Date(y, m - 1, d + n)); };
const IN_CLAUDE = !!(window.claude && typeof window.claude.use === 'function');
const VIEWER_THEME = document.documentElement.dataset.theme;

const CONTR = { "i'm": "i am", "you're": "you are", "we're": "we are", "they're": "they are", "he's": "he is", "she's": "she is", "it's": "it is", "that's": "that is", "what's": "what is", "here's": "here is", "there's": "there is", "isn't": "is not", "aren't": "are not", "wasn't": "was not", "weren't": "were not", "don't": "do not", "doesn't": "does not", "didn't": "did not", "can't": "cannot", "won't": "will not", "i'll": "i will", "you'll": "you will", "we'll": "we will", "they'll": "they will", "she'll": "she will", "he'll": "he will", "haven't": "have not", "hasn't": "has not", "mustn't": "must not", "shouldn't": "should not", "let's": "let us", "i've": "i have" };
function norm(s) {
  let t = String(s).toLowerCase().replace(/[’‘`]/g, "'").replace(/can not/g, 'cannot').replace(/[^a-z0-9'\s-]+/g, ' ').replace(/-/g, ' ');
  return t.split(/\s+/).filter(Boolean).map(w => CONTR[w] || w).join(' ').trim();
}
function lev(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
  return prev[n];
}
function wordSim(a, b) { // تشابه على مستوى الكلمات (LCS)
  const x = norm(a).split(' '), y = norm(b).split(' ');
  const dp = Array.from({ length: x.length + 1 }, () => new Array(y.length + 1).fill(0));
  for (let i = 1; i <= x.length; i++) for (let j = 1; j <= y.length; j++) dp[i][j] = x[i - 1] === y[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return (2 * dp[x.length][y.length]) / (x.length + y.length);
}
const tok = s => s.replace(/[.,!?]/g, '').split(/\s+/).filter(Boolean);

/* ---------------- المنهج ---------------- */
const C = window.LISAN_COURSES.en;
const LESSONS = [];
C.units.forEach((u, ui) => u.lessons.forEach((l, li) => { l.id = `u${ui + 1}l${li + 1}`; l.ui = ui; l.li = li; l.gi = LESSONS.length; LESSONS.push(l); }));
const UNIT_START = C.units.map((u, ui) => LESSONS.findIndex(l => l.ui === ui));
const ALLV = LESSONS.flatMap(l => l.vocab.map(v => ({ en: v[0], ar: v[1], lid: l.id, ui: l.ui })));
const VMAP = {}; ALLV.forEach(v => { if (!VMAP[v.en]) VMAP[v.en] = v; });
const ALLWORDS = [...new Set(LESSONS.flatMap(l => l.sentences.flatMap(s => tok(s[0]))))];
const TAGS = { s: 'الفاعل', v: 'الفعل', x: 'فعل مساعد / أداة', o: 'التكملة / المفعول', t: 'زمان / تكرار / شرط', q: 'أداة سؤال', p: 'حرف جر / مكان' };

/* ---------------- التخزين ---------------- */
const KEY = 'lisan.v1';
const HEART_MAX = 5, HEART_MS = 30 * 60 * 1000;
const INTERVALS = [0, 1, 2, 4, 8, 16];
let DB = loadDB();
function loadDB() { try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && Array.isArray(d.profiles)) return d; } catch (e) { } return { v: 1, profiles: [], current: null }; }
function save() { DB.updated = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { } cloudQueue(); }

/* ---------- المزامنة عبر الحساب (عند الفتح من رابط claude.ai) ----------
   كل مستخدم مسجّل يحصل على نسخة خاصة به (data/users/<id>) لا يراها غيره.
   تُرفع التغييرات تلقائياً وتُسحب على أي جهاز آخر يفتح الرابط بالحساب نفسه. */
const DEVICE = (() => { try { let d = localStorage.getItem('lisan.device'); if (!d) { d = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); localStorage.setItem('lisan.device', d); } return d; } catch (e) { return 'd0'; } })();
const CLOUD = { ref: null, on: false, timer: null, writing: false, again: false, pending: null };
let SCREEN = 'boot';
const packDB = () => { const { current, ...rest } = DB; return JSON.stringify(rest); };
const saveLocal = () => { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { } };
function cloudQueue() { if (!CLOUD.on) return; clearTimeout(CLOUD.timer); CLOUD.timer = setTimeout(cloudPush, 1500); }
async function cloudPush() {
  if (!CLOUD.on) return; if (CLOUD.writing) { CLOUD.again = true; return; }
  CLOUD.writing = true;
  try { await CLOUD.ref.set({ json: packDB(), updated: DB.updated || Date.now(), device: DEVICE }); } catch (e) { }
  CLOUD.writing = false; if (CLOUD.again) { CLOUD.again = false; cloudPush(); }
}
function cloudApply(d) {
  try { const remote = JSON.parse(d.json); if (!remote || !Array.isArray(remote.profiles)) return;
    const cur = DB.current; remote.profiles.forEach(fixProfile); DB = remote; DB.updated = d.updated;
    DB.current = DB.profiles.some(p => p.id === cur) ? cur : null; saveLocal();
  } catch (e) { }
}
function cloudIncoming(d) {
  if (!d || !d.json || !(d.updated > (DB.updated || 0))) return;
  if (SCREEN === 'home' || SCREEN === 'profiles') { const sc = SCREEN; cloudApply(d); go(sc); toast('☁️ تم تحديث تقدّمك من جهاز آخر'); }
  else CLOUD.pending = d;
}
async function cloudInit() {
  if (!IN_CLAUDE) return;
  try {
    const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
    if (!db || !user) return; const id = await user.id(); if (!id) return;
    CLOUD.ref = db.doc('data/users/' + id + '/lisan');
    const snap = await CLOUD.ref.get(); const d = snap.exists ? snap.data() : null;
    CLOUD.on = true;
    if (d && d.json && (d.updated || 0) > (DB.updated || 0)) { cloudApply(d); }
    else if (DB.profiles.length && (!d || (DB.updated || 0) > (d.updated || 0))) cloudPush();
    CLOUD.ref.onSnapshot(s2 => { const x = s2.exists ? s2.data() : null; if (x && x.device !== DEVICE) cloudIncoming(x); }, () => { });
    if (SCREEN === 'home' || SCREEN === 'profiles') go(SCREEN);
  } catch (e) { CLOUD.on = false; }
}
const syncLine = () => CLOUD.on ? '☁️ متزامن مع حسابك: افتح الرابط نفسه من أي جهاز' : 'كل البيانات محفوظة على هذا الجهاز فقط · بلا حسابات وبلا اشتراكات';
function P() { return DB.profiles.find(p => p.id === DB.current) || null; }
function newProfile(name, avatar, goal) {
  return { id: 'p' + Date.now().toString(36) + rnd(1e4), name, avatar, goal, lang: 'en', xp: 0, streak: 0, lastDay: null, xpLog: {},
    hearts: HEART_MAX, heartsTs: Date.now(), placement: null, startIndex: 0, done: {}, convos: {}, srs: {}, badges: [],
    stats: { lessons: 0, perfect: 0, reviews: 0, talks: 0 }, settings: { unlimited: false, rate: 0.9, mic: true, sfx: true, theme: 'auto' }, created: Date.now() };
}
function fixProfile(p) { // ترقية آمنة لملفات قديمة
  const base = newProfile(p.name || 'متعلّم', p.avatar || '🦊', p.goal || 30);
  for (const k in base) if (p[k] === undefined) p[k] = base[k];
  for (const k in base.settings) if (p.settings[k] === undefined) p.settings[k] = base.settings[k];
  for (const k in base.stats) if (p.stats[k] === undefined) p.stats[k] = base.stats[k];
  return p;
}
DB.profiles.forEach(fixProfile);

/* ---------------- منطق التقدّم ---------------- */
function streakNow(p) { if (!p.lastDay) return 0; const t = today(); return (p.lastDay === t || p.lastDay === addDays(t, -1)) ? p.streak : 0; }
function todayXP(p) { return p.xpLog[today()] || 0; }
function addXP(p, n) {
  p.xp += n; const t = today(); p.xpLog[t] = (p.xpLog[t] || 0) + n;
  if (p.lastDay !== t) { p.streak = p.lastDay === addDays(t, -1) ? p.streak + 1 : 1; p.lastDay = t; }
}
function refreshHearts(p) {
  if (p.hearts >= HEART_MAX) { p.hearts = HEART_MAX; p.heartsTs = Date.now(); return; }
  const n = Math.floor((Date.now() - p.heartsTs) / HEART_MS);
  if (n > 0) { p.hearts = Math.min(HEART_MAX, p.hearts + n); p.heartsTs += n * HEART_MS; if (p.hearts >= HEART_MAX) p.heartsTs = Date.now(); }
}
function loseHeart(p) { if (p.hearts >= HEART_MAX) p.heartsTs = Date.now(); p.hearts = Math.max(0, p.hearts - 1); }
function minsToHeart(p) { return Math.max(1, Math.ceil((HEART_MS - (Date.now() - p.heartsTs)) / 60000)); }
const isDone = (p, i) => !!p.done[LESSONS[i].id];
const isUnlocked = (p, i) => i <= p.startIndex || isDone(p, i - 1);
function currentIndex(p) { for (let i = 0; i < LESSONS.length; i++) { if (i < p.startIndex) continue; if (!isDone(p, i)) return i; } return -1; }
function nodeState(p, i, cur) { if (isDone(p, i)) return 'done'; if (i < p.startIndex) return 'skip'; if (i === cur) return 'cur'; return isUnlocked(p, i) ? 'open' : 'lock'; }
function levelLabel(p) { if (!p.placement) { const cur = currentIndex(p); const l = LESSONS[cur < 0 ? LESSONS.length - 1 : cur]; return C.units[l.ui].lvl; } return p.placement.level; }

/* SRS — صناديق لايتنر */
function srsAdd(p, key) { if (!p.srs[key]) p.srs[key] = { box: 1, due: addDays(today(), 1) }; }
function srsHit(p, key, ok, mode) {
  const it = p.srs[key]; if (!it) return;
  if (ok) { if (mode === 'review') { it.box = Math.min(5, it.box + 1); it.due = addDays(today(), INTERVALS[it.box]); } }
  else { it.box = 1; it.due = today(); }
}

/* الشارات */
const BADGES = [
  { id: 'first', i: '🌱', t: 'الخطوة الأولى', d: 'أكمل أول درس', c: p => p.stats.lessons >= 1 },
  { id: 'place', i: '🎯', t: 'عرفت مستواك', d: 'أنهِ اختبار المستوى', c: p => !!p.placement },
  { id: 's3', i: '🔥', t: 'ثلاثة أيام', d: 'سلسلة 3 أيام', c: p => p.streak >= 3 },
  { id: 's7', i: '⚡', t: 'أسبوع كامل', d: 'سلسلة 7 أيام', c: p => p.streak >= 7 },
  { id: 's30', i: '🏆', t: 'شهر التزام', d: 'سلسلة 30 يوماً', c: p => p.streak >= 30 },
  { id: 'x100', i: '⭐', t: '100 نقطة', d: 'اجمع 100 XP', c: p => p.xp >= 100 },
  { id: 'x500', i: '🌟', t: '500 نقطة', d: 'اجمع 500 XP', c: p => p.xp >= 500 },
  { id: 'x2000', i: '💎', t: '2000 نقطة', d: 'اجمع 2000 XP', c: p => p.xp >= 2000 },
  { id: 'perfect', i: '🎖️', t: 'بلا أخطاء', d: 'درس بدقة 100%', c: p => p.stats.perfect >= 1 },
  { id: 'unit', i: '📘', t: 'أنهيت وحدة', d: 'أكمل وحدة كاملة', c: p => C.units.some((u, ui) => LESSONS.filter(l => l.ui === ui).every(l => p.done[l.id])) },
  { id: 'talk', i: '💬', t: 'أول محادثة', d: 'أكمل محادثة', c: p => p.stats.talks >= 1 },
  { id: 'talkall', i: '🎙️', t: 'متحدث واثق', d: 'كل المحادثات', c: p => C.convos.every(c => p.convos[c.id]) },
  { id: 'rev5', i: '🧠', t: 'ذاكرة قوية', d: '5 جلسات مراجعة', c: p => p.stats.reviews >= 5 },
  { id: 'w50', i: '📚', t: '50 كلمة', d: 'تعلّم 50 كلمة', c: p => Object.keys(p.srs).length >= 50 },
  { id: 'all', i: '👑', t: 'أنهيت المنهج', d: 'كل الدروس', c: p => LESSONS.every(l => p.done[l.id]) }
];
function checkBadges(p) { const nw = BADGES.filter(b => !p.badges.includes(b.id) && b.c(p)); nw.forEach(b => p.badges.push(b.id)); return nw; }

/* ---------------- الصوت ---------------- */
const synth = window.speechSynthesis || null;
let voice = null;
function pickVoice() {
  if (!synth) return; const vs = synth.getVoices(); if (!vs.length) return;
  const enUS = vs.filter(v => /^en[-_]US/i.test(v.lang));
  voice = enUS.find(v => /Google|Samantha|Natural|Aria|Jenny|Ava|Allison/i.test(v.name)) || enUS[0] || vs.find(v => /^en/i.test(v.lang)) || null;
}
if (synth) { pickVoice(); synth.onvoiceschanged = pickVoice; }
function say(text, slow) {
  if (!synth || !text) return;
  try { synth.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = C.voice; if (voice) u.voice = voice;
    const p = P(); u.rate = slow ? 0.55 : (p ? p.settings.rate : 0.9); synth.speak(u); } catch (e) { }
}
const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
function micOK() { const p = P(); return !!SR && !IN_CLAUDE && (!p || p.settings.mic); }
function listen(cb) {
  if (!SR) return cb(null, 'unsupported');
  let done = false; const r = new SR(); r.lang = C.voice; r.interimResults = false; r.maxAlternatives = 4;
  r.onresult = e => { done = true; cb(Array.from(e.results[0]).map(a => a.transcript)); };
  r.onerror = e => { if (!done) { done = true; cb(null, e.error); } };
  r.onend = () => { if (!done) { done = true; cb(null, 'no-speech'); } };
  try { synth && synth.cancel(); r.start(); } catch (e) { done = true; cb(null, 'start'); }
  return r;
}
let AC = null;
function tone(seq) {
  const p = P(); if (p && !p.settings.sfx) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)(); let t = AC.currentTime;
    seq.forEach(([f, d]) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d + 0.03); t += d * 0.75; });
  } catch (e) { }
}
const SFX = { ok: () => tone([[660, .12], [990, .2]]), bad: () => tone([[196, .28]]), win: () => tone([[523, .12], [659, .12], [784, .12], [1046, .35]]), pair: () => tone([[880, .08]]) };

/* ---------------- مكونات واجهة ---------------- */
function toast(msg) { const t = $('#toast'); t.innerHTML = msg; t.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('on'), 2600); }
function sheet(html, bind) {
  const w = document.createElement('div'); w.className = 'sheet-wrap'; w.innerHTML = `<div class="sheet" role="dialog">${html}</div>`;
  const close = () => { w.classList.remove('on'); setTimeout(() => w.remove(), 200); };
  w.addEventListener('click', e => { if (e.target === w) close(); });
  document.body.appendChild(w); requestAnimationFrame(() => w.classList.add('on'));
  bind && bind($('.sheet', w), close); return close;
}
function confirmBox(msg, yes, yesTxt = 'نعم') {
  sheet(`<p class="cf">${msg}</p><button class="btn bad" data-y>${yesTxt}</button><button class="btn ghost" data-n>إلغاء</button>`, (s, close) => {
    $('[data-y]', s).onclick = () => { close(); yes(); }; $('[data-n]', s).onclick = close; });
}
function bindSay(root) { $$('[data-say]', root).forEach(b => b.onclick = e => { e.stopPropagation(); say(b.dataset.say, b.dataset.slow === '1'); }); }
const spkBtn = (t, cls = '') => `<button class="spk ${cls}" data-say="${esc(t)}" aria-label="استمع">🔊</button>`;
function applyTheme() { const p = P(); const th = p ? p.settings.theme : 'auto'; if (th === 'auto') { if (VIEWER_THEME) document.documentElement.dataset.theme = VIEWER_THEME; else delete document.documentElement.dataset.theme; } else document.documentElement.dataset.theme = th; }
let onKey = null;
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') { const c = $('#chk'); if (c && !c.disabled && document.activeElement !== c) { e.preventDefault(); c.click(); } return; }
  if (/^[1-9]$/.test(e.key) && document.activeElement && document.activeElement.tagName !== 'INPUT') {
    const o = $(`.opt[data-i="${+e.key - 1}"]`) || $(`.chip[data-i="${+e.key - 1}"]`); if (o) o.click();
  }
  onKey && onKey(e);
});
function leave() { SCREEN = 'busy'; onKey = null; try { synth && synth.cancel(); } catch (e) { } window.scrollTo(0, 0); }

/* ---------------- توليد التمارين ---------------- */
const okey = s => /[a-z]/i.test(s) ? norm(s) : String(s).trim();
function distract(correct, pool, n) { const c = okey(correct); const seen = new Set([c]); const out = [];
  for (const x of shuffle(pool)) { const k = okey(x); if (!seen.has(k)) { seen.add(k); out.push(x); if (out.length >= n) break; } } return out; }
function unitVocab(L) { return ALLV.filter(v => v.ui === L.ui).map(v => [v.en, v.ar]); }
function exMcArEn(v, L) {
  const pool = L ? L.vocab.map(x => x[0]).concat(unitVocab(L).map(x => x[0])) : ALLV.map(x => x.en);
  return { type: 'mc', key: v[0], q: 'اختر الترجمة الصحيحة', big: v[1], options: shuffle([v[0], ...distract(v[0], pool, 2)]), answer: v[0], optEn: true };
}
function exMcEnAr(v, L) {
  const pool = L ? L.vocab.map(x => x[1]).concat(unitVocab(L).map(x => x[1])) : ALLV.map(x => x.ar);
  return { type: 'mc', key: v[0], q: 'ما معنى هذه الكلمة؟', bigEn: v[0], options: shuffle([v[1], ...distract(v[1], pool, 2)]), answer: v[1] };
}
function exListenWord(v) {
  return { type: 'mc', key: v[0], q: 'استمع واختر ما سمعته', audio: v[0], options: shuffle([v[0], ...distract(v[0], ALLV.map(x => x.en), 3)]), answer: v[0], optEn: true, note: esc(v[1]) };
}
function exFill(b) {
  const m = b[0].match(/^(.*)\{(.+?)\}(.*)$/);
  return { type: 'fill', pre: m[1], post: m[3], options: shuffle(b[1]), answer: m[2], ar: b[2], why: b[3] || '', full: b[0].replace(/[{}]/g, ''), sayAfter: b[0].replace(/[{}]/g, '') };
}
function extraWords(words, n) { const low = words.map(w => w.toLowerCase()); return shuffle(ALLWORDS.filter(w => !low.includes(w.toLowerCase()) && w.length < 9)).slice(0, n); }
function exOrder(s) { const w = tok(s[0]); return { type: 'order', en: s[0], ar: s[1], tiles: shuffle(w.concat(extraWords(w, 2))), answer: w.join(' '), sayAfter: s[0] }; }
function exListen(s) { const w = tok(s[0]); return { type: 'order', listen: true, en: s[0], ar: s[1], tiles: shuffle(w.concat(extraWords(w, 1))), answer: w.join(' ') }; }
function exTrans(s, L) {
  const pool = L.sentences.map(x => x[1]).concat(LESSONS.filter(l => l.ui === L.ui).flatMap(l => l.sentences.map(x => x[1])));
  return { type: 'mc', q: 'ما ترجمة هذه الجملة؟', bigEn: s[0], options: shuffle([s[1], ...distract(s[1], pool, 2)]), answer: s[1] };
}
function exWrite(v) { return { type: 'write', key: v[0], ar: v[1], answer: v[0], sayAfter: v[0] }; }
function exSpeak(s) { return { type: 'speak', en: s[0], ar: s[1] }; }

function genLesson(L) {
  const V = shuffle(L.vocab), S = shuffle(L.sentences), B = shuffle(L.blanks);
  const rest = [
    exMcArEn(V[0], L), exMcArEn(V[1], L), exMcEnAr(V[2], L),
    ...B.map(exFill),
    exOrder(S[0]), exOrder(S[1]), exTrans(S[2], L), exListen(S[3]), exWrite(V[3])
  ];
  const out = [{ type: 'match', pairs: V.slice(0, 5) }, ...shuffle(rest)];
  if (micOK()) out.splice(out.length - 2, 0, exSpeak(S[4]));
  return out;
}

/* ---------------- مُشغّلات التمارين ---------------- */
const R = {};
R.mc = (ex, el, ready) => {
  let sel = -1;
  const top = ex.audio ? `<div class="audio-row">${spkBtn(ex.audio, 'xl')}<button class="spk slow" data-say="${esc(ex.audio)}" data-slow="1" aria-label="ببطء">🐢</button></div>`
    : ex.bigEn ? `<div class="big">${spkBtn(ex.bigEn)}${en(ex.bigEn)}</div>` : `<div class="big ar">${esc(ex.big)}</div>`;
  el.innerHTML = `<h2 class="q">${ex.q}</h2>${top}<div class="opts">${ex.options.map((o, i) => `<button class="opt" data-i="${i}"><span class="k">${i + 1}</span>${ex.optEn ? en(o) : esc(o)}</button>`).join('')}</div>`;
  bindSay(el);
  $$('.opt', el).forEach(b => b.onclick = () => { sel = +b.dataset.i; $$('.opt', el).forEach(x => x.classList.toggle('sel', x === b)); if (ex.optEn && !ex.audio) say(ex.options[sel]); ready(true); });
  setTimeout(() => say(ex.audio || ex.bigEn), 280);
  return { check() {
    const ok = ex.options[sel] === ex.answer; el.classList.add('locked');
    $$('.opt', el).forEach((b, i) => { if (ex.options[i] === ex.answer) b.classList.add('right'); else if (i === sel) b.classList.add('wrong'); b.classList.remove('sel'); });
    if (ex.optEn) ex.sayAfter = ex.answer;
    return { ok, correct: ex.optEn ? en(ex.answer) : esc(ex.answer), note: ex.note || '' };
  } };
};
R.fill = (ex, el, ready) => {
  let sel = -1;
  el.innerHTML = `<h2 class="q">أكمل الفراغ</h2><div class="fill-s" dir="ltr">${esc(ex.pre)}<span class="slot">&nbsp;</span>${esc(ex.post)}</div><div class="fill-ar">${esc(ex.ar)}</div><div class="chips" dir="ltr">${ex.options.map((o, i) => `<button class="chip" data-i="${i}">${esc(o)}</button>`).join('')}</div>`;
  $$('.chip', el).forEach(b => b.onclick = () => { sel = +b.dataset.i; $$('.chip', el).forEach(x => x.classList.toggle('sel', x === b)); $('.slot', el).textContent = ex.options[sel]; ready(true); });
  return { check() { el.classList.add('locked'); const ok = ex.options[sel] === ex.answer; return { ok, correct: en(ex.full), note: ex.why ? '💡 ' + esc(ex.why) : '' }; } };
};
R.order = (ex, el, ready) => {
  const chosen = [];
  const head = ex.listen
    ? `<h2 class="q">استمع ورتّب ما تسمعه</h2><div class="audio-row">${spkBtn(ex.en, 'xl')}<button class="spk slow" data-say="${esc(ex.en)}" data-slow="1" aria-label="ببطء">🐢</button></div>`
    : `<h2 class="q">ترجم إلى الإنجليزية</h2><div class="big ar">${esc(ex.ar)}</div>`;
  el.innerHTML = `${head}<div class="ans"></div><div class="bank">${ex.tiles.map((t, i) => `<button class="tile" data-i="${i}">${esc(t)}</button>`).join('')}</div>`;
  bindSay(el);
  const ans = $('.ans', el);
  function draw() {
    ans.innerHTML = chosen.map(i => `<button class="tile" data-i="${i}">${esc(ex.tiles[i])}</button>`).join('');
    $$('.bank .tile', el).forEach(b => b.classList.toggle('used', chosen.includes(+b.dataset.i)));
    $$('.tile', ans).forEach(b => b.onclick = () => { chosen.splice(chosen.indexOf(+b.dataset.i), 1); draw(); });
    ready(chosen.length > 0);
  }
  $$('.bank .tile', el).forEach(b => b.onclick = () => { const i = +b.dataset.i; if (chosen.includes(i)) return; chosen.push(i); if (!ex.listen) say(ex.tiles[i]); draw(); });
  if (ex.listen) setTimeout(() => say(ex.en), 300);
  draw();
  return { check() {
    el.classList.add('locked'); const got = chosen.map(i => ex.tiles[i]).join(' ');
    return { ok: norm(got) === norm(ex.answer), correct: en(ex.en), note: esc(ex.ar) };
  } };
};
R.write = (ex, el, ready) => {
  el.innerHTML = `<h2 class="q">اكتب الكلمة بالإنجليزية</h2><div class="big ar">${esc(ex.ar)}</div><input class="write-inp" dir="ltr" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="type here…" aria-label="الإجابة">`;
  const inp = $('input', el); inp.oninput = () => ready(inp.value.trim().length > 0); setTimeout(() => inp.focus(), 150);
  return { check() {
    inp.disabled = true; const a = norm(inp.value), b = norm(ex.answer);
    if (a === b) return { ok: true, correct: en(ex.answer) };
    if (b.length >= 4 && lev(a, b) <= 1) return { ok: true, correct: en(ex.answer), note: `انتبه للإملاء الصحيح: ${en(ex.answer)}` };
    return { ok: false, correct: en(ex.answer) };
  } };
};
R.speak = (ex, el, ready, api) => {
  let score = null, heard = '';
  el.innerHTML = `<h2 class="q">انطق هذه الجملة</h2><div class="big">${spkBtn(ex.en)}${en(ex.en)}</div><div class="fill-ar">${esc(ex.ar)}</div>
    <button class="mic" aria-label="تحدّث">🎤</button><div class="heard">اضغط الميكروفون ثم تحدّث بوضوح</div>`;
  bindSay(el);
  const mic = $('.mic', el), hd = $('.heard', el);
  mic.onclick = () => {
    if (mic.classList.contains('rec')) return; mic.classList.add('rec'); hd.textContent = 'أستمع إليك…';
    listen((alts, err) => {
      mic.classList.remove('rec');
      if (!alts) { hd.textContent = err === 'not-allowed' ? 'اسمح للمتصفح باستخدام الميكروفون، أو تخطَّ هذا التمرين.' : 'لم أسمع شيئاً، حاول مجدداً.'; return; }
      let best = 0, bt = alts[0]; alts.forEach(a => { const s = wordSim(a, ex.en); if (s > best) { best = s; bt = a; } });
      score = best; heard = bt; hd.innerHTML = `سمعتُ: ${en(bt)}`; ready(true);
    });
  };
  api.showSkip('لا أستطيع التحدث الآن', api.skipNeutral);
  return { check() {
    const ok = score >= 0.7;
    return { ok, soft: !ok, correct: en(ex.en), note: ok ? `نطق ممتاز! سمعتُ: ${en(heard)}` : `سمعتُ: ${en(heard)} — استمع للنطق وحاول مرة أخرى لاحقاً.` };
  } };
};
R.match = (ex, el, ready, api) => {
  const left = shuffle(ex.pairs.map((p, i) => ({ i, t: p[1] })));   // العربية (يمين)
  const right = shuffle(ex.pairs.map((p, i) => ({ i, t: p[0] })));  // الإنجليزية
  el.innerHTML = `<h2 class="q">طابِق الأزواج</h2><div class="match"><div class="mcol">${left.map(x => `<button class="mbtn" data-s="a" data-i="${x.i}">${esc(x.t)}</button>`).join('')}</div><div class="mcol">${right.map(x => `<button class="mbtn" data-s="e" data-i="${x.i}">${en(x.t)}</button>`).join('')}</div></div>`;
  let sel = null, got = 0, miss = 0;
  $$('.mbtn', el).forEach(b => b.onclick = () => {
    if (b.classList.contains('ok')) return;
    if (b.dataset.s === 'e') say(ex.pairs[+b.dataset.i][0]);
    if (!sel || sel.dataset.s === b.dataset.s) { $$('.mbtn.sel', el).forEach(x => x.classList.remove('sel')); sel = b; b.classList.add('sel'); return; }
    const a = sel; sel = null; a.classList.remove('sel');
    if (a.dataset.i === b.dataset.i) { a.classList.add('ok'); b.classList.add('ok'); SFX.pair(); got++; if (got === ex.pairs.length) setTimeout(() => api.autoOk(miss === 0), 350); }
    else { miss++; [a, b].forEach(x => { x.classList.add('bad'); setTimeout(() => x.classList.remove('bad'), 450); }); SFX.bad(); }
  });
  return { check() { return null; } };
};

/* ---------------- مشغّل الجلسات ---------------- */
const PRAISE = ['أحسنت! 🎉', 'ممتاز!', 'رائع! 👏', 'إجابة صحيحة!', 'عمل متقن!', 'استمر هكذا! 💪', 'مذهل! ✨'];
function runSession(opt) {
  leave();
  const p = P(); const total = opt.exercises.length; const hearted = opt.mode === 'lesson' && !p.settings.unlimited;
  const st = { queue: opt.exercises.slice(), done: 0, firstOk: 0, seen: new Set(), mistakes: 0, t0: Date.now(), cur: null, phase: 'answer', api: null };
  app.innerHTML = `<div class="ses">
    <div class="ses-top"><button class="icon-btn" data-x aria-label="خروج">✕</button><div class="pbar"><i></i></div>${hearted ? `<div class="hc">❤️ <span>${p.hearts}</span></div>` : opt.mode === 'review' ? '<div class="hc" style="color:var(--t-q)">🧠</div>' : ''}</div>
    <div class="ses-body"></div>
    <div class="ses-foot"><div class="fb"></div><div class="foot-row"><button class="btn ghost" data-skip hidden></button><button class="btn" id="chk" disabled>تحقّق</button></div></div></div>`;
  const body = $('.ses-body'), foot = $('.ses-foot'), fb = $('.fb'), chk = $('#chk'), skip = $('[data-skip]');
  $('[data-x]').onclick = () => confirmBox('هل تريد إنهاء الجلسة؟ لن يُحفظ تقدّمك فيها.', () => { leave(); go('home'); }, 'إنهاء');
  const upd = () => { $('.pbar i').style.width = (st.done / total * 100) + '%'; const h = $('.hc span'); if (h) h.textContent = p.hearts; };
  function next() {
    if (!st.queue.length) return finish();
    st.cur = st.queue.shift(); st.phase = 'answer'; foot.className = 'ses-foot'; fb.innerHTML = ''; chk.textContent = 'تحقّق'; chk.disabled = true; skip.hidden = true;
    body.innerHTML = ''; body.className = 'ses-body'; void body.offsetWidth; window.scrollTo(0, 0);
    const api = { autoOk: perfect => resolve({ ok: true, imperfect: !perfect }), showSkip: (t, fn) => { skip.hidden = false; skip.textContent = t; skip.onclick = fn; }, skipNeutral: () => { st.done++; upd(); next(); } };
    st.api = R[st.cur.type](st.cur, body, r => { if (st.phase === 'answer') chk.disabled = !r; }, api);
    if (st.cur.type === 'match') { chk.disabled = true; chk.textContent = 'طابِق كل الأزواج'; }
    window.__lisan.cur = st.cur;
  }
  function resolve(res) {
    st.phase = 'fb'; skip.hidden = true; const ex = st.cur; const first = !st.seen.has(ex); st.seen.add(ex);
    if (res.ok) {
      st.done++; if (first && !res.imperfect) st.firstOk++; SFX.ok(); foot.className = 'ses-foot ok';
      fb.innerHTML = `<div class="fb-t">${pick(PRAISE)}</div>${res.note ? `<div class="fb-n">${res.note}</div>` : ''}`;
      if (ex.key) srsHit(p, ex.key, true, opt.mode); if (ex.sayAfter) setTimeout(() => say(ex.sayAfter), 150);
    } else if (res.soft) {
      st.done++; foot.className = 'ses-foot bad'; fb.innerHTML = `<div class="fb-t">قريب! تابع التدريب</div><div class="fb-a">${res.correct}</div><div class="fb-n">${res.note}</div>`; SFX.bad();
    } else {
      st.mistakes++; SFX.bad(); foot.className = 'ses-foot bad';
      fb.innerHTML = `<div class="fb-t">الإجابة الصحيحة:</div><div class="fb-a">${res.correct}</div>${res.note ? `<div class="fb-n">${res.note}</div>` : ''}`;
      st.queue.push(ex); if (ex.key) srsHit(p, ex.key, false, opt.mode); if (hearted) loseHeart(p);
    }
    upd(); save(); chk.disabled = false; chk.textContent = 'متابعة'; chk.focus({ preventScroll: true });
  }
  chk.onclick = () => {
    if (st.phase === 'answer') { const r = st.api.check(); if (r) resolve(r); }
    else { if (hearted && p.hearts <= 0) return outOfHearts(); next(); }
  };
  function finish() { const secs = Math.round((Date.now() - st.t0) / 1000); opt.onDone({ acc: Math.round(st.firstOk / total * 100), secs, mistakes: st.mistakes, total }); }
  upd(); next();
}
function outOfHearts() {
  leave(); const p = P(); save();
  app.innerHTML = `<div class="result"><div class="big-ic">💔</div><h1 style="color:var(--bad)">نفدت القلوب</h1>
    <p class="muted">يتجدد قلب كل 30 دقيقة (القادم بعد ${minsToHeart(p)} دقيقة).<br>أو راجع كلماتك الآن لتكسب قلباً فوراً.</p><div class="spacer"></div>
    <button class="btn acc" data-r>🧠 راجع واكسب قلباً</button><button class="btn ghost" data-h>العودة للرئيسية</button></div>`;
  $('[data-r]').onclick = startReview; $('[data-h]').onclick = () => go('home');
}

/* ---------------- شاشة النتيجة ---------------- */
function resultScreen(o) {
  leave(); SFX.win(); const p = P(); const g = Math.min(100, Math.round(todayXP(p) / p.goal * 100));
  const goalHit = o.goalBefore < p.goal && todayXP(p) >= p.goal;
  app.innerHTML = `<div class="result"><div class="big-ic">${o.icon}</div><h1>${o.title}</h1><p class="muted">${o.sub || ''}</p>
    <div class="res-tiles">
      <div class="rt" style="--c:var(--acc)"><small>نقاط XP</small><b>+${o.xp}</b></div>
      <div class="rt" style="--c:var(--pri)"><small>الدقة</small><b>${o.acc}%</b></div>
      <div class="rt" style="--c:var(--t-s)"><small>الوقت</small><b>${Math.floor(o.secs / 60)}:${String(o.secs % 60).padStart(2, '0')}</b></div>
    </div>
    ${goalHit ? `<div class="card" style="margin-bottom:12px"><b>🎯 حققت هدفك اليومي!</b><div class="muted">سلسلتك الآن ${streakNow(p)} 🔥</div></div>` : `<div class="muted" style="margin-bottom:12px">الهدف اليومي: ${todayXP(p)} / ${p.goal} XP (${g}%) · السلسلة ${streakNow(p)} 🔥</div>`}
    ${o.badges && o.badges.length ? `<div class="new-badges">${o.badges.map(b => `<div class="nb">${b.i} ${b.t}</div>`).join('')}</div>` : ''}
    <div class="spacer"></div><button class="btn" data-n>متابعة</button></div>`;
  $('[data-n]').onclick = o.next || (() => go('home'));
}

/* ---------------- القواعد التفاعلية ---------------- */
function markup(s) {
  let out = '', last = 0; const re = /\[([^|\]]+)\|(\w)\]/g; let m;
  while ((m = re.exec(s))) { out += esc(s.slice(last, m.index)) + `<span class="tkw t-${m[2]}" data-tag="${m[2]}" data-w="${esc(m[1])}">${esc(m[1])}</span>`; last = re.lastIndex; }
  return out + esc(s.slice(last));
}
const plain = s => s.replace(/\[([^|\]]+)\|\w\]/g, '$1');
function gCardHTML(c) {
  const tags = new Set(); (c.ex || []).forEach(e => { let m; const re = /\|(\w)\]/g; while ((m = re.exec(e[0]))) tags.add(m[1]); }); (c.f || []).forEach(f => tags.add(f[1]));
  return `<div class="gcard"><h2>${c.t}</h2>
    ${tags.size ? `<div class="legend">${[...tags].map(t => `<span class="t-${t}">${TAGS[t]}</span>`).join('')}</div>` : ''}
    <div class="gbody">${c.b}</div>
    ${c.f ? `<div class="formula" dir="ltr">${c.f.map(([x, t]) => `<span class="tk t-${t}">${x}</span>`).join('<b>+</b>')}</div>` : ''}
    ${c.ex ? `<div class="exs">${c.ex.map(e => `<div class="exl">${spkBtn(plain(e[0]), 'sm')}<div><div class="en-l">${markup(e[0])}</div><div class="ar-l">${esc(e[1])}</div></div></div>`).join('')}</div>` : ''}
    ${c.n ? `<div class="gnote">${c.n}</div>` : ''}
    ${c.q ? `<div class="qc"><div class="qc-h">✋ جرّب بنفسك</div><div class="qc-s">${esc(c.q.s).replace('___', '<span class="slot">&nbsp;</span>')}</div><div class="chips">${shuffle(c.q.o).map(o => `<button class="chip" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div><div class="qfb"></div></div>` : ''}
  </div>`;
}
function bindGCard(root, c) {
  bindSay(root);
  $$('.tkw', root).forEach(t => t.onclick = e => {
    say(t.dataset.w); const r = t.getBoundingClientRect(); const tip = document.createElement('div'); tip.className = 'tipbox'; tip.textContent = TAGS[t.dataset.tag];
    tip.style.left = (r.left + r.width / 2) + 'px'; tip.style.top = (r.top - 4) + 'px'; document.body.appendChild(tip); setTimeout(() => tip.remove(), 1400);
  });
  if (c.q) {
    const fbx = $('.qfb', root);
    $$('.qc .chip', root).forEach(b => b.onclick = () => {
      if (b.dataset.o === c.q.a) { $$('.qc .chip', root).forEach(x => x.style.pointerEvents = 'none'); b.classList.add('right'); $('.qc .slot', root).textContent = c.q.a; fbx.innerHTML = `✅ ${esc(c.q.w || 'إجابة صحيحة!')}`; fbx.style.color = 'var(--pri)'; SFX.ok(); say(c.q.s.replace('___', c.q.a)); }
      else { b.classList.add('wrong'); setTimeout(() => b.classList.remove('wrong'), 500); fbx.textContent = '❌ ليست هذه، حاول مرة أخرى.'; fbx.style.color = 'var(--bad)'; SFX.bad(); }
    });
  }
}
function showGrammar(L, onEnd, readOnly) {
  leave(); let i = 0; const cards = L.g;
  function draw() {
    const c = cards[i]; const last = i === cards.length - 1;
    app.innerHTML = `<div class="ses"><div class="ses-top"><button class="icon-btn" data-x aria-label="خروج">✕</button><div style="flex:1;font-weight:700">📖 ${esc(L.ta)}</div>${!readOnly ? '<button class="btn ghost sm" data-skip>تخطَّ الشرح</button>' : ''}</div>
      <div class="g-wrap">${gCardHTML(c)}<div class="dots">${cards.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div><p class="g-tip">💡 اضغط على الكلمات الملوّنة لتعرف دورها، وعلى 🔊 للاستماع.</p></div>
      <div class="ses-foot"><div class="foot-row">${i > 0 ? '<button class="btn ghost" data-prev>السابق</button>' : ''}<button class="btn" data-next>${last ? (readOnly ? 'تم ✓' : 'ابدأ التمارين ←') : 'التالي'}</button></div></div></div>`;
    bindGCard(app, c);
    $('[data-x]').onclick = () => go('home');
    const sk = $('[data-skip]'); if (sk) sk.onclick = onEnd;
    const pv = $('[data-prev]'); if (pv) pv.onclick = () => { i--; draw(); };
    $('[data-next]').onclick = () => { if (last) onEnd(); else { i++; draw(); window.scrollTo(0, 0); } };
    onKey = e => { if (e.key === 'Enter' && document.activeElement.tagName !== 'BUTTON') $('[data-next]').click(); };
  }
  draw();
}

/* ---------------- الدروس ---------------- */
function startLesson(L) {
  const p = P(); refreshHearts(p);
  if (!p.settings.unlimited && p.hearts <= 0) return outOfHearts();
  const run = () => runSession({ mode: 'lesson', exercises: genLesson(L), onDone: s => lessonDone(L, s) });
  showGrammar(L, run, false);
}
function lessonDone(L, s) {
  const p = P(); const first = !p.done[L.id]; const before = todayXP(p);
  p.done[L.id] = (p.done[L.id] || 0) + 1; p.stats.lessons++; if (s.acc === 100) p.stats.perfect++;
  const xp = 10 + (s.acc === 100 ? 5 : 0) + (first ? 5 : 0); addXP(p, xp); refreshHearts(p); if (s.acc >= 90 && p.hearts < HEART_MAX) p.hearts++; L.vocab.forEach(v => srsAdd(p, v[0]));
  const badges = checkBadges(p); save();
  const unitDone = first && LESSONS.filter(l => l.ui === L.ui).every(l => p.done[l.id]);
  resultScreen({ icon: unitDone ? '🏅' : s.acc === 100 ? '🌟' : '🎉', title: unitDone ? 'أنهيت الوحدة كاملة!' : 'أتممت الدرس!', sub: `${esc(L.ta)} · ${L.vocab.length} كلمات جديدة أضيفت للمراجعة`, xp, acc: s.acc, secs: s.secs, badges, goalBefore: before });
}

/* ---------------- المراجعة الذكية ---------------- */
function reviewEx(k, p) {
  const v = VMAP[k] ? [k, VMAP[k].ar] : [k, k]; const box = p.srs[k].box;
  const types = box >= 3 ? ['write', 'listen', 'enar', 'aren'] : ['aren', 'enar', 'listen', 'aren'];
  const t = pick(types);
  return t === 'write' ? exWrite(v) : t === 'listen' ? exListenWord(v) : t === 'enar' ? exMcEnAr(v) : exMcArEn(v);
}
function startReview() {
  const p = P(); const keys = Object.keys(p.srs);
  if (!keys.length) return toast('أكمل درساً أولاً لتظهر كلماتك هنا');
  const t = today(); let due = shuffle(keys.filter(k => p.srs[k].due <= t)).slice(0, 12);
  if (due.length < 6) due = due.concat(shuffle(keys.filter(k => !due.includes(k))).sort((a, b) => p.srs[a].box - p.srs[b].box).slice(0, 6 - due.length));
  runSession({ mode: 'review', exercises: shuffle(due.map(k => reviewEx(k, p))), onDone: s => {
    const before = todayXP(p); const xp = 5 + Math.round(due.length * s.acc / 100); addXP(p, xp); p.stats.reviews++;
    refreshHearts(p); const gained = !p.settings.unlimited && p.hearts < HEART_MAX; if (gained) p.hearts++;
    const badges = checkBadges(p); save();
    resultScreen({ icon: '🧠', title: 'أنهيت المراجعة!', sub: gained ? 'كسبت قلباً ❤️ +1' : 'ذاكرتك تتقوّى يوماً بعد يوم', xp, acc: s.acc, secs: s.secs, badges, goalBefore: before });
  } });
}

/* ---------------- اختبار تحديد المستوى ---------------- */
const LV = ['A1', 'A2', 'B1', 'B2'];
function startPlacement() {
  leave();
  app.innerHTML = `<div class="result"><div class="big-ic">🎯</div><h1 style="color:var(--pri)">اختبار تحديد المستوى</h1>
    <p class="muted">أسئلة قصيرة تتدرج من السهل إلى الصعب، وتتوقف تلقائياً عند مستواك.<br>المدة: من 3 إلى 8 دقائق. إن لم تعرف الإجابة فاضغط <b>«لا أعرف»</b> ولا تخمّن، لتكون النتيجة دقيقة.</p>
    <div class="place-bars">${LV.map(l => `<div class="pb-row"><b>${l}</b><span class="muted">${{ A1: 'مبتدئ', A2: 'أساسي', B1: 'متوسط', B2: 'فوق المتوسط' }[l]}</span></div>`).join('')}</div>
    <div class="spacer"></div><button class="btn" data-s>ابدأ الاختبار</button><button class="btn ghost" data-b>رجوع</button></div>`;
  $('[data-s]').onclick = runPlacement; $('[data-b]').onclick = () => go('home');
}
function runPlacement() {
  leave(); const sets = LV.map(l => shuffle(C.placement[l])); const score = [0, 0, 0, 0], asked = [0, 0, 0, 0]; let li = 0, qi = 0; const N = 6, PASS = 5; const maxQ = N * 4; let n = 0;
  function draw() {
    const q = sets[li][qi]; const opts = shuffle(q[1]);
    app.innerHTML = `<div class="ses"><div class="ses-top"><button class="icon-btn" data-x aria-label="خروج">✕</button><div class="pbar"><i style="width:${n / maxQ * 100}%"></i></div><span class="pill">${LV[li]}</span></div>
      <div class="ses-body"><h2 class="q">اختر الكلمة المناسبة</h2><div class="fill-s" dir="ltr">${esc(q[0]).replace('___', '<span class="slot">&nbsp;</span>')}</div><div style="height:18px"></div>
      <div class="opts">${opts.map((o, i) => `<button class="opt" data-i="${i}" dir="ltr"><span class="k">${i + 1}</span>${esc(o)}</button>`).join('')}</div></div>
      <div class="ses-foot"><button class="btn ghost" data-dk>لا أعرف</button></div></div>`;
    $('[data-x]').onclick = () => confirmBox('إنهاء الاختبار؟', () => go('home'), 'إنهاء');
    const answer = ok => { asked[li]++; if (ok) score[li]++; n++; qi++;
      if (qi >= N) { if (score[li] >= PASS && li < 3) { li++; qi = 0; } else return finishPlacement(score, asked); }
      else if (asked[li] - score[li] > N - PASS) { return finishPlacement(score, asked); } // استحال النجاح في هذا المستوى
      draw(); };
    $$('.opt').forEach(b => b.onclick = () => { $$('.opt').forEach(x => x.style.pointerEvents = 'none'); b.classList.add('sel'); setTimeout(() => answer(opts[+b.dataset.i] === q[2]), 260); });
    $('[data-dk]').onclick = () => answer(false);
  }
  draw();
}
function finishPlacement(score, asked) {
  const p = P(); let passed = 0; for (let i = 0; i < 4; i++) { if (asked[i] && score[i] >= 5) passed++; else break; }
  const level = ['A1', 'A2', 'B1', 'B1+', 'B2+'][passed];
  const start = passed === 0 ? 0 : passed === 1 ? UNIT_START[3] : passed === 2 ? UNIT_START[6] : LESSONS.length;
  p.placement = { level, date: today(), score, asked }; if (start > p.startIndex) p.startIndex = start;
  const badges = checkBadges(p); save();
  const desc = { A1: 'مبتدئ: سنبني الأساس خطوة بخطوة من البداية.', A2: 'أساسي: تجاوزت الأساسيات، وستبدأ من الوحدة 4.', B1: 'متوسط: ممتاز! ستبدأ من وحدة المستوى المتوسط.', 'B1+': 'فوق المتوسط: فُتحت لك كل الوحدات المتاحة. ابدأ من أي درس.', 'B2+': 'متقدم: فُتح لك المنهج كاملاً. والمستويات الأعلى قادمة.' }[level];
  leave(); SFX.win();
  app.innerHTML = `<div class="result"><div class="big-ic">🎯</div><p class="muted" style="margin:10px 0 0">مستواك</p><div class="lvl-big">${level}</div><p>${desc}</p>
    <div class="place-bars">${LV.map((l, i) => `<div class="pb-row"><b>${l}</b><div class="pbar"><i style="width:${asked[i] ? score[i] / asked[i] * 100 : 0}%"></i></div><small>${asked[i] ? score[i] + '/' + asked[i] : '—'}</small></div>`).join('')}</div>
    ${badges.length ? `<div class="new-badges">${badges.map(b => `<div class="nb">${b.i} ${b.t}</div>`).join('')}</div>` : ''}
    <div class="spacer"></div><button class="btn" data-n>ابدأ التعلّم</button></div>`;
  $('[data-n]').onclick = () => go('home');
}

/* ---------------- المحادثات ---------------- */
function startConvo(c) {
  leave(); const p = P(); let ti = 0, mistakes = 0; const t0 = Date.now();
  app.innerHTML = `<div class="ses convo"><div class="ses-top"><button class="icon-btn" data-x aria-label="خروج">✕</button><div class="ct"><b>${c.icon} ${esc(c.ta)}</b><small>${esc(c.npcName)} · ${esc(c.place)}</small></div><div class="pbar"><i></i></div></div>
    <div class="chat"></div><div class="reply"></div></div>`;
  const chat = $('.chat'), rp = $('.reply');
  $('[data-x]').onclick = () => confirmBox('إنهاء المحادثة؟', () => go('home'), 'إنهاء');
  const scroll = () => setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 50);
  function bubble(who, text, tr) {
    const d = document.createElement('div'); d.className = 'msg ' + who;
    d.innerHTML = who === 'npc'
      ? `<div class="av">${c.npcAv}</div><div class="bub"><span class="en">${esc(text)}</span><div class="tr">${esc(tr)}</div><div class="bub-tools"><button data-say="${esc(text)}">🔊 استمع</button><button data-say="${esc(text)}" data-slow="1">🐢 ببطء</button><button data-tr>ترجمة</button></div></div>`
      : `<div class="av">${p.avatar}</div><div class="bub"><span class="en">${esc(text)}</span></div>`;
    chat.appendChild(d); bindSay(d); const trb = $('[data-tr]', d); if (trb) trb.onclick = () => $('.bub', d).classList.toggle('show-tr'); scroll();
  }
  function npcTurn() { const t = c.turns[ti]; $('.pbar i').style.width = (ti / c.turns.length * 100) + '%'; bubble('npc', t.npc, t.ar); say(t.npc); setTimeout(() => options(t), 450); }
  function options(t) {
    const opts = shuffle(t.opts);
    rp.innerHTML = `<div class="reply-h"><span>اختر ردّك${micOK() ? ' أو قله بصوتك' : ''}</span>${micOK() ? '<button class="mic-sm" aria-label="تحدّث">🎤</button>' : ''}</div><div class="cfb" hidden></div>${opts.map((o, i) => `<button class="ropt" data-i="${i}">${esc(o[0])}</button>`).join('')}`;
    const cfb = $('.cfb', rp);
    const choose = (i, viaVoice) => {
      const o = opts[i]; const b = $(`.ropt[data-i="${i}"]`, rp);
      if (o[1]) {
        SFX.ok(); bubble('me', o[0]); if (!viaVoice) say(o[0]);
        rp.innerHTML = o[2] ? `<div class="cfb ok">✅ ${esc(o[2])}</div>` : `<div class="cfb ok">✅ ${pick(PRAISE)}</div>`;
        ti++; setTimeout(() => ti < c.turns.length ? npcTurn() : end(), o[2] ? 1700 : 1100);
      } else { mistakes++; SFX.bad(); b.classList.add('wrong'); cfb.hidden = false; cfb.className = 'cfb'; cfb.innerHTML = `❌ ${esc(o[2])}`; }
    };
    $$('.ropt', rp).forEach(b => b.onclick = () => choose(+b.dataset.i));
    const mic = $('.mic-sm', rp);
    if (mic) mic.onclick = () => {
      if (mic.classList.contains('rec')) return; mic.classList.add('rec');
      listen((alts, err) => {
        mic.classList.remove('rec');
        if (!alts) { cfb.hidden = false; cfb.className = 'cfb'; cfb.textContent = err === 'not-allowed' ? 'اسمح باستخدام الميكروفون من إعدادات المتصفح.' : 'لم أسمعك جيداً، حاول مجدداً.'; return; }
        let best = -1, bs = 0; opts.forEach((o, i) => alts.forEach(a => { const s = wordSim(a, o[0]); if (s > bs) { bs = s; best = i; } }));
        if (best >= 0 && bs >= 0.6) choose(best, true);
        else { cfb.hidden = false; cfb.className = 'cfb'; cfb.innerHTML = `سمعتُ: ${en(alts[0])} — حاول نطق أحد الردود.`; }
      });
    };
  }
  function end() {
    const before = todayXP(p); const xp = 10 + (mistakes === 0 ? 5 : 0); const first = !p.convos[c.id];
    p.convos[c.id] = true; p.stats.talks++; addXP(p, xp); const badges = checkBadges(p); save();
    const total = c.turns.length; const acc = Math.round(Math.max(0, total - mistakes) / total * 100);
    setTimeout(() => resultScreen({ icon: '💬', title: 'محادثة ناجحة!', sub: first ? `أتممت «${esc(c.ta)}» لأول مرة` : 'تدريب ممتاز على الحوار', xp, acc, secs: Math.round((Date.now() - t0) / 1000), badges, goalBefore: before, next: () => go('home', 'talk') }), 600);
  }
  npcTurn();
}

/* ---------------- الشاشات الرئيسية ---------------- */
const AVATARS = ['🦊', '🐼', '🦁', '🐯', '🐨', '🐸', '🐵', '🐬', '🦄', '🐢', '🐙', '🐝', '🦅', '🐪', '🐎', '🦒', '🐧', '🐳'];
const GOALS = [[15, 'خفيف', 'درس واحد تقريباً · 5 دقائق'], [30, 'منتظم', 'درسان · 10 دقائق'], [50, 'جاد', '3 دروس · 15 دقيقة'], [80, 'مكثّف', '5 دروس · 25 دقيقة']];

function scrProfiles() {
  leave(); SCREEN = 'profiles'; DB.current = null; saveLocal(); applyTheme();
  app.innerHTML = `<div class="prof-scr"><div class="logo"><img src="icon.svg" alt="" onerror="this.remove()">لِسان</div><p class="tagline">تعلّم الإنجليزية خطوة بخطوة، دقائق كل يوم.</p>
    <h2 style="margin-bottom:16px">من يتعلّم الآن؟</h2>
    <div class="prof-grid">${DB.profiles.map(p => `<button class="prof" data-id="${p.id}"><span class="av">${p.avatar}</span><b>${esc(p.name)}</b><small>${levelLabel(p)} · 🔥 ${streakNow(p)} · ⭐ ${p.xp}</small></button>`).join('')}
    <button class="prof add" data-add><span class="av">＋</span>إضافة فرد</button></div>
    <p class="muted" style="font-size:13px">${syncLine()}</p></div>`;
  $$('[data-id]').forEach(b => b.onclick = () => { DB.current = b.dataset.id; saveLocal(); go('home'); });
  $('[data-add]').onclick = scrNewProfile;
}
function scrNewProfile() {
  leave(); let name = '', av = AVATARS[rnd(AVATARS.length)], goal = 30, step = 0;
  function draw() {
    if (step === 0) {
      app.innerHTML = `<div class="form"><button class="icon-btn" data-b aria-label="رجوع">→</button><h2>ملف جديد</h2><p>لكل فرد في العائلة ملفه وتقدّمه الخاص.</p>
        <label class="field" for="nm">الاسم</label><input class="inp" id="nm" maxlength="20" placeholder="مثال: محمد" value="${esc(name)}">
        <label class="field">الصورة الرمزية</label><div class="av-grid">${AVATARS.map(a => `<button class="${a === av ? 'sel' : ''}" data-av="${a}">${a}</button>`).join('')}</div>
        <label class="field">الهدف اليومي</label><div class="goal-list">${GOALS.map(g => `<button class="goal ${g[0] === goal ? 'sel' : ''}" data-g="${g[0]}"><span>${g[1]} <small>· ${g[2]}</small></span><span class="en">${g[0]} XP</span></button>`).join('')}</div>
        <button class="btn" data-n ${name.trim() ? '' : 'disabled'}>التالي</button></div>`;
      const nm = $('#nm'); nm.oninput = () => { name = nm.value; $('[data-n]').disabled = !name.trim(); };
      $$('[data-av]').forEach(b => b.onclick = () => { av = b.dataset.av; $$('[data-av]').forEach(x => x.classList.toggle('sel', x === b)); });
      $$('[data-g]').forEach(b => b.onclick = () => { goal = +b.dataset.g; $$('[data-g]').forEach(x => x.classList.toggle('sel', x === b)); });
      $('[data-b]').onclick = () => go('profiles');
      $('[data-n]').onclick = () => { step = 1; draw(); };
      if (!name) setTimeout(() => nm.focus(), 100);
    } else {
      app.innerHTML = `<div class="form"><button class="icon-btn" data-b aria-label="رجوع">→</button><div style="font-size:56px;text-align:center">${av}</div><h2 style="text-align:center">أهلاً ${esc(name)}!</h2><p style="text-align:center">من أين تريد أن تبدأ؟</p>
        <button class="choice-big" data-z><span class="ic">🌱</span><span><b>من البداية</b><span>لا أعرف الإنجليزية، أو أريد تأسيساً قوياً.</span></span></button>
        <button class="choice-big" data-p><span class="ic">🎯</span><span><b>اختبار تحديد المستوى</b><span>أعرف بعض الإنجليزية، حدّد لي نقطة البداية.</span></span></button></div>`;
      $('[data-b]').onclick = () => { step = 0; draw(); };
      const create = () => { const p = newProfile(name.trim(), av, goal); DB.profiles.push(p); DB.current = p.id; save(); };
      $('[data-z]').onclick = () => { create(); go('home'); };
      $('[data-p]').onclick = () => { create(); startPlacement(); };
    }
  }
  draw();
}

let TAB = 'path';
function scrHome(tab) {
  leave(); SCREEN = 'home'; const p = P(); if (!p) return go('profiles'); if (tab) TAB = tab; refreshHearts(p); save(); applyTheme();
  const s = streakNow(p);
  app.innerHTML = `<div class="home"><div class="topbar">
      <button class="lvl-chip" data-sw aria-label="تبديل الملف">${p.avatar} <span class="en">${levelLabel(p)}</span></button>
      <button class="stat flame ${s ? '' : 'off'}" data-st>🔥<span class="n">${s}</span></button>
      <button class="stat gem" data-xp>⭐<span class="n">${p.xp}</span></button>
      <button class="stat heart" data-hr>❤️<span class="n">${p.settings.unlimited ? '∞' : p.hearts}</span></button></div>
    <div class="tab-body"></div>
    <nav class="tabs"><div class="tabs-in">${[['path', '🏠', 'التعلّم'], ['review', '🧠', 'المراجعة'], ['talk', '💬', 'المحادثة'], ['me', '👤', 'ملفي']].map(t => `<button data-tab="${t[0]}" class="${TAB === t[0] ? 'on' : ''}"><span class="ti">${t[1]}</span>${t[2]}</button>`).join('')}</div></nav></div>`;
  $$('[data-tab]').forEach(b => b.onclick = () => { TAB = b.dataset.tab; scrHome(); });
  $('[data-sw]').onclick = () => go('profiles');
  $('[data-st]').onclick = () => toast(s ? `سلسلتك ${s} يوم 🔥 — تعلّم اليوم لتحافظ عليها` : 'ابدأ درساً اليوم لتشعل سلسلتك 🔥');
  $('[data-xp]').onclick = () => toast(`مجموع نقاطك ${p.xp} XP · اليوم ${todayXP(p)}`);
  $('[data-hr]').onclick = () => toast(p.settings.unlimited ? 'القلوب غير محدودة (من الإعدادات)' : p.hearts >= HEART_MAX ? 'قلوبك ممتلئة ❤️' : `قلب جديد بعد ${minsToHeart(p)} دقيقة، أو راجع لتكسب قلباً`);
  const body = $('.tab-body');
  ({ path: tabPath, review: tabReview, talk: tabTalk, me: tabMe })[TAB](p, body);
}
const OFF = [0, 46, 70, 46, 0, -46, -70, -46];
function tabPath(p, el) {
  const cur = currentIndex(p); const tx = todayXP(p); const pct = Math.min(100, Math.round(tx / p.goal * 100));
  let h = `<div class="card goal-card"><div class="ring" style="--p:${pct}"><span>${pct >= 100 ? '🎯' : '⚡'}</span></div><div><b>${pct >= 100 ? 'حققت هدف اليوم!' : 'هدفك اليومي'}</b><small class="en">${tx} / ${p.goal} XP</small></div></div>`;
  if (!p.placement) h += `<button class="card cta-card" data-pl><span class="ic">🎯</span><span><b>اختبار تحديد المستوى</b><small>تعرف الإنجليزية؟ تخطَّ ما تعرفه وابدأ من مستواك.</small></span></button>`;
  C.units.forEach((u, ui) => {
    const ls = LESSONS.filter(l => l.ui === ui); const dn = ls.filter(l => p.done[l.id]).length;
    h += `<section class="unit"><div class="uhead" style="--uc:${u.color}"><div><small>الوحدة ${ui + 1} · ${u.lvl} · ${dn}/${ls.length}</small><h3>${u.t}</h3><p>${u.d}</p></div><button class="gbtn" data-ug="${ui}" aria-label="القواعد">📖</button></div><div class="path">`;
    ls.forEach((l, k) => { const stt = nodeState(p, l.gi, cur);
      h += `<div class="nodewrap" style="transform:translateX(${OFF[k % OFF.length]}px)">${stt === 'cur' ? '<div class="start-tag">ابدأ</div>' : ''}<button class="node ${stt}" data-g="${l.gi}" style="--uc:${u.color}" aria-label="${esc(l.ta)}">${stt === 'done' ? '✓' : stt === 'lock' ? '🔒' : l.icon}</button><div class="nlabel">${esc(l.ta)}</div></div>`; });
    h += `</div></section>`;
  });
  h += `<div class="soon"><b>🚀 قريباً</b>المستوى B2، ووحدة الإنجليزية الهندسية، ولغات أخرى.</div>`;
  el.innerHTML = h;
  const pl = $('[data-pl]', el); if (pl) pl.onclick = startPlacement;
  $$('[data-g]', el).forEach(b => b.onclick = () => lessonSheet(LESSONS[+b.dataset.g]));
  $$('[data-ug]', el).forEach(b => b.onclick = () => unitGrammarSheet(+b.dataset.ug));
  const c = $('.node.cur', el); if (c && c.getBoundingClientRect().bottom > innerHeight - 90) setTimeout(() => c.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60);
}
function lessonSheet(L) {
  const p = P(); const stt = nodeState(p, L.gi, currentIndex(p)); const u = C.units[L.ui];
  if (stt === 'lock') return toast('🔒 أكمل الدرس السابق أولاً');
  sheet(`<div class="sh-ic" style="background:${u.color}">${L.icon}</div><h3>${esc(L.ta)}</h3><p class="muted">${en(L.t)} · الوحدة ${L.ui + 1} · الدرس ${L.li + 1}</p>
    ${p.done[L.id] ? `<p class="pill ok" style="display:inline-block">أكملته ${p.done[L.id]} مرة ✓</p>` : stt === 'skip' ? '<p class="pill" style="display:inline-block">تخطيته باختبار المستوى</p>' : ''}
    <button class="btn" data-go>${p.done[L.id] ? 'تدرّب مجدداً' : 'ابدأ الدرس'}</button><button class="btn ghost" data-gr>📖 شرح القواعد فقط</button>`, (s, close) => {
    $('[data-go]', s).onclick = () => { close(); startLesson(L); };
    $('[data-gr]', s).onclick = () => { close(); showGrammar(L, () => go('home'), true); };
  });
}
function unitGrammarSheet(ui) {
  const ls = LESSONS.filter(l => l.ui === ui);
  sheet(`<h3>📖 قواعد الوحدة ${ui + 1}</h3><p class="muted">${C.units[ui].t}</p><div class="list" style="text-align:start">${ls.map(l => `<button class="row-card" data-l="${l.gi}"><span class="ic">${l.icon}</span><span class="tx"><b>${esc(l.ta)}</b><small class="en">${esc(l.t)}</small></span></button>`).join('')}</div>`, (s, close) => {
    $$('[data-l]', s).forEach(b => b.onclick = () => { close(); showGrammar(LESSONS[+b.dataset.l], () => go('home'), true); });
  });
}
function tabReview(p, el) {
  const keys = Object.keys(p.srs); const t = today(); const due = keys.filter(k => p.srs[k].due <= t).length;
  const boxes = [1, 2, 3, 4, 5].map(b => keys.filter(k => p.srs[k].box === b).length); const mx = Math.max(1, ...boxes);
  el.innerHTML = `<div class="card" style="text-align:center"><div style="font-size:52px">🧠</div><h2>المراجعة الذكية</h2>
      <p class="muted">${keys.length ? (due ? `لديك <b>${due}</b> كلمة مستحقة للمراجعة اليوم.` : 'لا توجد كلمات مستحقة الآن، لكن التدريب الإضافي يقوّي ذاكرتك.') : 'أكمل درسك الأول لتبدأ كلماتك بالظهور هنا.'}</p>
      <button class="btn acc" data-rv ${keys.length ? '' : 'disabled'}>ابدأ المراجعة${due ? ` (${Math.min(due, 12)})` : ''}</button>
      <p class="muted" style="font-size:13px;margin:10px 0 0">كل جلسة مراجعة تمنحك قلباً ❤️</p></div>
    <h3 class="sec-h">قوة الحفظ</h3><div class="card"><div class="boxes">${boxes.map((n, i) => `<div class="b"><small class="en">${n}</small><div class="bar" style="height:${n / mx * 100}%;opacity:${0.35 + i * 0.16}"></div><small>${['جديدة', 'ضعيفة', 'متوسطة', 'جيدة', 'راسخة'][i]}</small></div>`).join('')}</div>
      <p class="muted" style="font-size:13px;margin:12px 0 0">التطبيق يعيد عليك الكلمة قبل أن تنساها: بعد يوم، ثم يومين، ثم 4، ثم 8، ثم 16 يوماً (التكرار المتباعد).</p></div>
    <h3 class="sec-h">كلماتي (${keys.length})</h3><div class="card" style="max-height:340px;overflow:auto">${keys.length ? keys.map(k => `<div class="set-row"><span>${en(k)} <small class="muted">— ${esc(VMAP[k] ? VMAP[k].ar : '')}</small></span><span style="display:flex;gap:8px;align-items:center"><span class="pill">${'●'.repeat(p.srs[k].box)}${'○'.repeat(5 - p.srs[k].box)}</span>${spkBtn(k, 'sm')}</span></div>`).join('') : '<p class="muted">لا توجد كلمات بعد.</p>'}</div>`;
  bindSay(el); const b = $('[data-rv]', el); b.onclick = startReview;
}
function tabTalk(p, el) {
  el.innerHTML = `<div class="card" style="margin-bottom:16px"><b>💬 محادثات واقعية</b><p class="muted" style="margin:4px 0 0">حاور شخصيات في مواقف يومية: اختر الرد المناسب أو انطقه بصوتك، وستحصل على شرح فوري لكل خطأ.</p></div>
    <div class="list">${C.convos.map(c => `<button class="row-card" data-c="${c.id}"><span class="ic">${c.icon}</span><span class="tx"><b>${esc(c.ta)}</b><small>${esc(c.place)} · ${c.turns.length} أدوار</small></span><span class="pill ${p.convos[c.id] ? 'ok' : ''}">${p.convos[c.id] ? '✓ ' : ''}${c.lvl}</span></button>`).join('')}</div>
    ${SR ? '' : '<p class="muted" style="font-size:13px;margin-top:14px">ℹ️ التحدث بالصوت متاح في متصفح Chrome على أندرويد والكمبيوتر، وفي Safari الحديث.</p>'}`;
  $$('[data-c]', el).forEach(b => b.onclick = () => startConvo(C.convos.find(c => c.id === b.dataset.c)));
}
function tabMe(p, el) {
  const days = [...Array(7)].map((_, i) => addDays(today(), i - 6)); const vals = days.map(d => p.xpLog[d] || 0); const mx = Math.max(p.goal, ...vals);
  const DN = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
  const doneN = Object.keys(p.done).length;
  el.innerHTML = `<div class="card" style="display:flex;gap:14px;align-items:center"><div style="font-size:56px">${p.avatar}</div><div style="flex:1"><h2>${esc(p.name)}</h2><span class="muted">المستوى <b class="en">${levelLabel(p)}</b> · منذ ${new Date(p.created).toLocaleDateString('ar')}</span></div><button class="btn ghost sm" data-ren>تعديل</button></div>
    <h3 class="sec-h">الإحصائيات</h3><div class="kpis">
      <div class="kpi"><span class="ic">🔥</span><span><b>${streakNow(p)}</b><small>أيام متتالية</small></span></div>
      <div class="kpi"><span class="ic">⭐</span><span><b>${p.xp}</b><small>مجموع XP</small></span></div>
      <div class="kpi"><span class="ic">📗</span><span><b>${doneN}/${LESSONS.length}</b><small>دروس مكتملة</small></span></div>
      <div class="kpi"><span class="ic">📚</span><span><b>${Object.keys(p.srs).length}</b><small>كلمات تعلّمتها</small></span></div></div>
    <h3 class="sec-h">آخر 7 أيام</h3><div class="card"><div class="week">${days.map((d, i) => { const [y, m, dd] = d.split('-').map(Number); return `<div class="d ${i === 6 ? 'today' : ''}"><span class="v">${vals[i] || ''}</span><div class="bar ${vals[i] ? '' : 'zero'}" style="height:${vals[i] / mx * 100}%"></div><small>${DN[new Date(y, m - 1, dd).getDay()]}</small></div>`; }).join('')}</div></div>
    <h3 class="sec-h">الشارات (${p.badges.length}/${BADGES.length})</h3><div class="badges">${BADGES.map(b => `<div class="badge ${p.badges.includes(b.id) ? '' : 'off'}"><div class="ic">${b.i}</div><b>${b.t}</b><small>${b.d}</small></div>`).join('')}</div>
    <h3 class="sec-h">الإعدادات</h3><div class="card">
      <div class="set-row"><span><b>الهدف اليومي</b><small>${p.goal} XP</small></span><div class="seg">${GOALS.map(g => `<button class="${p.goal === g[0] ? 'on' : ''}" data-goal="${g[0]}">${g[1]}</button>`).join('')}</div></div>
      <div class="set-row"><span><b>قلوب غير محدودة</b><small>مناسب للأطفال والمبتدئين جداً</small></span><button class="sw ${p.settings.unlimited ? 'on' : ''}" data-tg="unlimited" aria-label="قلوب غير محدودة"></button></div>
      <div class="set-row"><span><b>تمارين النطق بالميكروفون</b><small>${IN_CLAUDE ? 'متاح في نسخة الملف، وغير متاح داخل رابط claude.ai' : SR ? 'مدعوم في هذا المتصفح' : 'غير مدعوم في هذا المتصفح'}</small></span><button class="sw ${p.settings.mic ? 'on' : ''}" data-tg="mic" aria-label="الميكروفون"></button></div>
      <div class="set-row"><span><b>المؤثرات الصوتية</b><small>أصوات الإجابة الصحيحة والخاطئة</small></span><button class="sw ${p.settings.sfx ? 'on' : ''}" data-tg="sfx" aria-label="المؤثرات"></button></div>
      <div class="set-row"><span><b>سرعة النطق</b><small>صوت القارئ الإنجليزي</small></span><div class="seg">${[[0.7, 'بطيء'], [0.9, 'عادي'], [1.05, 'سريع']].map(r => `<button class="${p.settings.rate === r[0] ? 'on' : ''}" data-rate="${r[0]}">${r[1]}</button>`).join('')}</div></div>
      <div class="set-row"><span><b>المظهر</b></span><div class="seg">${[['auto', 'تلقائي'], ['light', 'فاتح'], ['dark', 'داكن']].map(r => `<button class="${p.settings.theme === r[0] ? 'on' : ''}" data-th="${r[0]}">${r[1]}</button>`).join('')}</div></div>
      <div class="set-row"><span><b>اختبار المستوى</b><small>${p.placement ? 'آخر نتيجة: ' + p.placement.level : 'لم يُجرَ بعد'}</small></span><button class="btn ghost sm" data-pl>${p.placement ? 'إعادة' : 'ابدأ'}</button></div>
    </div>
    <h3 class="sec-h">البيانات والعائلة</h3><div class="card">
      <div class="set-row"><span><b>${CLOUD.on ? '☁️ المزامنة مفعّلة' : '💾 حفظ محلي'}</b><small>${CLOUD.on ? 'تقدّم العائلة محفوظ في حسابك ويظهر على أي جهاز تفتح منه الرابط' : 'للعمل على أكثر من جهاز: افتح التطبيق من رابط claude.ai، أو انقل النسخة الاحتياطية'}</small></span></div>
      <div class="set-row"><span><b>تبديل الملف</b><small>${DB.profiles.length} ملف على هذا الجهاز</small></span><button class="btn ghost sm" data-sw>تبديل</button></div>
      <div class="set-row"><span><b>نسخة احتياطية</b><small>احفظ تقدّم العائلة كاملاً في ملف</small></span><button class="btn ghost sm" data-ex>تصدير</button></div>
      <div class="set-row"><span><b>استعادة / نقل لجهاز آخر</b><small>من ملف نسخة احتياطية</small></span><button class="btn ghost sm" data-im>استيراد</button></div>
      <div class="set-row"><span><b style="color:var(--bad)">حذف هذا الملف</b><small>لا يمكن التراجع</small></span><button class="btn ghost sm" data-del style="color:var(--bad)">حذف</button></div>
    </div><p class="muted" style="text-align:center;font-size:12px;margin-top:20px">لِسان · الإصدار 1.0 · يعمل دون إنترنت بعد التثبيت</p>`;
  const rer = () => { save(); applyTheme(); scrHome(); };
  $$('[data-goal]', el).forEach(b => b.onclick = () => { p.goal = +b.dataset.goal; rer(); });
  $$('[data-tg]', el).forEach(b => b.onclick = () => { const k = b.dataset.tg; p.settings[k] = !p.settings[k]; rer(); });
  $$('[data-rate]', el).forEach(b => b.onclick = () => { p.settings.rate = +b.dataset.rate; save(); say('This is how I sound.'); scrHome(); });
  $$('[data-th]', el).forEach(b => b.onclick = () => { p.settings.theme = b.dataset.th; rer(); });
  $('[data-pl]', el).onclick = startPlacement;
  $('[data-sw]', el).onclick = () => go('profiles');
  $('[data-ex]', el).onclick = exportData;
  $('[data-im]', el).onclick = importData;
  $('[data-del]', el).onclick = () => confirmBox(`حذف ملف «${esc(p.name)}» وكل تقدّمه نهائياً؟`, () => { DB.profiles = DB.profiles.filter(x => x.id !== p.id); DB.current = null; save(); go('profiles'); }, 'حذف نهائي');
  $('[data-ren]', el).onclick = () => sheet(`<h3>تعديل الملف</h3><input class="inp" id="rn" maxlength="20" value="${esc(p.name)}" style="margin:14px 0"><div class="av-grid">${AVATARS.map(a => `<button class="${a === p.avatar ? 'sel' : ''}" data-av="${a}">${a}</button>`).join('')}</div><button class="btn" data-sv>حفظ</button>`, (s, close) => {
    let av = p.avatar; $$('[data-av]', s).forEach(b => b.onclick = () => { av = b.dataset.av; $$('[data-av]', s).forEach(x => x.classList.toggle('sel', x === b)); });
    $('[data-sv]', s).onclick = () => { const n = $('#rn', s).value.trim(); if (n) p.name = n; p.avatar = av; close(); rer(); };
  });
}
async function exportData() {
  if (IN_CLAUDE) {
    const json = JSON.stringify({ app: 'lisan', v: 1, exported: new Date().toISOString(), data: DB }, null, 1);
    try { const dl = await window.claude.use('downloads'); if (dl) { await dl.save({ filename: `lisan-backup-${today()}.json`, data: json }); toast('✅ تم حفظ النسخة الاحتياطية'); return; } } catch (e) { return; }
    return toast(CLOUD.on ? 'تقدّمك محفوظ تلقائياً في حسابك' : 'التصدير غير متاح هنا');
  }
  const blob = new Blob([JSON.stringify({ app: 'lisan', v: 1, exported: new Date().toISOString(), data: DB }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `lisan-backup-${today()}.json`; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); toast('✅ تم حفظ النسخة الاحتياطية');
}
function importData() {
  const i = document.createElement('input'); i.type = 'file'; i.accept = 'application/json,.json';
  i.onchange = () => { const f = i.files[0]; if (!f) return; const r = new FileReader();
    r.onload = () => { try { const j = JSON.parse(r.result); const d = j.data || j; if (!d || !Array.isArray(d.profiles)) throw 0;
      confirmBox(`استيراد ${d.profiles.length} ملف؟ سيُستبدل كل ما على هذا الجهاز.`, () => { d.profiles.forEach(fixProfile); DB = d; DB.current = null; save(); toast('✅ تمت الاستعادة'); go('profiles'); }, 'استيراد');
    } catch (e) { toast('❌ الملف غير صالح'); } };
    r.readAsText(f); };
  i.click();
}

/* ---------------- الموجّه ---------------- */
function go(scr, arg) {
  if (CLOUD.pending) { const d = CLOUD.pending; CLOUD.pending = null; if (d.updated > (DB.updated || 0)) cloudApply(d); }
  if (scr === 'profiles') return scrProfiles();
  if (scr === 'home') return P() ? scrHome(arg) : scrProfiles();
}
window.__lisan = { cur: null, get DB() { return DB; }, LESSONS, go };

applyTheme();
go(DB.current && P() ? 'home' : 'profiles');
cloudInit();
if (!IN_CLAUDE && 'serviceWorker' in navigator && /^https?:/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => { });
})();
